from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

try:
    from database import get_db
    from services.analytics_service import AnalyticsService
except ImportError:
    from backend.database import get_db
    from backend.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview")
def get_analytics_overview(
    dataset_id: Optional[int] = Query(None),
    severity: Optional[str] = Query("All"),
    db: Session = Depends(get_db)
):
    service = AnalyticsService(db)
    return service.get_overview(dataset_id=dataset_id, severity=severity)

@router.get("/monthly")
def get_monthly_distribution(
    dataset_id: Optional[int] = Query(None),
    severity: Optional[str] = Query("All"),
    db: Session = Depends(get_db)
):
    service = AnalyticsService(db)
    return service.get_monthly(dataset_id=dataset_id, severity=severity)

@router.get("/severity")
def get_severity_breakdown(
    dataset_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    service = AnalyticsService(db)
    return service.get_severity(dataset_id=dataset_id)

@router.get("/locations")
def get_blackspot_rankings(
    dataset_id: Optional[int] = Query(None),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    service = AnalyticsService(db)
    return service.get_locations(dataset_id=dataset_id, limit=limit)

@router.get("/weather")
def get_weather_distribution(
    dataset_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    service = AnalyticsService(db)
    return service.get_weather(dataset_id=dataset_id)

@router.get("/recommendations")
def get_investigation_recommendations(
    dataset_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    service = AnalyticsService(db)
    return service.get_recommendations(dataset_id=dataset_id)
