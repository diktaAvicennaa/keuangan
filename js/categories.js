import {
  collection,
  addDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { DOM, renderCategories } from "./ui.js";
import { currentUser } from "./auth.js";

export async function loadCategories() {
  if (!currentUser) return;
  const catCol = collection(db, `users/${currentUser.uid}/categories`);
  const snapshot = await getDocs(catCol);
  const categories = snapshot.docs.map((doc) => doc.data().name);
  renderCategories(categories);
}

export function initCategoryForm() {
  DOM.addCategoryForm.onsubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const catName = DOM.newCategoryInput.value.trim();
    if (!catName) return;
    try {
      const catCol = collection(db, `users/${currentUser.uid}/categories`);
      await addDoc(catCol, { name: catName });
      DOM.newCategoryInput.value = "";
      loadCategories(); // Muat ulang kategori setelah menambah
    } catch (error) {
      console.error("Gagal menambah kategori:", error);
      alert("Gagal menambah kategori.");
    }
  };
}
