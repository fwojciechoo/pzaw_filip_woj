const express = require('express');
const session = require('express-session');
const csrf = require('csurf');
const path = require('path');
const db = require('./db');

const authRoutes = require('./routes/auth');
const entryRoutes = require('./routes/entries');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'secret123',
  resave: false,
  saveUninitialized: false
}));

app.use(csrf());

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.locals.user = req.session.user;
  next();
});

// Routes
app.use('/', authRoutes);
app.use('/', entryRoutes);

// Root redirect
app.get('/', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.redirect('/entries');
});

// Entries list
app.get('/entries', (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  db.all(`
    SELECT entries.id, entries.title, entries.content, entries.rating, entries.user_id, users.login AS user_login 
    FROM entries 
    JOIN users ON entries.user_id = users.id 
    ORDER BY entries.id DESC
  `, [], (err, rows) => {
    if (err) rows = [];
    res.render('index', {
      entries: rows,
      user: req.session.user,
      csrfToken: req.csrfToken()
    });
  });
});

app.listen(3000, () => console.log('Server running: http://localhost:3000'));