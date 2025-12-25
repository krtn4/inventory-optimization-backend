const express = require("express");
const router = express.Router();
const pool = require("../db");

// 🔹 Predict stockout date
router.get("/stockout/:businessId/:productId", async (req, res) => {
  const { businessId, productId } = req.params;

  try {
    const result = await pool.query(
      "SELECT fn_predict_stockout_date($1, $2) AS stockout_date",
      [businessId, productId]
    );

    res.json({
      product_id: productId,
      stockout_date: result.rows[0].stockout_date,
    });
  } catch (err) {
    console.error("Stockout API error:", err);
    res.status(500).json({ error: "Failed to predict stockout date" });
  }
});



router.post("/update-stock", async (req, res) => {
  const { product_id, quantity_change } = req.body;
  const business_id = 1; // for now (single business)

  try {
    await pool.query("BEGIN");

    // 1️⃣ If it's a sale → record transaction
    if (quantity_change < 0) {
      await pool.query(
        `
        INSERT INTO transactions
          (business_id, product_id, quantity, total_amount, transaction_date)
        SELECT
          $1,
          $2,
          ABS($3),
          ABS($3) * unit_price,
          CURRENT_DATE
        FROM products
        WHERE product_id = $2
        `,
        [business_id, product_id, quantity_change]
      );
    }

    // 2️⃣ Update inventory
    await pool.query(
      "SELECT fn_update_inventory($1, $2)",
      [product_id, quantity_change]
    );

    // 3️⃣ Update daily demand
    await pool.query(
      "SELECT fn_update_daily_demand($1)",
      [business_id]
    );

    await pool.query("COMMIT");

    res.json({ message: "Stock updated successfully" });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Stock update failed" });
  }
});



// 🔹 Daily demand trend for a product
router.get("/demand/:businessId/:productId", async (req, res) => {
  const { businessId, productId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT 
        date,
        total_quantity
      FROM daily_demand
      WHERE business_id = $1
        AND product_id = $2
      ORDER BY date
      `,
      [businessId, productId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Demand trend error:", err);
    res.status(500).json({ error: "Failed to fetch demand trend" });
  }
});


// 🔹 Total demand by product (for bar chart)
router.get("/demand-summary/:businessId", async (req, res) => {
  const { businessId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT 
        p.product_name,
        SUM(d.total_quantity) AS total_demand
      FROM daily_demand d
      JOIN products p ON d.product_id = p.product_id
      WHERE d.business_id = $1
      GROUP BY p.product_name
      ORDER BY total_demand DESC
      `,
      [businessId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Demand summary error:", err);
    res.status(500).json({ error: "Failed to fetch demand summary" });
  }
});




module.exports = router;
