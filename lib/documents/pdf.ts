import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

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
  const bodySize = 11;
  const bodyLineHeight = 15;

  let page = pdf.addPage([pageWidth, pageHeight]);
  let pageNumber = 1;
  let cursorY = pageHeight - marginTop;

  const drawHeader = (isFirstPage: boolean) => {
    if (isFirstPage) {
      page.drawText("INVOICE", { x: marginX, y: cursorY, size: 10, font: bold, color: rgb(0.1, 0.1, 0.1) });
      cursorY -= 28;
      const titleLines = wrapText(invoice.title, bold, 24, contentWidth).slice(0, 2);
      const titleLineHeight = 26;
      titleLines.forEach((line, index) => {
        page.drawText(line, { x: marginX, y: cursorY - index * titleLineHeight, size: 24, font: bold, color: rgb(0, 0, 0) });
      });
      cursorY -= Math.max(titleLines.length, 1) * titleLineHeight + 4;
      page.drawText(sanitizePdfText(`Invoice ${invoice.invoiceNumber}`), { x: marginX, y: cursorY, size: 11, font, color: rgb(0.35, 0.35, 0.35) });
      cursorY -= 16;
      page.drawText(
        sanitizePdfText(`Project ${project.name}   Client ${project.clientName}   Issue ${invoice.issueDate}   Due ${invoice.dueDate}`),
        { x: marginX, y: cursorY, size: 9, font, color: rgb(0.45, 0.45, 0.45), maxWidth: contentWidth },
      );
      cursorY -= 22;
    } else {
      page.drawText(sanitizePdfText(invoice.title), { x: marginX, y: cursorY, size: 10, font: bold, color: rgb(0.15, 0.15, 0.15), maxWidth: contentWidth - 90 });
      page.drawText(`Page ${pageNumber}`, { x: pageWidth - marginX - 42, y: cursorY, size: 9, font, color: rgb(0.45, 0.45, 0.45) });
      cursorY -= 12;
    }
    page.drawRectangle({ x: marginX, y: cursorY, width: contentWidth, height: 1, color: rgb(0.85, 0.85, 0.85) });
    cursorY -= 20;
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

  drawHeader(true);

  ensureSpace(22);
  page.drawText("Line Items", { x: marginX, y: cursorY, size: 10, font: bold, color: rgb(0.12, 0.12, 0.12) });
  cursorY -= 16;
  page.drawText("Description", { x: marginX, y: cursorY, size: 9, font: bold, color: rgb(0.4, 0.4, 0.4) });
  page.drawText("Qty", { x: marginX + 290, y: cursorY, size: 9, font: bold, color: rgb(0.4, 0.4, 0.4) });
  page.drawText("Unit", { x: marginX + 340, y: cursorY, size: 9, font: bold, color: rgb(0.4, 0.4, 0.4) });
  page.drawText("Total", { x: marginX + 420, y: cursorY, size: 9, font: bold, color: rgb(0.4, 0.4, 0.4) });
  cursorY -= 14;
  page.drawRectangle({ x: marginX, y: cursorY, width: contentWidth, height: 1, color: rgb(0.88, 0.88, 0.88) });
  cursorY -= 14;

  for (const line of invoice.lineItems) {
    const lineTotal = line.quantity * line.unitPrice;
    const wrapped = wrapText(line.description, font, 10, 270);
    const rowHeight = Math.max(1, wrapped.length) * 13 + 5;
    ensureSpace(rowHeight + 8);
    const rowStartY = cursorY;
    wrapped.forEach((descLine, index) => {
      page.drawText(descLine, { x: marginX, y: rowStartY - index * 13, size: 10, font, color: rgb(0.15, 0.15, 0.15), maxWidth: 270 });
    });
    page.drawText(String(line.quantity), { x: marginX + 290, y: rowStartY, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(formatCurrency(line.unitPrice), { x: marginX + 340, y: rowStartY, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(formatCurrency(lineTotal), { x: marginX + 420, y: rowStartY, size: 10, font, color: rgb(0.12, 0.12, 0.12) });
    cursorY -= rowHeight;
  }

  ensureSpace(86);
  cursorY -= 6;
  page.drawRectangle({ x: marginX + 300, y: cursorY + 18, width: 200, height: 1, color: rgb(0.86, 0.86, 0.86) });
  page.drawText("Subtotal", { x: marginX + 320, y: cursorY, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(formatCurrency(invoice.subtotal), { x: marginX + 420, y: cursorY, size: 10, font, color: rgb(0.18, 0.18, 0.18) });
  cursorY -= 16;
  page.drawText(`Tax ${invoice.taxEnabled ? `(${(invoice.taxRate * 100).toFixed(2)}%)` : "(off)"}`, { x: marginX + 320, y: cursorY, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(formatCurrency(invoice.taxAmount), { x: marginX + 420, y: cursorY, size: 10, font, color: rgb(0.18, 0.18, 0.18) });
  cursorY -= 20;
  page.drawText("Total", { x: marginX + 320, y: cursorY, size: 12, font: bold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText(formatCurrency(invoice.total), { x: marginX + 420, y: cursorY, size: 12, font: bold, color: rgb(0.1, 0.1, 0.1) });
  cursorY -= 28;

  if (invoice.notes) {
    ensureSpace(26);
    page.drawRectangle({ x: marginX, y: cursorY + 14, width: contentWidth, height: 1, color: rgb(0.88, 0.88, 0.88) });
    page.drawText("Notes", { x: marginX, y: cursorY - 4, size: 10, font: bold, color: rgb(0.12, 0.12, 0.12) });
    cursorY -= 22;

    const noteLines = sanitizePdfMultilineText(invoice.notes).split("\n");
    for (const sourceLine of noteLines) {
      if (!sourceLine.trim()) {
        ensureSpace(bodyLineHeight * 0.6);
        cursorY -= bodyLineHeight * 0.6;
        continue;
      }
      const wrapped = wrapText(sourceLine, font, bodySize, contentWidth);
      for (const rendered of wrapped) {
        ensureSpace(bodyLineHeight);
        page.drawText(rendered, { x: marginX, y: cursorY, size: bodySize, font, color: rgb(0.17, 0.17, 0.17), maxWidth: contentWidth });
        cursorY -= bodyLineHeight;
      }
    }
    cursorY -= 16;
  }

  ensureSpace(110);
  page.drawRectangle({ x: marginX, y: cursorY + 20, width: contentWidth, height: 1, color: rgb(0.88, 0.88, 0.88) });
  page.drawText("Pay Details", { x: marginX, y: cursorY, size: 10, font: bold, color: rgb(0.12, 0.12, 0.12) });
  cursorY -= 18;
  page.drawText(`Name: ${sanitizePdfText(invoice.paymentDetails.name)}`, { x: marginX, y: cursorY, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
  cursorY -= 14;
  page.drawText(`ABN: ${sanitizePdfText(invoice.paymentDetails.abn)}`, { x: marginX, y: cursorY, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
  cursorY -= 14;
  page.drawText(`PayID: ${sanitizePdfText(invoice.paymentDetails.payId)}`, { x: marginX, y: cursorY, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
  cursorY -= 14;
  page.drawText(`Reference: ${sanitizePdfText(invoice.paymentDetails.reference)}`, { x: marginX, y: cursorY, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
  cursorY -= 14;
  page.drawText(`Amount: ${formatCurrency(invoice.paymentDetails.amount)}`, { x: marginX, y: cursorY, size: 10, font, color: rgb(0.2, 0.2, 0.2) });

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
