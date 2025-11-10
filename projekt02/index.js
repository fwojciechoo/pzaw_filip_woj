
import express from "express";
import morgan from "morgan";

const app = express();
const port = 8000;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

let entries = [];

function log_request(req, res, next) {
  console.log(`Request ${req.method} ${req.path}`);
  next();
}
app.use(log_request);

app.get("/", (req, res) => {
  res.render("index", { title: "Księga Gości", entries });
});

app.get("/form", (req, res) => {
  res.render("form", { title: "Dodaj wpis" });
});

app.post("/add", (req, res) => {
  const name = req.body.name?.trim();
  const message = req.body.message?.trim();

  if (!name || !message) {
    return res.status(400).send("Błąd: imię i wiadomość są wymagane.");
  }

  const newEntry = { name, message, date: new Date().toLocaleString("pl-PL") };
  entries.push(newEntry);
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
