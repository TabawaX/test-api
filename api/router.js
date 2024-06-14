const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');
const CidrMatcher = require('cidr-matcher');
const os = require('os');

const router = express.Router();
const app = express();
const whitelist = ['192.168.1.0/24', '10.0.0.0/8', '158.178.243.123/32', '114.10.114.94/32'];
const matcher = new CidrMatcher(whitelist);
// Mock API Key authentication list
const apikeyAuth = ['tabawayoisaki']; // Masukkan API key Anda yang valid di sini

// Log messages
const logsekai = {
    noapikey: {
        engineering: `@renkie`,
        status: 403,
        message: "Need Apikey? Contact Developer",
    },
    error: {
        engineering: `@renkie`,
        status: 503,
        message: "Locked 403",
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

// Routes
router.get("/tiktokdl", async (req, res) => {
    const url = req.query.url;
    const apikey = req.query.apikey;

    if (!url) return res.status(403).json(logsekai.butuhurl);
    if (!apikey) return res.status(403).json(logsekai.noapikey);

    if (!apikeyAuth.includes(apikey)) {
        return res.status(403).json({ error: 'Invalid API key' });
    }

    async function ttdl(url) {
        try {
            const response = await axios.post(
                'https://ttsave.app/download',
                {
                    query: url,
                    language_id: '1'
                },
                {
                    headers: {
                        'Accept': 'application/json, text/plain, */*',
                        'Content-Type': 'application/json'
                    }
                }
            );

            const html = response.data;
            const $ = cheerio.load(html);
             
            const engineering = "Tabawa";
            const uniqueId = $('h2.font-extrabold.text-xl.text-center').text();
            const urls = $('a[title="zuo888z"]').attr('href');
            const thumbnail = $('a[title="zuo888z"] img').attr('src');
            const download = [];

            $('a[onclick="bdl(this, event)"]').each((index, element) => {
                const type = $(element).attr('type');
                const link = $(element).attr('href');
                download.push({
                    type, link
                });
            });

            return { 
                engineering,
                uniqueId,
                urls,
                thumbnail,
                download,
            };
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    try {
        console.log('Processing URL:', url);
        const data = await ttdl(url);
        res.json(data);
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
        apikey: "None",
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
})

module.exports = router;