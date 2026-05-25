import os
import tempfile
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from fastapi.responses import FileResponse

from app.services.unified_scanner import UnifiedScanner
from app.services.pdf_generator import PDFReportGenerator

router = APIRouter()
_unified_scanner = UnifiedScanner()

def remove_file(path: str):
    try:
        if os.path.exists(path):
            os.unlink(path)
    except Exception as e:
        print(f"Error deleting temp file {path}: {e}")

@router.get("/download-report")
async def download_report(
    background_tasks: BackgroundTasks,
    domain: str = Query(..., description="The target domain or query for the report.")
):
    # 1. Fetch OSINT Data via Unified Scanner
    try:
        json_data = await _unified_scanner.scan(domain)
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to gather OSINT intelligence for report: {str(e)}"
        )
        
    # 2. Extract context for Executive Summary
    target_type = json_data.get("target_type", "Unknown")
    summary_text = (
        f"OSINT Investigation for target: {domain}\n\n"
        f"This automated intelligence report covers preliminary footprinting "
        f"for a {target_type} target. The following pages contain raw metadata, "
        f"network configurations, and potential public exposures discovered across "
        f"integrated scanning modules. All findings should be manually verified."
    )
    
    # 3. Generate PDF to a temporary file
    fd, temp_path = tempfile.mkstemp(suffix=".pdf")
    os.close(fd)
    
    try:
        generator = PDFReportGenerator()
        generator.generate_pdf(json_data, summary_text, temp_path)
    except Exception as e:
        remove_file(temp_path)
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to compile PDF document: {str(e)}"
        )
        
    # 4. Schedule cleanup and return FileResponse
    background_tasks.add_task(remove_file, temp_path)
    
    # Clean filename string
    safe_filename = "".join([c if c.isalnum() else "_" for c in domain]) + "_osint_report.pdf"
    
    return FileResponse(
        path=temp_path,
        media_type="application/pdf",
        filename=safe_filename
    )
