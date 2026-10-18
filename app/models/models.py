from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, JSON, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

# ---------------------------------------------------------------------------
# da Holmes v2.0 - Core Investigation & Forensics Data Models
# ---------------------------------------------------------------------------

class Workspace(Base):
    """
    Logical grouping of OSINT investigations, targets, and forensic artifacts.
    """
    __tablename__ = "workspaces"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    targets: Mapped[List["Target"]] = relationship(
        "Target", back_populates="workspace", cascade="all, delete-orphan", lazy="selectin"
    )
    artifacts: Mapped[List["Artifact"]] = relationship(
        "Artifact", back_populates="workspace", cascade="all, delete-orphan", lazy="selectin"
    )


class Target(Base):
    """
    An entity under investigation (domain, IP, username, email, phone, BTC, etc.).
    """
    __tablename__ = "targets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    workspace_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True
    )
    target_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)  # domain, ip, username, email, etc.
    target_value: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending", index=True, nullable=False)  # pending, scanning, completed, failed
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="targets")
    scan_results: Mapped[List["ScanResult"]] = relationship(
        "ScanResult", back_populates="target", cascade="all, delete-orphan", lazy="selectin"
    )


class Artifact(Base):
    """
    Files, images, documents, or raw binary assets analyzed by the local forensics engine.
    """
    __tablename__ = "artifacts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    workspace_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True
    )
    artifact_name: Mapped[str] = mapped_column(String(255), nullable=False)
    artifact_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)  # image, pdf, pcap, document
    file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    file_hash: Mapped[Optional[str]] = mapped_column(String(64), index=True, nullable=True)  # SHA-256
    file_size_bytes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    extracted_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="artifacts")


class ScanResult(Base):
    """
    Detailed output and metrics produced by an individual recon or analysis module.
    """
    __tablename__ = "scan_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    target_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("targets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    module_name: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(50), index=True, nullable=False)  # success, error, partial
    data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    execution_time_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True, nullable=False)

    target: Mapped["Target"] = relationship("Target", back_populates="scan_results")


# ---------------------------------------------------------------------------
# Legacy Model Definitions (Maintained for Backward Compatibility)
# ---------------------------------------------------------------------------

class Investigation(Base):
    """
    Represents a legacy OSINT investigation session for a specific target.
    """
    __tablename__ = "investigations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    query_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)  # ip, domain, email, username
    query_value: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True, nullable=False)

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
    module_name: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    raw_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(50), index=True, nullable=False)

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
    tag_color: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    note_text: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True, nullable=False)

    investigation: Mapped["Investigation"] = relationship("Investigation", back_populates="notes")


class ApiKeySetting(Base):
    """
    Stores credentials/keys for third-party API services securely.
    """
    __tablename__ = "api_key_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    service_name: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    api_key: Mapped[str] = mapped_column(String(255), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
