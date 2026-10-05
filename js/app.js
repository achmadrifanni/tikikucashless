import { state, maxShipment } from "./state.js";
import { formatRupiah } from "./helper.js";

const qrisReceiptInput = document.querySelector("#qrisReceiptInput");
const qrisShippingInput = document.querySelector("#qrisShippingInput");
const trfReceiptInput = document.querySelector("#trfReceiptInput");
const trfShippingInput = document.querySelector("#trfShippingInput");
const debitReceiptInput = document.querySelector("#debitReceiptInput");
const debitShippingInput = document.querySelector("#debitShippingInput");

const qrisTableBody = document.querySelector("#qrisTableBody");
const trfTableBody = document.querySelector("#trfTableBody");
const debitTableBody = document.querySelector("#debitTableBody");

const qrisAddBtn = document.querySelector("#qrisAddBtn");
const trfAddBtn = document.querySelector("#trfAddBtn");
const debitAddBtn = document.querySelector("#debitAddBtn");

const summaryElements = {
  qris: document.querySelector("#qrisSum"),
  trf: document.querySelector("#trfSum"),
  debit: document.querySelector("#debitSum"),
  grandTotal: document.querySelector("#grandTotal"),
};

const pdfInput = document.querySelector("#pdfInput");
const pdfName = document.querySelector("#pdfName");
const mergeButton = document.querySelector("#mergeButton");

const qrisPdfExtract = document.querySelector("#qrisPdfExtract");
const trfPdfExtract = document.querySelector("#trfPdfExtract");
const debitPdfExtract = document.querySelector("#debitPdfExtract");

const qrisPdfStatus = document.getElementById("qrisPdfStatus");
const trfPdfStatus = document.getElementById("trfPdfStatus");
const debitPdfStatus = document.getElementById("debitPdfStatus");

const { rgb, StandardFonts } = PDFLib;
let pdfUpload = document.querySelector("#pdfUpload");

const tabBtn = document.querySelectorAll(".tab__btn");
const payment = document.querySelectorAll(".payment__content");

async function handlePdfExtract(file, statusElement, transaction) {
  if (!file) {
    return;
  }

  try {
    // Tentukan transaksi yang sedang diproses
    state.activeTransaction = transaction;

    console.log("Transaction:", state.activeTransaction);
    console.log("File:", file.name);

    statusElement.textContent = "Membaca PDF...";

    // =========================
    // EXTRACT
    // =========================

    const text = await extractPdfText(file);

    // =========================
    // PARSE
    // =========================

    const pdfShipments = parseShipmentData(text);

    if (pdfShipments.length === 0) {
      statusElement.textContent = "Tidak ditemukan data No Connote dan Biaya.";

      return;
    }

    // =========================
    // IMPORT
    // =========================

    const importedCount = importShipmentsFromPdf(pdfShipments);

    statusElement.textContent = `${importedCount} transaksi berhasil diimport.`;
  } catch (error) {
    console.error("PDF import error:", error);

    statusElement.textContent = "Gagal membaca PDF.";
  }
}

async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
  }).promise;

  let text = "";

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);

    const textContent = await page.getTextContent();

    const pageText = textContent.items.map((item) => item.str).join(" ");

    text += pageText + "\n";
  }

  return text;
}

function parseShipmentData(text) {
  const shipments = [];

  // Cari semua No Connote (12 digit)
  const connoteRegex = /\b\d{12}\b/g;
  const connoteMatches = [...text.matchAll(connoteRegex)];

  for (let i = 0; i < connoteMatches.length; i++) {
    const currentMatch = connoteMatches[i];

    const receipt = currentMatch[0];

    // Mulai setelah nomor connote
    const startIndex = currentMatch.index + currentMatch[0].length;

    // Berhenti sebelum nomor connote berikutnya
    const endIndex = i + 1 < connoteMatches.length ? connoteMatches[i + 1].index : text.length;

    const transactionText = text.slice(startIndex, endIndex);

    // Cari biaya seperti 32,000 / 33,000 / 1,250,000
    const costMatches = transactionText.match(/\b\d{1,3}(?:,\d{3})+\b/g);

    if (!costMatches) {
      continue;
    }

    // Ambil biaya pertama setelah connote
    const costText = costMatches[0];

    const cost = Number(costText.replace(/,/g, ""));

    shipments.push({
      receipt,
      cost,
    });
  }

  return shipments;
}

function importShipmentsFromPdf(pdfShipments) {
  let importedCount = 0;

  const activeShipments = getActiveShipment();

  for (const shipment of pdfShipments) {
    const alreadyExists = activeShipments.some((item) => item.receipt === shipment.receipt);

    if (alreadyExists) {
      continue;
    }

    activeShipments.push({
      receipt: shipment.receipt,
      shippingCost: shipment.cost,
    });

    importedCount++;
  }

  renderActiveTransaction();

  return importedCount;
}

function renderActiveTransaction() {
  const activeShipments = getActiveShipment();

  switch (state.activeTransaction) {
    case "qris":
      renderTable(activeShipments, "#qrisTableBody", "#qrisTotal");
      updateSummary();
      break;

    case "transfer":
      renderTable(activeShipments, "#trfTableBody", "#trfTotal");
      updateSummary();
      break;

    case "debit":
      renderTable(activeShipments, "#debitTableBody", "#debitTotal");
      updateSummary();
      break;
  }
}

function getActiveShipment() {
  switch (state.activeTransaction) {
    case "qris":
      return state.qrisShipments;

    case "transfer":
      return state.trfShipments;

    case "debit":
      return state.debitShipments;

    default:
      return state.qrisShipments;
  }
}

function setupShipmentForm(addButton, receiptInput, shippingInput, shipments, tableSelector, totalSelector) {
  addButton.addEventListener("click", function () {
    const success = addShipment(receiptInput, shippingInput, shipments);

    if (success) {
      renderTable(shipments, tableSelector, totalSelector);
      updateSummary();
    }
  });
}
function addShipment(receiptInput, shippingInput, shipmentArray) {
  const receipt = receiptInput.value.trim();
  const shippingCost = Number(shippingInput.value);

  if (shipmentArray.length >= maxShipment) {
    alert(`Maksimal ${maxShipment} data dalam satu transaksi.`);
    return;
  }

  if (!/^\d{12}$/.test(receipt)) {
    alert("Nomor Resi harus berupa angka sebanyak 12 digit");
    return false;
  }

  if (!shippingCost || shippingCost <= 0) {
    alert("Ongkir harus lebih dari 0");
    return false;
  }

  if (!receipt || !shippingCost) {
    alert("Data belum lengkap");
    return;
  }

  shipmentArray.push({
    receipt,
    shippingCost,
  });

  receiptInput.value = "";
  shippingInput.value = "";

  receiptInput.focus();

  return true;
}

function setupDeleteShipment(tableBody, shipments, tableSelector, totalSelector) {
  tableBody.addEventListener("click", function (event) {
    const deleteButton = event.target.closest(".btn--danger");

    if (!deleteButton) return;

    const index = Number(deleteButton.dataset.index);

    shipments.splice(index, 1);

    renderTable(shipments, tableSelector, totalSelector);
    updateSummary();
  });
}

function getSummary() {
  const totalQris = calculateTotal(state.qrisShipments);
  const totalTrf = calculateTotal(state.trfShipments);
  const totalDebit = calculateTotal(state.debitShipments);

  return {
    qris: totalQris,
    trf: totalTrf,
    debit: totalDebit,
    grandTotal: totalQris + totalTrf + totalDebit,
  };
}

function updateSummary() {
  const summary = getSummary();

  summaryElements.qris.textContent = formatRupiah(summary.qris);
  summaryElements.trf.textContent = formatRupiah(summary.trf);
  summaryElements.debit.textContent = formatRupiah(summary.debit);
  summaryElements.grandTotal.textContent = formatRupiah(summary.grandTotal);
}

function calculateTotal(shipments) {
  return shipments.reduce(function (sum, shipment) {
    return sum + shipment.shippingCost;
  }, 0);
}

function renderTotal(shipments, totalSelector) {
  const totalElement = document.querySelector(totalSelector);
  const total = calculateTotal(shipments);

  totalElement.textContent = formatRupiah(total);
}

function renderTable(shipments, tableSelector, totalSelector) {
  const tableBody = document.querySelector(tableSelector);

  tableBody.innerHTML = "";

  shipments.forEach((shipment, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
            <td>${index + 1}</td>
            <td>${shipment.receipt}</td>
            <td>${formatRupiah(shipment.shippingCost)}</td>
            <td>
                <button type="button" data-index="${index}" class="btn btn--danger">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    
                </button>
            </td>
        `;

    tableBody.appendChild(row);
  });
  renderTotal(shipments, totalSelector);
}

function downloadPdf(pdfBytes) {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "laporan-final.pdf";
  link.click();
  URL.revokeObjectURL(url);
}

function drawTable(page, shipments, startX, startY, title, fontBold) {
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

function drawSummary(page, startX, startY, fontBold) {
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

function drawHorizontalLine(page, x1, x2, y) {
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

function drawVerticalLine(page, x, y1, y2) {
  page.drawLine({
    start: {
      x: x,
      y: y1,
    },
    end: {
      x: x,
      y: y2,
    },
    thickness: 1,
  });
}

async function loadPdf() {
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

tabBtn.forEach((tab, index) => {
  tab.addEventListener("click", () => {
    tabBtn.forEach((tab) => {
      tab.classList.remove("active");
    });
    tab.classList.add("active");

    payment.forEach((content) => {
      content.classList.remove("active");
    });
    payment[index].classList.add("active");

    state.activeTransaction = tab.dataset.transaction;
  });
});

qrisPdfExtract.addEventListener("change", function () {
  state.activeTransaction = "qris";

  handlePdfExtract(this.files[0], qrisPdfStatus, "qris");

  this.value = "";
});

trfPdfExtract.addEventListener("change", function () {
  state.activeTransaction = "transfer";

  handlePdfExtract(this.files[0], trfPdfStatus, "transfer");

  this.value = "";
});

debitPdfExtract.addEventListener("change", function () {
  state.activeTransaction = "debit";

  handlePdfExtract(this.files[0], debitPdfStatus, "debit");

  this.value = "";
});

// qris
setupShipmentForm(qrisAddBtn, qrisReceiptInput, qrisShippingInput, state.qrisShipments, "#qrisTableBody", "#qrisTotal");

setupDeleteShipment(qrisTableBody, state.qrisShipments, "#qrisTableBody", "#qrisTotal");

// trf
setupShipmentForm(trfAddBtn, trfReceiptInput, trfShippingInput, state.trfShipments, "#trfTableBody", "#trfTotal");

setupDeleteShipment(trfTableBody, state.trfShipments, "#trfTableBody", "#trfTotal");

// debit
setupShipmentForm(
  debitAddBtn,
  debitReceiptInput,
  debitShippingInput,
  state.debitShipments,
  "#debitTableBody",
  "#debitTotal",
);

setupDeleteShipment(debitTableBody, state.debitShipments, "#debitTableBody", "#debitTotal");

pdfInput.addEventListener("change", function () {
  const file = pdfInput.files[0];

  if (!file) {
    return;
  }

  if (file.type !== "application/pdf") {
    alert("File harus berupa PDF");
    pdfInput.value = "";
    return;
  }
  state.selectedPdf = file;
  // pdfName.textContent = file.name;
  console.log(state.selectedPdf);
});

mergeButton.addEventListener("click", function () {
  if (!state.selectedPdf) {
    alert("Silahkan upload file Laporan terlebih dahulu");
    return;
  }
  loadPdf();
});
