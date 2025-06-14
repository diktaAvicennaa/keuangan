// Import fungsi-fungsi yang diperlukan dari Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  query,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Variabel global
let db, auth;
let currentUser = null;
let transactionsCollection;
let unsubscribe;

// Elemen DOM
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

// Chart.js initialization
const ctx = document.getElementById("expense-chart").getContext("2d");
let expenseChart = new Chart(ctx, {
  type: "doughnut",
  data: {
    labels: [],
    datasets: [
      {
        label: "Pengeluaran per Kategori",
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
        borderColor: "#ffffff",
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
        callbacks: {
          label: (context) => {
            let label = context.label || "";
            if (label) label += ": ";
            if (context.parsed !== null) {
              const total = context.chart.data.datasets[0].data.reduce(
                (a, b) => a + b,
                0
              );
              const percentage =
                total > 0
                  ? ((context.parsed / total) * 100).toFixed(2) + "%"
                  : "0%";
              label += formatRupiah(context.parsed) + ` (${percentage})`;
            }
            return label;
          },
        },
      },
    },
  },
});

// --- FUNGSI UTAMA & AUTENTIKASI ---

// Fungsi inisialisasi Firebase
function initializeFirebase() {
  try {
    const firebaseConfig = {
      apiKey: "AIzaSyBAdKlekDsHUe1n8BL9rjxZFZjmbAh9_ro",
      authDomain: "keuangan-saya-620fd.firebaseapp.com",
      projectId: "keuangan-saya-620fd",
      storageBucket: "keuangan-saya-620fd.appspot.com",
      messagingSenderId: "807499290917",
      appId: "1:807499290917:web:e0c6f20d53f3c9c4b6e2cc",
    };

    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);

    // Listener utama untuk status autentikasi
    onAuthStateChanged(auth, handleAuthStateChange);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    loadingOverlay.innerHTML =
      '<p class="text-white text-lg text-center">Gagal inisialisasi Firebase.<br>Pastikan Anda sudah mengisi konfigurasi dengan benar.</p>';
  }
}

// Menangani perubahan status login/logout
function handleAuthStateChange(user) {
  if (user) {
    // ---- Pengguna berhasil login ----
    currentUser = user;

    // Tampilkan konten aplikasi, sembunyikan layar login
    loginScreen.style.display = "none";
    appContent.style.display = "grid";

    // Tampilkan informasi pengguna
    userInfo.innerHTML = `
            <img src="${user.photoURL}" alt="Foto Profil" class="w-10 h-10 rounded-full mr-3 border-2 border-gray-200">
            <div>
                <p class="font-semibold text-gray-800 leading-tight">${user.displayName}</p>
                <p class="text-xs text-gray-500">${user.email}</p>
            </div>
        `;

    // Mulai mengambil data keuangan pengguna
    setupDataListener();
  } else {
    // ---- Pengguna logout atau belum login ----
    currentUser = null;

    // Tampilkan layar login, sembunyikan konten aplikasi
    loginScreen.style.display = "flex";
    appContent.style.display = "none";
    loadingOverlay.style.display = "none";

    // Bersihkan UI
    userInfo.innerHTML = "";
    transactionList.innerHTML =
      '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">Silakan login untuk melihat data.</td></tr>';
    updateSummary([]);
    updateChart([]);
  }
}

// Fungsi untuk login dengan Google
const signInWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider).catch((error) => {
    console.error("Google sign-in error", error);
    alert("Gagal login dengan Google. Silakan coba lagi.");
  });
};

// Fungsi untuk logout
const logout = () => {
  signOut(auth).catch((error) => {
    console.error("Sign out error", error);
    alert("Gagal logout.");
  });
};

// --- FUNGSI DATABASE & OPERASI DATA ---

// Setup listener data real-time dari Firestore
function setupDataListener() {
  if (!currentUser) return;
  if (unsubscribe) unsubscribe();

  const collectionPath = `users/${currentUser.uid}/transactions`;
  transactionsCollection = collection(db, collectionPath);
  const q = query(transactionsCollection);

  unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const transactions = [];
      querySnapshot.forEach((doc) => {
        transactions.push({ id: doc.id, ...doc.data() });
      });
      transactions.sort(
        (a, b) =>
          (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)
      );
      renderUI(transactions);
      loadingOverlay.style.display = "none";
    },
    (error) => {
      console.error("Error listening to data:", error);
      loadingOverlay.innerHTML =
        '<p class="text-white text-lg">Gagal memuat data.</p>';
    }
  );
}

// Menambah transaksi baru
async function addTransaction(e) {
  e.preventDefault();
  if (
    keteranganInput.value.trim() === "" ||
    jumlahInput.value.trim() === "" ||
    !currentUser
  ) {
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

// Menghapus transaksi
async function removeTransaction(id) {
  if (!currentUser) return;
  if (confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
    try {
      const docRef = doc(transactionsCollection, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error removing document: ", error);
      alert("Gagal menghapus transaksi.");
    }
  }
}

// --- FUNGSI PEMBANTU (RENDERING UI) ---

// Merender ulang seluruh UI dengan data baru
function renderUI(transactions) {
  renderTransactionList(transactions);
  updateSummary(transactions);
  updateChart(transactions);
}

// Merender daftar transaksi di tabel
function renderTransactionList(transactions) {
  transactionList.innerHTML = "";
  if (transactions.length === 0) {
    transactionList.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">Belum ada transaksi.</td></tr>`;
    return;
  }
  transactions.forEach((transaction) => {
    const item = document.createElement("tr");
    const isPendapatan = transaction.tipe === "pendapatan";
    item.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm font-medium text-gray-900">${
              transaction.keterangan
            }</div></td>
            <td class="px-6 py-4 whitespace-nowrap"><span class="text-sm font-semibold ${
              isPendapatan ? "text-green-600" : "text-red-600"
            }">${isPendapatan ? "+" : "-"} ${formatRupiah(
      transaction.jumlah
    )}</span></td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              isPendapatan
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }">${transaction.kategori}</span></td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium"><button onclick="window.removeTransaction('${
              transaction.id
            }')" class="text-red-500 hover:text-red-700">Hapus</button></td>
        `;
    transactionList.appendChild(item);
  });
}

// Memperbarui ringkasan (pendapatan, pengeluaran, saldo)
function updateSummary(transactions) {
  const pendapatan = transactions
    .filter((t) => t.tipe === "pendapatan")
    .reduce((acc, t) => acc + t.jumlah, 0);
  const pengeluaran = transactions
    .filter((t) => t.tipe === "pengeluaran")
    .reduce((acc, t) => acc + t.jumlah, 0);
  const saldo = pendapatan - pengeluaran;
  totalPendapatanEl.innerText = formatRupiah(pendapatan);
  totalPengeluaranEl.innerText = formatRupiah(pengeluaran);
  saldoAkhirEl.innerText = formatRupiah(saldo);
}

// Memperbarui grafik
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

// Memformat angka menjadi Rupiah
function formatRupiah(angka) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
}

// --- EVENT LISTENERS ---

// Membuat fungsi global agar bisa dipanggil dari HTML (onclick)
window.removeTransaction = removeTransaction;

// Menjalankan inisialisasi saat halaman dimuat
document.addEventListener("DOMContentLoaded", initializeFirebase);
// Listener untuk form
form.addEventListener("submit", addTransaction);
// Listener untuk tombol login dan logout
loginButton.addEventListener("click", signInWithGoogle);
logoutButton.addEventListener("click", logout);
