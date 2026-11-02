from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import date, time, datetime

class DatabaseStatusResponse(BaseModel):
    connected: bool
    database_name: str
    server_version: str
    latency_ms: float
    total_datasets: int
    total_accidents: int
    total_valid_accidents: int
    total_invalid_accidents: int
    total_duplicates: int
    tables: List[Dict[str, Any]]
    error: Optional[str] = None

class DatasetResponse(BaseModel):
    id: int
    dataset_name: str
    original_filename: str
    upload_date: datetime
    total_records: int
    valid_records: int
    invalid_records: int
    duplicate_records: int
    processing_status: str

    class Config:
        from_attributes = True

class QualityIssueItem(BaseModel):
    id: int
    issue_type: str
    field_name: str
    issue_description: str
    detected_value: Optional[str]

    class Config:
        from_attributes = True

class AccidentRecordResponse(BaseModel):
    id: int
    dataset_id: int
    source_record_id: Optional[str]
    accident_date: Optional[date]
    accident_time: Optional[time]
    location: str
    latitude: Optional[float]
    longitude: Optional[float]
    severity: str
    weather_condition: Optional[str]
    road_condition: Optional[str]
    number_of_vehicles: int
    injuries: int
    fatalities: int
    is_valid: bool
    is_duplicate: bool
    issues: Optional[List[QualityIssueItem]] = []

    class Config:
        from_attributes = True

class OverviewStatsResponse(BaseModel):
    total_accidents: int
    total_injuries: int
    total_fatalities: int
    top_location: str
    top_location_count: int
    unique_locations_count: int
    valid_records: int
    invalid_records: int
    dataset_name: str

class MonthlyDataPoint(BaseModel):
    month: str
    accidents: int

class DayOfWeekDataPoint(BaseModel):
    day: str
    accidents: int

class CategoryDataPoint(BaseModel):
    name: str
    value: int

class LocationDataPoint(BaseModel):
    location: str
    crashes: int
    injuries: int
    fatalities: int
    rank: int

class SqlDemoQueryResponse(BaseModel):
    query_id: str
    title: str
    description: str
    sql_text: str
    operations_demonstrated: List[str]
    columns: List[str]
    rows: List[Dict[str, Any]]
    row_count: int
    execution_time_ms: float

class AIInsightsRequest(BaseModel):
    dataset_id: Optional[int] = None
    severity_filter: Optional[str] = "All"
    include_recommendations: Optional[bool] = True

class AIInsightResponse(BaseModel):
    generated_at: datetime
    source: str
    model_name: str
    executive_summary: str
    key_observations: List[str]
    high_risk_corridors_analysis: str
    weather_and_visibility_impact: str
    recommended_interventions: List[Dict[str, Any]]
    caveat_note: str
    supporting_metrics: Dict[str, Any]
