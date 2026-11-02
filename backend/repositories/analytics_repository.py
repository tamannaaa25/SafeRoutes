from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text

class AnalyticsRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_overview_stats(self, dataset_id: Optional[int] = None, severity: Optional[str] = "All") -> Dict[str, Any]:
        query = text("""
            SELECT 
                COUNT(id) AS total_accidents,
                COALESCE(SUM(injuries), 0) AS total_injuries,
                COALESCE(SUM(fatalities), 0) AS total_fatalities,
                COUNT(DISTINCT location) AS unique_locations_count,
                COUNT(CASE WHEN severity IN ('High', 'Fatal', 'Severe') THEN 1 END) AS high_severity_count
            FROM accidents
            WHERE is_valid = TRUE
              AND (:dataset_id IS NULL OR dataset_id = :dataset_id)
              AND (:severity = 'All' OR LOWER(severity) = LOWER(:severity));
        """)

        res = self.db.execute(query, {
            "dataset_id": dataset_id,
            "severity": severity or "All"
        }).fetchone()

        top_loc_query = text("""
            SELECT location, COUNT(id) AS crash_count
            FROM accidents
            WHERE is_valid = TRUE
              AND (:dataset_id IS NULL OR dataset_id = :dataset_id)
              AND (:severity = 'All' OR LOWER(severity) = LOWER(:severity))
            GROUP BY location
            ORDER BY crash_count DESC, location ASC
            LIMIT 1;
        """)

        top_loc_res = self.db.execute(top_loc_query, {
            "dataset_id": dataset_id,
            "severity": severity or "All"
        }).fetchone()

        top_loc = top_loc_res[0] if top_loc_res else "None Recorded"
        top_loc_count = top_loc_res[1] if top_loc_res else 0

        invalid_query = text("""
            SELECT COUNT(id)
            FROM accidents
            WHERE is_valid = FALSE
              AND (:dataset_id IS NULL OR dataset_id = :dataset_id);
        """)
        invalid_count = self.db.execute(invalid_query, {"dataset_id": dataset_id}).scalar() or 0

        ds_name_query = text("""
            SELECT dataset_name FROM datasets
            WHERE (:dataset_id IS NULL OR id = :dataset_id)
            ORDER BY upload_date DESC
            LIMIT 1;
        """)
        ds_name = self.db.execute(ds_name_query, {"dataset_id": dataset_id}).scalar() or "All Datasets"

        return {
            "dataset_name": ds_name,
            "dataset_id": dataset_id,
            "total_accidents": res[0] if res else 0,
            "total_injuries": int(res[1]) if res else 0,
            "total_fatalities": int(res[2]) if res else 0,
            "unique_locations_count": res[3] if res else 0,
            "high_severity_count": res[4] if res else 0,
            "top_location": top_loc,
            "top_location_count": top_loc_count,
            "valid_records": res[0] if res else 0,
            "invalid_records": invalid_count
        }

    def get_monthly_distribution(self, dataset_id: Optional[int] = None, severity: Optional[str] = "All") -> List[Dict[str, Any]]:
        query = text("""
            SELECT 
                TO_CHAR(accident_date, 'YYYY-Mon') AS month,
                EXTRACT(MONTH FROM accident_date) AS month_number,
                COUNT(id) AS incident_count,
                COALESCE(SUM(injuries), 0) AS injuries,
                COALESCE(SUM(fatalities), 0) AS fatalities
            FROM accidents
            WHERE is_valid = TRUE 
              AND accident_date IS NOT NULL
              AND (:dataset_id IS NULL OR dataset_id = :dataset_id)
              AND (:severity = 'All' OR LOWER(severity) = LOWER(:severity))
            GROUP BY TO_CHAR(accident_date, 'YYYY-Mon'), EXTRACT(MONTH FROM accident_date)
            ORDER BY month_number ASC;
        """)

        results = self.db.execute(query, {
            "dataset_id": dataset_id,
            "severity": severity or "All"
        }).fetchall()

        data = []
        for row in results:
            data.append({
                "month": row[0],
                "month_number": int(row[1]),
                "incident_count": int(row[2]),
                "accidents": int(row[2]),
                "injuries": int(row[3]),
                "fatalities": int(row[4])
            })
        return data

    def get_severity_breakdown(self, dataset_id: Optional[int] = None) -> List[Dict[str, Any]]:
        query = text("""
            SELECT 
                severity,
                COUNT(id) AS count,
                COALESCE(SUM(injuries), 0) AS injuries,
                COALESCE(SUM(fatalities), 0) AS fatalities
            FROM accidents
            WHERE is_valid = TRUE
              AND (:dataset_id IS NULL OR dataset_id = :dataset_id)
            GROUP BY severity
            ORDER BY count DESC;
        """)

        results = self.db.execute(query, {"dataset_id": dataset_id}).fetchall()
        return [
            {
                "name": row[0] or "Unknown",
                "value": int(row[1]),
                "injuries": int(row[2]),
                "fatalities": int(row[3])
            }
            for row in results
        ]

    def get_location_rankings(self, dataset_id: Optional[int] = None, limit: int = 10) -> List[Dict[str, Any]]:
        query = text("""
            SELECT 
                location,
                COUNT(id) AS crashes,
                COALESCE(SUM(injuries), 0) AS injuries,
                COALESCE(SUM(fatalities), 0) AS fatalities
            FROM accidents
            WHERE is_valid = TRUE
              AND (:dataset_id IS NULL OR dataset_id = :dataset_id)
            GROUP BY location
            ORDER BY crashes DESC, fatalities DESC, injuries DESC
            LIMIT :limit;
        """)

        results = self.db.execute(query, {
            "dataset_id": dataset_id,
            "limit": limit
        }).fetchall()

        rankings = []
        for idx, row in enumerate(results, 1):
            rankings.append({
                "rank": idx,
                "location": row[0],
                "crashes": int(row[1]),
                "injuries": int(row[2]),
                "fatalities": int(row[3])
            })
        return rankings

    def get_weather_distribution(self, dataset_id: Optional[int] = None) -> List[Dict[str, Any]]:
        query = text("""
            SELECT 
                COALESCE(weather_condition, 'Clear') AS weather,
                COUNT(id) AS count,
                COALESCE(SUM(injuries), 0) AS injuries,
                COALESCE(SUM(fatalities), 0) AS fatalities
            FROM accidents
            WHERE is_valid = TRUE
              AND (:dataset_id IS NULL OR dataset_id = :dataset_id)
            GROUP BY weather_condition
            ORDER BY count DESC;
        """)

        results = self.db.execute(query, {"dataset_id": dataset_id}).fetchall()
        return [
            {
                "name": row[0],
                "value": int(row[1]),
                "injuries": int(row[2]),
                "fatalities": int(row[3])
            }
            for row in results
        ]

    def get_recommendations(self, dataset_id: Optional[int] = None) -> List[Dict[str, Any]]:
        query = text("""
            SELECT id, location, recommendation, priority, evidence, status
            FROM investigation_recommendations
            WHERE (:dataset_id IS NULL OR dataset_id = :dataset_id)
            ORDER BY 
              CASE priority
                WHEN 'CRITICAL' THEN 1
                WHEN 'HIGH' THEN 2
                WHEN 'MEDIUM' THEN 3
                ELSE 4
              END, id ASC;
        """)

        results = self.db.execute(query, {"dataset_id": dataset_id}).fetchall()
        return [
            {
                "id": row[0],
                "location": row[1],
                "recommendation": row[2],
                "priority": row[3],
                "evidence": row[4],
                "status": row[5]
            }
            for row in results
        ]
