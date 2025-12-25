const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all products for a business
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.product_id,p.product_name,p.stock_keeping_unit,p.unit_price,i.current_stock,i.reorder_point
       FROM products p
       LEFT JOIN inventory i ON p.product_id = i.product_id
       ORDER BY p.product_id ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});


// CREATE product + inventory
router.post("/", async (req, res) => {
  try {
    const {
      business_id,
      product_name,
      stock_keeping_unit,
      unit_cost,
      unit_price,
    } = req.body;

    const productResult = await pool.query(
      `INSERT INTO products
       (business_id, product_name, stock_keeping_unit, unit_cost, unit_price)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [business_id, product_name, stock_keeping_unit, unit_cost, unit_price]
    );

    const product = productResult.rows[0];

    await pool.query(
      `INSERT INTO inventory (business_id, product_id, current_stock)
       VALUES ($1, $2, 0)`,
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
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM products WHERE product_id = $1",
      [id]
    );

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});



module.exports = router;
