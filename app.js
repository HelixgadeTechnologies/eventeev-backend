const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const dotenv = require("dotenv");
const cors = require("cors");
const app = express();
dotenv.config();
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

const { AuthRoute, EventRoute } = require("./index.routes");


const mongodb = process.env.MongoUrl;

mongoose
  .connect(mongodb, {
    // useUnifiedTopology: true
  })
  .then(() => console.log("CONNECTED TO DATABASE"))
  .catch((error) => console.log("CONNECTION ERROR", error));

app.get("/", (req, res) => {
  res.send("EVENTEEV IS ACTIVE");
});

app.use("/auth", AuthRoute);
app.use("/event", EventRoute)

module.exports = app;
