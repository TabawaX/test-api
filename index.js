const express = require("express");
const cors = require("cors");
const secure = require("ssl-express-www");
const path = require("path");

const app = express();
const __path = process.cwd();
const swaggerJsdoc = require("swagger-jsdoc")
const swaggerUi = require("swagger-ui-express");

// middleware
app.use(express.json());
app.enable("trust proxy");
app.set("json spaces", 2);
app.use(cors());
app.use(secure);


app.use(express.static(path.join(__dirname, './')))

app.get("/", (req, res) => {
  res.sendFile(path.join(__path, "sekai-page", "home.html"));
});


app.get("/docs", (req, res) => {
  res.sendFile(path.join(__path, "sekai-page", "docs.html"));
});


const router = require('./api/router');
app.use('/api', router);


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

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Kislana API's",
      version: "0.1.0",
      description:
        "list of available apis, thanks to swagger team to make it easier for me using this docs",
      contact: {
        name: "Group Whatsapp Support",
        url: "https://chat.whatsapp.com/GSkuBCr2IGwEXZ4HwFhzmN",
      },
    },
    tags: [
      {
        name: "Search",
        description: "Search  API's"
      },
      {
        name: "Server",
        description: "API Servers"
      }
    ],
    servers: [
      {
        url: "https://kislana.my.id/",
      },
    ],
  },
  apis: ["./api/router.js"],
};

const specs = swaggerJsdoc(options);
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs)
);

const PORT = 8000; 
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;