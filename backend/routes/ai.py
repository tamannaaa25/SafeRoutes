from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

try:
    from database import get_db
    from schemas import AIInsightsRequest, AIInsightResponse
    from services.gemini_service import generate_safety_insights
except ImportError:
    from backend.database import get_db
    from backend.schemas import AIInsightsRequest, AIInsightResponse
    from backend.services.gemini_service import generate_safety_insights

router = APIRouter(prefix="/ai", tags=["AI Safety Insights"])

@router.post("/insights", response_model=AIInsightResponse)
def get_ai_safety_insights(req: AIInsightsRequest = AIInsightsRequest(), db: Session = Depends(get_db)):
    result = generate_safety_insights(db, req.dataset_id)
    return result
