import { state } from "./state.js";
import { importShipmentsFromPdf } from "./shipment.js";

export async function handlePdfExtract(file, statusElement, transaction) {
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

export async function extractPdfText(file) {
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

export function parseShipmentData(text) {
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
