import os
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def add_header_footer(canvas, doc):
    """Draw a dynamic page header and footer."""
    canvas.saveState()
    
    # Primary accent color: Deep Navy
    primary_color = colors.HexColor('#0F172A')
    line_color = colors.HexColor('#CBD5E1')
    
    # Header
    canvas.setFont('Helvetica-Bold', 8)
    canvas.setFillColor(primary_color)
    canvas.drawString(54, 755, "HOLMES OSINT PLATFORM — INTEL AUDIT")
    
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#64748B'))
    canvas.drawRightString(doc.pagesize[0] - 54, 755, datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC'))
    
    canvas.setStrokeColor(line_color)
    canvas.setLineWidth(0.5)
    canvas.line(54, 747, doc.pagesize[0] - 54, 747)
    
    # Footer
    canvas.line(54, 50, doc.pagesize[0] - 54, 50)
    canvas.drawString(54, 38, "CONFIDENTIAL // TECHNICAL THREAT RECONNAISSANCE")
    
    page_num = f"Page {doc.page}"
    canvas.drawRightString(doc.pagesize[0] - 54, 38, page_num)
    
    canvas.restoreState()

def build_pdf_report(target: str, data: dict, analyst_notes: list = None) -> bytes:
    """
    Generates a professional PDF containing structured threat intelligence data.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=70,
        bottomMargin=70
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Palette
    c_primary = colors.HexColor('#0F172A')   # Navy Blue
    c_secondary = colors.HexColor('#0284C7') # Sky Blue
    c_dark = colors.HexColor('#1E293B')      # Slate
    c_gray = colors.HexColor('#475569')      # Cool Gray
    c_light = colors.HexColor('#F8FAFC')     # Light Gray Background
    c_border = colors.HexColor('#E2E8F0')    # Border line color
    
    # Typography Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=30,
        textColor=c_primary,
        spaceAfter=10
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=c_gray,
        spaceAfter=30
    )
    
    h1_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=c_primary,
        spaceBefore=20,
        spaceAfter=10,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        'SubSectionHeading',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=c_secondary,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=c_dark,
        spaceAfter=8
    )
    
    body_bold = ParagraphStyle(
        'CustomBodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    
    code_style = ParagraphStyle(
        'CustomCode',
        parent=styles['Code'],
        fontName='Courier',
        fontSize=9,
        leading=11,
        textColor=colors.HexColor('#BE123C'),
        spaceAfter=6
    )
    
    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=c_dark
    )
    
    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.white
    )

    story = []
    
    # ── COVER / TITLE PAGE ──
    story.append(Spacer(1, 40))
    story.append(Paragraph("🕵️ HOLMES OSINT PLATFORM", subtitle_style))
    story.append(Paragraph("TECHNICAL RECONNAISSANCE AUDIT BRIEF", title_style))
    story.append(Spacer(1, 10))
    
    # Metadata Box
    meta_data = [
        [Paragraph("<b>Target Entity:</b>", body_style), Paragraph(target, body_style)],
        [Paragraph("<b>Scan Date:</b>", body_style), Paragraph(datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"), body_style)],
        [Paragraph("<b>Document Classification:</b>", body_style), Paragraph("CONFIDENTIAL // PROPRIETARY OSINT TELEMETRY", body_bold)],
    ]
    t_meta = Table(meta_data, colWidths=[150, 350])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_light),
        ('PADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 30))
    
    # Executive Summary (Deterministic Rule-Based)
    story.append(Paragraph("1. Executive Summary", h1_style))
    
    # Gather key metrics for summary
    subdomain_count = len(data.get("subdomains", []))
    tech_count = len(data.get("tech_stack", []))
    social_profiles = len(data.get("social_profiles", []))
    threat_pulses = data.get("threat_intel", {}).get("malicious_flags", 0)
    spf_status = data.get("email_forensics", {}).get("spf", {}).get("status", "Not Checked")
    dmarc_status = data.get("email_forensics", {}).get("dmarc", {}).get("status", "Not Checked")
    
    risk_score = 0
    risk_factors = []
    
    if spf_status != "Found":
        risk_score += 25
        risk_factors.append("Domain lacks an SPF validation configuration, allowing immediate impersonation.")
    if dmarc_status != "Found":
        risk_score += 25
        risk_factors.append("Domain lacks a DMARC monitoring/enforcement configuration.")
    if threat_pulses > 0:
        risk_score += min(threat_pulses * 15, 40)
        risk_factors.append(f"Entity is referenced in {threat_pulses} active threat intelligence indicators (AlienVault OTX).")
    if social_profiles > 3:
        risk_score += 10
    
    risk_level = "LOW"
    if risk_score > 60:
        risk_level = "CRITICAL"
    elif risk_score > 40:
        risk_level = "HIGH"
    elif risk_score > 20:
        risk_level = "MEDIUM"
        
    summary_text = (
        f"A comprehensive OSINT audit was conducted on target <b>{target}</b>. "
        f"Based on resolved system signatures, the current target profile risk level is assessed as "
        f"<b>{risk_level}</b> (Score: {risk_score}/100). "
        f"The scan identified {subdomain_count} distinct subdomains, {tech_count} infrastructure technologies, "
        f"{social_profiles} online footprints, and {threat_pulses} known threat matches."
    )
    story.append(Paragraph(summary_text, body_style))
    
    if risk_factors:
        story.append(Paragraph("Primary Threat Drivers Identified:", h2_style))
        for factor in risk_factors:
            story.append(Paragraph(f"• {factor}", body_style))
            
    story.append(Spacer(1, 20))
    story.append(PageBreak())
    
    # ── TECHNICAL RECON DATA ──
    story.append(Paragraph("2. Infrastructure Technical Recon", h1_style))
    
    # Email Forensics
    story.append(Paragraph("Email Validation Configurations", h2_style))
    spf_val = data.get("email_forensics", {}).get("spf", {}).get("record") or "No SPF configuration parsed."
    dmarc_val = data.get("email_forensics", {}).get("dmarc", {}).get("record") or "No DMARC configuration parsed."
    
    story.append(Paragraph("<b>SPF Record:</b>", body_style))
    story.append(Paragraph(spf_val, code_style))
    story.append(Paragraph("<b>DMARC Record:</b>", body_style))
    story.append(Paragraph(dmarc_val, code_style))
    
    story.append(Spacer(1, 15))
    
    # Subdomain Table
    subdomains = data.get("subdomains", [])
    if subdomains:
        story.append(Paragraph(f"Discovered Subdomains ({len(subdomains)})", h2_style))
        sub_rows = [[Paragraph("Subdomain Name", table_header), Paragraph("Source/Issuer", table_header)]]
        for sub in subdomains[:30]:  # Cap at 30 to prevent massive reports
            name = sub.get("subdomain") or sub
            issuer = sub.get("issuer") if isinstance(sub, dict) else "crt.sh CT Log"
            sub_rows.append([Paragraph(name, table_cell), Paragraph(issuer, table_cell)])
            
        t_sub = Table(sub_rows, colWidths=[350, 150])
        t_sub.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), c_primary),
            ('BOTTOMPADDING', (0,0), (-1,0), 6),
            ('GRID', (0,0), (-1,-1), 0.5, c_border),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light]),
            ('PADDING', (0,0), (-1,-1), 5),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(t_sub)
        if len(subdomains) > 30:
            story.append(Paragraph(f"<i>* Showing first 30 of {len(subdomains)} subdomains.</i>", body_style))
    else:
        story.append(Paragraph("No subdomains discovered in public certificate logs.", body_style))
        
    story.append(Spacer(1, 20))
    story.append(PageBreak())
    
    # ── SYSTEM TECH STACK ──
    story.append(Paragraph("3. Fingerprinted Technologies", h1_style))
    technologies = data.get("tech_stack", [])
    if technologies:
        tech_rows = [[Paragraph("Category / Type", table_header), Paragraph("Technology Profile", table_header)]]
        for tech in technologies:
            tech_rows.append([
                Paragraph(tech.get("type", "Unknown"), table_cell),
                Paragraph(tech.get("name", "Unknown"), table_cell)
            ])
        t_tech = Table(tech_rows, colWidths=[200, 300])
        t_tech.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), c_secondary),
            ('BOTTOMPADDING', (0,0), (-1,0), 6),
            ('GRID', (0,0), (-1,-1), 0.5, c_border),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light]),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(t_tech)
    else:
        story.append(Paragraph("No technological stack signatures captured.", body_style))
        
    story.append(Spacer(1, 20))
    
    # ── SOCIAL OR ONLINE FOOTPRINT ──
    story.append(Paragraph("4. Username Footprinting & Threat Feeds", h1_style))
    
    socials = data.get("social_profiles", [])
    if socials:
        story.append(Paragraph("Captured Account Matches Across Curated Platforms:", h2_style))
        soc_rows = [[Paragraph("Platform", table_header), Paragraph("Profile URL", table_header)]]
        for soc in socials:
            soc_rows.append([
                Paragraph(soc.get("platform", "Unknown"), table_cell),
                Paragraph(soc.get("url", "Unknown"), table_cell)
            ])
        t_soc = Table(soc_rows, colWidths=[150, 350])
        t_soc.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), c_primary),
            ('BOTTOMPADDING', (0,0), (-1,0), 6),
            ('GRID', (0,0), (-1,-1), 0.5, c_border),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light]),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(t_soc)
    else:
        story.append(Paragraph("No profile matches identified.", body_style))
        
    story.append(Spacer(1, 15))
    
    # AlienVault Threat Intel Matches
    story.append(Paragraph("Threat Intelligence Database Reputation Check", h2_style))
    intel_details = data.get("threat_intel", {}).get("details") or f"Target was mapped against current Threat Intelligence indices. Malicious flags matched: {threat_pulses} pulses."
    story.append(Paragraph(intel_details, body_style))
    
    story.append(Spacer(1, 20))
    
    # ── ANALYST NOTES SECTION ──
    if analyst_notes:
        story.append(KeepTogether([
            Paragraph("5. Investigator Notes", h1_style),
            Spacer(1, 5)
        ]))
        for note in analyst_notes:
            n_text = note.get("text", "")
            n_tags = note.get("tags", "")
            n_date = note.get("created_at")
            if isinstance(n_date, datetime):
                n_date_str = n_date.strftime("%Y-%m-%d %H:%M")
            else:
                n_date_str = str(n_date)
                
            note_content = (
                f"<b>Date:</b> {n_date_str} | <b>Tags:</b> {n_tags}<br/>"
                f"{n_text}"
            )
            story.append(Paragraph(note_content, body_style))
            story.append(Spacer(1, 10))
            
    # Build Document using page template functions
    doc.build(story, onFirstPage=add_header_footer, onLaterPages=add_header_footer)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
