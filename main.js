// --- Firebase SDK Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  query,
  serverTimestamp,
  orderBy,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// --- PENTING: Ganti dengan konfigurasi proyek Firebase Anda ---
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXX",
  authDomain: "nama-proyek-anda.firebaseapp.com",
  projectId: "nama-proyek-anda",
  storageBucket: "nama-proyek-anda.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:xxxxxxxxxxxxxx",
};

// --- Inisialisasi Firebase & Layanannya ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Variabel Global ---
let currentUser = null;
let transactionsCollection;
let unsubscribe; // Untuk listener data

// --- Elemen DOM ---
const loginScreen = document.getElementById("login-screen");
const appContent = document.getElementById("app-content");
const loginButton = document.getElementById("login-button");
const logoutButton = document.getElementById("logout-button");
const userInfo = document.getElementById("user-info");
const loadingOverlay = document.getElementById("loading-overlay");
const form = document.getElementById("transaction-form");
const keteranganInput = document.getElementById("keterangan");
const jumlahInput = document.getElementById("jumlah");
const tipeInput = document.getElementById("tipe");
const kategoriInput = document.getElementById("kategori");
const transactionList = document.getElementById("transaction-list");
const totalPendapatanEl = document.getElementById("total-pendapatan");
const totalPengeluaranEl = document.getElementById("total-pengeluaran");
const saldoAkhirEl = document.getElementById("saldo-akhir");

// --- Inisialisasi Chart.js ---
const ctx = document.getElementById("expense-chart").getContext("2d");
const expenseChart = new Chart(ctx, {
  type: "doughnut",
  data: {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          "#ef4444",
          "#f97316",
          "#eab308",
          "#84cc16",
          "#22c55e",
          "#14b8a6",
          "#06b6d4",
          "#3b82f6",
          "#8b5cf6",
          "#d946ef",
        ],
        borderWidth: 2,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "right" },
      tooltip: {
        callbacks: { label: (c) => `${c.label}: ${formatRupiah(c.parsed)}` },
      },
    },
  },
});

// --- FUNGSI AUTENTIKASI ---

// Listener utama untuk status login
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Pengguna berhasil login
    currentUser = user;
    loginScreen.classList.add("hidden");
    appContent.classList.remove("hidden");
    displayUserInfo(user);
    setupDataListener(); // Mulai mengambil data setelah login
  } else {
    // Pengguna logout atau belum login
    currentUser = null;
    loginScreen.classList.remove("hidden");
    appContent.classList.add("hidden");
    if (unsubscribe) unsubscribe(); // Hentikan listener data
    clearUI();
  }
  loadingOverlay.classList.add("hidden");
});

const signInWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider).catch((error) =>
    console.error("Google sign-in error", error)
  );
};

const logout = () => {
  signOut(auth).catch((error) => console.error("Sign out error", error));
};

// --- FUNGSI DATABASE (FIRESTORE) ---

function setupDataListener() {
  if (!currentUser) return;
  // Membuat path koleksi yang unik untuk setiap pengguna
  const collectionPath = `users/${currentUser.uid}/transactions`;
  transactionsCollection = collection(db, collectionPath);
  const q = query(transactionsCollection, orderBy("createdAt", "desc"));

  unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const transactions = [];
      querySnapshot.forEach((doc) => {
        transactions.push({ id: doc.id, ...doc.data() });
      });
      renderUI(transactions);
    },
    (error) => {
      console.error("Error listening to data:", error);
      alert("Gagal memuat data dari Firestore.");
    }
  );
}

async function addTransaction(e) {
  e.preventDefault();
  if (!keteranganInput.value.trim() || !jumlahInput.value) {
    alert("Mohon isi semua field.");
    return;
  }
  try {
    await addDoc(transactionsCollection, {
      keterangan: keteranganInput.value,
      jumlah: +jumlahInput.value,
      tipe: tipeInput.value,
      kategori: kategoriInput.value,
      createdAt: serverTimestamp(),
    });
    form.reset();
  } catch (error) {
    console.error("Error adding document: ", error);
    alert("Gagal menambahkan transaksi.");
  }
}

async function removeTransaction(id) {
  if (!confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) return;
  try {
    const docRef = doc(transactionsCollection, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error removing document: ", error);
    alert("Gagal menghapus transaksi.");
  }
}

// --- FUNGSI RENDER UI ---

function displayUserInfo(user) {
  userInfo.innerHTML = `
        <img src="${user.photoURL}" alt="Foto Profil" class="w-10 h-10 rounded-full mr-3 border-2 border-gray-200">
        <div>
            <p class="font-semibold text-gray-800 leading-tight">${user.displayName}</p>
            <p class="text-xs text-gray-500">${user.email}</p>
        </div>`;
}

function clearUI() {
  userInfo.innerHTML = "";
  transactionList.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">Silakan login untuk melihat data.</td></tr>`;
  updateSummary([]);
  updateChart([]);
}

function renderUI(transactions) {
  renderTransactionList(transactions);
  updateSummary(transactions);
  updateChart(transactions);
}

function renderTransactionList(transactions) {
  transactionList.innerHTML = "";
  if (transactions.length === 0) {
    transactionList.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">Belum ada transaksi.</td></tr>`;
    return;
  }
  transactions.forEach((t) => {
    const item = document.createElement("tr");
    const isPendapatan = t.tipe === "pendapatan";
    item.innerHTML = `
            <td class="px-6 py-4"><div class="text-sm font-medium text-gray-900">${
              t.keterangan
            }</div></td>
            <td class="px-6 py-4"><span class="text-sm font-semibold ${
              isPendapatan ? "text-green-600" : "text-red-600"
            }">${isPendapatan ? "+" : "-"} ${formatRupiah(t.jumlah)}</span></td>
            <td class="px-6 py-4"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              isPendapatan
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }">${t.kategori}</span></td>
            <td class="px-6 py-4"><button data-id="${
              t.id
            }" class="remove-btn text-red-500 hover:text-red-700">Hapus</button></td>
        `;
    transactionList.appendChild(item);
  });
}

function updateSummary(transactions) {
  const pendapatan = transactions
    .filter((t) => t.tipe === "pendapatan")
    .reduce((acc, t) => acc + t.jumlah, 0);
  const pengeluaran = transactions
    .filter((t) => t.tipe === "pengeluaran")
    .reduce((acc, t) => acc + t.jumlah, 0);
  totalPendapatanEl.innerText = formatRupiah(pendapatan);
  totalPengeluaranEl.innerText = formatRupiah(pengeluaran);
  saldoAkhirEl.innerText = formatRupiah(pendapatan - pengeluaran);
}

function updateChart(transactions) {
  const expenseByCategory = transactions
    .filter((t) => t.tipe === "pengeluaran")
    .reduce((acc, t) => {
      acc[t.kategori] = (acc[t.kategori] || 0) + t.jumlah;
      return acc;
    }, {});
  expenseChart.data.labels = Object.keys(expenseByCategory);
  expenseChart.data.datasets[0].data = Object.values(expenseByCategory);
  expenseChart.update();
}

function formatRupiah(angka) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
}

// --- EVENT LISTENERS ---
loginButton.addEventListener("click", signInWithGoogle);
logoutButton.addEventListener("click", logout);
form.addEventListener("submit", addTransaction);

// Event listener untuk tombol hapus (menggunakan event delegation)
transactionList.addEventListener("click", (e) => {
  if (e.target.classList.contains("remove-btn")) {
    const id = e.target.dataset.id;
    removeTransaction(id);
  }
});
