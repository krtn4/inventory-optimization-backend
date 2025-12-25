import express from "express";
import cors from "cors";
import productsRoutes from "./routes/products.js";
// import inventoryRoutes from "./routes/inventory.js"; // optional later

const app = express();

/**
 * 🔐 CORS CONFIG
 * Allows Vercel frontend to call Render backend
 */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://inventory-optimization-frontend.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

/**
 * Routes
 */
app.use("/api/products", productsRoutes);
// app.use("/api/inventory", inventoryRoutes); // optional later

/**
 * Health check (IMPORTANT)
 */
app.get("/", (req, res) => {
  res.send("Inventory Backend is running 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Inventory API listening on port ${PORT}`);
});
