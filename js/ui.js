export const DOM = {
  // Layar & Kontainer
  authScreen: document.getElementById("auth-screen"),
  appContainer: document.getElementById("app-container"),
  loadingOverlay: document.getElementById("loading-overlay"),

  // Tombol
  googleBtn: document.getElementById("login-btn"),
  logoutBtn: document.getElementById("logout-btn"),

  // Tampilan Info
  userIdDisplay: document.getElementById("user-id-display"),
  totalPendapatanEl: document.getElementById("total-pendapatan"),
  totalPengeluaranEl: document.getElementById("total-pengeluaran"),
  saldoAkhirEl: document.getElementById("saldo-akhir"),

  // Form Kategori
  addCategoryForm: document.getElementById("add-category-form"),
  newCategoryInput: document.getElementById("new-category"),
  categoryList: document.getElementById("category-list"),

  // Form Transaksi
  transactionForm: document.getElementById("transaction-form"),
  keteranganInput: document.getElementById("keterangan"),
  jumlahInput: document.getElementById("jumlah"),
  tipeInput: document.getElementById("tipe"),
  kategoriInput: document.getElementById("kategori"),
  transactionList: document.getElementById("transaction-list"),

  // Grafik
  expenseChartCanvas: document.getElementById("expense-chart"),
};

let expenseChart = null;

export function formatRupiah(angka) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
}

export function showLoginState(user) {
  DOM.loadingOverlay.style.display = "none";
  if (user) {
    DOM.authScreen.style.display = "none";
    DOM.appContainer.style.display = "block";
  } else {
    DOM.authScreen.style.display = "flex";
    DOM.appContainer.style.display = "none";
  }
}

export function updateUserInfo(user) {
  if (user) {
    DOM.userIdDisplay.innerHTML = `ID Pengguna Anda: <span class="font-semibold">${user.uid}</span>`;
  } else {
    DOM.userIdDisplay.innerHTML = `ID Pengguna Anda: <span class="font-semibold">tidak login</span>`;
  }
}

export function renderCategories(categories) {
  DOM.kategoriInput.innerHTML =
    categories.map((cat) => `<option value="${cat}">${cat}</option>`).join("") +
    `<option value="Lainnya">Lainnya</option>`;
  DOM.categoryList.innerHTML = categories
    .map(
      (cat) =>
        `<span class="inline-block bg-gray-200 rounded px-2 py-1 mr-1 mb-1">${cat}</span>`
    )
    .join("");
}

export function renderTransactionList(transactions) {
  DOM.transactionList.innerHTML = "";
  if (transactions.length === 0) {
    DOM.transactionList.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">Belum ada transaksi.</td></tr>`;
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
    DOM.transactionList.appendChild(item);
  });
}

export function updateSummary(transactions) {
  const pendapatan = transactions
    .filter((t) => t.tipe === "pendapatan")
    .reduce((acc, t) => acc + t.jumlah, 0);
  const pengeluaran = transactions
    .filter((t) => t.tipe === "pengeluaran")
    .reduce((acc, t) => acc + t.jumlah, 0);
  DOM.totalPendapatanEl.innerText = formatRupiah(pendapatan);
  DOM.totalPengeluaranEl.innerText = formatRupiah(pengeluaran);
  DOM.saldoAkhirEl.innerText = formatRupiah(pendapatan - pengeluaran);
}

export function updateExpenseChart(transactions) {
  if (!DOM.expenseChartCanvas) return;

  const pengeluaran = transactions.filter((t) => t.tipe === "pengeluaran");

  const kategoriTotals = {};
  pengeluaran.forEach((t) => {
    kategoriTotals[t.kategori] = (kategoriTotals[t.kategori] || 0) + t.jumlah;
  });

  const labels = Object.keys(kategoriTotals);
  const data = Object.values(kategoriTotals);
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
    expenseChart = new Chart(DOM.expenseChartCanvas, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [{ data: data, backgroundColor: colors }],
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
