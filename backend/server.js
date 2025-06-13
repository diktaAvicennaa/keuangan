const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
require("dotenv").config();

const app = express();
// Render akan menyediakan port, atau 3001 untuk pengembangan lokal.
const PORT = process.env.PORT || 3001;

// --- Konfigurasi Middleware ---
// Mengizinkan permintaan dari domain frontend Anda.
app.use(cors());
// Mem-parsing body request JSON.
app.use(express.json());

// --- Konfigurasi Database PostgreSQL ---
// Render akan menyediakan DATABASE_URL secara otomatis jika Anda menautkan service-nya.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Fungsi untuk membuat tabel jika belum ada
const initializeDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        keterangan VARCHAR(255) NOT NULL,
        jumlah NUMERIC(15, 2) NOT NULL,
        tipe VARCHAR(50) NOT NULL,
        kategori VARCHAR(50) NOT NULL,
        createdAt TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log(
      'Database initialized successfully. "transactions" table is ready.'
    );
  } catch (err) {
    console.error("Error initializing database:", err);
  }
};

// --- API Endpoints ---

// Endpoint untuk mendapatkan semua transaksi
app.get("/api/transactions", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM transactions ORDER BY createdAt DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint untuk menambahkan transaksi baru
app.post("/api/transactions", async (req, res) => {
  const { keterangan, jumlah, tipe, kategori } = req.body;

  // Validasi sederhana
  if (!keterangan || !jumlah || !tipe || !kategori) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO transactions (keterangan, jumlah, tipe, kategori) VALUES ($1, $2, $3, $4) RETURNING *",
      [keterangan, jumlah, tipe, kategori]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint untuk menghapus transaksi
app.delete("/api/transactions/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM transactions WHERE id = $1", [
      id,
    ]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.status(204).send(); // 204 No Content, artinya berhasil tapi tidak ada data yang dikembalikan
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Menjalankan server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  initializeDatabase();
});
