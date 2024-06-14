const express = require('express');
const { performance } = require('perf_hooks');
const fetch = require('node-fetch');
const os = require('os');
const CidrMatcher = require('cidr-matcher');

const router = express.Router();

const whitelist = ['192.168.1.0/24', '10.0.0.0/8', '158.178.243.123/32', '114.10.114.94/32'];
const matcher = new CidrMatcher(whitelist)

const SnapTikClient = require('../public/func/tiktokdl');

const tikclient = new SnapTikClient();

const apikeyAuth = ['tabawayoisaki', 'tabawahoshino']; // Update with your valid API keys

router.get("/tiktokdl", async (req, res) => {
  const { tiktokdl: url, apikey } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Enter the TikTok video URL' });
  }

  if (!apikey) {
    return res.status(400).json({ error: 'API key is required' });
  }

  if (!apikeyAuth.includes(apikey)) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  try {
    console.log('Received TikTok URL:', url); // Log the TikTok URL

    res.json({ url }); // Temporarily respond with the received URL
  } catch (error) {
    console.error('Error in /tiktokdl endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/status", async (req, res) => { 
  try {
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
  } catch (error) {
    console.error('Error di route /api/status:', error);
    res.status(500).json({
      message: 'Internal Server Error'
    });
  }
});

module.exports = router;