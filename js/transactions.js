import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { db } from "./firebase-config.js";
import * as ui from "./ui.js";
import { currentUser } from "./auth.js";

let unsubscribeFromTransactions = null;
let allTransactions = [];

export function setupTransactionListener(userId) {
  if (unsubscribeFromTransactions) unsubscribeFromTransactions();

  const transactionsRef = collection(db, `users/${userId}/transactions`);
  const q = query(transactionsRef);

  unsubscribeFromTransactions = onSnapshot(q, (querySnapshot) => {
    allTransactions = [];
    querySnapshot.forEach((doc) => {
      allTransactions.push({ id: doc.id, ...doc.data() });
    });
    // Urutkan di sisi client
    allTransactions.sort(
      (a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0)
    );

    ui.renderTransactionList(allTransactions);
    ui.updateSummary(allTransactions);
    ui.updateExpenseChart(allTransactions);
  });

  return unsubscribeFromTransactions;
}

export function initTransactionForm(userId) {
  ui.DOM.transactionForm.onsubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      alert("Anda harus login terlebih dahulu.");
      return;
    }
    const keterangan = ui.DOM.keteranganInput.value.trim();
    const jumlah = parseFloat(ui.DOM.jumlahInput.value);
    const tipe = ui.DOM.tipeInput.value;
    const kategori = ui.DOM.kategoriInput.value;

    if (!keterangan || isNaN(jumlah) || !tipe || !kategori) {
      alert("Mohon lengkapi semua field.");
      return;
    }

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
  ui.DOM.transactionList.addEventListener("click", async (e) => {
    if (e.target.classList.contains("remove-btn")) {
      const id = e.target.dataset.id;
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
