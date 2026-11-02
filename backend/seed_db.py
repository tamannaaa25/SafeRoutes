import os
import sys
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

def seed_database():
    print("Initializing PostgreSQL tables in saferoutes_db...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Clear existing seeded data to ensure strict consistency
        db.query(DataQualityIssue).delete()
        db.query(InvestigationRecommendation).delete()
        db.query(Accident).delete()
        db.query(Dataset).delete()
        db.commit()

        demo_csv_path = os.path.join(parent_dir, "datasets", "chandigarh_road_accidents_demo.csv")
        if not os.path.exists(demo_csv_path):
            raise FileNotFoundError(f"Demonstration dataset not found at {demo_csv_path}")

        with open(demo_csv_path, "rb") as f:
            content = f.read()

        print(f"Processing 10-record demonstration dataset from {demo_csv_path}...")
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

        demo_ds = Dataset(
            dataset_name="Chandigarh Road Accidents Demonstration Dataset",
            original_filename="chandigarh_road_accidents_demo.csv",
            upload_date=datetime.utcnow(),
            total_records=report["total_records"],
            valid_records=report["valid_records"],
            invalid_records=report["invalid_records"],
            duplicate_records=report["duplicate_records"],
            processing_status="completed"
        )
        db.add(demo_ds)
        db.flush()

        accident_models = []
        rec_id_to_model = {}

        for r in records:
            acc = Accident(
                dataset_id=demo_ds.id,
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
                    dataset_id=demo_ds.id,
                    accident_id=acc_obj.id if acc_obj else None,
                    issue_type=iss.get("issue_type", "OTHER"),
                    field_name=iss.get("field_name", "unknown"),
                    issue_description=iss.get("issue_description", ""),
                    detected_value=str(iss.get("detected_value", ""))[:500] if iss.get("detected_value") is not None else None
                ))

        db.add_all(issue_models)

        valid_accident_models = [a for a in accident_models if a.is_valid]
        recs = generate_deterministic_recommendations(valid_accident_models if valid_accident_models else accident_models)
        for r in recs:
            db.add(InvestigationRecommendation(
                dataset_id=demo_ds.id,
                location=r["location"],
                recommendation=r["recommendation"],
                priority=r["priority"],
                evidence=r["evidence"]
            ))

        db.commit()
        print(f"Successfully seeded Demonstration Dataset (ID: {demo_ds.id}, {len(accident_models)} records, {len(issue_models)} issues).")

        print("\n--- Database Seeding Summary ---")
        print(f"Total Datasets: {db.query(Dataset).count()}")
        print(f"Total Accidents: {db.query(Accident).count()}")
        print(f"Valid Accidents: {db.query(Accident).filter(Accident.is_valid == True).count()}")
        print(f"Invalid Accidents: {db.query(Accident).filter(Accident.is_valid == False).count()}")
        print(f"Duplicate Accidents: {db.query(Accident).filter(Accident.is_duplicate == True).count()}")
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
