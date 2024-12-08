const axios = require('axios');
const cheerio = require('cheerio');

class ZerochanScraper {
    constructor(query, pages) {
        this.query = query;
        this.pages = pages;  // Array berisi halaman yang ingin di-scrape
        this.baseUrl = 'https://www.zerochan.net';
    }

    // Fungsi untuk mengambil HTML dari URL
    async fetchHtml(url) {
        try {
            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            return cheerio.load(data);
        } catch (error) {
            console.error(`Gagal memuat halaman: ${url}`, error);
            throw error;
        }
    }

    // Fungsi untuk mengambil gambar berdasarkan halaman
    async getAllImagesFromSearch(page) {
        const searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(this.query)}&p=${page}`;
        const { data } = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        // Cek apakah responnya mengandung pesan error (halaman terlalu tinggi)
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

    // Fungsi untuk mengambil detail gambar
    async getImageDetails(imageId) {
        const detailUrl = `${this.baseUrl}/${imageId}`;
        const $ = await this.fetchHtml(detailUrl);

        const fullImageUrl = $('#large a.preview').attr('href');
        const thumbnailUrl = $('#large a.preview img').attr('src');
        const title = $('#large a.preview img').attr('title');
        const altText = $('#large a.preview img').attr('alt');
        const resolution = $('#image-info li').first().text();
        const fileSize = $('#image-info li span').first().text();
        const tagsFromAlt = altText?.match(/Tags: (.+)/)?.[1]?.split(',').map(tag => tag.trim()) || [];
        const tagsFromP = $('#large p').text().split(',').map(tag => tag.trim());
        const tags = [...new Set([...tagsFromAlt, ...tagsFromP])];

        return {
            fullImageUrl,
            thumbnailUrl,
            title,
            altText,
            imageSize: {
                resolution: resolution || 'Tidak diketahui',
                fileSize: fileSize || 'Tidak diketahui',
            },
            tags: tags.length > 0 ? tags : ['Tidak ada tag'],
        };
    }

    // Fungsi utama untuk scrape semua halaman dan detail gambar
    async scrapeAllDetails() {
        const images = [];

        // Mengambil gambar dari beberapa halaman sesuai dengan input yang diberikan
        for (let page of this.pages) {
            console.log(`Memuat halaman ${page}`);
            const result = await this.getAllImagesFromSearch(page);

            if (!result.status) {
                console.log(result.message); // Jika halaman terlalu tinggi
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

        // Mengambil detail dari setiap gambar yang ditemukan
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