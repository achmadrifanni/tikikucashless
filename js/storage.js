export function saveShipments(data) {
  localStorage.setItem("tikiCashlessData", JSON.stringify(data));
}

export function loadShipments() {
  const savedData = localStorage.getItem("tikiCashlessData");

  if (!savedData) return null;

  try {
    return JSON.parse(savedData);
  } catch (error) {
    console.error("Gagal membaca data:", error);
    return null;
  }
}

export function clearStorage() {
  localStorage.removeItem("tikiCashlessData");
}
