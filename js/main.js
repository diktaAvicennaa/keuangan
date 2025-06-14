import { initAuth, currentUser } from "./auth.js";
import { initCategoryForm, loadCategories } from "./categories.js";
import {
  initTransactionForm,
  setupTransactionListener,
  initTransactionDeletion,
} from "./transactions.js";

let transactionUnsubscribe = null;

export function initAppForUser(userId) {
  if (!userId) return;

  // Inisialisasi form
  initCategoryForm(userId);
  initTransactionForm(userId);
  initTransactionDeletion(userId);

  // Muat data awal
  loadCategories(userId);

  // Setup listener realtime
  if (transactionUnsubscribe) transactionUnsubscribe();
  transactionUnsubscribe = setupTransactionListener(userId);
}

export function cleanupListeners() {
  if (transactionUnsubscribe) {
    transactionUnsubscribe();
    transactionUnsubscribe = null;
  }
}

// Inisialisasi aplikasi saat halaman dimuat
document.addEventListener("DOMContentLoaded", () => {
  initAuth();
});
