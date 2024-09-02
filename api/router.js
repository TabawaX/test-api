const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');
const CidrMatcher = require('cidr-matcher');
const os = require('os');
const fetch = require('node-fetch');
const PlayStore = require('../public/func/playstore');

const router = express.Router();
const whitelist = ['192.168.1.0/24', '10.0.0.0/8', '158.178.243.123/32', '114.10.114.94/32', '45.142.115.222/32', '114.5.110.185/32'];
const matcher = new CidrMatcher(whitelist);

const apikeyAuth = ['tabawayoisaki'];

const logsekai = {
  noapikey: {
    engineering: `@renkie`,
    status: 403,
    message: "Need Apikey? Contact Developer",
  },
  error: {
    engineering: `@renkie`,
    status: 503,
    message: "Locked 503",
  },
  apikey: {
    engineering: `@renkie`,
    status: 403,
    message: "Butuh Apikey? Contact Developer",
  },
  butuhurl: {
    engineering: `@renkie`,
    status: 403,
    message: "I Need a URL!",
  },
};


async function pinterest(query) {
  const baseUrl = 'https://www.pinterest.com/resource/BaseSearchResource/get/';
  const queryParams = {
    source_url: '/search/pins/?q=' + encodeURIComponent(query),
    data: JSON.stringify({
      options: {
        isPrefetch: false,
        query,
        scope: 'pins',
        no_fetch_context_on_resource: false
      },
      context: {}
    }),
    _: Date.now()
  };
  const url = new URL(baseUrl);
  Object.entries(queryParams).forEach(entry => url.searchParams.set(entry[0], entry[1]));

  try {
    const json = await (await fetch(url.toString())).json();
    const results = json.resource_response?.data?.results ?? [];
    return {
      engineer: "tabawa renki",
      data: results.map(item => ({
        created_at: (new Date(item.created_at)).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }) ?? '',
        url_pin: item.images?.['736x']?.url ?? '',
        judul_pin: item.grid_title ?? ''
      }))
    };
  } catch (error) {
    console.error('Error mengambil data:', error);
    return {
      engineer: "tabawa renki",
      data: []
    };
  }
}


/**
 * REST API endpoint to get PlayStore search results.
 * 
 * @param {string} apikey - API key for authentication.
 * @param {string} search - Search query for PlayStore.
 * @returns {Object} - JSON response containing search results or error message.
 */
router.get('/playstore', async (req, res) => {
    const apikey = req.query.apikey;
    const search = req.query.search;

    if (!apikey || !search) {
        return res.status(400).json({ error: 'API key and search query are required.' });
    }

    try {
        const results = await PlayStore(search);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong.' });
    }
})
router.get('/pinterest', (req, res) => {
  const apikey = req.query.apikey;
  const text = req.query.text;

  if (!apikey) return res.status(403).json({ error: 'Butuh Query Apikey' });
  if (!text) return res.status(403).json({ error: 'Mau Cari Pin Apa?' });
  if (!apikeyAuth.includes(apikey)) {
    return res.status(403).json({ error: 'Nggak Ada Apikey Mau Apikey? Contact Developer' });
  }

  pinterest(text)
    .then(images => {
      res.status(200).json(images);
    })
    .catch(error => {
      console.error('Error in /pinterest endpoint:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    });
});

router.get("/status", async (req, res) => {
  try {
    const date = new Date();
    const jam = date.getHours();
    const menit = date.getMinutes();
    const detik = date.getSeconds();
    const ram = `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(os.totalmem() / 1024 / 1024)}MB`;
    const cpu = os.cpus();
    const json = await (await fetch("https://api.ipify.org/?format=json")).json();
    const status = {
      status: "online",
      memory: ram,
      cpu: cpu[0].model,
      ip: json.ip,
      time: `${jam}:${menit}:${detik}`,
      uptime: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m ${Math.floor(process.uptime() % 60)}s`,
      info: {
        developer: "Renkie",
        apikey: "tabawayoisaki",
      },
    };
    res.json(status);
  } catch (error) {
    console.error('Error in /status route:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get("/ip", (req, res) => {
  const ipPengunjung = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  if (matcher.contains(ipPengunjung)) {
    res.status(200).json({
      status: "200",
      developer: "@renkie",
      ip: ipPengunjung,
      message: 'Authorized'
    });
  } else {
    res.status(403).json({
      status: "403",
      developer: "@Renkie",
      ip: ipPengunjung,
      message: 'Not authorized' 
    });
  }
});

module.exports = router;