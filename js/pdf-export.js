import { state } from "./state.js";
import { calculateTotal, getSummary } from "./shipment.js";
import { formatRupiah } from "./helper.js";

const { rgb, StandardFonts } = PDFLib;
export async function loadPdf() {
  const pdfBytes = await state.selectedPdf.arrayBuffer();
  const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.getPages()[0];
  const { width, height } = page.getSize();

  const tables = [];

  if (state.qrisShipments.length > 0) {
    tables.push({
      shipments: state.qrisShipments,
      title: "QRIS",
    });
  }

  if (state.trfShipments.length > 0) {
    tables.push({
      shipments: state.trfShipments,
      title: "TRANSFER",
    });
  }

  if (state.debitShipments.length > 0) {
    tables.push({
      shipments: state.debitShipments,
      title: "DEBIT",
    });
  }

  const tableWidth = 155;
  const tableGap = 5;
  const startX = 180;
  const startY = 310;

  tables.forEach(function (table, index) {
    const x = startX + index * (tableWidth + tableGap);

    drawTable(page, table.shipments, x, startY, table.title, fontBold);
  });

  // SUMMARY
  const summaryX = startX + tables.length * (tableWidth + tableGap);

  drawSummary(page, summaryX, startY, fontBold);

  const modifiedPdf = await pdfDoc.save();
  downloadPdf(modifiedPdf);
}

export function drawTable(page, shipments, startX, startY, title, fontBold) {
  const rowHeight = 15;
  const noWidth = 10;
  const receiptWidth = 70;
  const costWidth = 55;
  const totalTableHeight = rowHeight * (shipments.length + 2);

  // Total lebar tabel
  const tableWidth = noWidth + receiptWidth + costWidth;

  let currentY = startY;

  page.drawRectangle({
    x: startX,
    y: currentY - totalTableHeight,
    width: tableWidth,
    height: totalTableHeight,
    color: rgb(1.0, 1.0, 1.0),
  });

  // =========================
  // HEADER
  // =========================

  page.drawText(title, {
    x: startX + 20,
    y: currentY - 10,
    font: fontBold,
    size: 8,
  });

  currentY -= rowHeight;

  drawHorizontalLine(page, startX, startX + tableWidth, currentY);

  // =========================
  // DATA
  // =========================

  shipments.forEach(function (shipment, index) {
    page.drawText(String(index + 1), {
      x: startX + 7,
      y: currentY - 10,
      size: 8,
    });

    page.drawText(shipment.receipt, {
      x: startX + noWidth + 10,
      y: currentY - 10,
      size: 8,
    });

    page.drawText(formatRupiah(shipment.shippingCost), {
      x: startX + noWidth + receiptWidth + 10,
      y: currentY - 10,
      size: 8,
    });

    currentY -= rowHeight;

    drawHorizontalLine(page, startX, startX + tableWidth, currentY);
  });

  // =========================
  // TOTAL
  // =========================

  const total = calculateTotal(shipments);

  page.drawText("Total", {
    x: startX + noWidth + 10,
    y: currentY - 10,
    font: fontBold,
    size: 8,
  });

  page.drawText(formatRupiah(total), {
    x: startX + noWidth + receiptWidth + 10,
    y: currentY - 10,
    font: fontBold,
    size: 8,
  });
}

export function drawSummary(page, startX, startY, fontBold) {
  const summary = getSummary();

  const rowHeight = 15;

  const paymentWidth = 80;
  const costWidth = 55;
  const totalTableHeight = rowHeight * 5;

  // Total lebar tabel
  const tableWidth = paymentWidth + costWidth;

  let currentY = startY;

  page.drawRectangle({
    x: startX,
    y: currentY - totalTableHeight,
    width: tableWidth,
    height: totalTableHeight,
    color: rgb(1.0, 1.0, 1.0),
  });

  page.drawText("SUMMARY", {
    x: startX,
    y: currentY - 10,
    font: fontBold,
    size: 8,
  });

  currentY -= rowHeight;

  drawHorizontalLine(page, startX, startX + tableWidth, currentY);

  page.drawText(`QRIS`, {
    x: startX,
    y: currentY - 10,
    size: 8,
  });
  page.drawText(`${formatRupiah(summary.qris)}`, {
    x: startX + paymentWidth,
    y: currentY - 10,
    size: 8,
  });

  currentY -= rowHeight;

  drawHorizontalLine(page, startX, startX + tableWidth, currentY);

  page.drawText(`TRANSFER`, {
    x: startX,
    y: currentY - 11,
    size: 8,
  });
  page.drawText(`${formatRupiah(summary.trf)}`, {
    x: startX + paymentWidth,
    y: currentY - 11,
    size: 8,
  });

  currentY -= rowHeight;

  drawHorizontalLine(page, startX, startX + tableWidth, currentY);

  page.drawText(`DEBIT`, {
    x: startX,
    y: currentY - 12,
    size: 8,
  });
  page.drawText(`${formatRupiah(summary.debit)}`, {
    x: startX + paymentWidth,
    y: currentY - 12,
    size: 8,
  });

  currentY -= rowHeight;

  drawHorizontalLine(page, startX, startX + tableWidth, currentY);

  page.drawText(`GRAND TOTAL`, {
    x: startX,
    y: currentY - 13,
    font: fontBold,
    size: 9,
  });
  page.drawText(`${formatRupiah(summary.grandTotal)}`, {
    x: startX + paymentWidth,
    y: currentY - 13,
    font: fontBold,
    size: 9,
  });
}

export function drawHorizontalLine(page, x1, x2, y) {
  page.drawLine({
    start: {
      x: x1,
      y: y,
    },
    end: {
      x: x2,
      y: y,
    },
    thickness: 1,
  });
}

export function downloadPdf(pdfBytes) {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "laporan-final.pdf";
  link.click();
  URL.revokeObjectURL(url);
}
