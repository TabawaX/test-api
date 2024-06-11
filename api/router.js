const express = require('express');
const { performance } = require('perf_hooks');
const fetch = require('node-fetch');
const os = require('os');
const path = require('path');
const router = express.Router();

const __path = process.cwd();

router.get("/status", async (req, res) => { // Remove '/api' prefix
  const date = new Date();
  const jam = date.getHours();
  const menit = date.getMinutes();
  const detik = date.getSeconds();
  const old = performance.now();
  const neww = performance.now();
  const ram = `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(os.totalmem() / 1024 / 1024)}MB`;
  const cpu = os.cpus();
  const json = await (await fetch("https://api.ipify.org/?format=json")).json();
  const status = {
    status: "online",
    memory: ram,
    cpu: cpu[0].model,
    ip: json.ip,
    time: `${jam} : ${menit} : ${detik}`,
    uptime: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m ${Math.floor(process.uptime() % 60)}s`,
    speed: `${neww - old}ms`,
    info: {
      developer: "Renkie",
      apikey: "Kagak Ada :v",
    },
  };
  res.json(status);
});

module.exports = router;