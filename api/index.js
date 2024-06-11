const express = require('express');
const path = require('path');
const app = express();

// Serve the root index.html with embedded style.css
app.get("/", (req, res) => {
  const indexFilePath = path.join(__dirname, '../public/index.html');
  
  res.sendFile(indexFilePath);
});

// Import and use the router for /api routes
const router = require('./router');
app.use('/api', router);

module.exports = app;