const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');

class Resource {
  constructor(url) {
    this.url = url;
  }

  download(config = {}) {
    return axios({
      url: this.url,
      responseType: 'stream',
      ...config
    });
  }
}

class SnapTikClient {
  constructor(config = {}) {
    this.axios = axios.create({
      baseURL: 'https://dev.snaptik.app',
      ...config,
    });
  }

  async get_token() {
    console.log('Fetching token...');
    const { data } = await this.axios({ url: '/' });
    const $ = cheerio.load(data);
    const token = $('input[name="token"]').val();
    if (!token) {
      throw new Error('Failed to fetch token.');
    }
    console.log('Token fetched:', token);
    return token;
  }

  async get_script(url) {
    console.log('Fetching script...');
    const form = new FormData();
    const token = await this.get_token();

    form.append('token', token);
    form.append('url', url);

    const { data } = await this.axios({
      url: '/abc2.php',
      method: 'POST',
      data: form
    });

    if (!data) {
      throw new Error('Failed to fetch script.');
    }

    console.log('Script fetched.');
    return data;
  }

  async eval_script(script1) {
    console.log('Evaluating script...');
    try {
      const script2 = await new Promise((resolve, reject) => {
        try {
          Function('resolve', 'window', 'document', 'XMLHttpRequest', 'app', script1)(
            resolve,
            { location: { hostname: 'snaptik.app' } },
            { getElementById: () => ({ src: '' }) },
            function() {
              return { open() {}, send() {} }
            },
            {
              showAlert: reject
            }
          );
        } catch (error) {
          reject(error);
        }
      });

      return new Promise((resolve, reject) => {
        let html = '';
        const [k, v] = ['keys', 'values'].map(x => Object[x]({
          $: () => Object.defineProperty({
            remove() {},
            style: { display: '' }
          }, 'innerHTML', { set: t => (html = t) }),
          app: { showAlert: reject },
          document: { getElementById: () => ({ src: '' }) },
          fetch: a => {
            return resolve({ html, oembed_url: a }), { json: () => ({ thumbnail_url: '' }) };
          },
          gtag: () => 0,
          Math: { round: () => 0 },
          XMLHttpRequest: function() {
            return { open() {}, send() {} }
          },
          window: { location: { hostname: 'snaptik.app' } }
        }));

        try {
          Function(...k, script2)(...v);
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      console.error('Error during script evaluation:', error);
      throw new Error('Script evaluation failed.');
    }
  }

  async get_hd_video(token) {
    console.log('Fetching HD video URL...');
    const { data: { error, url } } = await this.axios({
      url: '/getHdLink.php',
      params: { token }
    });

    if (error) throw new Error(error);
    console.log('HD video URL fetched:', url);
    return url;
  }

  async parse_html(html) {
    console.log('Parsing HTML...');
    const $ = cheerio.load(html);
    const is_video = !$('div.render-wrapper').length;

    if (is_video) {
      console.log('Detected video content.');
      const hd_token = $('div.video-links > button[data-tokenhd]').data('tokenhd');
      const hd_url = new URL(await this.get_hd_video(hd_token));
      const token = hd_url.searchParams.get('token');
      const { url } = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));

      return { 
        Engineer: 'Tabawa',
        type: 'video',
        data: {
          sources: [
            url,
            hd_url.href,
            ...$('div.video-links > a:not(a[href="/"])').toArray()
            .map(elem => $(elem).attr('href'))
            .map(x => x.startsWith('/') ? this.axios.defaults.baseURL + x : x)
          ].map(url => new Resource(url))
        }
      };
    } else {
      console.log('Detected slideshow content.');
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
  }

  async process(url) {
    console.log('Processing URL:', url);
    try {
      const script = await this.get_script(url);
      const { html, oembed_url } = await this.eval_script(script);

      const res = {
        ...(await this.parse_html(html)),
        url,
        oembed_url
      };

      console.log('Processing complete.');
      return res;
    } catch (error) {
      console.error('Error in process:', error);
      throw error;
    }
  }
}

module.exports = SnapTikClient;