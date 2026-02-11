import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Report, CompanySettings, Client } from '../types';

export const generatePDF = (report: Report, client: Client, company: CompanySettings) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // --- HEADER ---
  doc.setFillColor(41, 128, 185); // Blue header
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(company.name, 14, 18);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${company.address} | NIF: ${company.nif}`, 14, 25);
  doc.text(`${company.email} | ${company.phone}`, 14, 30);
  
  doc.setFontSize(16);
  doc.text('RELATÓRIO DE INTERVENÇÃO', pageWidth - 14, 25, { align: 'right' });

  // --- INFO BLOCK ---
  let y = 50;
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO CLIENTE', 14, y);
  doc.text('DADOS DA INTERVENÇÃO', pageWidth / 2 + 5, y);
  y += 5;
  
  doc.setDrawColor(200);
  doc.line(14, y, pageWidth - 14, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  // Client Column
  doc.text(`Cliente: ${client.name}`, 14, y);
  if (client.shopName) doc.text(`Loja: ${client.shopName}`, 14, y + 5);
  doc.text(`Morada: ${client.address}`, 14, y + 10);
  doc.text(`${client.postalCode} ${client.locality}, ${client.county}`, 14, y + 15);
  doc.text(`NIF: ${client.nif || 'N/A'}`, 14, y + 20);
  doc.text(`Responsável: ${report.clientSignerName}`, 14, y + 25);

  // Intervention Column
  const col2 = pageWidth / 2 + 5;
  doc.text(`Data: ${report.date}`, col2, y);
  doc.text(`Horário: ${report.startTime} - ${report.endTime}`, col2, y + 5);
  doc.text(`Técnico: ${report.auditorName}`, col2, y + 10);
  doc.text(`Tipo: ${report.typeName}`, col2, y + 15);
  if (report.contractNumber) doc.text(`Contrato: ${report.contractNumber}`, col2, y + 20);
  if (report.routeNumber) doc.text(`Rota: ${report.routeNumber}`, col2, y + 25);
  if (report.gpsLocation) doc.text(`GPS: ${report.gpsLocation.lat.toFixed(5)}, ${report.gpsLocation.lng.toFixed(5)}`, col2, y + 30);

  y += 40;

  // --- CRITERIA TABLE ---
  if (report.criteria && report.criteria.length > 0) {
    const tableData = report.criteria.map(c => [
      c.label,
      c.status === 'pass' ? 'OK' : c.status === 'fail' ? 'NOK' : 'N/A',
      c.notes || ''
    ]);

    (doc as any).autoTable({
      startY: y,
      head: [['Critério de Avaliação', 'Estado', 'Observações']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 'auto' }
      }
    });

    y = (doc as any).lastAutoTable.finalY + 15;
  }

  // --- SUMMARY / FREE TEXT ---
  doc.setFont('helvetica', 'bold');
  doc.text(report.typeKey === 'intervention_general' ? 'RELATÓRIO DA INTERVENÇÃO' : 'RESUMO / CONCLUSÕES', 14, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  const splitSummary = doc.splitTextToSize(report.summary || 'Sem observações.', pageWidth - 28);
  doc.text(splitSummary, 14, y);
  y += (splitSummary.length * 5) + 10;

  // --- CLIENT OBSERVATIONS ---
  if (report.clientObservations) {
    doc.setFont('helvetica', 'bold');
    doc.text('OBSERVAÇÕES DO CLIENTE', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    const splitClientObs = doc.splitTextToSize(report.clientObservations, pageWidth - 28);
    doc.text(splitClientObs, 14, y);
    y += (splitClientObs.length * 5) + 10;
  }

  // --- SIGNATURES ---
  // Ensure we have space for signatures
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  
  // Auditor Sig
  doc.text('TÉCNICO RESPONSÁVEL', 14, y);
  if (report.auditorSignature) {
    doc.addImage(report.auditorSignature, 'PNG', 14, y + 2, 60, 25);
  }
  doc.text(report.auditorName, 14, y + 30);

  // Client Sig
  doc.text('RESPONSÁVEL CLIENTE', pageWidth / 2 + 5, y);
  if (report.clientSignature) {
    doc.addImage(report.clientSignature, 'PNG', pageWidth / 2 + 5, y + 2, 60, 25);
  }
  doc.text(report.clientSignerName, pageWidth / 2 + 5, y + 30);

  // --- FOOTER ---
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Gerado por AuditPro 360 - Página ${i} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
  }

  return doc;
};