import os
import sys
import re
from datetime import datetime

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from database import engine, SessionLocal, Base
from models import Dataset, Accident, DataQualityIssue, InvestigationRecommendation
from processing.data_loader import load_csv_data
from processing.data_cleaner import clean_dataset_dataframe
from processing.data_validator import validate_row
from processing.duplicate_detector import detect_duplicates_in_records
from processing.quality_report import generate_data_quality_report
from processing.recommendation_engine import generate_deterministic_recommendations

def parse_sample_accidents_js(js_path: str):
    records = []
    with open(js_path, "r", encoding="utf-8") as f:
        content = f.read()

    match = re.search(r"export const sampleAccidents = (\[.*?\]);", content, re.DOTALL)
    if not match:
        return records

    js_array = match.group(1)
    object_pattern = re.compile(
        r"\{\s*id:\s*(\d+),\s*date:\s*'([^']*)',\s*location:\s*'([^']*)',\s*sector:\s*'([^']*)',\s*weatherCondition:\s*'([^']*)',\s*roadCondition:\s*'([^']*)',\s*severity:\s*'([^']*)',\s*injuries:\s*(\d+),\s*fatalities:\s*(\d+)",
        re.DOTALL
    )

    for m in object_pattern.finditer(js_array):
        records.append({
            "id": int(m.group(1)),
            "date": m.group(2),
            "location": m.group(3),
            "sector": m.group(4),
            "weather": m.group(5),
            "road": m.group(6),
            "severity": m.group(7),
            "injuries": int(m.group(8)),
            "fatalities": int(m.group(9))
        })
    return records

def seed_database():
    print("Initializing PostgreSQL tables in saferoutes_db...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        db.query(DataQualityIssue).delete()
        db.query(InvestigationRecommendation).delete()
        db.query(Accident).delete()
        db.query(Dataset).delete()
        db.commit()

        js_path = os.path.join(parent_dir, "src", "data", "sampleAccidents.js")
        baseline_records = parse_sample_accidents_js(js_path)
        print(f"Loaded {len(baseline_records)} baseline records from {js_path}")

        baseline_ds = Dataset(
            dataset_name="Chandigarh Baseline Verification Dataset",
            original_filename="sampleAccidents.js",
            upload_date=datetime(2024, 1, 1, 10, 0, 0),
            total_records=len(baseline_records),
            valid_records=len(baseline_records),
            invalid_records=0,
            duplicate_records=0,
            processing_status="completed"
        )
        db.add(baseline_ds)
        db.flush()

        baseline_accidents = []
        for r in baseline_records:
            acc_date = datetime.strptime(r["date"], "%Y-%m-%d").date() if r["date"] else None
            sev = "High" if r["severity"].lower() in ["severe", "fatal", "high"] else ("Medium" if r["severity"].lower() in ["moderate", "medium"] else "Low")
            baseline_accidents.append(Accident(
                dataset_id=baseline_ds.id,
                source_record_id=f"BASE_{r['id']}",
                accident_date=acc_date,
                location=r["location"],
                severity=sev,
                weather_condition=r["weather"],
                road_condition=r["road"],
                number_of_vehicles=2 if r["injuries"] + r["fatalities"] > 1 else 1,
                injuries=r["injuries"],
                fatalities=r["fatalities"],
                is_valid=True,
                is_duplicate=False
            ))
        db.add_all(baseline_accidents)
        db.flush()
        print(f"Successfully seeded Baseline Dataset (ID: {baseline_ds.id}, 37 records).")

        messy_csv_path = os.path.join(parent_dir, "datasets", "chandigarh_road_accidents_messy.csv")
        if os.path.exists(messy_csv_path):
            with open(messy_csv_path, "rb") as f:
                content = f.read()

            print("Processing messy evaluation dataset through Pandas / NumPy pipeline...")
            df_raw, df_standard = load_csv_data(content)
            df_clean = clean_dataset_dataframe(df_standard)

            records = []
            issues_list = []
            for idx, (_, row) in enumerate(df_clean.iterrows()):
                is_val, rec, issues = validate_row(row, idx)
                records.append(rec)
                issues_list.append(issues)

            records, dup_count = detect_duplicates_in_records(records, issues_list)
            report = generate_data_quality_report(len(records), records, issues_list, df_clean)

            messy_ds = Dataset(
                dataset_name="Chandigarh Comprehensive Evaluation Dataset",
                original_filename="chandigarh_road_accidents_messy.csv",
                upload_date=datetime(2024, 11, 2, 14, 30, 0),
                total_records=report["total_records"],
                valid_records=report["valid_records"],
                invalid_records=report["invalid_records"],
                duplicate_records=report["duplicate_records"],
                processing_status="completed"
            )
            db.add(messy_ds)
            db.flush()

            accident_models = []
            rec_id_to_model = {}

            for r in records:
                acc = Accident(
                    dataset_id=messy_ds.id,
                    source_record_id=r["source_record_id"],
                    accident_date=r["accident_date"],
                    accident_time=r["accident_time"],
                    location=r["location"],
                    latitude=r["latitude"],
                    longitude=r["longitude"],
                    severity=r["severity"],
                    weather_condition=r["weather_condition"],
                    road_condition=r["road_condition"],
                    number_of_vehicles=r["number_of_vehicles"],
                    injuries=r["injuries"],
                    fatalities=r["fatalities"],
                    is_valid=r["is_valid"],
                    is_duplicate=r["is_duplicate"]
                )
                accident_models.append(acc)
                rec_id_to_model[r["source_record_id"]] = acc

            db.add_all(accident_models)
            db.flush()

            issue_models = []
            for idx, issues in enumerate(issues_list):
                rec_id = records[idx]["source_record_id"]
                acc_obj = rec_id_to_model.get(rec_id)
                for iss in issues:
                    issue_models.append(DataQualityIssue(
                        dataset_id=messy_ds.id,
                        accident_id=acc_obj.id if acc_obj else None,
                        issue_type=iss.get("issue_type", "OTHER"),
                        field_name=iss.get("field_name", "unknown"),
                        issue_description=iss.get("issue_description", ""),
                        detected_value=str(iss.get("detected_value", ""))[:500] if iss.get("detected_value") is not None else None
                    ))

            db.add_all(issue_models)

            recs = generate_deterministic_recommendations(accident_models)
            for r in recs:
                db.add(InvestigationRecommendation(
                    dataset_id=messy_ds.id,
                    location=r["location"],
                    recommendation=r["recommendation"],
                    priority=r["priority"],
                    evidence=r["evidence"]
                ))

            db.commit()
            print(f"Successfully seeded Evaluation Dataset (ID: {messy_ds.id}, {len(accident_models)} records, {len(issue_models)} issues).")

        print("\n--- Database Seeding Summary ---")
        print(f"Total Datasets: {db.query(Dataset).count()}")
        print(f"Total Accidents: {db.query(Accident).count()}")
        print(f"Total Data Quality Issues Logged: {db.query(DataQualityIssue).count()}")
        print(f"Total Investigation Recommendations: {db.query(InvestigationRecommendation).count()}")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
