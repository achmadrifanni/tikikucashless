const shipments = [];

const receiptInput = document.querySelector("#receiptInput");
const shippingInput = document.querySelector("#shippingInput");
const addBtn = document.querySelector("#addBtn");
const tableBody = document.querySelector("#shipmentTableBody");
const pdfInput = document.querySelector("#pdfInput");
const pdfName = document.querySelector("#pdfName");
const mergeButton = document.querySelector("#mergeButton");

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
            <td>
                <button type="button" data-index="${index}">
                    Hapus
                </button>
            </td>
        `;

    tableBody.appendChild(row);
  });
}

function calculateTotal() {
  const total = shipments.reduce(function (sum, shipment) {
    return sum + shipment.shipping;
  }, 0 )
  
  document.querySelector("#total").textContent = formatRupiah(total);
}

function downloadPdf(pdfBytes) {
  const blob = new Blob([pdfBytes], {type:"application/pdf"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "laporan-final.pdf";
  link.click();
  URL.revokeObjectURL(url);
}

async function loadPdf() {
  const pdfBytes = await selectedPdf.arrayBuffer();
  const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
  const page = pdfDoc.getPages()[0];
  const {width, height} = page.getSize();
  console.log("Width:", width);
  console.log("Height:", height);

  page.drawText("TEST", {
    x: 500,
    y: 300,
    size: 20
  });

  const modifiedPdf = await pdfDoc.save();
  downloadPdf(modifiedPdf);
}

addBtn.addEventListener("click", function () {
  const receipt = receiptInput.value.trim();
  const shipping = Number(shippingInput.value);

  if (!/^\d{12}$/.test(receipt)) {
    alert("Nomor Resi harus berupa angka sebanyak 12 digit");
    return
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
  pdfName.textContent = file.name;
  console.log(selectedPdf);
})

mergeButton.addEventListener("click", function () {
  if (!selectedPdf) {
    alert("Silahkan upload file Laporan terlebih dahulu");
    return;
  }
  loadPdf();
})
