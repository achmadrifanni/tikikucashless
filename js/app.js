const shipments = [];

const receiptInput = document.querySelector("#receiptInput");
const shippingInput = document.querySelector("#shippingInput");
const addBtn = document.querySelector("#addBtn");

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function renderTable() {
  const tableBody = document.querySelector("#shipmentTableBody");

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

addBtn.addEventListener("click", function () {
  const receipt = receiptInput.value;
  const shipping = Number(shippingInput.value);

  if (!receipt || !shipping) {
    alert("Data belum lengkap");
    return;
  }

  shipments.push({
    receipt,
    shipping,
  });

  renderTable();

  receiptInput.value = "";
  shippingInput.value = "";

  receiptInput.focus();
});

const tableBody = document.querySelector("#shipmentTableBody");
tableBody.addEventListener("click", function (event) {
  if (event.target.tagName === "BUTTON") {
    const index = Number(event.target.dataset.index);

    shipments.splice(index, 1);

    renderTable();
  }
});
