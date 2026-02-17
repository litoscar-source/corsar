import { Report, CompanySettings, Client } from '../types';

// Declare globals for the script tags loaded in index.html
declare global {
  interface Window {
    jspdf: any;
    jsPDF: any; // Shim global
  }
}

// Constants for styling
const COLORS: { [key: string]: [number, number, number] } = {
  PRIMARY: [30, 58, 138], // Blue-900
  SECONDARY: [100, 116, 139], // Slate-500
  ACCENT: [241, 245, 249], // Slate-100 (Backgrounds)
  TEXT: [15, 23, 42], // Slate-900
  OK: [22, 163, 74], // Green-600
  NOK: [220, 38, 38], // Red-600
  NA: [148, 163, 184] // Slate-400
};

export const generatePDF = (report: Report, client: Client, company: CompanySettings) => {
  try {
    // Access jsPDF from the global window object (loaded via script tag)
    if (!window.jspdf) {
      alert("Erro: Biblioteca PDF não carregada. Verifique a sua ligação à internet.");
      throw new Error("jsPDF not loaded");
    }

    const jsPDF = window.jspdf.jsPDF;
    const doc = new jsPDF();

    // Verify AutoTable Plugin
    if (typeof (doc as any).autoTable !== 'function') {
       alert("Erro: Plugin de tabelas (AutoTable) não carregou corretamente. Tente atualizar a página.");
       throw new Error("AutoTable plugin missing");
    }
    
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);

    // Helper: Draw Section Title
    const drawSectionTitle = (title: string, y: number) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(COLORS.PRIMARY[0], COLORS.PRIMARY[1], COLORS.PRIMARY[2]);
      doc.text(title.toUpperCase(), margin, y);
      doc.setDrawColor(COLORS.PRIMARY[0], COLORS.PRIMARY[1], COLORS.PRIMARY[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, y + 1.5, margin + 40, y + 1.5); // Underline part
      return y + 6;
    };

    // Helper: Draw Field
    const drawField = (label: string, value: string, x: number, y: number, maxWidth: number = 80) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(COLORS.SECONDARY[0], COLORS.SECONDARY[1], COLORS.SECONDARY[2]);
      doc.text(label, x, y);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.TEXT[0], COLORS.TEXT[1], COLORS.TEXT[2]);
      // Handle long text wrapping
      const splitText = doc.splitTextToSize(value, maxWidth);
      doc.text(splitText, x, y + 4);
      
      return (splitText.length * 3.5) + 3; // Return height used
    };

    // --- 1. HEADER ---
    let y = 15;

    // Logo (Left)
    if (company.logoUrl) {
      try {
        doc.addImage(company.logoUrl, 'PNG', margin, 10, 25, 25);
      } catch (e) {
        console.warn("Logo error", e);
      }
    }

    // Company Info (Right Aligned)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(COLORS.PRIMARY[0], COLORS.PRIMARY[1], COLORS.PRIMARY[2]);
    doc.text(company.name, pageWidth - margin, y, { align: 'right' });
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.SECONDARY[0], COLORS.SECONDARY[1], COLORS.SECONDARY[2]);
    doc.text(company.address, pageWidth - margin, y, { align: 'right' });
    y += 4;
    doc.text(`${company.postalCode || ''} ${company.locality || ''}`, pageWidth - margin, y, { align: 'right' }); 
    y += 4;
    doc.text(`NIF: ${company.nif} | ${company.phone}`, pageWidth - margin, y, { align: 'right' });
    y += 4;
    doc.text(company.email, pageWidth - margin, y, { align: 'right' });
    
    // Document Title Bar
    y = 42;
    doc.setFillColor(COLORS.PRIMARY[0], COLORS.PRIMARY[1], COLORS.PRIMARY[2]);
    doc.rect(margin, y, contentWidth, 10, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text("RELATÓRIO DE INTERVENÇÃO TÉCNICA", margin + 4, y + 6.5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Nº ${report.id.replace('r-', '')} | Data: ${report.date}`, pageWidth - margin - 4, y + 6.5, { align: 'right' });

    // --- 2. INFO GRID (Client & Intervention) ---
    y += 15;
    const boxHeight = 42;
    const colWidth = (contentWidth / 2) - 4;

    // Draw Background Boxes
    doc.setFillColor(COLORS.ACCENT[0], COLORS.ACCENT[1], COLORS.ACCENT[2]);
    doc.roundedRect(margin, y, colWidth, boxHeight, 2, 2, 'F'); // Client Box
    doc.roundedRect(margin + colWidth + 8, y, colWidth, boxHeight, 2, 2, 'F'); // Intervention Box

    // Client Data
    let cy = y + 6;
    const cx = margin + 4;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.PRIMARY[0], COLORS.PRIMARY[1], COLORS.PRIMARY[2]);
    doc.text("CLIENTE", cx, cy);
    cy += 6;

    cy += drawField("Nome / Empresa", client.name, cx, cy, colWidth - 8);
    cy += drawField("Localização", `${client.address}, ${client.locality}`, cx, cy, colWidth - 8);
    
    // Quick contact line
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.SECONDARY[0], COLORS.SECONDARY[1], COLORS.SECONDARY[2]);
    doc.text("Contacto:", cx, cy + 4);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.TEXT[0], COLORS.TEXT[1], COLORS.TEXT[2]);
    doc.text(`${client.contactPerson} (${client.phone})`, cx + 18, cy + 4);

    // Intervention Data
    let iy = y + 6;
    const ix = margin + colWidth + 12;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.PRIMARY[0], COLORS.PRIMARY[1], COLORS.PRIMARY[2]);
    doc.text("DETALHES DO SERVIÇO", ix, iy);
    iy += 6;

    // Compact line for times
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.SECONDARY[0], COLORS.SECONDARY[1], COLORS.SECONDARY[2]);
    doc.text("Horário:", ix, iy);
    doc.text("Técnico:", ix + (colWidth/2), iy);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.TEXT[0], COLORS.TEXT[1], COLORS.TEXT[2]);
    doc.text(`${report.startTime} - ${report.endTime}`, ix, iy + 4);
    doc.text(report.auditorName.split(' ')[0], ix + (colWidth/2), iy + 4);
    iy += 9;

    iy += drawField("Tipo de Serviço", report.typeName, ix, iy, colWidth - 8);
    if (report.contractNumber || report.routeNumber) {
      drawField("Contrato / Rota", `${report.contractNumber || '-'} / ${report.routeNumber || '-'}`, ix, iy, colWidth - 8);
    }

    y += boxHeight + 8;

    // --- 3. CRITERIA TABLE ---
    if (report.criteria && report.criteria.length > 0) {
      const tableData = report.criteria.map(c => [
        c.label,
        c.status === 'pass' ? 'OK' : c.status === 'fail' ? 'NOK' : 'N/A',
        c.notes || ''
      ]);

      // Use method attached to prototype by script tag
      (doc as any).autoTable({
        startY: y,
        head: [['CRITÉRIO AVALIADO', 'ESTADO', 'OBSERVAÇÕES TÉCNICAS']],
        body: tableData,
        theme: 'plain', // Clean look
        styles: {
          fontSize: 7,
          cellPadding: 2,
          font: 'helvetica',
          textColor: COLORS.TEXT,
          lineColor: [226, 232, 240], // Slate-200
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: COLORS.ACCENT,
          textColor: COLORS.PRIMARY,
          fontStyle: 'bold',
          fontSize: 7,
        },
        columnStyles: {
          0: { cellWidth: 80, fontStyle: 'bold' },
          1: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
          2: { cellWidth: 'auto' }
        },
        didParseCell: function(data: any) {
          // Color coding for Status
          if (data.section === 'body' && data.column.index === 1) {
            const text = data.cell.text[0];
            if (text === 'OK') data.cell.styles.textColor = COLORS.OK;
            if (text === 'NOK') data.cell.styles.textColor = COLORS.NOK;
            if (text === 'N/A') data.cell.styles.textColor = COLORS.NA;
          }
          // Zebra striping manually for cleaner look
          if (data.section === 'body' && data.row.index % 2 === 1) {
             data.cell.styles.fillColor = [248, 250, 252]; // Slate-50
          }
        },
        margin: { left: margin, right: margin }
      });

      y = (doc as any).lastAutoTable.finalY + 8;
    }
    
    // --- 3.5 ORDER TABLE (If exists) ---
    if (report.order && report.order.items.length > 0) {
      
      // Check if we need new page before order
      if (pageHeight - y < 60) {
          doc.addPage();
          y = 20;
      }

      drawSectionTitle("Nota de Encomenda", y);
      y += 5;

      const orderData = report.order.items.map(item => [
          item.productName,
          String(item.quantity),
          `${Number(item.unitPrice).toFixed(2)}€`,
          `${item.discount}%`,
          `${Number(item.total).toFixed(2)}€`
      ]);

      (doc as any).autoTable({
          startY: y,
          head: [['Produto / Serviço', 'Qtd', 'Preço Unit.', 'Desc.', 'Total']],
          body: orderData,
          theme: 'plain',
          styles: {
              fontSize: 7,
              cellPadding: 2,
              font: 'helvetica',
              textColor: COLORS.TEXT,
              lineColor: [226, 232, 240],
              lineWidth: 0.1,
          },
          headStyles: {
              fillColor: COLORS.PRIMARY,
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 7,
          },
          columnStyles: {
              0: { cellWidth: 'auto' },
              1: { cellWidth: 15, halign: 'center' },
              2: { cellWidth: 20, halign: 'right' },
              3: { cellWidth: 15, halign: 'center' },
              4: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }
          },
          margin: { left: margin, right: margin }
      });

      y = (doc as any).lastAutoTable.finalY + 4;

      // Total Value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(COLORS.PRIMARY[0], COLORS.PRIMARY[1], COLORS.PRIMARY[2]);
      doc.text(`Valor Total: ${report.order.totalValue.toFixed(2)}€`, pageWidth - margin, y, { align: 'right' });
      y += 8;

      // Delivery Conditions & Obs
      if (report.order.deliveryConditions || report.order.observations) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(COLORS.SECONDARY[0], COLORS.SECONDARY[1], COLORS.SECONDARY[2]);
          
          if (report.order.deliveryConditions) {
              doc.text("Condições de Entrega:", margin, y);
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(COLORS.TEXT[0], COLORS.TEXT[1], COLORS.TEXT[2]);
              doc.text(report.order.deliveryConditions, margin + 35, y);
              y += 5;
          }

          if (report.order.observations) {
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(COLORS.SECONDARY[0], COLORS.SECONDARY[1], COLORS.SECONDARY[2]);
              doc.text("Obs. Encomenda:", margin, y);
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(COLORS.TEXT[0], COLORS.TEXT[1], COLORS.TEXT[2]);
              doc.text(report.order.observations, margin + 35, y);
              y += 5;
          }
      }
      y += 4;
    }

    // --- 4. OBSERVATIONS & SUMMARY ---
    
    // Check space for observations. If minimal space left, add page.
    if (pageHeight - y < 90) {
      doc.addPage();
      y = 20;
    }

    // Summary Box
    drawSectionTitle("Resumo e Conclusões", y);
    y += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.TEXT[0], COLORS.TEXT[1], COLORS.TEXT[2]);
    
    const summaryText = report.summary || "Sem observações adicionais a registar.";
    const splitSummary = doc.splitTextToSize(summaryText, contentWidth);
    doc.text(splitSummary, margin, y);
    y += (splitSummary.length * 4) + 8;

    // Client Obs (if exists)
    if (report.clientObservations) {
      drawSectionTitle("Observações do Cliente", y);
      y += 5;
      const clientObsText = report.clientObservations;
      const splitClientObs = doc.splitTextToSize(clientObsText, contentWidth);
      doc.setFont('helvetica', 'italic');
      doc.text(splitClientObs, margin, y);
      doc.setFont('helvetica', 'normal');
      y += (splitClientObs.length * 4) + 8;
    }

    // --- 5. SIGNATURES (Anchored Bottom) ---
    
    // Only draw signatures if NOT a commercial visit
    if (report.typeKey !== 'visit_comercial') {

      // Calculate footer area height required (approx 45 units)
      const footerHeight = 45;
      let sigY = pageHeight - footerHeight - 10; // 10 padding from bottom edge

      // If current content overlaps signature area, push signatures to next page
      if (y > sigY) {
        doc.addPage();
        sigY = pageHeight - footerHeight - 10;
      }

      // Draw light separator line
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, sigY, pageWidth - margin, sigY);
      sigY += 5;

      const sigBoxWidth = (contentWidth / 2) - 10;
      const sigBoxHeight = 35;

      // Auditor Signature Area
      const aX = margin;
      doc.setFontSize(7);
      doc.setTextColor(COLORS.SECONDARY[0], COLORS.SECONDARY[1], COLORS.SECONDARY[2]);
      doc.text(report.order ? "COMERCIAL" : "TÉCNICO RESPONSÁVEL", aX, sigY + 3);
      
      if (report.auditorSignature) {
        try {
          doc.addImage(report.auditorSignature, 'PNG', aX, sigY + 5, 40, 18);
        } catch(e) { console.warn("Auditor signature error", e); }
      }
      doc.setDrawColor(COLORS.TEXT[0], COLORS.TEXT[1], COLORS.TEXT[2]);
      doc.setLineWidth(0.1);
      doc.line(aX, sigY + 25, aX + sigBoxWidth, sigY + 25); // Signature Line
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.TEXT[0], COLORS.TEXT[1], COLORS.TEXT[2]);
      doc.text(report.auditorName, aX, sigY + 29);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(COLORS.SECONDARY[0], COLORS.SECONDARY[1], COLORS.SECONDARY[2]);
      doc.text("Assinado digitalmente", aX, sigY + 32);

      // Client Signature Area
      const cX = pageWidth - margin - sigBoxWidth;
      doc.setFontSize(7);
      doc.text("PELO CLIENTE", cX, sigY + 3);

      if (report.clientSignature) {
        try {
          doc.addImage(report.clientSignature, 'PNG', cX, sigY + 5, 40, 18);
        } catch(e) { console.warn("Client signature error", e); }
      }
      doc.setDrawColor(COLORS.TEXT[0], COLORS.TEXT[1], COLORS.TEXT[2]);
      doc.line(cX, sigY + 25, cX + sigBoxWidth, sigY + 25); // Signature Line

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(COLORS.TEXT[0], COLORS.TEXT[1], COLORS.TEXT[2]);
      doc.text(report.clientSignerName, cX, sigY + 29);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(COLORS.SECONDARY[0], COLORS.SECONDARY[1], COLORS.SECONDARY[2]);
      doc.text("Validado no local", cX, sigY + 32);
    } else {
      // If commercial visit, maybe just add a small footer note or nothing
      let noteY = pageHeight - 15;
      if (y > noteY) {
          doc.addPage();
          noteY = pageHeight - 15;
      }
      doc.setFontSize(7);
      doc.setTextColor(COLORS.SECONDARY[0], COLORS.SECONDARY[1], COLORS.SECONDARY[2]);
      doc.text("Relatório de visita comercial (não carece de assinatura).", margin, noteY);
    }

    // --- 6. FOOTER (Page Numbers) ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(6);
      doc.setTextColor(COLORS.SECONDARY[0], COLORS.SECONDARY[1], COLORS.SECONDARY[2]);
      const footerText = `AuditPro 360 | Processado informaticamente | Pág. ${i}/${pageCount}`;
      doc.text(footerText, pageWidth / 2, pageHeight - 5, { align: 'center' });
    }

    return doc;

  } catch (err) {
    console.error("Critical PDF Generation Error", err);
    alert(`Erro ao gerar PDF: ${(err as Error).message}`);
    throw err;
  }
};

// Function to generate ONLY the Order PDF
export const generateOrderPDF = (report: Report, client: Client, company: CompanySettings) => {
    try {
      // Access jsPDF from the global window object (loaded via script tag)
      if (!window.jspdf) {
          alert("Erro: Biblioteca PDF não carregada. Verifique a sua ligação à internet.");
          throw new Error("jsPDF not loaded");
      }

      if (!report.order) return generatePDF(report, client, company); // Fallback

      const jsPDF = window.jspdf.jsPDF;
      const doc = new jsPDF();

      // Verify AutoTable Plugin
      if (typeof (doc as any).autoTable !== 'function') {
        alert("Erro: Plugin de tabelas (AutoTable) não carregou corretamente. Tente atualizar a página.");
        throw new Error("AutoTable plugin missing");
      }

      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 14;
      const contentWidth = pageWidth - (margin * 2);

      let y = 15;

      // --- Header (Similar to main report but specific title) ---
      if (company.logoUrl) {
          try {
            doc.addImage(company.logoUrl, 'PNG', margin, 10, 25, 25);
          } catch (e) {
            console.warn("Logo error", e);
          }
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(COLORS.PRIMARY[0], COLORS.PRIMARY[1], COLORS.PRIMARY[2]);
      doc.text(company.name, pageWidth - margin, y, { align: 'right' });
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(COLORS.SECONDARY[0], COLORS.SECONDARY[1], COLORS.SECONDARY[2]);
      doc.text(company.address, pageWidth - margin, y, { align: 'right' });
      y += 4;
      doc.text(`NIF: ${company.nif} | ${company.phone}`, pageWidth - margin, y, { align: 'right' });
      
      // Document Title Bar
      y = 42;
      doc.setFillColor(COLORS.PRIMARY[0], COLORS.PRIMARY[1], COLORS.PRIMARY[2]);
      doc.rect(margin, y, contentWidth, 10, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text("NOTA DE ENCOMENDA", margin + 4, y + 6.5);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Ref: ${report.id.replace('r-', 'enc-')} | Data: ${report.date}`, pageWidth - margin - 4, y + 6.5, { align: 'right' });

      // Client Info
      y += 15;
      
      // Commercial Name Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(COLORS.TEXT[0], COLORS.TEXT[1], COLORS.TEXT[2]);
      doc.text(`Comercial: ${report.auditorName}`, margin, y);
      
      y += 10;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(COLORS.PRIMARY[0], COLORS.PRIMARY[1], COLORS.PRIMARY[2]);
      doc.text("DADOS DO CLIENTE", margin, y);
      y += 5;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(COLORS.TEXT[0], COLORS.TEXT[1], COLORS.TEXT[2]);
      doc.text(client.name, margin, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`${client.address}, ${client.postalCode} ${client.locality}`, margin, y);
      y += 4;
      doc.text(`NIF: ${client.nif || 'N/A'}`, margin, y);
      y += 4;
      doc.text(`Contacto: ${client.contactPerson} (${client.phone})`, margin, y);

      y += 10;

      // Order Table
      const orderData = report.order.items.map(item => [
          item.productName,
          String(item.quantity),
          `${Number(item.unitPrice).toFixed(2)}€`,
          `${item.discount}%`,
          `${Number(item.total).toFixed(2)}€`
      ]);

      (doc as any).autoTable({
          startY: y,
          head: [['Produto / Serviço', 'Qtd', 'Preço Unit.', 'Desc.', 'Total']],
          body: orderData,
          theme: 'striped',
          styles: { fontSize: 8 },
          headStyles: { 
              fillColor: COLORS.PRIMARY, 
              textColor: [255, 255, 255] 
          },
          columnStyles: {
              0: { cellWidth: 'auto' },
              1: { cellWidth: 15, halign: 'center' },
              2: { cellWidth: 25, halign: 'right' },
              3: { cellWidth: 15, halign: 'center' },
              4: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }
          },
          margin: { left: margin, right: margin }
      });

      y = (doc as any).lastAutoTable.finalY + 5;

      // Total and Conditions
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Valor Total: ${report.order.totalValue.toFixed(2)}€`, pageWidth - margin, y, { align: 'right' });
      y += 15;

      if (report.order.deliveryConditions) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.text("Condições de Entrega:", margin, y);
          y += 4;
          doc.setFont('helvetica', 'normal');
          doc.text(report.order.deliveryConditions, margin, y);
          y += 8;
      }

      if (report.order.observations) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.text("Observações:", margin, y);
          y += 4;
          doc.setFont('helvetica', 'normal');
          doc.text(report.order.observations, margin, y);
          y += 8;
      }

      // Signatures
      const sigY = pageHeight - 40;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, sigY, margin + 60, sigY);
      doc.line(pageWidth - margin - 60, sigY, pageWidth - margin, sigY);

      doc.setFontSize(8);
      // Explicitly showing Commercial Name under signature line
      doc.text("O Comercial", margin, sigY + 5);
      doc.setFont('helvetica', 'bold');
      doc.text(report.auditorName, margin, sigY + 10);
      
      doc.setFont('helvetica', 'normal');
      doc.text("O Cliente", pageWidth - margin - 60, sigY + 5);

      return doc;
    } catch (err) {
      console.error("Critical Order PDF Generation Error", err);
      alert(`Erro ao gerar PDF de Encomenda: ${(err as Error).message}`);
      throw err;
    }
};