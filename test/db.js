const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');
const bcrypt = require('bcrypt');

db.serialize(() => {
  // Tworzymy tabele
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      login TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'user'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content TEXT,
      rating INTEGER,
      user_id INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // Sprawdzenie czy admin istnieje
  db.get("SELECT * FROM users WHERE login = 'admin'", async (err, row) => {
    if (err) {
      console.error('Błąd przy sprawdzaniu admina:', err);
      return;
    }

    if (!row) {
      // Tworzymy admina
      const hash = await bcrypt.hash('admin123', 10);
      db.run(
        "INSERT INTO users (login, password, role) VALUES (?, ?, ?)",
        ['admin', hash, 'admin'],
        (err) => {
          if (err) console.error('Błąd przy tworzeniu admina:', err);
          else console.log('Utworzono konto admina: login=admin, hasło=admin123');
        }
      );
    }
  });
});

module.exports = db;