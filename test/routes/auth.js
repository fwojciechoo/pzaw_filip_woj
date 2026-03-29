const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');

const router = express.Router();

// Login
router.get('/login', (req, res) => res.render('login'));
router.post('/login', (req, res) => {
  const { login, password } = req.body;
  db.get('SELECT * FROM users WHERE login = ?', [login], async (err, user) => {
    if (!user) return res.send('Invalid login');
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send('Invalid password');

    req.session.user = { id: user.id, login: user.login, role: user.role };
    res.redirect('/entries');
  });
});

// Register
router.get('/register', (req, res) => res.render('register'));
router.post('/register', async (req, res) => {
  const { login, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  db.run('INSERT INTO users (login, password) VALUES (?, ?)', [login, hash], function(err) {
    if (err) return res.send('Error: ' + err.message);
    res.redirect('/login');
  });
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

module.exports = router;