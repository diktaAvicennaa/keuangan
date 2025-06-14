import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBAdKlekDsHUe1n8BL9rjxZFZjmbAh9_ro",
  authDomain: "keuangan-saya-620fd.firebaseapp.com",
  projectId: "keuangan-saya-620fd",
  storageBucket: "keuangan-saya-620fd.appspot.com",
  messagingSenderId: "807499290917",
  appId: "1:807499290917:web:3232b5b35235f6fcb6e2cc",
  measurementId: "G-SL1ER5MLNL",
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- AUTH ---
const authScreen = document.getElementById("auth-screen");
const googleBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const appContent = document.querySelector(".max-w-7xl");
const loadingOverlay = document.getElementById("loading-overlay");

onAuthStateChanged(auth, (user) => {
  if (loadingOverlay) loadingOverlay.style.display = "none";
  if (user) {
    currentUser = user;
    authScreen.style.display = "none";
    appContent.style.display = "";
    logoutBtn.classList.remove("hidden");
    loadCategories();
  } else {
    currentUser = null;
    authScreen.style.display = "";
    appContent.style.display = "none";
    logoutBtn.classList.add("hidden");
  }
});

googleBtn.onclick = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    alert("Login Google gagal: " + err.message);
  }
};
logoutBtn.onclick = () => signOut(auth);

// --- KATEGORI DINAMIS ---
const addCategoryForm = document.getElementById("add-category-form");
const newCategoryInput = document.getElementById("new-category");
const kategoriInput = document.getElementById("kategori");
const categoryList = document.getElementById("category-list");

async function loadCategories() {
  if (!currentUser) return;
  const catCol = collection(db, `users/${currentUser.uid}/categories`);
  const snapshot = await getDocs(catCol);
  const categories = snapshot.docs.map((doc) => doc.data().name);
  // Update dropdown kategori
  kategoriInput.innerHTML =
    categories.map((cat) => `<option value="${cat}">${cat}</option>`).join("") +
    `<option value="Lainnya">Lainnya</option>`;
  // List kategori
  categoryList.innerHTML = categories
    .map(
      (cat) =>
        `<span class="inline-block bg-gray-200 rounded px-2 py-1 mr-1 mb-1">${cat}</span>`
    )
    .join("");
}

addCategoryForm.onsubmit = async (e) => {
  e.preventDefault();
  if (!currentUser) return;
  const catName = newCategoryInput.value.trim();
  if (!catName) return;
  const catCol = collection(db, `users/${currentUser.uid}/categories`);
  await addDoc(catCol, { name: catName });
  newCategoryInput.value = "";
  loadCategories();
};
