import { state } from "./state.js";
import { getActiveShipment, calculateTotal, getSummary } from "./shipment.js";
import { formatRupiah } from "./helper.js";

const summaryElements = {
  qris: document.querySelector("#qrisSum"),
  trf: document.querySelector("#trfSum"),
  debit: document.querySelector("#debitSum"),
  grandTotal: document.querySelector("#grandTotal"),
};

export function renderTotal(shipments, totalSelector) {
  const totalElement = document.querySelector(totalSelector);
  const total = calculateTotal(shipments);

  totalElement.textContent = formatRupiah(total);
}

export function renderEmptyState(tableBody, message = "Belum ada data") {
  tableBody.innerHTML = `
        <tr class="table__empty">
            <td colspan="4">
                <div class="empty-state">
                    <span class="empty-state__icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-text preview-icon"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 8h8"/><path d="M7 12h10"/><path d="M7 16h6"/></svg>
                    </span>
                    <strong class="empty-state__title">${message}</strong>
                    <span class="empty-state__description">
                        Tambahkan nomor resi dan ongkir atau upload file borongan.
                    </span>
                </div>
            </td>
        </tr>
    `;
}

export function renderTable(shipments, tableSelector, totalSelector) {
  const tableBody = document.querySelector(tableSelector);

  tableBody.innerHTML = "";

  if (shipments.length === 0) {
    renderEmptyState(tableBody);
    renderTotal(shipments, totalSelector);
    return;
  }

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

export function updateSummary() {
  const summary = getSummary();

  summaryElements.qris.textContent = formatRupiah(summary.qris);
  summaryElements.trf.textContent = formatRupiah(summary.trf);
  summaryElements.debit.textContent = formatRupiah(summary.debit);
  summaryElements.grandTotal.textContent = formatRupiah(summary.grandTotal);
}

export function renderActiveTransaction() {
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
