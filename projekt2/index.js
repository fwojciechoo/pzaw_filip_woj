import express from "express";

const port = 8000;
const app = express();

app.use(express.static("public")); // "magiczna" obsługa ścieżek dla plików z katalogu public

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});