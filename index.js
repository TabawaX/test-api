const express = require("express");
const cors = require("cors");
const secure = require("ssl-express-www");
const path = require("path");
const app = express();
const __path = process.cwd();

// Middleware to disable caching
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Debugging line to check the request object
app.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  next();
});

app.use(express.json());
app.enable("trust proxy");
app.set("json spaces", 2);
app.use(cors());

// Check if secure is being called correctly
try {
  app.use(secure);
} catch (err) {
  console.error('Error initializing ssl-express-www middleware:', err);
}

app.use(express.static(path.join(__path, 'public')));

app.get("/", (req, res) => {
  res.sendFile(path.join(__path, "sekai-page", "home.html"));
});

app.get("/docs", (req, res) => {
  res.sendFile(path.join(__path, "sekai-page", "docs.html"));
});

app.get("/api-docs", (req, res) => {
  res.sendFile(path.join(__path, "sekai-page", "apis.html"));
});

// Direct routing for WhatsApp, Telegram, and Discord
app.get('/grup', (req, res) => {
  res.redirect('https://chat.whatsapp.com/CwhyfVBfbydANCTohrBtzk');
});

app.get('/telegram', (req, res) => {
  res.redirect('https://t.me/nusantaku');
});

app.get('/discord', (req, res) => {
  res.redirect('https://discord.com/invite/B9n6EqTjkr');
});

// Handle 404 errors
app.use((req, res, next) => {
  res.status(404).json({ 
    engineer: "@Tabawa",
    message: '404 Not Found Please Contact Developer'
  });
});

// Handle 500 errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    engineer: "@Tabawa",
    message: '500 Internal Server Error Please Contact Developer'
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;