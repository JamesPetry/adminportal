import { PDFDocument, PDFImage, PDFPage, StandardFonts, rgb } from "pdf-lib";

import { formatCurrency } from "@/lib/format";
import type { AgreementRecord, InvoiceRecord, ProjectRecord } from "@/lib/types";

export async function buildInvoicePdf(
  invoice: InvoiceRecord,
  project: ProjectRecord,
  options?: { heroImageBytes?: Uint8Array | null },
) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  page.drawRectangle({ x: 0, y: 760, width: 595, height: 82, color: rgb(0.07, 0.07, 0.07) });
  page.drawText("JAMES MARLIN STUDIO", { x: 40, y: 792, size: 22, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Creative Operations Invoice", { x: 40, y: 774, size: 9, font, color: rgb(0.86, 0.86, 0.86) });

  page.drawText(`Invoice ${invoice.invoiceNumber}`, { x: 40, y: 724, size: 12, font: bold, color: rgb(0.1, 0.1, 0.1) });
  drawWrappedText(page, invoice.title, {
    x: 40,
    y: 706,
    maxWidth: 300,
    lineHeight: 13,
    size: 11,
    font,
    color: rgb(0.2, 0.2, 0.2),
    maxLines: 2,
  });
  page.drawText(`Project: ${project.name}`, { x: 40, y: 688, size: 10, font, color: rgb(0.25, 0.25, 0.25) });
  page.drawText(`Client: ${project.clientName}`, { x: 40, y: 672, size: 10, font, color: rgb(0.25, 0.25, 0.25) });
  page.drawText(`Issue: ${invoice.issueDate}`, { x: 360, y: 706, size: 10, font, color: rgb(0.25, 0.25, 0.25) });
  page.drawText(`Due: ${invoice.dueDate}`, { x: 360, y: 690, size: 10, font, color: rgb(0.25, 0.25, 0.25) });
  page.drawText(`Status: ${invoice.status}`, { x: 360, y: 674, size: 10, font, color: rgb(0.25, 0.25, 0.25) });

  if (options?.heroImageBytes) {
    const image = await embedBestEffortImage(pdf, options.heroImageBytes);
    if (image) {
      drawImageFitted(page, image, { x: 360, y: 586, width: 195, height: 72 });
    }
  }

  page.drawRectangle({ x: 40, y: 646, width: 515, height: 1, color: rgb(0.2, 0.2, 0.2) });
  let y = 628;
  page.drawText("Description", { x: 40, y, size: 9, font: bold });
  page.drawText("Qty", { x: 340, y, size: 9, font: bold });
  page.drawText("Unit", { x: 390, y, size: 9, font: bold });
  page.drawText("Total", { x: 470, y, size: 9, font: bold });
  y -= 16;

  for (const line of invoice.lineItems) {
    const lineTotal = line.quantity * line.unitPrice;
    const lines = wrapText(line.description, font, 10, 280).slice(0, 2);
    page.drawText(lines[0] ?? "", { x: 40, y, size: 10, font });
    if (lines[1]) {
      page.drawText(lines[1], { x: 40, y: y - 12, size: 10, font, color: rgb(0.35, 0.35, 0.35) });
    }
    page.drawText(String(line.quantity), { x: 340, y, size: 10, font });
    page.drawText(formatCurrency(line.unitPrice), { x: 390, y, size: 10, font });
    page.drawText(formatCurrency(lineTotal), { x: 470, y, size: 10, font });
    y -= lines[1] ? 28 : 16;
  }

  y -= 16;
  page.drawRectangle({ x: 360, y: y + 22, width: 195, height: 1, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(`Subtotal`, { x: 380, y, size: 10, font, color: rgb(0.35, 0.35, 0.35) });
  page.drawText(formatCurrency(invoice.subtotal), { x: 470, y, size: 10, font });
  y -= 16;
  page.drawText(`Tax`, { x: 380, y, size: 10, font, color: rgb(0.35, 0.35, 0.35) });
  page.drawText(formatCurrency(invoice.taxAmount), { x: 470, y, size: 10, font });
  y -= 20;
  page.drawText(`Total`, { x: 380, y, size: 12, font: bold });
  page.drawText(formatCurrency(invoice.total), { x: 470, y, size: 12, font: bold });

  if (invoice.notes) {
    y -= 30;
    page.drawText("Notes", { x: 40, y, size: 10, font: bold });
    y -= 16;
    drawWrappedText(page, invoice.notes, {
      x: 40,
      y,
      maxWidth: 500,
      lineHeight: 12,
      size: 10,
      font,
      color: rgb(0.2, 0.2, 0.2),
      maxLines: 14,
    });
  }

  return Buffer.from(await pdf.save());
}

export async function buildAgreementPdf(
  agreement: AgreementRecord,
  project: ProjectRecord,
  options?: { heroImageBytes?: Uint8Array | null },
) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  page.drawRectangle({ x: 0, y: 0, width: 195, height: 842, color: rgb(0.07, 0.07, 0.07) });
  page.drawText("CLIENT AGREEMENT", { x: 24, y: 720, size: 26, font: bold, color: rgb(1, 1, 1), maxWidth: 160 });
  page.drawText(project.name, { x: 24, y: 675, size: 10, font, color: rgb(0.85, 0.85, 0.85), maxWidth: 160 });
  page.drawText("Services Engagement", { x: 24, y: 654, size: 9, font, color: rgb(0.72, 0.72, 0.72), maxWidth: 160 });

  page.drawText(agreement.title, { x: 220, y: 760, size: 18, font: bold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText(`Project: ${project.name}`, { x: 220, y: 734, size: 10, font });
  page.drawText(`Client: ${project.clientName}`, { x: 220, y: 718, size: 10, font });
  page.drawText(`Status: ${agreement.status}`, { x: 220, y: 702, size: 10, font });

  if (options?.heroImageBytes) {
    const image = await embedBestEffortImage(pdf, options.heroImageBytes);
    if (image) {
      drawImageFitted(page, image, { x: 220, y: 600, width: 340, height: 78 });
    }
  }

  drawWrappedText(page, agreement.content || "Agreement content to be defined.", {
    x: 220,
    y: options?.heroImageBytes ? 586 : 668,
    maxWidth: 340,
    lineHeight: 13,
    size: 10,
    font,
    color: rgb(0.12, 0.12, 0.12),
    maxLines: 34,
  });

  page.drawRectangle({ x: 220, y: 184, width: 330, height: 1, color: rgb(0.2, 0.2, 0.2) });
  page.drawText("Client Signature", { x: 220, y: 170, size: 10, font: bold });
  page.drawText(agreement.clientSigName ?? "-", { x: 220, y: 154, size: 10, font });
  page.drawText(agreement.clientSignedAt ?? "-", { x: 220, y: 138, size: 9, font, color: rgb(0.4, 0.4, 0.4) });

  page.drawText("Studio Signature", { x: 390, y: 170, size: 10, font: bold });
  page.drawText(agreement.adminSigName ?? "-", { x: 390, y: 154, size: 10, font });
  page.drawText(agreement.adminSignedAt ?? "-", { x: 390, y: 138, size: 9, font, color: rgb(0.4, 0.4, 0.4) });

  return Buffer.from(await pdf.save());
}

async function embedBestEffortImage(pdf: PDFDocument, bytes: Uint8Array) {
  try {
    return await pdf.embedPng(bytes);
  } catch {
    try {
      return await pdf.embedJpg(bytes);
    } catch {
      return null;
    }
  }
}

function drawImageFitted(page: PDFPage, image: PDFImage, box: { x: number; y: number; width: number; height: number }) {
  const dims = image.scale(1);
  const ratio = Math.min(box.width / dims.width, box.height / dims.height);
  const width = dims.width * ratio;
  const height = dims.height * ratio;
  page.drawImage(image, {
    x: box.x + (box.width - width) / 2,
    y: box.y + (box.height - height) / 2,
    width,
    height,
  });
}

function wrapText(text: string, font: Awaited<ReturnType<PDFDocument["embedFont"]>>, size: number, maxWidth: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawWrappedText(
  page: PDFPage,
  text: string,
  options: {
    x: number;
    y: number;
    maxWidth: number;
    lineHeight: number;
    size: number;
    font: Awaited<ReturnType<PDFDocument["embedFont"]>>;
    color?: ReturnType<typeof rgb>;
    maxLines?: number;
  },
) {
  const { x, y, maxWidth, lineHeight, size, font, color = rgb(0, 0, 0), maxLines = 999 } = options;
  const lines = wrapText(text, font, size, maxWidth);
  for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
    const content = i === maxLines - 1 && lines.length > maxLines ? `${lines[i]}...` : lines[i];
    page.drawText(content, { x, y: y - i * lineHeight, size, font, color });
  }
}
