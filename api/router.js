const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');
const CidrMatcher = require('cidr-matcher');
const os = require('os');
const fetch = require('node-fetch');
const PlayStore = require('../public/func/playstore');
const ZerochanScraper = require('../public/func/ZerochanScraper'); 

const router = express.Router();
const whitelist = ['192.168.1.0/24', '10.0.0.0/8', '158.178.243.123/32', '114.10.114.94/32', '45.142.115.222/32', '114.5.110.185/32'];
const matcher = new CidrMatcher(whitelist);

const apikeyAuth = ['tabawayoisaki'];

const logsekai = {
    noapikey: {
        engineering: `@li zhuanxie`,
        status: 403,
        message: "Need Apikey? Contact Developer",
    },
    error: {
        engineering: `@li zhuanxie`,
        status: 503,
        message: "Locked 503",
    },
    apikey: {
        engineering: `@li zhuanxie`,
        status: 403,
        message: "Butuh Apikey? Contact Developer",
    },
    butuhurl: {
        engineering: `@li zhuanxie`,
        status: 403,
        message: "I Need a URL!",
    },
    butuhq: {
        engineering: `@li zhuanxie`,
        status: 403,
        message: "Query nya mana?!",
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

router.post('/zerochan', async (req, res) => {
    const { apiKey, query, pages } = req.body;

    if (!apiKey || !apikeyAuth.includes(apiKey)) {
        return res.status(logsekai.noapikey.status).json(logsekai.noapikey);
    }
    if (!query) {
        return res.status(logsekai.butuhq.status).json(logsekai.butuhurl);
    }

    const pageNumbers = pages ? pages.split(',').map(Number) : [];
    if (pageNumbers.length === 0) {
        return res.status(400).json({ error: 'Pages parameter tidak valid atau kosong' });
    }

    try {
        const scraper = new ZerochanScraper(query, pageNumbers);
        const results = await scraper.scrapeAllDetails();

        if (results.status === 'success') {
            return res.json(results);
        } else {
            return res.status(logsekai.error.status).json(logsekai.error);
        }
    } catch (error) {
        console.error('Error saat scraping:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Beritahu Dev Soal eror ini',
            details: error.message,
        });
    }
});

router.get('/brat', async (req, res) => {
    const apikey = req.query.apikey;
    const search = req.query.query;

    if (!apikey || !search) {
        return res.status(400).json({ error: 'API key and search query are required.' });
    }

    if (!apikeyAuth.includes(apikey)) {
        return res.status(403).json({ error: 'Nggak Ada Apikey Mau Apikey? Contact Developer' });
    }

    try {
        const imageUrl = `https://mxmxk-helper.hf.space/brat?text=${encodeURIComponent(search)}`;
        const response = await fetch(imageUrl);
        
        if (!response.ok) {
            return res.status(500).json({ error: 'Failed to fetch image from the source.' });
        }

        const buffer = await response.buffer();
        res.set('Content-Type', 'image/png');
        res.status(200).send(buffer);
    } catch (error) {
        console.error('Error in /brat endpoint:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/playstore', async (req, res) => {
    const apikey = req.query.apikey;
    const search = req.query.search;

    if (!apikey || !search) {
        return res.status(400).json({ error: 'API key and search query are required.' });
    }

    if (!apikeyAuth.includes(apikey)) {
        return res.status(403).json({ error: 'Nggak Ada Apikey Mau Apikey? Contact Developer' });
    }

    try {
        const result = await PlayStore(search);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in /playstore endpoint:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

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
            developer: "@li zhuanxie",
            ip: ipPengunjung,
            message: 'Authorized'
        });
    } else {
        res.status(403).json({
            status: "403",
            developer: "@li zhuanxie",
            ip: ipPengunjung,
            message: 'Not authorized' 
        });
    }
});

module.exports = router;