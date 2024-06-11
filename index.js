
const express = require("express");
const cors = require("cors");
const secure = require("ssl-express-www");

const app = express();
const __path = process.cwd(); 

app.enable("trust proxy");
app.set("json spaces", 2);
app.use(cors());
app.use(secure);
app.use(express.static((__path + "public"));

app.get("/", (req, res) => {
  res.sendFile(__path + "/sekai-page/home.html"); 
});

const router = require('./api/router');
app.use('/api', router);

module.exports = app;