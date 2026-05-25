# O stronie
    Strona o hotelach.Jeśli użytkownik nie jest zalogowany moze tylko przegladac opinie. Zwykły użytkownik, czyli taki, który nie ma uprawnien admina może dodawać nowe hotele 

    oraz opinie o tych hotelach. Natomiast admin dodatkowo oprócz możliwości dodawania hoteli i opinii może również zarządzać opiniami i hotelami - to znaczy usunąć hotel lub 

    opinie lub zmienić treść opinii.

# Uruchomienie

Bash
    npm install

    bash utils/generate_env.sh > .env

    node utils/populate_db.js

    node index.js

    Dostępne na http://localhost:8000

# Autor
Filip Wojciechowski 3c