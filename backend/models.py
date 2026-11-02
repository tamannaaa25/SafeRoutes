from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Date, Time,
    DateTime, ForeignKey, Text, Index
)
from sqlalchemy.orm import relationship
try:
    from database import Base
except ImportError:
    from backend.database import Base

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    dataset_name = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    total_records = Column(Integer, default=0)
    valid_records = Column(Integer, default=0)
    invalid_records = Column(Integer, default=0)
    duplicate_records = Column(Integer, default=0)
    processing_status = Column(String(50), default="processed")

    accidents = relationship("Accident", back_populates="dataset", cascade="all, delete-orphan")
    quality_issues = relationship("DataQualityIssue", back_populates="dataset", cascade="all, delete-orphan")

class Accident(Base):
    __tablename__ = "accidents"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    accident_date = Column(Date, nullable=True, index=True)
    accident_time = Column(Time, nullable=True)
    location = Column(String(255), nullable=False, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    severity = Column(String(50), nullable=False, index=True)
    weather_condition = Column(String(50), nullable=True)
    road_condition = Column(String(50), nullable=True)
    number_of_vehicles = Column(Integer, default=1)
    injuries = Column(Integer, default=0)
    fatalities = Column(Integer, default=0)
    source_record_id = Column(String(100), nullable=True)
    is_valid = Column(Boolean, default=True)
    is_duplicate = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    dataset = relationship("Dataset", back_populates="accidents")
    quality_issues = relationship("DataQualityIssue", back_populates="accident", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_accidents_dataset_valid", "dataset_id", "is_valid"),
        Index("idx_accidents_location_severity", "location", "severity"),
    )

class DataQualityIssue(Base):
    __tablename__ = "data_quality_issues"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=True, index=True)
    accident_id = Column(Integer, ForeignKey("accidents.id", ondelete="CASCADE"), nullable=True, index=True)
    issue_type = Column(String(50), nullable=False)
    field_name = Column(String(100), nullable=False)
    issue_description = Column(Text, nullable=False)
    detected_value = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    dataset = relationship("Dataset", back_populates="quality_issues")
    accident = relationship("Accident", back_populates="quality_issues")

class InvestigationRecommendation(Base):
    __tablename__ = "investigation_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="SET NULL"), nullable=True, index=True)
    location = Column(String(255), nullable=False)
    recommendation = Column(Text, nullable=False)
    priority = Column(String(50), nullable=False)
    evidence = Column(Text, nullable=True)
    status = Column(String(50), default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)
