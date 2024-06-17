
const express = require("express");
const cors = require("cors");
const secure = require("ssl-express-www");
const path = require("path");

const app = express();
const __path = process.cwd();

// Middleware
app.use(express.json());
app.enable("trust proxy");
app.set("json spaces", 2);
app.use(cors());
app.use(secure);

// Middleware logging
app.use((req, res, next) => {
  console.log(`Request URL: ${req.url}`);
  next();
});

// Path absolut ke folder 'public'
app.use(express.static(path.join(__path, 'public')));

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__path, "sekai-page", "home.html"));
});

app.get("/docs", (req, res) => {
  res.sendFile(path.join(__path, "sekai-page", "docs.html"));
});

app.get("/api-docs", (req, res) => {
  res.sendFile(path.join(__path, "sekai-page", "apis.html"));
});

const router = require('./api/router');
app.use('/api', router);

// Error handling
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

module.exports = app;