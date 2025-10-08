const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const responseHandler = require("./middlewares/ResponseHandler");
// const mongoose = require("mongoose");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(responseHandler);

const connectDB = require("./config/db");
connectDB();

const routes = require("./routes/index");
app.use("/", routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
