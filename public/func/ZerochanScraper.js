const axios = require('axios');
const cheerio = require('cheerio');

class ZerochanScraper {
    constructor(query) {
        this.query = query;
        this.baseUrl = 'https://www.zerochan.net';
    }

    async fetchHtml(url) {
        try {
            const { data } = await axios.get(url);
            return cheerio.load(data);
        } catch (error) {
            console.error(`Gagal memuat halaman: ${url}`, error);
            throw error;
        }
    }

    async getAllImagesFromSearch() {
        const searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(this.query)}`;
        const $ = await this.fetchHtml(searchUrl);

        const images = [];
        $('#thumbs2 li').each((_, element) => {
            const id = $(element).attr('data-id');
            const thumbnailUrl = $(element).find('img').attr('data-src') || $(element).find('img').attr('src');
            const favorites = $(element).find('a.fav b').text() || '0';

            if (id) {
                images.push({ id, thumbnailUrl, favorites });
            }
        });

        return images;
    }

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

    async scrapeAllDetails() {
        const images = await this.getAllImagesFromSearch();
        if (images.length === 0) {
            console.log('Tidak ada gambar yang ditemukan.');
            return {
                status: 'failed',
                developer: 'Li Zhuanxie',
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
            developer: 'Li Zhuanxie',
            data: details,
        };
    }
}

module.exports = ZerochanScraper;