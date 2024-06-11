const express = require('express');
const path = require('path');
const fs = require('fs').promises; // Import the promises version of fs
const app = express();

// Serve the root index.html with embedded style.css
app.get("/", async (req, res) => {
  try {
    const indexFilePath = path.join(__dirname, '../public/index.html');
    const cssFilePath = path.join(__dirname, '../public/style.css');

    // Read the contents of both files
    const [indexContent, cssContent] = await Promise.all([
      fs.readFile(indexFilePath, 'utf-8'),
      fs.readFile(cssFilePath, 'utf-8')
    ]);

    // Combine the HTML and CSS content
    const combinedContent = indexContent.replace('</head>', `<style>${cssContent}</style></head>`);

    // Send the combined content as the response
    res.send(combinedContent);
  } catch (error) {
    console.error('Error processing files:', error);
    res.status(500).send('Error processing files');
  }
});

// Import and use the router for /api routes
const router = require('./router');
app.use('/api', router);

module.exports = app;