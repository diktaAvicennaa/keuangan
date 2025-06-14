import { initAuth } from "./auth.js";
import { initCategoryForm, loadCategories } from "./categories.js";
import {
  initTransactionForm,
  setupTransactionListener,
  initTransactionDeletion,
} from "./transactions.js";
import { initChartFilters } from "./ui.js";

let transactionUnsubscribe = null;

export function initAppForUser(userId) {
  if (!userId) return;

  initCategoryForm();
  initTransactionForm(userId);
  initTransactionDeletion(userId);

  loadCategories();

  if (transactionUnsubscribe) transactionUnsubscribe();
  transactionUnsubscribe = setupTransactionListener(userId);
}

export function cleanupListeners() {
  if (transactionUnsubscribe) {
    transactionUnsubscribe();
    transactionUnsubscribe = null;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initAuth();
  initChartFilters();
});
