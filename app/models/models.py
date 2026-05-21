from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Investigation(Base):
    """
    Represents an OSINT investigation session for a specific target.
    """
    __tablename__ = "investigations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    query_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)  # ip, domain, email, username
    query_value: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True, nullable=False)

    # Cascade delete is specified so removing an investigation deletes its results and notes.
    results: Mapped[List["TargetResult"]] = relationship(
        "TargetResult", back_populates="investigation", cascade="all, delete-orphan", lazy="selectin"
    )
    notes: Mapped[List["AnalystNote"]] = relationship(
        "AnalystNote", back_populates="investigation", cascade="all, delete-orphan", lazy="selectin"
    )


class TargetResult(Base):
    """
    Stores raw results/telemetry from individual scanning modules.
    """
    __tablename__ = "target_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    investigation_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    module_name: Mapped[str] = mapped_column(String(50), index=True, nullable=False)  # e.g., shodan, maigret, ipintel
    raw_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(50), index=True, nullable=False)  # e.g., success, error, partial

    investigation: Mapped["Investigation"] = relationship("Investigation", back_populates="results")


class AnalystNote(Base):
    """
    Allows analysts to record findings, assign tags/colors, and annotate investigations.
    """
    __tablename__ = "analyst_notes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    investigation_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    tag_color: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # Hex or CSS class color
    note_text: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True, nullable=False)

    investigation: Mapped["Investigation"] = relationship("Investigation", back_populates="notes")
