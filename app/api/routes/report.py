import os
import tempfile
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks, Request
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

    summary_text = f"OSINT Investigation for target: {domain}\n\nThis automated intelligence report covers preliminary footprinting for a {target_type} target. All findings should be manually verified."
    try:
        import g4f
        prompt = f"Act as a Senior Cyber Intelligence Analyst. Write a 2-paragraph executive summary of these OSINT findings for target {domain}: {str(json_data)[:1000]}"
        ai_response = g4f.ChatCompletion.create(model=g4f.models.gpt_35_turbo, messages=[{"role": "user", "content": prompt}], provider=g4f.Provider.Blackbox)
        if ai_response:
            summary_text = f"AI EXECUTIVE SUMMARY:\n\n{ai_response}\n\n" + summary_text
    except Exception as ai_err:
        print(f"AI Summary failed: {ai_err}")
    
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

@router.post("/generate")
async def generate_report_from_data(
    request: Request,
    background_tasks: BackgroundTasks,
    query: str = Query(..., description="The target query for the report.")
):
    try:
        json_data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload.")

    target_type = json_data.get("target_type", "Unknown")

    summary_text = f"OSINT Investigation for target: {domain}\n\nThis automated intelligence report covers preliminary footprinting for a {target_type} target. All findings should be manually verified."
    try:
        import g4f
        prompt = f"Act as a Senior Cyber Intelligence Analyst. Write a 2-paragraph executive summary of these OSINT findings for target {domain}: {str(json_data)[:1000]}"
        ai_response = g4f.ChatCompletion.create(model=g4f.models.gpt_35_turbo, messages=[{"role": "user", "content": prompt}], provider=g4f.Provider.Blackbox)
        if ai_response:
            summary_text = f"AI EXECUTIVE SUMMARY:\n\n{ai_response}\n\n" + summary_text
    except Exception as ai_err:
        print(f"AI Summary failed: {ai_err}")

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

    background_tasks.add_task(remove_file, temp_path)
    safe_filename = "".join([c if c.isalnum() else "_" for c in query]) + "_osint_report.pdf"

    return FileResponse(
        path=temp_path,
        media_type="application/pdf",
        filename=safe_filename
    )


