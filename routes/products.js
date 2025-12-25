const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all products for a business
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.product_id,p.display_order,p.product_name,p.stock_keeping_unit,p.unit_price,i.current_stock,i.reorder_point
       FROM products p
       LEFT JOIN inventory i ON p.product_id = i.product_id
       ORDER BY p.display_order ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});


// CREATE product + inventory (WITH display_order)
router.post("/", async (req, res) => {
  try {
    const {
      business_id,
      product_name,
      stock_keeping_unit,
      unit_cost,
      unit_price,
    } = req.body;

    // 1️⃣ Get next display_order
    const { rows } = await pool.query(
      "SELECT COALESCE(MAX(display_order), 0) + 1 AS next_order FROM products"
    );

    const nextOrder = rows[0].next_order;

    // 2️⃣ Insert product with display_order
    const productResult = await pool.query(
      `
      INSERT INTO products
        (business_id, product_name, stock_keeping_unit, unit_cost, unit_price, display_order)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        business_id,
        product_name,
        stock_keeping_unit,
        unit_cost,
        unit_price,
        nextOrder,
      ]
    );

    const product = productResult.rows[0];

    // 3️⃣ Create inventory entry
    await pool.query(
      `
      INSERT INTO inventory (business_id, product_id, current_stock)
      VALUES ($1, $2, 0)
      `,
      [business_id, product.product_id]
    );

    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create product" });
  }
});


// DELETE product
router.delete("/:id", async (req, res) => {
  const productId = req.params.id;

  try {
    await pool.query("BEGIN");

    const { rows } = await pool.query(
      "SELECT display_order FROM products WHERE product_id = $1",
      [productId]
    );

    if (rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ error: "Product not found" });
    }

    const deletedOrder = rows[0].display_order;

    await pool.query(
      "DELETE FROM products WHERE product_id = $1",
      [productId]
    );

    await pool.query(
      `
      UPDATE products
      SET display_order = display_order - 1
      WHERE display_order > $1
      `,
      [deletedOrder]
    );

    await pool.query("COMMIT");

    res.json({ message: "Product deleted & reordered" });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
});



module.exports = router;
