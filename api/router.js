const express = require('express');
const axios = require('axios');
const fetch = require('node-fetch');
const os = require('os');
const CidrMatcher = require('cidr-matcher');
const cheerio = require('cheerio');
const FormData = require('form-data');

const router = express.Router();
const whitelist = ['192.168.1.0/24', '10.0.0.0/8', '158.178.243.123/32', '114.10.114.94/32'];
const matcher = new CidrMatcher(whitelist);

class SnapTikClient {
  constructor(config = {}) {
    this.axios = axios.create({
      baseURL: 'https://dev.snaptik.app',
      ...config,
    });
  }

  async get_token() {
    try {
      const { data } = await this.axios.get('/');
      const $ = cheerio.load(data);
      const token = $('input[name="token"]').val();
      console.log('Token retrieved:', token);
      return token;
    } catch (error) {
      console.error('Error in get_token:', error);
      throw error;
    }
  }

  async get_script(url) {
    try {
      const form = new FormData();
      const token = await this.get_token();
      console.log('Token used:', token);

      form.append('token', token);
      form.append('url', url);

      const { data } = await this.axios.post('/abc2.php', form);
      console.log('Script data received:', data);
      return data;
    } catch (error) {
      console.error('Error in get_script:', error);
      throw error;
    }
  }

  async eval_script(script1) {
    try {
      const script2 = await new Promise(resolve => Function('eval', script1)(resolve));
      console.log('Evaluated script:', script2);

      // Adjusted logic to handle conditions and errors
      return new Promise((resolve, reject) => {
        let html = '';
        const [k, v] = ['keys', 'values'].map(x => Object[x]({
          $: () => Object.defineProperty({
            remove() {},
            style: { display: '' }
          }, 'innerHTML', { set: t => (html = t) }),
          app: { showAlert: (msg, type) => reject(new Error(msg)) }, // Reject with an error
          document: { getElementById: () => ({ src: '' }) },
          fetch: a => {
            console.log('Fetch called with:', a);
            return resolve({ html, oembed_url: a }), { json: () => ({ thumbnail_url: '' }) };
          },
          gtag: () => 0,
          Math: { round: () => 0 },
          XMLHttpRequest: function() {
            return { open() {}, send() {} }
          },
          window: { location: { hostname: 'snaptik.app' } }
        }));

        // Execute the evaluated script
        Function(...k, script2)(...v);
      });
    } catch (error) {
      console.error('Error in eval_script:', error);
      throw error; // Propagate the error further up the chain
    }
  }

  async get_hd_video(token) {
    try {
      const { data } = await this.axios.get(`/getHdLink.php?token=${token}`);
      console.log('HD Video data received:', data);
      if (data.error) throw new Error(data.error);
      return data.url;
    } catch (error) {
      console.error('Error in get_hd_video:', error);
      throw error;
    }
  }

  async parse_html(html) {
    try {
      const $ = cheerio.load(html);
      const is_video = !$('div.render-wrapper').length;

      if (is_video) {
        const hd_token = $('div.video-links > button[data-tokenhd]').data('tokenhd');
        const hd_url = new URL(await this.get_hd_video(hd_token));
        const token = hd_url.searchParams.get('token');
        const { url } = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));

        console.log('Video URL:', url);
        
        return { 
          Engineer: 'Tabawa',
          type: 'video',
          data: {
            sources: [
              url,
              hd_url.href,
              ...$('div.video-links > a:not(a[href="/"])').toArray()
              .map(elem => $(elem).attr('href'))
              .map(x => x.startsWith('/') ? this.config.baseURL + x : x)
            ].map(url => new Resource(url))
          }
        };
      } else {
        return { 
          Engineer: 'Tabawa',
          type: 'slideshow',
          data: {
            photos: $('div.columns > div.column > div.photo').toArray().map(elem => ({
              sources: [
                $(elem).find('img[alt="Photo"]').attr('src'),
                $(elem).find('a[data-event="download_albumPhoto_photo"]').attr('href')
              ].map(url => new Resource(url))
            }))
          }
        };
      }
    } catch (error) {
      console.error('Error in parse_html:', error);
      throw error;
    }
  }

  async process(url) {
    try {
      const script = await this.get_script(url);
      const { html, oembed_url } = await this.eval_script(script);
      const data = await this.parse_html(html);

      return {
        ...data,
        url,
        oembed_url
      };
    } catch (error) {
      console.error('Error in process:', error);
      throw error; // Propagate the error further up the chain
    }
  }
}

const apikeyAuth = ['tabawayoisaki', 'tabawahoshino'];
const tikclient = new SnapTikClient();

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
    console.log('Processing URL:', url);

    const data = await tikclient.process(url);
    const prettyJson = JSON.stringify(data, null, 2);

    console.log('Processed data:', data);

    res.header('Content-Type', 'application/json').send(prettyJson);
  } catch (error) {
    console.error('Error in /tiktokdl endpoint:', error);
    if (error.message.includes('Url error')) {
      return res.status(400).json({ error: 'URL error. Please check again' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
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

module.exports = router;