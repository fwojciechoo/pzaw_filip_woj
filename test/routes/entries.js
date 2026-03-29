const express = require('express');
const db = require('../db');
const router = express.Router();

// GET lista wpisów
router.get('/entries', (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  db.all(`
    SELECT e.*, u.login AS user_login
    FROM entries e
    JOIN users u ON u.id = e.user_id
    ORDER BY e.id DESC
  `, (err, rows) => {
    if (err) return res.send("Błąd bazy: " + err.message);
    res.render('entries', { entries: rows });
  });
});

// GET dodawanie wpisu
router.get('/add-entry', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('add-entry');
});

// POST dodawanie wpisu
router.post('/add-entry', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { title, content, rating } = req.body;
  db.run('INSERT INTO entries (title, content, rating, user_id) VALUES (?, ?, ?, ?)',
    [title, content, rating, req.session.user.id],
    (err) => {
      if (err) return res.send('Błąd: ' + err.message);
      res.redirect('/entries');
    });
});

// POST usuwanie wpisu
router.post('/delete-entry/:id', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const entryId = req.params.id;

  db.get('SELECT * FROM entries WHERE id = ?', [entryId], (err, entry) => {
    if (!entry) return res.send('Nie znaleziono wpisu');
    if (req.session.user.role !== 'admin' && req.session.user.id !== entry.user_id) {
      return res.send('Brak uprawnień');
    }

    db.run('DELETE FROM entries WHERE id = ?', [entryId], (err) => {
      if (err) return res.send('Błąd przy usuwaniu');
      res.redirect('/entries');
    });
  });
});

// GET edytowanie wpisu
router.get('/edit-entry/:id', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const entryId = req.params.id;

  db.get('SELECT * FROM entries WHERE id = ?', [entryId], (err, entry) => {
    if (err || !entry) return res.send('Nie znaleziono wpisu');
    if (req.session.user.role !== 'admin' && req.session.user.id !== entry.user_id) {
      return res.send('Brak uprawnień do edycji tego wpisu');
    }
    res.render('edit-entry', { entry });
  });
});

// POST zapis edycji
router.post('/edit-entry/:id', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const entryId = req.params.id;
  const { title, content, rating } = req.body;

  db.get('SELECT * FROM entries WHERE id = ?', [entryId], (err, entry) => {
    if (err || !entry) return res.send('Nie znaleziono wpisu');
    if (req.session.user.role !== 'admin' && req.session.user.id !== entry.user_id) {
      return res.send('Brak uprawnień do edycji tego wpisu');
    }

    db.run('UPDATE entries SET title = ?, content = ?, rating = ? WHERE id = ?',
      [title, content, rating, entryId],
      (err) => {
        if (err) return res.send('Błąd przy aktualizacji wpisu');
        res.redirect('/entries');
      });
  });
});

module.exports = router;