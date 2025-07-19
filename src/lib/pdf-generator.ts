
'use client';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import type { AuditEvent } from '@/services/feedback-service';

// Extend jsPDF with autoTable plugin
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

export const downloadAuditTrailPDF = (trail: AuditEvent[], title: string, trackingId: string) => {
  try {
    const doc = new jsPDF() as jsPDFWithAutoTable;

    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tracking ID: ${trackingId}`, 14, 26);
    doc.text(`Report Generated: ${format(new Date(), 'PPP p')}`, 14, 32);

    const tableColumn = ["Timestamp", "Event", "Actor", "Details"];
    const tableRows: (string | undefined)[][] = [];

    trail.forEach(event => {
      const eventData = [
        format(new Date(event.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        event.event,
        String(event.actor), // Actor can be Role or string
        event.details || 'N/A'
      ];
      tableRows.push(eventData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [26, 94, 78], textColor: 255 }, // #1A5E4E
      columnStyles: {
          0: { cellWidth: 35 }, // Timestamp
          1: { cellWidth: 35 }, // Event
          2: { cellWidth: 25 }, // Actor
          3: { cellWidth: 'auto' }, // Details
      },
      didDrawPage: function (data) {
        // Footer
        const str = `Page ${doc.internal.getNumberOfPages()}`;
        doc.setFontSize(8);
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        doc.text(str, data.settings.margin.left, pageHeight - 10);
      }
    });

    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    doc.save(`Audit_Trail_${trackingId}_${timestamp}.pdf`);
  } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("There was an error generating the PDF. Please check the console for details.");
  }
};
