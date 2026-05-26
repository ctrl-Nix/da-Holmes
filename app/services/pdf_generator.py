import os
import html
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.enums import TA_CENTER

class PDFReportGenerator:
    """
    Generates a professional, corporate-grade multi-page PDF document 
    from OSINT JSON data and an Executive Summary.
    """
    def __init__(self):
        self.styles = getSampleStyleSheet()
        
        # Custom styles using standard Helvetica fonts
        self.styles.add(ParagraphStyle(
            name='CoverTitle', 
            parent=self.styles['Heading1'], 
            fontName='Helvetica-Bold', 
            fontSize=28, 
            spaceAfter=20, 
            alignment=TA_CENTER
        ))
        self.styles.add(ParagraphStyle(
            name='CoverSubtitle', 
            parent=self.styles['Normal'], 
            fontName='Helvetica', 
            fontSize=16, 
            spaceAfter=15, 
            alignment=TA_CENTER
        ))
        self.styles.add(ParagraphStyle(
            name='Disclaimer', 
            parent=self.styles['Normal'], 
            fontName='Helvetica-Bold', 
            fontSize=14, 
            textColor=colors.red, 
            alignment=TA_CENTER,
            spaceBefore=50
        ))
        self.styles.add(ParagraphStyle(
            name='SectionHeader', 
            parent=self.styles['Heading2'], 
            fontName='Helvetica-Bold', 
            fontSize=18, 
            spaceBefore=20, 
            spaceAfter=15,
            textColor=colors.HexColor("#2C3E50")
        ))
        self.styles.add(ParagraphStyle(
            name='TableCell', 
            parent=self.styles['Normal'], 
            fontName='Helvetica', 
            fontSize=10,
            leading=14 # line spacing
        ))
        self.styles.add(ParagraphStyle(
            name='TableHeader', 
            parent=self.styles['Normal'], 
            fontName='Helvetica-Bold', 
            fontSize=11, 
            textColor=colors.whitesmoke,
            alignment=TA_CENTER
        ))

    def _create_cover_page(self, target_domain: str):
        """Builds the cover page elements."""
        elements = []
        
        # Spacer to center content vertically
        elements.append(Spacer(1, 200))
        
        elements.append(Paragraph("OSINT INVESTIGATION REPORT", self.styles['CoverTitle']))
        
        domain_text = f"Target: {target_domain}" if target_domain else "Target: Unknown"
        elements.append(Paragraph(domain_text, self.styles['CoverSubtitle']))
        
        date_text = f"Date Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        elements.append(Paragraph(date_text, self.styles['CoverSubtitle']))
        
        # Spacer before disclaimer
        elements.append(Spacer(1, 250))
        
        elements.append(Paragraph("EDUCATIONAL / PUBLIC SOURCES ONLY", self.styles['Disclaimer']))
        
        # Ensure the next content starts on a new page
        elements.append(PageBreak())
        return elements

    def _flatten_data_to_rows(self, data, prefix=""):
        """Recursively flattens nested dictionaries/lists into table rows containing Paragraphs."""
        rows = []
        if isinstance(data, dict):
            for key, value in data.items():
                clean_key = str(key).replace('_', ' ').title()
                
                if isinstance(value, dict):
                    # Add section row, then recurse
                    rows.append([Paragraph(f"<b>{prefix}{clean_key}</b>", self.styles['TableCell']), ""])
                    rows.extend(self._flatten_data_to_rows(value, prefix + "&nbsp;&nbsp;&nbsp;&nbsp;"))
                elif isinstance(value, list):
                    # Handle lists (strings or nested dicts)
                    if value and isinstance(value[0], dict):
                        rows.append([Paragraph(f"<b>{prefix}{clean_key}</b>", self.styles['TableCell']), ""])
                        for i, item in enumerate(value):
                            rows.append([Paragraph(f"{prefix}&nbsp;&nbsp;[{i+1}]", self.styles['TableCell']), ""])
                            rows.extend(self._flatten_data_to_rows(item, prefix + "&nbsp;&nbsp;&nbsp;&nbsp;"))
                    else:
                        val_str = html.escape(", ".join(str(v) for v in value))
                        rows.append([
                            Paragraph(f"{prefix}{clean_key}", self.styles['TableCell']), 
                            Paragraph(val_str, self.styles['TableCell'])
                        ])
                else:
                    rows.append([
                        Paragraph(f"{prefix}{clean_key}", self.styles['TableCell']), 
                        Paragraph(html.escape(str(value)), self.styles['TableCell'])
                    ])
        elif isinstance(data, list):
            val_str = html.escape(", ".join(str(v) for v in data))
            rows.append([
                Paragraph(f"{prefix}Values", self.styles['TableCell']), 
                Paragraph(val_str, self.styles['TableCell'])
            ])
        else:
            rows.append([
                Paragraph(f"{prefix}Value", self.styles['TableCell']), 
                Paragraph(html.escape(str(data)), self.styles['TableCell'])
            ])
            
        return rows

    def _create_data_table(self, title: str, data):
        """Creates a beautifully formatted table for a section of data."""
        elements = []
        elements.append(Paragraph(title, self.styles['SectionHeader']))
        
        if not data:
            elements.append(Paragraph("No data available.", self.styles['Normal']))
            elements.append(Spacer(1, 10))
            return elements

        # Headers
        table_data = [
            [Paragraph("Metric / Key", self.styles['TableHeader']), 
             Paragraph("Value / Details", self.styles['TableHeader'])]
        ]
        
        # Content Rows
        rows = self._flatten_data_to_rows(data)
        if not rows:
            return elements
            
        table_data.extend(rows)
        
        # Col widths: 180 points for Keys, 320 points for Values (Total = 500)
        t = Table(table_data, colWidths=[180, 320], repeatRows=1)
        
        # Base Table Style
        style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#2C3E50")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('TOPPADDING', (0, 0), (-1, 0), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ])
        
        # Alternating row colors (light gray and white)
        for i in range(1, len(table_data)):
            bg_color = colors.HexColor("#F9F9F9") if i % 2 == 0 else colors.white
            style.add('BACKGROUND', (0, i), (-1, i), bg_color)
            
            # Add some padding to data cells
            style.add('TOPPADDING', (0, i), (-1, i), 6)
            style.add('BOTTOMPADDING', (0, i), (-1, i), 6)
            style.add('LEFTPADDING', (0, i), (-1, i), 8)
            style.add('RIGHTPADDING', (0, i), (-1, i), 8)
            
        t.setStyle(style)
        elements.append(t)
        elements.append(Spacer(1, 20))
        return elements

    def generate_pdf(self, json_data: dict, summary_text: str, output_filename: str):
        """
        Generates the full PDF report.
        
        :param json_data: A dictionary containing raw OSINT data.
        :param summary_text: A string containing the Executive Summary.
        :param output_filename: The target output PDF filename path.
        """
        doc = SimpleDocTemplate(
            output_filename,
            pagesize=A4,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40
        )
        
        elements = []
        
        # 1. Cover Page
        target_domain = json_data.get("domain", json_data.get("target", json_data.get("username", "Unknown Target")))
        elements.extend(self._create_cover_page(target_domain))
        
        # 2. Executive Summary
        elements.append(Paragraph("Executive Summary", self.styles['SectionHeader']))
        
        if summary_text and summary_text.strip():
            # Handle multiple paragraphs by splitting on newlines
            paragraphs = summary_text.split('\n')
            for p_text in paragraphs:
                p_text = p_text.strip()
                if p_text:
                    elements.append(Paragraph(p_text, self.styles['Normal']))
                    elements.append(Spacer(1, 10))
        else:
            elements.append(Paragraph("No executive summary provided.", self.styles['Normal']))
            
        elements.append(Spacer(1, 20))
        
        # 3. Data Tables (Dynamic Generation from JSON)
        # We handle top-level keys as separate sections.
        top_level_flat = {}
        
        for key, value in json_data.items():
            if key in ["domain", "target", "username"]:
                # Already captured in header or generic info, but we can display them.
                top_level_flat[key] = value
                continue
                
            clean_title = str(key).replace('_', ' ').title()
            
            if isinstance(value, dict) and value:
                elements.extend(self._create_data_table(clean_title, value))
            elif isinstance(value, list) and value:
                # Distinguish between list of simple items vs list of dicts
                if isinstance(value[0], dict):
                    # We can pass the list of dicts directly to the data table
                    elements.extend(self._create_data_table(clean_title, value))
                else:
                    elements.extend(self._create_data_table(clean_title, value))
            else:
                top_level_flat[key] = value
                
        # If there were any flat key-value pairs at the root level, put them in a "General Intelligence" table
        if top_level_flat:
            # Prepend it right after the Executive Summary (index 4 or so, but appending is fine)
            elements.extend(self._create_data_table("General Intelligence", top_level_flat))

        # Build the final document
        doc.build(elements)
