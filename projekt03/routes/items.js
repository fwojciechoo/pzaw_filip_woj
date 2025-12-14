const express = require("express");
const router = express.Router();
const db = require("../db/connect");

router.get("/", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM items");
  res.render("list", { items: rows });
});

router.get("/add", (req, res) => res.render("add"));

router.post("/add", async (req, res) => {
  await db.query("INSERT INTO items (name, description) VALUES (?, ?)",
    [req.body.name, req.body.description]);
  res.redirect("/");
});

router.get("/edit/:id", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM items WHERE id=?", [req.params.id]);
  res.render("edit", { item: rows[0] });
});

router.post("/edit/:id", async (req, res) => {
  await db.query("UPDATE items SET name=?, description=? WHERE id=?",
    [req.body.name, req.body.description, req.params.id]);
  res.redirect("/");
});

router.post("/delete/:id", async (req, res) => {
  await db.query("DELETE FROM items WHERE id=?", [req.params.id]);
  res.redirect("/");
});

module.exports = router;
