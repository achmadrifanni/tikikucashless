import { state, maxShipment } from "./state.js";
import { renderActiveTransaction } from "./ui.js";
import { saveBackup, clearBackup } from "./backup.js";

// Menyimpan atau menghapus backup berdasarkan kondisi data
export async function saveCurrentSession() {
  const hasData = state.qrisShipments.length > 0 || state.trfShipments.length > 0 || state.debitShipments.length > 0;

  try {
    if (hasData) {
      await saveBackup(state);
      console.log("Backup berhasil disimpan.");
    } else {
      await clearBackup();
      console.log("Backup dihapus karena seluruh data kosong.");
    }
  } catch (error) {
    console.error("Gagal menyimpan backup:", error);
  }
}

export function getActiveShipment() {
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

export function importShipmentsFromPdf(pdfShipments) {
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

  if (importedCount > 0) {
    saveCurrentSession();
  }

  renderActiveTransaction();

  return importedCount;
}

export function addShipment(receiptInput, shippingInput, shipmentArray) {
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

  saveCurrentSession();

  receiptInput.value = "";
  shippingInput.value = "";

  receiptInput.focus();

  return true;
}

export function calculateTotal(shipments) {
  return shipments.reduce(function (sum, shipment) {
    return sum + shipment.shippingCost;
  }, 0);
}

export function getSummary() {
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
