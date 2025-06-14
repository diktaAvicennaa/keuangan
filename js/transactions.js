import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  query,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { db } from "./firebase-config.js";
import * as ui from "./ui.js";

export let unsubscribeFromTransactions = null;

export function setupTransactionListener(userId) {
  if (unsubscribeFromTransactions) unsubscribeFromTransactions();

  const transactionsRef = collection(db, `users/${userId}/transactions`);
  const q = query(transactionsRef);

  unsubscribeFromTransactions = onSnapshot(q, (querySnapshot) => {
    const transactions = [];
    querySnapshot.forEach((doc) => {
      transactions.push({ id: doc.id, ...doc.data() });
    });

    const sortedTransactions = transactions.sort(
      (a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0)
    );

    ui.refreshAllViews(sortedTransactions);
  });

  return unsubscribeFromTransactions;
}

export function initTransactionForm(userId) {
  ui.DOM.transactionForm.onsubmit = async (e) => {
    e.preventDefault();
    if (!userId) return alert("Anda harus login terlebih dahulu.");

    const keterangan = ui.DOM.keteranganInput.value.trim();
    const jumlah = parseFloat(ui.DOM.jumlahInput.value);
    const tipe = ui.DOM.tipeInput.value;
    const kategori = ui.DOM.kategoriInput.value;

    if (!keterangan || isNaN(jumlah) || !tipe || !kategori)
      return alert("Mohon lengkapi semua field.");

    try {
      const transaksiCol = collection(db, `users/${userId}/transactions`);
      await addDoc(transaksiCol, {
        keterangan,
        jumlah,
        tipe,
        kategori,
        createdAt: new Date(),
      });
      ui.DOM.transactionForm.reset();
    } catch (err) {
      console.error("Gagal menambah transaksi:", err);
      alert("Gagal menambah transaksi: " + err.message);
    }
  };
}

export function initTransactionDeletion(userId) {
  ui.DOM.transactionListContainer.addEventListener("click", async (e) => {
    const removeBtn = e.target.closest(".remove-btn");
    if (removeBtn) {
      const id = removeBtn.dataset.id;
      if (confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
        try {
          const docRef = doc(db, `users/${userId}/transactions`, id);
          await deleteDoc(docRef);
        } catch (err) {
          console.error("Gagal menghapus transaksi:", err);
          alert("Gagal menghapus transaksi.");
        }
      }
    }
  });
}
