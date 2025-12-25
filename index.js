const express = require("express");
const cors = require("cors");
const productsRoutes = require("./routes/products");

const app = express();

// ✅ Allow Vercel frontend
app.use(cors({
  origin: [
    "https://inventory-optimization-frontend.vercel.app",
    "http://localhost:5173"
  ]
}));

app.use(express.json());

// Routes
app.use("/api/products", productsRoutes);

// Health check (optional but recommended)
app.get("/", (req, res) => {
  res.send("Inventory Optimization API is running");
});

const PORT = process.env.PORT || 3000;
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
