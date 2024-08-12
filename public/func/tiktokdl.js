const axios = require('axios');
const cheerio = require('cheerio');

class Tiktok {
  constructor() {}

  async slideDownloader(url) {
    try {
      const response = await axios.post(
        'https://ttsave.app/download',
        {
          query: url,
          language_id: '2'
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

      const download = [];
      $('a[onclick="bdl(this, event)"]').each((i, elem) => {
        const link = $(elem).attr('href');
        const type = $(elem).attr('type');
        const title = $(elem).text().trim();
        download.push({ link, type, title });
      });

      return { download };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

module.exports = Tiktok;