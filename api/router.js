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

class Resource {
  constructor(url, index) {
    this.index = index;
    this.url = url;
  }

  download(config = {}) {
    return axios({
      url: this.url,
      type: 'stream',
      ...config
    });
  }
}

/*
  * Scraper By https://github.com/0x6a69616e
  * Forbidden to sell and delete my wm 
*/

class SnapTikClient {
  constructor(config = {}) {
    this.axios = axios.create(this.config = {
      baseURL: 'https://dev.snaptik.app',
      ...config,
    });
  }

  async get_token() {
    const {
      data
    } = await this.axios({
      url: '/'
    });
    const $ = cheerio.load(data);
    return $('input[name="token"]').val();
  }

  async get_script(url) {
    const form = new FormData();
    const token = await this.get_token();

    form.append('token', token);
    form.append('url', url);

    const {
      data
    } = await this.axios({
      url: '/abc2.php',
      method: 'POST',
      data: form
    });

    return data;
  }

/*
  * Scraper By https://github.com/0x6a69616e
  * Forbidden to sell and delete my wm 
*/

  async eval_script(script1) {
    const script2 = await new Promise(resolve => Function('eval', script1)(resolve));
    return new Promise((resolve, reject) => {
      let html = '';
      const [
        k,
        v
      ] = [
        'keys',
        'values'
      ].map(x => Object[x]({
        $: () => Object.defineProperty({
          remove() {},
          style: {
            display: ''
          }
        }, 'innerHTML', {
          set: t => (html = t)
        }),
        app: {
          showAlert: reject
        },
        document: {
          getElementById: () => ({
            src: ''
          })
        },
        fetch: a => {
          return resolve({
            html,
            oembed_url: a
          }), {
            json: () => ({
              thumbnail_url: ''
            })
          };
        },
        gtag: () => 0,
        Math: {
          round: () => 0
        },
        XMLHttpRequest: function() {
          return {
            open() {},
            send() {}
          }
        },
        window: {
          location: {
            hostname: 'snaptik.app'
          }
        }
      }));

      Function(...k, script2)(...v);
    });
  }

  async get_hd_video(token) {
    const {
      data: {
        error,
        url
      }
    } = await this.axios({
      url: '/getHdLink.php?token=' + token
    });

    if (error) throw new Error(error);
    return url;
  }

  async parse_html(html) {
    const $ = cheerio.load(html);
    const is_video = !$('div.render-wrapper').length;

    return is_video ? await (async () => {
      const hd_token = $('div.video-links > button[data-tokenhd]').data('tokenhd');
      const hd_url = new URL(await this.get_hd_video(hd_token));
      const token = hd_url.searchParams.get('token');
      const {
        url
      } = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));

      return {
        type: 'video',
        data: {
          sources: [
            url,
            hd_url.href,
            ...$('div.video-links > a:not(a[href="/"])').toArray()
            .map(elem => $(elem).attr('href'))
            .map(x => x.startsWith('/') ? this.config.baseURL + x : x)
          ].map((...x) => new Resource(...x))
        }
      };
    })() : (x => x.data.photos.length == 1 ? ({
      ...x,
      type: 'photo',
      data: {
        sources: x.data.photos[0].sources
      }
    }) : x)({
      type: 'slideshow',
      data: {
        photos: $('div.columns > div.column > div.photo').toArray().map(elem => ({
          sources: [
            $(elem).find('img[alt="Photo"]').attr('src'),
            $(elem).find('a[data-event="download_albumPhoto_photo"]').attr('href')
          ].map((...x) => new Resource(...x))
        }))
      }
    });
  }
  
/*
  * Scraper By https://github.com/0x6a69616e
  * Forbidden to sell and delete my wm 
*/

  async process(url) {
    const script = await this.get_script(url);
    const {
      html,
      oembed_url
    } = await this.eval_script(script);

    const res = {
      ...(await this.parse_html(html)),
      url
    };

    return res.data.oembed_url = oembed_url, res;
  }
}


const apikeyAuth = ['tabawayoisaki', 'tabawahoshino'];
const client = new SnapTikClient();

// Routes
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

    const data = JSON.stringify(await client.process(url), null, 2)
    console.log('Processed data:', data);

    res.json(data)
  } catch (error) {
    console.error('Error in /tiktokdl endpoint:', error);

    let errorMessage = 'Internal Server Error';
    let statusCode = 500;

    if (error.message && error.message.includes('URL error')) {
      errorMessage = 'URL error. Please check again';
      statusCode = 400;
    } else if (error.response && error.response.status) {
      statusCode = error.response.status;
      errorMessage = error.message || `Request failed with status code ${statusCode}`;
    }

    res.status(statusCode).json({ error: errorMessage });
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