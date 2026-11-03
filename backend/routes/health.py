from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db, check_db_connection
from models import Dataset, Accident, DataQualityIssue, InvestigationRecommendation

router = APIRouter(tags=["Health & Status"])

@router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "service": "SafeRoutes Decision Support API",
        "version": "2.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/database/status")
def get_database_status(db: Session = Depends(get_db)):
    status_info = check_db_connection()
    if not status_info.get("connected"):
        return {
            "connected": False,
            "error": status_info.get("error"),
            "provider": status_info.get("provider", "PostgreSQL"),
            "database_name": status_info.get("database_name", "saferoutes_db"),
            "host": status_info.get("host", "configured"),
            "port": status_info.get("port", 5432),
            "latency_ms": status_info.get("latency_ms", 0),
            "table_counts": {}
        }
    
    table_counts = {}
    try:
        table_counts["datasets"] = db.query(Dataset).count()
        table_counts["accidents"] = db.query(Accident).count()
        table_counts["data_quality_issues"] = db.query(DataQualityIssue).count()
        table_counts["investigation_recommendations"] = db.query(InvestigationRecommendation).count()
    except Exception as e:
        table_counts["error"] = str(e)

    return {
        "connected": True,
        "provider": status_info.get("provider", "PostgreSQL"),
        "database_name": status_info.get("database_name", "saferoutes_db"),
        "server": status_info.get("server_version", "PostgreSQL"),
        "host": status_info.get("host", "configured"),
        "port": status_info.get("port", 5432),
        "latency_ms": status_info.get("latency_ms", 0),
        "table_counts": table_counts,
        "checked_at": datetime.utcnow().isoformat()
    }
