import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.pdf_generator import PDFReportGenerator

def main():
    print("=== Testing PDFReportGenerator ===")
    
    generator = PDFReportGenerator()
    
    sample_json = {
        "domain": "example.com",
        "ip_address": "93.184.216.34",
        "registrar": "ICANN",
        "Domain Intelligence": {
            "DNS Records": {
                "A": ["93.184.216.34"],
                "MX": ["mail.example.com (priority: 10)"],
                "TXT": ["v=spf1 include:_spf.example.com ~all", "some super long TXT record that needs to wrap around beautifully because it goes on and on and on. " * 5]
            },
            "Nameservers": ["a.iana-servers.net", "b.iana-servers.net"]
        },
        "Technology Stack": {
            "Web Servers": ["Nginx"],
            "Programming Languages": ["PHP", "JavaScript"],
            "Analytics": ["Google Analytics"]
        },
        "Nested Example": [
            {"name": "Subdomain 1", "ip": "1.1.1.1"},
            {"name": "Subdomain 2", "ip": "2.2.2.2"}
        ]
    }
    
    summary = "This is a comprehensive executive summary.\n\nIt spans multiple paragraphs to ensure the PDF generator correctly processes newlines and renders the text gracefully using standard ReportLab Paragraph structures. The target exhibits normal domain characteristics."
    
    output_path = os.path.join(os.path.dirname(__file__), "test_report.pdf")
    
    try:
        generator.generate_pdf(sample_json, summary, output_path)
        print(f"Success! PDF generated at: {output_path}")
        assert os.path.exists(output_path)
    except Exception as e:
        print(f"Error generating PDF: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
