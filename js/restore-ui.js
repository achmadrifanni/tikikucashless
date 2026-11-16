export function showRestorePrompt({ onRestore, onStartNew }) {
  // Mencegah modal muncul lebih dari satu kali
  const existingModal = document.querySelector("#restorePrompt");

  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement("div");

  modal.id = "restorePrompt";
  modal.className = "restore-modal";

  modal.innerHTML = `
    <div class="restore-modal__backdrop"></div>

    <section
      class="restore-modal__dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="restoreTitle"
    >
      <div class="restore-modal__icon">
        <span>↻</span>
      </div>

      <h2 id="restoreTitle">Data sebelumnya ditemukan</h2>

      <p>
        Kami menemukan data transaksi dari sesi sebelumnya.
        Apakah kamu ingin memulihkan data tersebut?
      </p>

      <div class="restore-modal__actions">
        <button
          type="button"
          class="restore-modal__restore"
        >
          Pulihkan Data
        </button>

        <button
          type="button"
          class="restore-modal__new"
        >
          Mulai Baru
        </button>
      </div>
    </section>
  `;

  document.body.appendChild(modal);

  // Tombol pulihkan data
  modal.querySelector(".restore-modal__restore").addEventListener("click", async () => {
    await onRestore();
    modal.remove();
  });

  // Tombol mulai baru
  modal.querySelector(".restore-modal__new").addEventListener("click", async () => {
    await onStartNew();
    modal.remove();
  });
}
