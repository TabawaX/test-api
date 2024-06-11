const express = require("express");
const cors = require("cors");
const secure = require("ssl-express-www");
const path = require("path"); 

const app = express();

app.enable("trust proxy");
app.set("json spaces", 2);
app.use(cors());
app.use(secure);
app.use(express.static(path.join(__dirname, "public"))); 

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "sekai-page", "home.html")); 
});

const router = require('./router'); 
app.use('/api', router);

module.exports = app;