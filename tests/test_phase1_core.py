"""
Unit tests for da Holmes v2.0 Phase 1: Database Models & Architecture
- Workspace, Target, Artifact, ScanResult
"""
import pytest
from app.models.models import Workspace, Target, Artifact, ScanResult, Investigation


def test_database_models_structure():
    """Verify Workspace, Target, Artifact, and ScanResult models instantiate with expected fields."""
    ws = Workspace(name="RedTeam-Op-Alpha", description="Q4 External Assessment")
    assert ws.name == "RedTeam-Op-Alpha"

    tgt = Target(workspace=ws, target_type="domain", target_value="target-corp.com", status="pending")
    assert tgt.target_value == "target-corp.com"
    assert tgt.workspace is ws

    art = Artifact(
        workspace=ws,
        artifact_name="suspect_doc.pdf",
        artifact_type="pdf",
        file_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        extracted_metadata={"author": "attacker", "producer": "malicious-gen"}
    )
    assert art.artifact_name == "suspect_doc.pdf"
    assert art.extracted_metadata["author"] == "attacker"

    scan = ScanResult(
        target=tgt,
        module_name="file_forensics",
        status="success",
        data={"hashes": {"sha256": "abc123"}},
        execution_time_ms=45.2
    )
    assert scan.module_name == "file_forensics"
    assert scan.target is tgt
