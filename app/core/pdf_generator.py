import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_pdf_report(scan_data: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#2c3e50'),
        alignment=1, # Center
        spaceAfter=20
    )
    
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#7f8c8d'),
        alignment=1,
        spaceAfter=30
    )
    
    section_style = ParagraphStyle(
        'SectionStyle',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#2980b9'),
        spaceBefore=20,
        spaceAfter=10
    )
    
    normal_style = styles["Normal"]
    
    elements = []
    
    # Header
    elements.append(Paragraph("Holmes OSINT Report", title_style))
    date_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    elements.append(Paragraph(f"Generated on: {date_str}", subtitle_style))
    
    # Target Information
    elements.append(Paragraph("Target Summary", section_style))
    
    target = scan_data.get("target", "Unknown")
    target_type = str(scan_data.get("target_type", "Unknown")).upper()
    risk_score = scan_data.get("risk_score", 0)
    risk_level = scan_data.get("risk_level", "INFO")
    
    risk_color = colors.HexColor('#2ecc71')
    if risk_score < 70: risk_color = colors.HexColor('#f39c12')
    if risk_score < 40: risk_color = colors.HexColor('#e74c3c')
    
    summary_data = [
        ["Target:", target],
        ["Type:", target_type],
        ["Risk Score:", str(risk_score)],
        ["Risk Level:", risk_level],
        ["Modules Run:", str(scan_data.get("modules_run", 0))],
        ["Total Findings:", str(scan_data.get("total_findings", 0))]
    ]
    
    summary_table = Table(summary_data, colWidths=[150, 350])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#ecf0f1')),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#2c3e50')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#bdc3c7')),
        ('TEXTCOLOR', (1, 3), (1, 3), risk_color), # Color code risk level
        ('FONTNAME', (1, 3), (1, 3), 'Helvetica-Bold'),
    ]))
    
    elements.append(summary_table)
    elements.append(Spacer(1, 20))
    
    # Correlations / Findings
    elements.append(Paragraph("Correlated Threats & Vulnerabilities", section_style))
    correlations = scan_data.get("correlations", [])
    
    if not correlations:
        elements.append(Paragraph("No major threats correlated during this scan.", normal_style))
    else:
        for c in correlations:
            rule = c.get("rule", "").replace("_", " ")
            sev = c.get("severity", "INFO")
            desc = c.get("description", "")
            rec = c.get("recommendation", "")
            
            sev_color = '#3498db'
            if sev == 'CRITICAL': sev_color = '#e74c3c'
            elif sev == 'HIGH': sev_color = '#e67e22'
            elif sev == 'MEDIUM': sev_color = '#f39c12'
            
            elements.append(Paragraph(f"<b><font color='{sev_color}'>[{sev}]</font> {rule}</b>", normal_style))
            elements.append(Spacer(1, 5))
            elements.append(Paragraph(f"<b>Description:</b> {desc}", normal_style))
            elements.append(Spacer(1, 5))
            elements.append(Paragraph(f"<b>Recommendation:</b> <i>{rec}</i>", normal_style))
            elements.append(Spacer(1, 15))
            
    doc.build(elements)
    
    return buffer.getvalue()
