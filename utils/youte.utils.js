const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Извлекает videoId из URL
 */
function extractVideoId(url) {
    console.log('[extractVideoId] Input URL:', url);
    const match = url.match(/(?:v=|\/|v=|vi=)([0-9A-Za-z_-]{11})/);
    const videoId = match ? match[1] : null;
    console.log('[extractVideoId] Extracted videoId:', videoId);
    return videoId;
}

/**
 * Получает название YouTube-видео через парсинг HTML без API-ключа
 */
async function fetchYouTubeTitle(videoId) {
    console.log('[fetchYouTubeTitle] Requested videoId (no API key):', videoId);

    if (!videoId) {
        console.warn('[fetchYouTubeTitle] No videoId provided!');
        return null;
    }

    const url = `https://www.youtube.com/watch?v=${videoId}`;

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0', // имитируем браузер
            },
        });

        const $ = cheerio.load(response.data);
        let rawTitle = $('title').text();
        console.log('[fetchYouTubeTitle] Raw <title>:', rawTitle);

        // Обычно заголовок вида: "Название видео - YouTube"
        const title = rawTitle.replace(' - YouTube', '').trim();
        console.log('[fetchYouTubeTitle] Parsed title:', title);
        return title;

    } catch (err) {
        console.error('[fetchYouTubeTitle] Failed to fetch HTML:', err.message);
        return null;
    }
}

module.exports = {
    extractVideoId,
    fetchYouTubeTitle,
};
