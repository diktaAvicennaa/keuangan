export const DOM = {
  authScreen: document.getElementById("auth-screen"),
  appContainer: document.getElementById("app-container"),
  loadingOverlay: document.getElementById("loading-overlay"),
  googleBtn: document.getElementById("login-btn"),
  logoutBtn: document.getElementById("logout-btn"),
  userIdDisplay: document.getElementById("user-id-display"),
  totalPendapatanEl: document.getElementById("total-pendapatan"),
  totalPengeluaranEl: document.getElementById("total-pengeluaran"),
  saldoAkhirEl: document.getElementById("saldo-akhir"),
  addCategoryForm: document.getElementById("add-category-form"),
  newCategoryInput: document.getElementById("new-category"),
  categoryList: document.getElementById("category-list"),
  transactionForm: document.getElementById("transaction-form"),
  keteranganInput: document.getElementById("keterangan"),
  jumlahInput: document.getElementById("jumlah"),
  tipeInput: document.getElementById("tipe"),
  kategoriInput: document.getElementById("kategori"),
  transactionListContainer: document.getElementById(
    "transaction-list-container"
  ),
  flowChartCanvas: document.getElementById("flow-chart"),
  chartFilterButtons: document.getElementById("chart-filter-buttons"),
};

// --- Variabel State UI ---
let flowChart = null;
let currentFilterRange = "all";
let allTransactionsCache = [];

// --- Fungsi Format ---
export function formatRupiah(angka) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
}

// --- Fungsi Tampilan Utama ---
export function showLoginState(user) {
  DOM.loadingOverlay.style.display = "none";
  if (user) {
    DOM.authScreen.style.display = "none";
    DOM.appContainer.style.display = "block";
  } else {
    // Tampilkan auth screen sebagai flex untuk centering
    DOM.authScreen.style.display = "flex";
    DOM.appContainer.style.display = "none";
  }
}

export function updateUserInfo(user) {
  if (user) {
    DOM.userIdDisplay.innerHTML = `ID Pengguna: <span class="font-semibold">${user.uid}</span>`;
  } else {
    DOM.userIdDisplay.innerHTML = `ID Pengguna: <span class="font-semibold">tidak login</span>`;
  }
}

// --- Fungsi Filter ---
function filterTransactionsByDate(transactions, range) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (range === "all") return transactions;

  return transactions.filter((t) => {
    if (!t.createdAt || typeof t.createdAt.toDate !== "function") return false;
    const date = t.createdAt.toDate();

    switch (range) {
      case "day":
        return (
          date.getFullYear() === today.getFullYear() &&
          date.getMonth() === today.getMonth() &&
          date.getDate() === today.getDate()
        );
      case "week":
        const startOfWeek = new Date(today);
        // Atur ke hari Senin minggu ini
        startOfWeek.setDate(
          today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)
        );
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        return date >= startOfWeek && date < endOfWeek;
      case "month":
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      default:
        return true;
    }
  });
}

// --- Fungsi Render ---
export function renderCategories(categories) {
  const defaultCategories = [
    "Gaji",
    "Makan",
    "Transportasi",
    "Hiburan",
    "Lainnya",
  ];
  const allCategories = [...new Set([...defaultCategories, ...categories])];

  DOM.kategoriInput.innerHTML = allCategories
    .map((cat) => `<option value="${cat}">${cat}</option>`)
    .join("");
  DOM.categoryList.innerHTML = categories
    .map(
      (cat) =>
        `<span class="bg-gray-200 text-gray-700 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">${cat}</span>`
    )
    .join("");
}

export function renderTransactionList(transactions) {
  DOM.transactionListContainer.innerHTML = "";
  if (transactions.length === 0) {
    DOM.transactionListContainer.innerHTML = `<p class="text-center text-gray-500 py-8">Belum ada transaksi pada periode ini.</p>`;
    return;
  }

  transactions.forEach((t) => {
    const isPendapatan = t.tipe === "pendapatan";
    const item = document.createElement("div");
    item.className =
      "table-row-item flex items-center justify-between p-3 hover:bg-gray-50";
    item.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="p-2 rounded-full ${
              isPendapatan ? "bg-green-100" : "bg-red-100"
            }">
                <ion-icon name="${
                  isPendapatan ? "arrow-up" : "arrow-down"
                }" class="text-xl ${
      isPendapatan ? "text-green-600" : "text-red-600"
    }"></ion-icon>
            </div>
            <div>
                <p class="font-semibold text-gray-800">${t.keterangan}</p>
                <p class="text-sm text-gray-500">${t.kategori}</p>
            </div>
        </div>
        <div class="text-right">
            <p class="font-bold ${
              isPendapatan ? "text-green-600" : "text-red-600"
            }">${formatRupiah(t.jumlah)}</p>
            <button data-id="${
              t.id
            }" class="remove-btn text-xs text-gray-400 hover:text-red-500">Hapus</button>
        </div>
    `;
    DOM.transactionListContainer.appendChild(item);
  });
}

export function updateSummary(transactions) {
  const pendapatan = transactions
    .filter((t) => t.tipe === "pendapatan")
    .reduce((sum, t) => sum + t.jumlah, 0);
  const pengeluaran = transactions
    .filter((t) => t.tipe === "pengeluaran")
    .reduce((sum, t) => sum + t.jumlah, 0);
  DOM.totalPendapatanEl.innerText = formatRupiah(pendapatan);
  DOM.totalPengeluaranEl.innerText = formatRupiah(pengeluaran);
  DOM.saldoAkhirEl.innerText = formatRupiah(pendapatan - pengeluaran);
}

export function updateFlowChart(transactions) {
  if (!DOM.flowChartCanvas) return;

  const totalPendapatan = transactions
    .filter((t) => t.tipe === "pendapatan")
    .reduce((sum, t) => sum + t.jumlah, 0);
  const totalPengeluaran = transactions
    .filter((t) => t.tipe === "pengeluaran")
    .reduce((sum, t) => sum + t.jumlah, 0);

  const data = {
    labels: ["Pendapatan", "Pengeluaran"],
    datasets: [
      {
        data: [totalPendapatan, totalPengeluaran],
        backgroundColor: ["rgba(16, 185, 129, 0.8)", "rgba(239, 68, 68, 0.8)"],
        borderColor: ["#ffffff"],
        borderWidth: 2,
      },
    ],
  };

  if (flowChart) {
    flowChart.data = data;
    flowChart.update();
  } else {
    flowChart = new Chart(DOM.flowChartCanvas, {
      type: "doughnut",
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => formatRupiah(context.parsed),
            },
          },
        },
      },
    });
  }
}

// --- Fungsi Inisialisasi & Update Terpusat ---
export function initChartFilters() {
  DOM.chartFilterButtons.addEventListener("click", (e) => {
    if (e.target.matches(".chart-filter-btn")) {
      currentFilterRange = e.target.dataset.range;
      DOM.chartFilterButtons
        .querySelector(".active")
        ?.classList.remove("active");
      e.target.classList.add("active");
      refreshAllViews(); // Panggil tanpa argumen untuk menggunakan cache
    }
  });
}

export function refreshAllViews(newTransactions) {
  if (newTransactions) {
    allTransactionsCache = newTransactions;
  }
  const filtered = filterTransactionsByDate(
    allTransactionsCache,
    currentFilterRange
  );
  renderTransactionList(filtered);
  updateSummary(filtered);
  updateFlowChart(filtered);
}
