from fastapi import APIRouter, HTTPException, UploadFile, File, status
import os
import io

router = APIRouter()

@router.post("/extract", summary="Extract Metadata from Documents")
async def extract_metadata(
    file: UploadFile = File(...)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")
    
    filename = file.filename.lower()
    content = await file.read()
    results = {}
    
    try:
        if filename.endswith(".pdf"):
            import fitz  # PyMuPDF
            doc = fitz.open(stream=content, filetype="pdf")
            results = doc.metadata
            doc.close()
            
        elif filename.endswith(".docx"):
            import docx
            doc = docx.Document(io.BytesIO(content))
            prop = doc.core_properties
            results = {
                "author": prop.author,
                "category": prop.category,
                "comments": prop.comments,
                "content_status": prop.content_status,
                "created": prop.created.isoformat() if prop.created else None,
                "identifier": prop.identifier,
                "keywords": prop.keywords,
                "language": prop.language,
                "last_modified_by": prop.last_modified_by,
                "last_printed": prop.last_printed.isoformat() if prop.last_printed else None,
                "modified": prop.modified.isoformat() if prop.modified else None,
                "revision": prop.revision,
                "subject": prop.subject,
                "title": prop.title,
                "version": prop.version
            }
            
        elif filename.endswith(".xlsx"):
            import openpyxl
            wb = openpyxl.load_workbook(filename=io.BytesIO(content), read_only=True)
            prop = wb.properties
            results = {
                "creator": prop.creator,
                "title": prop.title,
                "description": prop.description,
                "subject": prop.subject,
                "identifier": prop.identifier,
                "language": prop.language,
                "created": prop.created.isoformat() if prop.created else None,
                "modified": prop.modified.isoformat() if prop.modified else None,
                "lastModifiedBy": prop.lastModifiedBy,
                "category": prop.category,
                "contentStatus": prop.contentStatus,
                "version": prop.version,
                "revision": prop.revision,
                "keywords": prop.keywords,
                "lastPrinted": prop.lastPrinted.isoformat() if prop.lastPrinted else None,
            }
            wb.close()
            
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported file type. Please upload a .pdf, .docx, or .xlsx file."
            )
            
        # Clean up empty or None values
        cleaned_results = {k: v for k, v in results.items() if v}
        
        return {
            "filename": file.filename,
            "metadata": cleaned_results,
            "count": len(cleaned_results),
            "message": f"Successfully extracted {len(cleaned_results)} metadata fields."
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse document: {str(e)}"
        )
