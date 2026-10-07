import { state } from "./state.js";
import { addShipment } from "./shipment.js";
import { renderTable, updateSummary } from "./ui.js";
import { handlePdfExtract } from "./pdf-import.js";
import { loadPdf } from "./pdf-export.js";

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

const pdfInput = document.querySelector("#pdfInput");
const mergeButton = document.querySelector("#mergeButton");

const qrisPdfExtract = document.querySelector("#qrisPdfExtract");
const trfPdfExtract = document.querySelector("#trfPdfExtract");
const debitPdfExtract = document.querySelector("#debitPdfExtract");

const qrisPdfStatus = document.getElementById("qrisPdfStatus");
const trfPdfStatus = document.getElementById("trfPdfStatus");
const debitPdfStatus = document.getElementById("debitPdfStatus");

// let pdfUpload = document.querySelector("#pdfUpload");

const tabBtn = document.querySelectorAll(".tab__btn");
const payment = document.querySelectorAll(".payment__content");

function setupShipmentForm(addButton, receiptInput, shippingInput, shipments, tableSelector, totalSelector) {
  addButton.addEventListener("click", function () {
    const success = addShipment(receiptInput, shippingInput, shipments);

    if (success) {
      renderTable(shipments, tableSelector, totalSelector);
      updateSummary();
    }
  });
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

function initilizeTables() {
  renderTable(state.qrisShipments, "#qrisTableBody", "#qrisTotal");
  renderTable(state.trfShipments, "#trfTableBody", "#trfTotal");
  renderTable(state.debitShipments, "#debitTableBody", "#debitTotal");
}

function initializeShipmentForms() {
  setupShipmentForm(
    qrisAddBtn,
    qrisReceiptInput,
    qrisShippingInput,
    state.qrisShipments,
    "#qrisTableBody",
    "#qrisTotal",
  );
  setupShipmentForm(trfAddBtn, trfReceiptInput, trfShippingInput, state.trfShipments, "#trfTableBody", "#trfTotal");
  setupShipmentForm(
    debitAddBtn,
    debitReceiptInput,
    debitShippingInput,
    state.debitShipments,
    "#debitTableBody",
    "#debitTotal",
  );
}

function initializeDeleteShipment() {
  setupDeleteShipment(qrisTableBody, state.qrisShipments, "#qrisTableBody", "#qrisTotal");
  setupDeleteShipment(trfTableBody, state.trfShipments, "#trfTableBody", "#trfTotal");
  setupDeleteShipment(debitTableBody, state.debitShipments, "#debitTableBody", "#debitTotal");
}

function initializeApp() {
  initilizeTables();
  initializeShipmentForms();
  initializeDeleteShipment();
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

initializeApp();
