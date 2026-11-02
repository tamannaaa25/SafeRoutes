from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, text

try:
    from database import get_db
    from models import Dataset, Accident, InvestigationRecommendation
    from services.sql_demo_service import PREDEFINED_SQL_QUERIES, execute_predefined_sql_query
    from processing.recommendation_engine import generate_deterministic_recommendations
except ImportError:
    from backend.database import get_db
    from backend.models import Dataset, Accident, InvestigationRecommendation
    from backend.services.sql_demo_service import PREDEFINED_SQL_QUERIES, execute_predefined_sql_query
    from backend.processing.recommendation_engine import generate_deterministic_recommendations

router = APIRouter(prefix="/analytics", tags=["Analytics & SQL"])

class SqlRunRequest(BaseModel):
    query_id: str

@router.get("/overview")
def get_analytics_overview(
    dataset_id: Optional[int] = Query(None),
    severity: Optional[str] = Query("All"),
    db: Session = Depends(get_db)
):
    query = db.query(Accident)
    if dataset_id:
        query = query.filter(Accident.dataset_id == dataset_id)
        ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        ds_name = ds.dataset_name if ds else "Selected Dataset"
    else:
        ds = db.query(Dataset).order_by(desc(Dataset.upload_date)).first()
        if ds:
            query = query.filter(Accident.dataset_id == ds.id)
            ds_name = ds.dataset_name
        else:
            ds_name = "All Records"

    if severity and severity.lower() != "all":
        query = query.filter(Accident.severity == severity.capitalize())

    valid_query = query.filter(Accident.is_valid == True)
    total_accidents = valid_query.count()
    total_injuries = valid_query.with_entities(func.coalesce(func.sum(Accident.injuries), 0)).scalar() or 0
    total_fatalities = valid_query.with_entities(func.coalesce(func.sum(Accident.fatalities), 0)).scalar() or 0

    top_loc_tuple = (
        valid_query.with_entities(Accident.location, func.count(Accident.id).label("count"))
        .group_by(Accident.location)
        .order_by(desc("count"))
        .first()
    )
    top_location = top_loc_tuple[0] if top_loc_tuple else "None Recorded"
    top_location_count = top_loc_tuple[1] if top_loc_tuple else 0

    unique_locations_count = (
        valid_query.with_entities(func.count(func.distinct(Accident.location))).scalar() or 0
    )

    invalid_count = query.filter(Accident.is_valid == False).count()

    high_severity_count = valid_query.filter(
        Accident.severity.in_(["High", "Fatal", "Severe"])
    ).count()

    return {
        "dataset_name": ds_name,
        "dataset_id": ds.id if ds else None,
        "total_accidents": total_accidents,
        "total_injuries": int(total_injuries),
        "total_fatalities": int(total_fatalities),
        "top_location": top_location,
        "top_location_count": top_location_count,
        "unique_locations_count": unique_locations_count,
        "valid_records": total_accidents,
        "invalid_records": invalid_count,
        "high_severity_count": high_severity_count
    }

@router.get("/monthly")
def get_monthly_distribution(
    dataset_id: Optional[int] = Query(None),
    severity: Optional[str] = Query("All"),
    db: Session = Depends(get_db)
):
    query = db.query(Accident).filter(Accident.is_valid == True, Accident.accident_date != None)
    if dataset_id:
        query = query.filter(Accident.dataset_id == dataset_id)
    else:
        ds = db.query(Dataset).order_by(desc(Dataset.upload_date)).first()
        if ds:
            query = query.filter(Accident.dataset_id == ds.id)

    if severity and severity.lower() != "all":
        query = query.filter(Accident.severity == severity.capitalize())

    accidents = query.all()
    months_order = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    counts = {m: 0 for m in months_order}

    for acc in accidents:
        if acc.accident_date:
            m_str = acc.accident_date.strftime("%b")
            if m_str in counts:
                counts[m_str] += 1

    return [{"month": m, "accidents": counts[m]} for m in months_order]

@router.get("/severity")
def get_severity_breakdown(
    dataset_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Accident.severity, func.count(Accident.id)).filter(Accident.is_valid == True)
    if dataset_id:
        query = query.filter(Accident.dataset_id == dataset_id)
    else:
        ds = db.query(Dataset).order_by(desc(Dataset.upload_date)).first()
        if ds:
            query = query.filter(Accident.dataset_id == ds.id)

    results = query.group_by(Accident.severity).all()
    categories = {"High": 0, "Medium": 0, "Low": 0}
    for sev, cnt in results:
        sev_clean = sev.capitalize() if sev else "Medium"
        if sev_clean in categories:
            categories[sev_clean] += cnt
        else:
            categories["Medium"] += cnt

    return [{"name": k, "value": v} for k, v in categories.items()]

@router.get("/locations")
def get_blackspot_rankings(
    dataset_id: Optional[int] = Query(None),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    query = (
        db.query(
            Accident.location,
            func.count(Accident.id).label("crashes"),
            func.coalesce(func.sum(Accident.injuries), 0).label("injuries"),
            func.coalesce(func.sum(Accident.fatalities), 0).label("fatalities")
        )
        .filter(Accident.is_valid == True)
    )

    if dataset_id:
        query = query.filter(Accident.dataset_id == dataset_id)
    else:
        ds = db.query(Dataset).order_by(desc(Dataset.upload_date)).first()
        if ds:
            query = query.filter(Accident.dataset_id == ds.id)

    results = (
        query.group_by(Accident.location)
        .order_by(desc("crashes"), desc("fatalities"), desc("injuries"))
        .limit(limit)
        .all()
    )

    rankings = []
    for idx, (loc, crashes, injuries, fatalities) in enumerate(results, 1):
        rankings.append({
            "rank": idx,
            "location": loc,
            "crashes": crashes,
            "injuries": int(injuries),
            "fatalities": int(fatalities)
        })

    return rankings

@router.get("/weather")
def get_weather_distribution(
    dataset_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(
        func.coalesce(Accident.weather_condition, 'Clear').label("weather"),
        func.count(Accident.id)
    ).filter(Accident.is_valid == True)

    if dataset_id:
        query = query.filter(Accident.dataset_id == dataset_id)
    else:
        ds = db.query(Dataset).order_by(desc(Dataset.upload_date)).first()
        if ds:
            query = query.filter(Accident.dataset_id == ds.id)

    results = query.group_by("weather").order_by(desc(func.count(Accident.id))).all()
    return [{"name": r[0], "value": r[1]} for r in results]

@router.get("/recommendations")
def get_investigation_recommendations(
    dataset_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    target_dataset_id = dataset_id
    if not target_dataset_id:
        ds = db.query(Dataset).order_by(desc(Dataset.upload_date)).first()
        if ds:
            target_dataset_id = ds.id

    existing = []
    if target_dataset_id:
        existing = db.query(InvestigationRecommendation).filter(
            InvestigationRecommendation.dataset_id == target_dataset_id
        ).all()

    if not existing:
        accidents = db.query(Accident).filter(
            Accident.dataset_id == target_dataset_id,
            Accident.is_valid == True
        ).all()
        recs = generate_deterministic_recommendations(accidents)
        for r in recs:
            rec_obj = InvestigationRecommendation(
                dataset_id=target_dataset_id,
                location=r["location"],
                recommendation=r["recommendation"],
                priority=r["priority"],
                evidence=r["evidence"]
            )
            db.add(rec_obj)
        db.commit()
        existing = db.query(InvestigationRecommendation).filter(
            InvestigationRecommendation.dataset_id == target_dataset_id
        ).all()

    return [
        {
            "id": r.id,
            "location": r.location,
            "recommendation": r.recommendation,
            "priority": r.priority,
            "evidence": r.evidence,
            "status": r.status
        }
        for r in existing
    ]

@router.get("/sql-demo")
def list_sql_demo_queries():
    return [
        {
            "query_id": q["query_id"],
            "title": q["title"],
            "description": q["description"],
            "operations_demonstrated": q["operations_demonstrated"],
            "sql_text": q["sql_text"]
        }
        for q in PREDEFINED_SQL_QUERIES
    ]

@router.post("/sql-demo/run")
def run_sql_demo_query(req: SqlRunRequest, db: Session = Depends(get_db)):
    result = execute_predefined_sql_query(req.query_id, db)
    return result
