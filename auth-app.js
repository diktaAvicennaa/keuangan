import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  deleteDoc,
  query,
  serverTimestamp,
  setDoc,
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
const authForm = document.getElementById("auth-form");
const emailInput = document.getElementById("auth-email");
const passwordInput = document.getElementById("auth-password");
const loginBtn = document.getElementById("login-btn");
const registerBtn = document.getElementById("register-btn");
const logoutBtn = document.getElementById("logout-btn");
const appContent = document.querySelector(".max-w-7xl");

let currentUser = null;

onAuthStateChanged(auth, (user) => {
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

authForm.onsubmit = async (e) => {
  e.preventDefault();
  try {
    await signInWithEmailAndPassword(
      auth,
      emailInput.value,
      passwordInput.value
    );
  } catch (err) {
    alert("Login gagal: " + err.message);
  }
};
registerBtn.onclick = async () => {
  try {
    await createUserWithEmailAndPassword(
      auth,
      emailInput.value,
      passwordInput.value
    );
    alert("Registrasi berhasil!");
  } catch (err) {
    alert("Registrasi gagal: " + err.message);
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
