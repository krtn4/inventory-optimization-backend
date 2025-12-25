const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://your-frontend.vercel.app"
  ]
}));

app.use(express.json());

/* 🔴 Routes */
app.use("/api/products", require("./routes/products"));
app.use("/api/inventory", require("./routes/inventory"));

/* 🔴 Start server (ONLY ONCE) */
app.listen(PORT, () => {
  console.log(`Inventory API listening on port ${PORT}`);
});

/* 🔴 DB connection test */
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("DB connection failed", err);
  } else {
    console.log("DB connected at:", res.rows[0].now);
  }
});
