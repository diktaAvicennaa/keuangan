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
  onSnapshot,
  deleteDoc,
  doc,
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
const userIdDisplay = document.getElementById("user-id-display");

let currentUser = null;

onAuthStateChanged(auth, (user) => {
  if (loadingOverlay) loadingOverlay.style.display = "none";
  if (user) {
    currentUser = user;
    authScreen.style.display = "none";
    appContent.style.display = "";
    logoutBtn.classList.remove("hidden");
    if (userIdDisplay) {
      userIdDisplay.innerHTML = `ID Pengguna Anda: <span class="font-semibold">${user.uid}</span>`;
    }
    loadCategories();
    setupTransactionListener();
  } else {
    currentUser = null;
    authScreen.style.display = "";
    appContent.style.display = "none";
    logoutBtn.classList.add("hidden");
    if (userIdDisplay) {
      userIdDisplay.innerHTML = `ID Pengguna Anda: <span class=\"font-semibold\">memuat...</span>`;
    }
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

// --- FORM TRANSAKSI ---
const transactionForm = document.getElementById("transaction-form");
const keteranganInput = document.getElementById("keterangan");
const jumlahInput = document.getElementById("jumlah");
const tipeInput = document.getElementById("tipe");
// kategoriInput sudah ada

if (transactionForm) {
  transactionForm.onsubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Anda harus login terlebih dahulu.");
      return;
    }
    const keterangan = keteranganInput.value.trim();
    const jumlah = parseFloat(jumlahInput.value);
    const tipe = tipeInput.value;
    const kategori = kategoriInput.value;
    if (!keterangan || isNaN(jumlah) || !tipe || !kategori) {
      alert("Mohon lengkapi semua field.");
      return;
    }
    try {
      const transaksiCol = collection(
        db,
        `users/${currentUser.uid}/transactions`
      );
      await addDoc(transaksiCol, {
        keterangan,
        jumlah,
        tipe,
        kategori,
        createdAt: new Date(),
      });
      transactionForm.reset();
      alert("Transaksi berhasil ditambahkan!");
    } catch (err) {
      alert("Gagal menambah transaksi: " + err.message);
    }
  };
}

// --- DAFTAR TRANSAKSI REALTIME ---
const transactionList = document.getElementById("transaction-list");
const totalPendapatanEl = document.getElementById("total-pendapatan");
const totalPengeluaranEl = document.getElementById("total-pengeluaran");
const saldoAkhirEl = document.getElementById("saldo-akhir");

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

function formatRupiah(angka) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
}

// --- CHART.JS GRAFIK PENGELUARAN ---
let expenseChart = null;
const expenseChartCanvas = document.getElementById("expense-chart");

function updateExpenseChart(transactions) {
  if (!expenseChartCanvas) return;
  // Filter hanya pengeluaran
  const pengeluaran = transactions.filter((t) => t.tipe === "pengeluaran");
  // Hitung total per kategori
  const kategoriTotals = {};
  pengeluaran.forEach((t) => {
    kategoriTotals[t.kategori] = (kategoriTotals[t.kategori] || 0) + t.jumlah;
  });
  const labels = Object.keys(kategoriTotals);
  const data = Object.values(kategoriTotals);
  // Warna default
  const colors = [
    "#f87171",
    "#fbbf24",
    "#34d399",
    "#60a5fa",
    "#a78bfa",
    "#f472b6",
    "#facc15",
    "#38bdf8",
    "#818cf8",
    "#f472b6",
    "#fcd34d",
    "#4ade80",
    "#fca5a5",
    "#c084fc",
    "#f9a8d4",
    "#fbbf24",
  ];
  if (expenseChart) {
    expenseChart.data.labels = labels;
    expenseChart.data.datasets[0].data = data;
    expenseChart.update();
  } else {
    expenseChart = new Chart(expenseChartCanvas, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: colors,
          },
        ],
      },
      options: {
        plugins: {
          legend: { position: "bottom" },
          title: { display: false },
        },
      },
    });
  }
}

function setupTransactionListener() {
  if (!currentUser) return;
  const transaksiCol = collection(db, `users/${currentUser.uid}/transactions`);
  onSnapshot(transaksiCol, (querySnapshot) => {
    const transactions = [];
    querySnapshot.forEach((doc) => {
      transactions.push({ id: doc.id, ...doc.data() });
    });
    // Urutkan terbaru di atas
    transactions.sort(
      (a, b) =>
        (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
    );
    renderTransactionList(transactions);
    updateSummary(transactions);
    updateExpenseChart(transactions); // update chart realtime
    // TODO: update chart jika ada
  });
}

// Hapus transaksi
if (transactionList) {
  transactionList.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-btn")) {
      const id = e.target.dataset.id;
      if (confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
        const transaksiCol = collection(
          db,
          `users/${currentUser.uid}/transactions`
        );
        const docRef = doc(transaksiCol, id);
        deleteDoc(docRef);
      }
    }
  });
}

// Global error handler
window.addEventListener("error", function (e) {
  document.body.innerHTML = `<div style='padding:2rem;color:red;font-family:monospace;'>JS Error: ${e.message}<br><br><pre>${e.filename}: ${e.lineno}</pre></div>`;
  throw e;
});
