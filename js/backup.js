const DB_NAME = "tikiCashlessDB";
const STORE_NAME = "sessionBackup";
const BACKUP_ID = "currentSession";

// Membuka database IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.addEventListener("upgradeneeded", () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
        });
      }
    });

    request.addEventListener("success", () => {
      resolve(request.result);
    });

    request.addEventListener("error", () => {
      reject(request.error);
    });
  });
}

// Menyimpan data transaksi
export async function saveBackup(state) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");

    const store = transaction.objectStore(STORE_NAME);

    store.put({
      id: BACKUP_ID,
      qrisShipments: state.qrisShipments,
      trfShipments: state.trfShipments,
      debitShipments: state.debitShipments,
      updatedAt: Date.now(),
    });

    transaction.addEventListener("complete", () => {
      db.close();
      resolve(true);
    });

    transaction.addEventListener("error", () => {
      db.close();
      reject(transaction.error);
    });

    transaction.addEventListener("abort", () => {
      db.close();
      reject(transaction.error);
    });
  });
}

// Mengambil data backup
export async function loadBackup() {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");

    const store = transaction.objectStore(STORE_NAME);

    const request = store.get(BACKUP_ID);

    request.addEventListener("success", () => {
      const result = request.result ?? null;
      db.close();
      resolve(result);
    });

    request.addEventListener("error", () => {
      db.close();
      reject(request.error);
    });
  });
}

// Menghapus data backup
export async function clearBackup() {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");

    const store = transaction.objectStore(STORE_NAME);

    store.delete(BACKUP_ID);

    transaction.addEventListener("complete", () => {
      db.close();
      resolve(true);
    });

    transaction.addEventListener("error", () => {
      db.close();
      reject(transaction.error);
    });

    transaction.addEventListener("abort", () => {
      db.close();
      reject(transaction.error);
    });
  });
}
