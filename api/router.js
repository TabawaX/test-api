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
router.get("/pinterest", async (req, res) => {
    const text = req.query.text;
    const apikey = req.query.apikey;

    if (!text) return res.status(403).json(logsekai.butuhurl);
    if (!apikey) return res.status(403).json(logsekai.noapikey);

    if (!apikeyAuth.includes(apikey)) {
        return res.status(403).json({ error: 'Invalid API key' });
    }


async function pinterest(query) {
    return new Promise(async (resolve, reject) => {
        try {
            const encodedQuery = encodeURIComponent(query);
            const url = `https://id.pinterest.com/search/pins/?autologin=true&q=${encodedQuery}`;

            const response = await axios.get(url, {
                headers: {
                    "cookie": "_auth=1; _b=\"AVna7S1p7l1C5I9u0+nR3YzijpvXOPc6d09SyCzO+DcwpersQH36SmGiYfymBKhZcGg=\"; _pinterest_sess=TWc9PSZHamJOZ0JobUFiSEpSN3Z4a2NsMk9wZ3gxL1NSc2k2NkFLaUw5bVY5cXR5alZHR0gxY2h2MVZDZlNQalNpUUJFRVR5L3NlYy9JZkthekp3bHo5bXFuaFZzVHJFMnkrR3lTbm56U3YvQXBBTW96VUgzVUhuK1Z4VURGKzczUi9hNHdDeTJ5Y2pBTmxhc2owZ2hkSGlDemtUSnYvVXh5dDNkaDN3TjZCTk8ycTdHRHVsOFg2b2NQWCtpOWxqeDNjNkk3cS85MkhhSklSb0hwTnZvZVFyZmJEUllwbG9UVnpCYVNTRzZxOXNJcmduOVc4aURtM3NtRFo3STlmWjJvSjlWTU5ITzg0VUg1NGhOTEZzME9SNFNhVWJRWjRJK3pGMFA4Q3UvcHBnWHdaYXZpa2FUNkx6Z3RNQjEzTFJEOHZoaHRvazc1c1UrYlRuUmdKcDg3ZEY4cjNtZlBLRTRBZjNYK0lPTXZJTzQ5dU8ybDdVS015bWJKT0tjTWYyRlBzclpiamdsNmtpeUZnRjlwVGJXUmdOMXdTUkFHRWloVjBMR0JlTE5YcmhxVHdoNzFHbDZ0YmFHZ1VLQXU1QnpkM1FqUTNMTnhYb3VKeDVGbnhNSkdkNXFSMXQybjRGL3pyZXRLR0ZTc0xHZ0JvbTJCNnAzQzE0cW1WTndIK0trY05HV1gxS09NRktadnFCSDR2YzBoWmRiUGZiWXFQNjcwWmZhaDZQRm1UbzNxc21pV1p5WDlabm1UWGQzanc1SGlrZXB1bDVDWXQvUis3elN2SVFDbm1DSVE5Z0d4YW1sa2hsSkZJb1h0MTFpck5BdDR0d0lZOW1Pa2RDVzNySWpXWmUwOUFhQmFSVUpaOFQ3WlhOQldNMkExeDIvMjZHeXdnNjdMYWdiQUhUSEFBUlhUVTdBMThRRmh1ekJMYWZ2YTJkNlg0cmFCdnU2WEpwcXlPOVZYcGNhNkZDd051S3lGZmo0eHV0ZE42NW8xRm5aRWpoQnNKNnNlSGFad1MzOHNkdWtER0xQTFN5Z3lmRERsZnZWWE5CZEJneVRlMDd2VmNPMjloK0g5eCswZUVJTS9CRkFweHc5RUh6K1JocGN6clc1JmZtL3JhRE1sc0NMTFlpMVErRGtPcllvTGdldz0=; _ir=0"
                }
            });

            // Log HTML response for debugging
            console.log(response.data);

            const $ = cheerio.load(response.data);
            const imageLinks = [];

            $('div[data-test-id="pinWrapper"] img').each((index, element) => {
                const link = $(element).attr('src');
                if (link) {
                    imageLinks.push(link.replace(/236x/g, '736x'));
                }
            });

            if (imageLinks.length > 0) {
                const shuffledImages = imageLinks.sort(() => 0.5 - Math.random()).slice(0, 50);
                resolve(shuffledImages);
            } else {
                reject(new Error('No images found'));
            }
        } catch (error) {
            reject(error);
        }
    });
}

    try {
        const images = await pinterest(text);
        res.status(200).json({
            engineering: "Tabawa",
            data: ${images}
        });
    } catch (error) {
        console.error('Error in /pinterest endpoint:', error);
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