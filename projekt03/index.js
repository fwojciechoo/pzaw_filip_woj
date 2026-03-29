
import express from "express";
import bodyParser from "body-parser";
import * as hotel from "./models/hotel.js";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.set("view engine", "ejs");

app.get("/", async (req, res) => {
  const bookings = await hotel.getBookings();
  res.render("index", { bookings });
});

app.post("/book", async (req, res) => {
  await hotel.addBooking(req.body);
  res.redirect("/");
});

app.listen(3000, () => console.log("http://localhost:3000"));
