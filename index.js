const express = require("express");
const cors = require("cors");
const secure = require("ssl-express-www");
const path = require("path");

const app = express();
const __path = process.cwd();

app.enable("trust proxy");
app.set("json spaces", 2);
app.use(cors());
app.use(secure);

// Serve static files from the "public" directory
app.use(express.static(path.join(__path, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__path, "sekai-page", "home.html"));
});

// Integrate the router
const router = require('./api/router');
app.use('/api', router);

// Basic error handling middleware
app.use((req, res, next) => {
  res.status(404).json({
    message: 'Not Found'
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal Server Error'
  });
});

const PORT = 8000; 
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;