const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const responseHandler = require("./middlewares/ResponseHandler");
// const mongoose = require("mongoose");

require("dotenv").config();

// const registerRoutes = require("./routes/registerRoutes");
// const adminRoutes = require("./routes/adminRoutes");

const app = express();
app.use(bodyParser.json());

// mongoose.connect(process.env.MONGODB_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// }).then(() => console.log("MongoDB connected"));

const connectDB = require("./config/db"); // <-- import file config db

// Gọi hàm kết nối DB
connectDB();
app.use(cors());
app.use(responseHandler);
const routes = require("./routes/index");
app.use("/", routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
