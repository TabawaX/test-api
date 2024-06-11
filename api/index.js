const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Serve the root index.html and style.css on the root path
app.get("/", async (req, res) => {
  const indexFile = path.resolve(__dirname, '../public/index.html');
  const cssFile = path.resolve(__dirname, '../public/style.css');

  try {
    const [indexRAW, cssRAW] = await Promise.all([
      fs.promises.readFile(indexFile, 'utf8'),
      fs.promises.readFile(cssFile, 'utf8')
    ]);

    console.log('Successfully read index.html and style.css');

    let dataDiEdit = indexRAW.replace(/<head>/, `<head><style>${cssRAW}</style>`);

    res.setHeader('Content-Type', 'text/html');
    res.send(dataDiEdit);
  } catch (err) {
    console.error('Error processing files:', err);
    res.status(500).send('Error processing files');
  }
});

// Import and use the router for /api routes
const router = require('./your-router-file'); // Adjust the path accordingly
app.use('/api', router);

module.exports = app;