# Opis

Aplikacja webowa umożliwiająca przeglądanie hoteli oraz dodawanie opinii przez użytkowników.

## Funkcje

- Rejestracja i logowanie użytkowników
- Obsługa sesji
- Przeglądanie listy hoteli
- Wyświetlanie szczegółów hoteli
- Dodawanie i usuwanie własnych opinii
- Role użytkowników i administratorów
- Dodawanie, edycja i usuwanie hoteli przez administratora
- Zarządzanie opiniami przez administratora
- Motyw jasny / ciemny
- Obsługa plików cookie
- Zapamiętywanie ostatnio odwiedzonych hoteli
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
- `utils/` - skrypty pomocnicze

## EndPointy

| Metoda | Ścieżka                                    |
| ------ | ------------------------------------------ |
| GET    | `/`                                        |
| GET    | `/view/:hotel_slug`                        |
| GET    | `/new_hotel`                               |
| POST   | `/new_hotel`                               |
| GET    | `/edit/:hotel_slug`                        |
| POST   | `/edit/:hotel_slug`                        |
| POST   | `/edit/:hotel_slug/:review_id`             |
| POST   | `/delete/:hotel_slug/:review_id`           |
| POST   | `/delete_my_review/:hotel_slug/:review_id` |
| POST   | `/delete_hotel/:hotel_slug`                |
| POST   | `/add_review/:hotel_slug`                  |
| GET    | `/auth/signup`                             |
| POST   | `/auth/signup`                             |
| GET    | `/auth/login`                              |
| POST   | `/auth/login`                              |
| GET    | `/auth/logout`                             |
| POST   | `/settings/toggle-theme`                   |
| POST   | `/settings/accept-cookies`                 |
| POST   | `/settings/decline-cookies`                |
| POST   | `/settings/manage-cookies`                 |




## Uprawnienia

Tylko administrator może zarządzać dodawć hotele oraz zarządzać opiniami.

## Autor

Filip Wojciechowski