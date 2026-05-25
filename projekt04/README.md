# Opis

Aplikacja webowa umożliwiająca przeglądanie hoteli oraz dodawanie opinii przez użytkowników.

## Funkcje

- Rejestracja i logowanie użytkowników
- Obsługa sesji
- Dodawanie opinii o hotelach
- Role administratora
- Motyw jasny / ciemny
- Przechowywanie danych w SQLite

## Technologie

- Node.js
- Express.js
- EJS
- SQLite
- CSS

## Instalacja

```bash
git clone <link-do-repo>
cd <nazwa-folderu>

npm install

bash utils/generate_env.sh > .env

node utils/populate_db.js

node index.js
```

Dostępne na:

```txt
http://localhost:8000
```
## Konto testowe

Użytkownik:

```txt
login: test
hasło: test12345
```

## Struktura projektu

- `controllers/` – obsługa routingu i logiki
- `models/` – komunikacja z bazą danych
- `views/` – widoki EJS
- `public/` – pliki statyczne

## Uprawnienia

Tylko administrator może zarządzać dodawć hotele oraz zarządzać opiniami.

## Autor

Filip Wojciechowski