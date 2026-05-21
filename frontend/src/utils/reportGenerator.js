import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Generates a clean, monochrome PDF report from investigation data.
 * @param {Object} data - Contains footprint, network, and security data blocks.
 */
export function generatePDF(data) {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();

  // Helper to add mandatory ethical footer to every page
  const addFooter = () => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(
        'Ethical OSINT - Public Data Only | Designed for authorized use.',
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
  };

  // 1. Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text('da Holmes - Intelligence Brief', 14, 22);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
  
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 34, pageWidth - 14, 34);

  let currentY = 44;

  // 2. Digital Footprint Section
  if (data?.footprint && data.footprint.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text('Digital Footprint', 14, currentY);
    
    // Filter to show found ones first, or just show all
    const footprintBody = data.footprint.map(item => [
      item.platform,
      item.exists || item.found ? 'Found' : 'Not Found',
      item.url || 'N/A'
    ]);

    doc.autoTable({
      startY: currentY + 6,
      head: [['Platform', 'Status', 'URL']],
      body: footprintBody,
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4, textColor: [40, 40, 40], font: 'helvetica' },
      alternateRowStyles: { fillColor: [248, 248, 248] },
    });
    currentY = doc.lastAutoTable.finalY + 15;
  }

  // 3. Network Infrastructure Section
  if (data?.network && data.network.status !== 'error') {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text('Network Infrastructure', 14, currentY);

    const networkBody = [
      ['Target', data.network.target || 'N/A'],
      ['ISP / ASN', data.network.isp || 'N/A'],
      ['Organization', data.network.org || 'N/A'],
      ['Hostname', data.network.hostname || 'N/A'],
      ['Physical Location', data.network.location || 'N/A'],
      ['Coordinates', data.network.coordinates ? `[${data.network.coordinates.join(', ')}]` : 'N/A']
    ];

    doc.autoTable({
      startY: currentY + 6,
      head: [['Property', 'Telemetry Data']],
      body: networkBody,
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4, textColor: [40, 40, 40], font: 'helvetica' },
      alternateRowStyles: { fillColor: [248, 248, 248] },
    });
    currentY = doc.lastAutoTable.finalY + 15;
  }

  // 4. Security Alerts Section
  if (data?.security) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text('Security Alerts', 14, currentY);

    const securityOverview = [
      ['Target Email', data.security.email || 'N/A'],
      ['Status', data.security.status ? data.security.status.toUpperCase() : 'N/A'],
      ['Total Leaks', data.security.breach_count?.toString() || '0']
    ];

    doc.autoTable({
      startY: currentY + 6,
      head: [['Metric', 'Detail']],
      body: securityOverview,
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4, textColor: [40, 40, 40], font: 'helvetica' },
      alternateRowStyles: { fillColor: [248, 248, 248] },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    if (data.security.details && data.security.details.length > 0) {
      const breachBody = data.security.details.map(b => [
        b.name,
        b.date || 'Unknown',
        b.description ? b.description.substring(0, 110) + '...' : 'N/A'
      ]);

      doc.autoTable({
        startY: currentY,
        head: [['Exfiltrated Source', 'Date', 'Summary']],
        body: breachBody,
        theme: 'grid',
        headStyles: { fillColor: [60, 60, 60], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3, textColor: [40, 40, 40], font: 'helvetica' },
        alternateRowStyles: { fillColor: [248, 248, 248] },
      });
      currentY = doc.lastAutoTable.finalY + 15;
    }
  }

  // Finalize Page
  addFooter();
  doc.save(`da-holmes-brief-${new Date().getTime()}.pdf`);
}
