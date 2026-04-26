import { PDFDocument, PDFImage, PDFPage, StandardFonts, rgb } from "pdf-lib";

import { formatCurrency } from "@/lib/format";
import type { AgreementRecord, InvoiceRecord, ProjectRecord } from "@/lib/types";

function sanitizePdfText(input: string) {
  return input
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function sanitizePdfMultilineText(input: string) {
  return input
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ");
}

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

  page.drawText(sanitizePdfText(`Invoice ${invoice.invoiceNumber}`), { x: 40, y: 724, size: 12, font: bold, color: rgb(0.1, 0.1, 0.1) });
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
  page.drawText(sanitizePdfText(`Project: ${project.name}`), { x: 40, y: 688, size: 10, font, color: rgb(0.25, 0.25, 0.25) });
  page.drawText(sanitizePdfText(`Client: ${project.clientName}`), { x: 40, y: 672, size: 10, font, color: rgb(0.25, 0.25, 0.25) });
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
  page.drawText(`Tax ${invoice.taxEnabled ? `(${(invoice.taxRate * 100).toFixed(2)}%)` : "(off)"}`, { x: 380, y, size: 10, font, color: rgb(0.35, 0.35, 0.35) });
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

  y -= 38;
  page.drawRectangle({ x: 40, y: y + 26, width: 515, height: 1, color: rgb(0.2, 0.2, 0.2) });
  page.drawText("Pay Details", { x: 40, y, size: 11, font: bold, color: rgb(0.12, 0.12, 0.12) });
  y -= 18;
  page.drawText(`Name: ${sanitizePdfText(invoice.paymentDetails.name)}`, { x: 40, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
  y -= 14;
  page.drawText(`ABN: ${sanitizePdfText(invoice.paymentDetails.abn)}`, { x: 40, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
  y -= 14;
  page.drawText(`PayID: ${sanitizePdfText(invoice.paymentDetails.payId)}`, { x: 40, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
  y -= 14;
  page.drawText(`Reference: ${sanitizePdfText(invoice.paymentDetails.reference)}`, { x: 40, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
  y -= 14;
  page.drawText(`Amount: ${formatCurrency(invoice.paymentDetails.amount)}`, { x: 40, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });

  return Buffer.from(await pdf.save());
}

export async function buildAgreementPdf(
  agreement: AgreementRecord,
  project: ProjectRecord,
  _options?: { heroImageBytes?: Uint8Array | null },
) {
  void _options;
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = 595;
  const pageHeight = 842;
  const marginX = 72;
  const marginTop = 76;
  const marginBottom = 72;
  const contentWidth = pageWidth - marginX * 2;
  const bodyLineHeight = 15;
  const bodySize = 11;
  const bodyColor = rgb(0.08, 0.08, 0.08);

  let pageNumber = 0;
  let page = pdf.addPage([pageWidth, pageHeight]);
  let cursorY = pageHeight - marginTop;

  const drawHeader = (isFirstPage: boolean) => {
    if (isFirstPage) {
      page.drawText("CLIENT AGREEMENT", { x: marginX, y: cursorY, size: 10, font: bold, color: rgb(0.1, 0.1, 0.1) });
      cursorY -= 28;
      page.drawText(sanitizePdfText(agreement.title), { x: marginX, y: cursorY, size: 24, font: bold, color: rgb(0, 0, 0), maxWidth: contentWidth });
      cursorY -= 22;
      page.drawText(sanitizePdfText(project.name), { x: marginX, y: cursorY, size: 11, font, color: rgb(0.35, 0.35, 0.35) });
      cursorY -= 16;
      page.drawText(
        sanitizePdfText(`Client ${project.clientName}   Status ${agreement.status.replaceAll("_", " ")}   Workflow ${agreement.workflowState.replaceAll("_", " ")}`),
        { x: marginX, y: cursorY, size: 9, font, color: rgb(0.45, 0.45, 0.45), maxWidth: contentWidth },
      );
      cursorY -= 22;
    } else {
      page.drawText(sanitizePdfText(agreement.title), { x: marginX, y: cursorY, size: 10, font: bold, color: rgb(0.15, 0.15, 0.15), maxWidth: contentWidth - 90 });
      page.drawText(`Page ${pageNumber}`, { x: pageWidth - marginX - 42, y: cursorY, size: 9, font, color: rgb(0.45, 0.45, 0.45) });
      cursorY -= 12;
    }

    page.drawRectangle({ x: marginX, y: cursorY, width: contentWidth, height: 1, color: rgb(0.85, 0.85, 0.85) });
    cursorY -= 26;
  };

  const startNewPage = () => {
    page = pdf.addPage([pageWidth, pageHeight]);
    pageNumber += 1;
    cursorY = pageHeight - marginTop;
    drawHeader(false);
  };

  const ensureSpace = (requiredHeight: number) => {
    if (cursorY - requiredHeight < marginBottom) {
      startNewPage();
    }
  };

  pageNumber = 1;
  drawHeader(true);

  const rawBody = sanitizePdfMultilineText(agreement.content || "Agreement content to be defined.");
  const bodyLines = rawBody.split("\n");
  let previousWasBlank = false;

  for (const rawLine of bodyLines) {
    if (!rawLine.trim()) {
      const blankSpacing = previousWasBlank ? bodyLineHeight * 0.8 : bodyLineHeight * 0.5;
      ensureSpace(blankSpacing);
      cursorY -= blankSpacing;
      previousWasBlank = true;
      continue;
    }

    const wrapped = wrapText(rawLine, font, bodySize, contentWidth);
    for (const line of wrapped) {
      ensureSpace(bodyLineHeight);
      page.drawText(line, { x: marginX, y: cursorY, size: bodySize, font, color: bodyColor, maxWidth: contentWidth });
      cursorY -= bodyLineHeight;
    }
    previousWasBlank = false;
  }

  const signatureBlockHeight = 124;
  ensureSpace(signatureBlockHeight + 18);
  cursorY -= 18;
  page.drawRectangle({ x: marginX, y: cursorY, width: contentWidth, height: 1, color: rgb(0.82, 0.82, 0.82) });
  cursorY -= 22;

  const colWidth = contentWidth / 2 - 8;
  const rightColX = marginX + contentWidth / 2 + 8;
  page.drawText("Client Signature", { x: marginX, y: cursorY, size: 10, font: bold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText(sanitizePdfText(`${project.businessSignatoryName ?? "Studio"} Signature`), {
    x: rightColX,
    y: cursorY,
    size: 10,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });
  cursorY -= 18;

  page.drawText(sanitizePdfText(agreement.clientSigName ?? "-"), { x: marginX, y: cursorY, size: 11, font, color: bodyColor, maxWidth: colWidth });
  page.drawText(sanitizePdfText(agreement.adminSigName ?? project.businessSignatoryName ?? "-"), {
    x: rightColX,
    y: cursorY,
    size: 11,
    font,
    color: bodyColor,
    maxWidth: colWidth,
  });
  cursorY -= 16;

  page.drawText(sanitizePdfText(agreement.clientSignedAt ?? "-"), { x: marginX, y: cursorY, size: 9, font, color: rgb(0.45, 0.45, 0.45), maxWidth: colWidth });
  page.drawText(sanitizePdfText(agreement.adminSignedAt ?? "-"), {
    x: rightColX,
    y: cursorY,
    size: 9,
    font,
    color: rgb(0.45, 0.45, 0.45),
    maxWidth: colWidth,
  });

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
  const words = sanitizePdfText(text).replace(/\s+/g, " ").trim().split(" ");
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
  const lines = wrapText(sanitizePdfText(text), font, size, maxWidth);
  for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
    const content = i === maxLines - 1 && lines.length > maxLines ? `${lines[i]}...` : lines[i];
    page.drawText(content, { x, y: y - i * lineHeight, size, font, color });
  }
}
