from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from .database import Base

class InvestigationHistory(Base):
    __tablename__ = "investigation_history"

    id = Column(Integer, primary_key=True, index=True)
    target = Column(String, index=True, nullable=False)
    type = Column(String, nullable=False)  # 'ip', 'domain', 'username', 'email'
    date = Column(DateTime, default=datetime.utcnow, nullable=False)
    results = Column(Text, nullable=True)  # JSON serialized scan results

class AnalystNotes(Base):
    __tablename__ = "analyst_notes"

    id = Column(Integer, primary_key=True, index=True)
    target = Column(String, index=True, nullable=False)
    text = Column(Text, nullable=False)
    tags = Column(String, default="", nullable=False)  # Comma-separated tags, e.g. "critical,leak"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class ApiVault(Base):
    __tablename__ = "api_vault"

    id = Column(Integer, primary_key=True, index=True)
    service_name = Column(String, unique=True, index=True, nullable=False)  # e.g. "github_pat", "alienvault"
    api_key = Column(String, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
