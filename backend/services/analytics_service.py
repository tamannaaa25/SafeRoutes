from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

try:
    from repositories.analytics_repository import AnalyticsRepository
except ImportError:
    from backend.repositories.analytics_repository import AnalyticsRepository

class AnalyticsService:
    def __init__(self, db: Session):
        self.repository = AnalyticsRepository(db)

    def get_overview(self, dataset_id: Optional[int] = None, severity: Optional[str] = "All") -> Dict[str, Any]:
        data = self.repository.get_overview_stats(dataset_id=dataset_id, severity=severity)
        return {
            "success": True,
            "data": data
        }

    def get_monthly(self, dataset_id: Optional[int] = None, severity: Optional[str] = "All") -> Dict[str, Any]:
        data = self.repository.get_monthly_distribution(dataset_id=dataset_id, severity=severity)
        return {
            "success": True,
            "data": data
        }

    def get_severity(self, dataset_id: Optional[int] = None) -> Dict[str, Any]:
        data = self.repository.get_severity_breakdown(dataset_id=dataset_id)
        return {
            "success": True,
            "data": data
        }

    def get_locations(self, dataset_id: Optional[int] = None, limit: int = 10) -> Dict[str, Any]:
        data = self.repository.get_location_rankings(dataset_id=dataset_id, limit=limit)
        return {
            "success": True,
            "data": data
        }

    def get_weather(self, dataset_id: Optional[int] = None) -> Dict[str, Any]:
        data = self.repository.get_weather_distribution(dataset_id=dataset_id)
        return {
            "success": True,
            "data": data
        }

    def get_recommendations(self, dataset_id: Optional[int] = None) -> Dict[str, Any]:
        data = self.repository.get_recommendations(dataset_id=dataset_id)
        return {
            "success": True,
            "data": data
        }

