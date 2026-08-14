import { jsPDF } from 'jspdf';

// Gerador do certificado corporativo Pontufy (A4 paisagem, 297 x 210 mm).
// Estética dark/minimalista com bordas esmeralda de marca. Server-only.

export interface CertificateData {
  employeeName: string;
  courseName: string;
  tenantName: string;
  completionDate: string; // já formatado em pt-BR
  workloadHours: number;
  lessonCount: number;
  verificationHash: string; // UUID único impresso no rodapé
}

const PAGE_W = 297;
const PAGE_H = 210;
const EMERALD: [number, number, number] = [16, 185, 129];
const GRAY_LIGHT: [number, number, number] = [163, 163, 163];
const GRAY_DIM: [number, number, number] = [115, 115, 115];
const GRAY_FAINT: [number, number, number] = [82, 82, 82];
const WHITE: [number, number, number] = [255, 255, 255];
const BG: [number, number, number] = [10, 10, 10];

export function generateCertificatePdf(data: CertificateData): Buffer<ArrayBuffer> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Fundo dark
  doc.setFillColor(BG[0], BG[1], BG[2]);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  // Moldura dupla esmeralda
  doc.setDrawColor(EMERALD[0], EMERALD[1], EMERALD[2]);
  doc.setLineWidth(1.6);
  doc.rect(8, 8, PAGE_W - 16, PAGE_H - 16);
  doc.setLineWidth(0.4);
  doc.rect(12, 12, PAGE_W - 24, PAGE_H - 24);

  // Cabeçalho: empresa
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(GRAY_LIGHT[0], GRAY_LIGHT[1], GRAY_LIGHT[2]);
  doc.text(data.tenantName.toUpperCase(), PAGE_W / 2, 32, { align: 'center' });

  // Título
  doc.setFontSize(34);
  doc.setTextColor(EMERALD[0], EMERALD[1], EMERALD[2]);
  doc.text('CERTIFICADO', PAGE_W / 2, 55, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(GRAY_LIGHT[0], GRAY_LIGHT[1], GRAY_LIGHT[2]);
  doc.text('DE CONCLUSÃO', PAGE_W / 2, 64, { align: 'center' });

  // Divisor
  doc.setDrawColor(EMERALD[0], EMERALD[1], EMERALD[2]);
  doc.setLineWidth(0.5);
  doc.line(90, 72, 207, 72);

  // Corpo
  doc.setFontSize(11);
  doc.setTextColor(GRAY_LIGHT[0], GRAY_LIGHT[1], GRAY_LIGHT[2]);
  doc.text('Certificamos que', PAGE_W / 2, 88, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  doc.text(doc.splitTextToSize(data.employeeName, 230), PAGE_W / 2, 102, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(GRAY_LIGHT[0], GRAY_LIGHT[1], GRAY_LIGHT[2]);
  doc.text('concluiu com sucesso o curso', PAGE_W / 2, 113, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(EMERALD[0], EMERALD[1], EMERALD[2]);
  doc.text(doc.splitTextToSize(data.courseName, 220), PAGE_W / 2, 126, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(GRAY_LIGHT[0], GRAY_LIGHT[1], GRAY_LIGHT[2]);
  doc.text(
    `Carga horária: ${data.workloadHours} hora${data.workloadHours === 1 ? '' : 's'}  ·  ${data.lessonCount} aula${data.lessonCount === 1 ? '' : 's'}`,
    PAGE_W / 2,
    140,
    { align: 'center' },
  );
  doc.text(`Concluído em ${data.completionDate}`, PAGE_W / 2, 150, { align: 'center' });

  // Assinaturas
  doc.setDrawColor(GRAY_LIGHT[0], GRAY_LIGHT[1], GRAY_LIGHT[2]);
  doc.setLineWidth(0.3);
  doc.line(60, 170, 130, 170);
  doc.line(167, 170, 237, 170);

  doc.setFontSize(9);
  doc.setTextColor(GRAY_DIM[0], GRAY_DIM[1], GRAY_DIM[2]);
  doc.text(doc.splitTextToSize(data.tenantName, 70), 95, 176, { align: 'center' });
  doc.text('Pontufy Platform', 202, 176, { align: 'center' });

  // Código de verificação
  doc.setFontSize(8);
  doc.setTextColor(GRAY_FAINT[0], GRAY_FAINT[1], GRAY_FAINT[2]);
  doc.text(`Código de verificação: ${data.verificationHash}`, PAGE_W / 2, 192, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
}