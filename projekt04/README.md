# Projekt 04 — opinie o hotelach

Aplikacja webowa umożliwia przeglądanie hoteli oraz dodawanie opinii przez zalogowanych użytkowników.

## Funkcje i uprawnienia

- Rejestracja i logowanie użytkowników
- Obsługa sesji
- Przeglądanie listy hoteli
- Wyświetlanie szczegółów hotelu i opinii
- Dodawanie opinii przez zalogowanych użytkowników
- Usuwanie własnych opinii przez autora
- Panel administratora
- Dodawanie, edycja i usuwanie hoteli przez administratora
- Edycja i usuwanie opinii przez administratora
- Walidacja opinii:
  - tytuł: od 3 do 100 znaków
  - treść: od 10 do 500 znaków
- Motyw jasny / ciemny
- Zarządzanie zgodą na cookies
- Zapamiętywanie ostatnio oglądanych hoteli osobno dla każdego użytkownika
- Obsługa strony 404 dla nieistniejących hoteli i podstron
- Przechowywanie danych w SQLite

## Technologie

- Node.js
- Express.js
- EJS
- SQLite
- CSS

## Instalacja

```bash
git clone https://github.com/fwojciechoo/pzaw_filip_woj.git
cd pzaw_filip_woj/projekt04

npm install

bash utils/generate_env.sh > .env

npm run populate_db

node index.js
```

Aplikacja jest dostępna pod adresem:

```txt
http://localhost:8000
```

## Konta testowe

Użytkownik:

```txt
login: test
hasło: test12345
```

Administrator:

```txt
login: admin
hasło: admin123
```

Administrator może dodawać, edytować i usuwać hotele oraz zarządzać opiniami.

## Struktura projektu

- `controllers/` – logika logowania, rejestracji i autoryzacji
- `models/` – komunikacja z bazą danych SQLite
- `views/` – widoki EJS
- `views/forms/` – formularze używane w widokach
- `public/` – pliki statyczne, CSS i ikony
- `utils/` – skrypty pomocnicze, np. generowanie `.env` i uzupełnianie bazy

## Najważniejsze endpointy

| Metoda | Ścieżka                                    | Opis |
| ------ | ------------------------------------------ | ---- |
| GET    | `/`                                        | Lista hoteli |
| GET    | `/view/:hotel_slug`                        | Szczegóły hotelu i opinie |
| POST   | `/add_review/:hotel_slug`                  | Dodanie opinii |
| GET    | `/new_hotel`                               | Formularz dodawania hotelu |
| POST   | `/new_hotel`                               | Dodanie hotelu |
| GET    | `/edit/:hotel_slug`                        | Panel zarządzania hotelem |
| POST   | `/edit/:hotel_slug`                        | Edycja hotelu |
| POST   | `/edit/:hotel_slug/:review_id`             | Edycja opinii przez administratora |
| POST   | `/delete/:hotel_slug/:review_id`           | Usunięcie opinii przez administratora |
| POST   | `/delete_my_review/:hotel_slug/:review_id` | Usunięcie własnej opinii |
| POST   | `/delete_hotel/:hotel_slug`                | Usunięcie hotelu |
| GET    | `/settings/manage-cookies`                 | Zarządzanie cookies |
| POST   | `/settings/manage-cookies`                 | Zapis ustawień cookies |

## Autor

Filip Wojciechowski
