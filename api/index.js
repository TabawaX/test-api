const express = require('express');
const path = require('path');
const app = express();

// Serve the root index.html with embedded style.css
app.get("/", (req, res) => {
  const indexFilePath = path.join(__dirname, '../public/index.html');
  const cssFilePath = path.join(__dirname, '../public/style.css');
  
  res.sendFile(indexFilePath);
});

// Import and use the router for /api routes
const router = require('./router');
app.use('/', router); // Remove '/api' prefix

module.exports = app;