import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const firebaseConfig = {
  // Ganti dengan kredensial Firebase Anda
  apiKey: "AIzaSyBAdKlekDsHUe1n8BL9rjxZFZjmbAh9_ro",
  authDomain: "keuangan-saya-620fd.firebaseapp.com",
  projectId: "keuangan-saya-620fd",
  storageBucket: "keuangan-saya-620fd.appspot.com",
  messagingSenderId: "807499290917",
  appId: "1:807499290917:web:3232b5b35235f6fcb6e2cc",
  measurementId: "G-SL1ER5MLNL",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
