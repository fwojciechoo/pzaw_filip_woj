require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.set("view engine", "ejs");

const routes = require("./routes/items");
app.use("/", routes);

app.listen(3000, () => console.log("http://localhost:3000"));
