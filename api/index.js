__path = process.cwd();
const express = require("express");
const cors = require("cors");
const secure = require("ssl-express-www");

const app = express();

app.enable("trust proxy");
app.set("json spaces", 2);
app.use(cors());
app.use(secure);
app.use(express.static("public"));


app.get("/", (req, res) => {
	res.sendFile(__path + "/sekai-page/home.html");
});

const router = require('./router');
app.use('/api', router);

module.exports = app;