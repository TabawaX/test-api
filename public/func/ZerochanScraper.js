const axios = require('axios');
const cheerio = require('cheerio');

const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/91.0.4472.124',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15'
];

class ZerochanScraper {
    constructor(query, pages) {
        this.query = query;
        this.pages = pages;
        this.baseUrl = 'https://www.zerochan.net';
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async fetchHtml(url) {
        try {
            const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': userAgent
                }
            });
            await this.sleep(1000); // Menambahkan jeda 1 detik antara permintaan
            return cheerio.load(data);
        } catch (error) {
            console.error(`Gagal memuat halaman: ${url}`, error);
            throw error;
        }
    }

    async getAllImagesFromSearch(page) {
        const searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(this.query)}&p=${page}`;
        const { data } = await axios.get(searchUrl, {
            headers: {
                'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)]
            }
        });
        await this.sleep(1000); // Menambahkan jeda 1 detik antara permintaan

        if (data.includes('Page number too high')) {
            return {
                status: false,
                message: 'Too many pages'
            };
        }

        const $ = cheerio.load(data);
        const images = [];
        $('#thumbs2 li').each((_, element) => {
            const id = $(element).attr('data-id');
            const thumbnailUrl = $(element).find('img').attr('data-src') || $(element).find('img').attr('src');
            const favorites = $(element).find('a.fav b').text() || '0';

            if (id) {
                images.push({ id, thumbnailUrl, favorites });
            }
        });

        return { status: true, images };
    }

    async getImageDetails(imageId) {
        const detailUrl = `${this.baseUrl}/${imageId}`;
        const $ = await this.fetchHtml(detailUrl);
        await this.sleep(1000); // Menambahkan jeda 1 detik antara permintaan

        const fullImageUrl = $('#large a.preview').attr('href');
        const thumbnailUrl = $('#large a.preview img').attr('src');
        const title = $('#large a.preview img').attr('title');
        const altText = $('#large a.preview img').attr('alt');
        const resolution = $('#image-info li').first().text();
        const fileSize = $('#image-info li span').first().text();
        const tagsFromAlt = altText?.match(/Tags: (.+)/)?.[1]?.split(',).map(tag => tag.trim()) || [];
        const tagsFromP = $('#large p').text().split(',').map(tag => tag.trim());
        const tags = [...new Set([...tagsFromAlt, ...tagsFromP])];

        return {
            fullImageUrl,
            thumbnailUrl,
            title,
            altText,
            imageSize: {
                resolution: resolution atau 'Tidak diketahui',
                fileSize: fileSize atau 'Tidak diketahui',
            },
            tags: tags.length > 0 ? tags atau ['Tidak ada tag'],
        };
    }

    async scrapeAllDetails() {
        const images = [];
        for (let page of this.pages) {
            console.log(`Memuat halaman ${page}`);
            const result = await this.getAllImagesFromSearch(page);
            if (!result.status) {
                console.log(result.message);
                return {
                    status: 'failed',
                    developer: '@Li Zhuanxie',
                    message: result.message,
                    data: [],
                };
            }
            if (result.images.length === 0) {
                console.log(`Tidak ada gambar di halaman ${page}`);
                continue;
            }
            images.push(...result.images);
        }
        if (images.length === 0) {
            console.log('Tidak ada gambar yang ditemukan.');
            return {
                status: 'failed',
                developer: '@Li Zhuanxie',
                data: [],
            };
        }

        const details = await Promise.all(
            images.map(async (image) => {
                const imageDetails = await this.getImageDetails(image.id);
                return {
                    ...imageDetails,
                    favorites: image.favorites,
                };
            })
        );
        return {
            status: 'success',
            developer: '@Li Zhuanxie',
            data: details,
        };
    }
}

module.exports = ZerochanScraper;