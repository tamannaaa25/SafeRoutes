import os
import math
from datetime import datetime, date, time
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

try:
    from database import get_db
    from models import Dataset, Accident, DataQualityIssue, InvestigationRecommendation
    from schemas import DatasetResponse
    from processing.data_loader import load_csv_data
    from processing.data_cleaner import clean_dataset_dataframe
    from processing.data_validator import validate_row
    from processing.duplicate_detector import detect_duplicates_in_records
    from processing.quality_report import generate_data_quality_report
    from processing.recommendation_engine import generate_deterministic_recommendations
except ImportError:
    from backend.database import get_db
    from backend.models import Dataset, Accident, DataQualityIssue, InvestigationRecommendation
    from backend.schemas import DatasetResponse
    from backend.processing.data_loader import load_csv_data
    from backend.processing.data_cleaner import clean_dataset_dataframe
    from backend.processing.data_validator import validate_row
    from backend.processing.duplicate_detector import detect_duplicates_in_records
    from backend.processing.quality_report import generate_data_quality_report
    from backend.processing.recommendation_engine import generate_deterministic_recommendations

router = APIRouter(prefix="/datasets", tags=["Datasets"])

@router.get("", response_model=List[DatasetResponse])
def list_datasets(db: Session = Depends(get_db)):
    datasets = db.query(Dataset).order_by(desc(Dataset.upload_date)).all()
    return datasets

@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset

@router.get("/{dataset_id}/quality-report")
def get_dataset_quality_report(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    issues = db.query(DataQualityIssue).filter(DataQualityIssue.dataset_id == dataset_id).all()
    
    issue_counts_by_type = {}
    issue_counts_by_field = {}
    for issue in issues:
        issue_counts_by_type[issue.issue_type] = issue_counts_by_type.get(issue.issue_type, 0) + 1
        issue_counts_by_field[issue.field_name] = issue_counts_by_field.get(issue.field_name, 0) + 1

    total = dataset.total_records or 0
    valid = dataset.valid_records or 0
    invalid = dataset.invalid_records or 0
    duplicates = dataset.duplicate_records or 0
    quality_score = round((valid / total * 100), 1) if total > 0 else 0.0

    return {
        "dataset_id": dataset.id,
        "dataset_name": dataset.dataset_name,
        "original_filename": dataset.original_filename,
        "upload_date": dataset.upload_date.isoformat() if dataset.upload_date else None,
        "total_records": total,
        "valid_records": valid,
        "invalid_records": invalid,
        "duplicate_records": duplicates,
        "quality_score_pct": quality_score,
        "issue_counts_by_type": issue_counts_by_type,
        "issue_counts_by_field": issue_counts_by_field,
        "total_issues_logged": len(issues),
        "scoring_methodology": "quality_score_pct = (valid_records / total_records) * 100"
    }

@router.get("/{dataset_id}/records")
def get_dataset_records(
    dataset_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    severity: Optional[str] = Query(None),
    is_valid: Optional[bool] = Query(None),
    is_duplicate: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    query = db.query(Accident).filter(Accident.dataset_id == dataset_id)

    if severity and severity.lower() != "all":
        query = query.filter(Accident.severity == severity.capitalize())
    if is_valid is not None:
        query = query.filter(Accident.is_valid == is_valid)
    if is_duplicate is not None:
        query = query.filter(Accident.is_duplicate == is_duplicate)
    if search:
        query = query.filter(Accident.location.ilike(f"%{search}%"))

    total_count = query.count()
    offset = (page - 1) * page_size
    accidents = query.order_by(Accident.id).offset(offset).limit(page_size).all()

    accident_ids = [a.id for a in accidents]
    issues_by_accident = {}
    if accident_ids:
        issues = db.query(DataQualityIssue).filter(
            DataQualityIssue.accident_id.in_(accident_ids)
        ).all()
        for iss in issues:
            if iss.accident_id not in issues_by_accident:
                issues_by_accident[iss.accident_id] = []
            issues_by_accident[iss.accident_id].append({
                "issue_type": iss.issue_type,
                "field_name": iss.field_name,
                "description": iss.issue_description,
                "detected_value": iss.detected_value
            })

    records_data = []
    for a in accidents:
        records_data.append({
            "id": a.id,
            "source_record_id": a.source_record_id,
            "accident_date": a.accident_date.isoformat() if a.accident_date else None,
            "accident_time": a.accident_time.strftime("%H:%M:%S") if a.accident_time else None,
            "location": a.location,
            "latitude": a.latitude,
            "longitude": a.longitude,
            "severity": a.severity,
            "weather_condition": a.weather_condition,
            "road_condition": a.road_condition,
            "number_of_vehicles": a.number_of_vehicles,
            "injuries": a.injuries,
            "fatalities": a.fatalities,
            "is_valid": a.is_valid,
            "is_duplicate": a.is_duplicate,
            "issues": issues_by_accident.get(a.id, [])
        })

    return {
        "dataset_id": dataset_id,
        "page": page,
        "page_size": page_size,
        "total_records": total_count,
        "total_pages": math.ceil(total_count / page_size) if total_count > 0 else 1,
        "records": records_data
    }

@router.post("/upload")
async def upload_csv_dataset(
    file: UploadFile = File(...),
    dataset_name: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    name = dataset_name or file.filename.replace(".csv", "").replace("_", " ").title()

    try:
        df_raw, df_standard = load_csv_data(content)
        if df_standard.empty:
            raise HTTPException(status_code=400, detail="CSV file contained no parseable records")

        df_clean = clean_dataset_dataframe(df_standard)

        records = []
        issues_list = []
        for idx, (_, row) in enumerate(df_clean.iterrows()):
            is_val, rec, issues = validate_row(row, idx)
            records.append(rec)
            issues_list.append(issues)

        records, dup_count = detect_duplicates_in_records(records, issues_list)
        quality_summary = generate_data_quality_report(len(records), records, issues_list, df_clean)

        # Prevent duplicate dataset accumulation if re-uploading the same file
        existing_dataset = db.query(Dataset).filter(
            (Dataset.original_filename == file.filename) | (Dataset.dataset_name == name)
        ).first()
        if existing_dataset:
            db.query(InvestigationRecommendation).filter(InvestigationRecommendation.dataset_id == existing_dataset.id).delete()
            db.delete(existing_dataset)
            db.flush()

        dataset = Dataset(
            dataset_name=name,
            original_filename=file.filename,
            upload_date=datetime.utcnow(),
            total_records=quality_summary["total_records"],
            valid_records=quality_summary["valid_records"],
            invalid_records=quality_summary["invalid_records"],
            duplicate_records=quality_summary["duplicate_records"],
            processing_status="completed"
        )
        db.add(dataset)
        db.flush()

        def clean_coord(val):
            if val is None:
                return None
            try:
                f = float(val)
                return None if math.isnan(f) else f
            except (ValueError, TypeError):
                return None

        accident_models = []
        rec_id_to_model = {}

        for idx, r in enumerate(records):
            source_id = str(r.get("source_record_id") or f"rec_{idx + 1}")
            loc_val = str(r.get("location") or "Unknown Location").strip()
            sev_val = str(r.get("severity") or "Unknown").strip()

            acc = Accident(
                dataset_id=dataset.id,
                source_record_id=source_id,
                accident_date=r.get("accident_date"),
                accident_time=r.get("accident_time"),
                location=loc_val if loc_val else "Unknown Location",
                latitude=clean_coord(r.get("latitude")),
                longitude=clean_coord(r.get("longitude")),
                severity=sev_val if sev_val else "Unknown",
                weather_condition=str(r.get("weather_condition")) if r.get("weather_condition") else None,
                road_condition=str(r.get("road_condition")) if r.get("road_condition") else None,
                number_of_vehicles=int(r.get("number_of_vehicles", 1) or 1),
                injuries=int(r.get("injuries", 0) or 0),
                fatalities=int(r.get("fatalities", 0) or 0),
                is_valid=bool(r.get("is_valid", True)),
                is_duplicate=bool(r.get("is_duplicate", False))
            )
            accident_models.append(acc)
            rec_id_to_model[source_id] = acc

        db.add_all(accident_models)
        db.flush()

        issue_models = []
        for idx, issues in enumerate(issues_list):
            rec_id = str(records[idx].get("source_record_id") or f"rec_{idx + 1}")
            acc_obj = rec_id_to_model.get(rec_id)
            for iss in issues:
                issue_models.append(DataQualityIssue(
                    dataset_id=dataset.id,
                    accident_id=acc_obj.id if acc_obj else None,
                    issue_type=iss.get("issue_type", "OTHER"),
                    field_name=iss.get("field_name", "unknown"),
                    issue_description=iss.get("issue_description", ""),
                    detected_value=str(iss.get("detected_value", ""))[:500] if iss.get("detected_value") is not None else None
                ))

        if issue_models:
            db.add_all(issue_models)

        # Generate deterministic recommendations for the imported dataset
        valid_accident_models = [a for a in accident_models if a.is_valid]
        recs = generate_deterministic_recommendations(valid_accident_models if valid_accident_models else accident_models)
        rec_models = []
        for rec_item in recs:
            rec_models.append(InvestigationRecommendation(
                dataset_id=dataset.id,
                location=rec_item.get("location") or "Unknown Location",
                recommendation=rec_item.get("recommendation") or "",
                priority=rec_item.get("priority") or "Medium",
                evidence=rec_item.get("evidence") or ""
            ))
        if rec_models:
            db.add_all(rec_models)

        db.commit()
        db.refresh(dataset)

        return {
            "status": "success",
            "dataset": {
                "id": dataset.id,
                "dataset_name": dataset.dataset_name,
                "original_filename": dataset.original_filename,
                "upload_date": dataset.upload_date.isoformat(),
                "total_records": dataset.total_records,
                "valid_records": dataset.valid_records,
                "invalid_records": dataset.invalid_records,
                "duplicate_records": dataset.duplicate_records,
                "quality_score_pct": quality_summary["quality_percentage"]
            },
            "quality_summary": quality_summary
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process and store dataset: {str(e)}")

@router.delete("/{dataset_id}")
def delete_dataset(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    db.delete(dataset)
    db.commit()
    return {"status": "success", "message": f"Dataset {dataset_id} deleted"}
