const shipments = [];

const receiptInput = document.querySelector("#receiptInput");
const shippingInput = document.querySelector("#shippingInput");
const addBtn = document.querySelector("#addBtn");
const tableBody = document.querySelector("#shipmentTableBody");
const pdfInput = document.querySelector("#pdfInput");
const pdfName = document.querySelector("#pdfName");
const mergeButton = document.querySelector("#mergeButton");
let pdfUpload = document.querySelector("#pdfUpload");
let selectedPdf = null;

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function renderTable() {
  tableBody.innerHTML = "";

  shipments.forEach((shipment, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
            <td>${index + 1}</td>
            <td>${shipment.receipt}</td>
            <td>${formatRupiah(shipment.shipping)}</td>
            <td class="col-center">
                <button type="button" data-index="${index}" class="btn btn__icon btn--secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    <span>Hapus</span>
                </button>
            </td>
        `;

    tableBody.appendChild(row);
  });
}

function calculateTotal() {
  const total = shipments.reduce(function (sum, shipment) {
    return sum + shipment.shipping;
  }, 0);

  document.querySelector("#total").textContent = formatRupiah(total);
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

function drawTable(page, shipments) {
  const startX = 500;
  const startY = 300;

  const rowHeight = 15;

  const noWidth = 15;
  const receiptWidth = 80;
  const costWidth = 60;

  // Total lebar tabel
  const tableWidth = noWidth + receiptWidth + costWidth;

  let currentY = startY;

  // =========================
  // HEADER
  // =========================

  page.drawText("QRIS", {
    x: startX + 10,
    y: currentY - 10,
    size: 8,
  });

  // page.drawText("Nomor Resi", {
  //   x: startX + noWidth + 10,
  //   y: currentY - 10,
  //   size: 10,
  // });

  // page.drawText("Ongkir", {
  //   x: startX + noWidth + receiptWidth + 10,
  //   y: currentY - 10,
  //   size: 10,
  // });

  drawHorizontalLine(page, startX, startX + tableWidth, currentY);

  currentY -= rowHeight;

  drawHorizontalLine(page, startX, startX + tableWidth, currentY);

  // =========================
  // DATA
  // =========================

  shipments.forEach(function (shipment, index) {
    page.drawText(String(index + 1), {
      x: startX + 10,
      y: currentY - 10,
      size: 8,
    });

    page.drawText(shipment.receipt, {
      x: startX + noWidth + 10,
      y: currentY - 10,
      size: 8,
    });

    page.drawText(formatRupiah(shipment.shipping), {
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

  const total = shipments.reduce(function (sum, shipment) {
    return sum + shipment.shipping;
  }, 0);

  page.drawText("Total", {
    x: startX + noWidth + 10,
    y: currentY - 10,
    size: 8,
  });

  page.drawText(formatRupiah(total), {
    x: startX + noWidth + receiptWidth + 10,
    y: currentY - 10,
    size: 8,
  });

  currentY -= rowHeight;

  drawHorizontalLine(page, startX, startX + tableWidth, currentY);
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
  const pdfBytes = await selectedPdf.arrayBuffer();
  const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
  const page = pdfDoc.getPages()[0];
  const { width, height } = page.getSize();
  console.log("Width:", width);
  console.log("Height:", height);

  // page.drawText("TEST", {
  //   x: 500,
  //   y: 300,
  //   size: 20,
  // });

  drawTable(page, shipments);

  const modifiedPdf = await pdfDoc.save();
  downloadPdf(modifiedPdf);
}

addBtn.addEventListener("click", function () {
  const receipt = receiptInput.value.trim();
  const shipping = Number(shippingInput.value);

  if (!/^\d{12}$/.test(receipt)) {
    alert("Nomor Resi harus berupa angka sebanyak 12 digit");
    return;
  }

  if (!shipping || shipping <= 0) {
    alert("Ongkir harus lebih dari 0");
  }

  if (!receipt || !shipping) {
    alert("Data belum lengkap");
    return;
  }

  shipments.push({
    receipt,
    shipping,
  });

  renderTable();
  calculateTotal();

  receiptInput.value = "";
  shippingInput.value = "";

  receiptInput.focus();
});

tableBody.addEventListener("click", function (event) {
  if (event.target.tagName === "BUTTON") {
    const index = Number(event.target.dataset.index);

    shipments.splice(index, 1);

    renderTable();
    calculateTotal();
  }
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
  selectedPdf = file;
  // pdfName.textContent = file.name;
  console.log(selectedPdf);
});

mergeButton.addEventListener("click", function () {
  if (!selectedPdf) {
    alert("Silahkan upload file Laporan terlebih dahulu");
    return;
  }
  loadPdf();
});
