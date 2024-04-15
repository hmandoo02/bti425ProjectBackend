const http = require('http');

const API_KEY = process.env.LASTFM_API_KEY;
const API_BASE_URL = 'http://ws.audioscrobbler.com/2.0/';

module.exports.getTopRapAlbums = function () {
    const method = 'tag.getTopAlbums';
    const tag = 'rap';
    const url = `${API_BASE_URL}?method=${method}&tag=${tag}&api_key=${API_KEY}&format=json`;

    return new Promise((resolve, reject) => {
        http.get(url, response => {
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    if (jsonData.error) {
                        reject(jsonData.message);
                    } else {
                        resolve(jsonData.albums.album);
                    }
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', reject);
    });
}

module.exports.getAlbumInfo = function (artist, album) {
    const method = 'album.getinfo';
    const url = `${API_BASE_URL}?method=${method}&artist=${encodeURIComponent(artist)}&album=${encodeURIComponent(album)}&api_key=${API_KEY}&format=json`;
    
    return new Promise((resolve, reject) => {
        http.get(url, response => {
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    if (jsonData.error) {
                        reject(jsonData.message);
                    } else {
                        resolve(jsonData.album);
                    }
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', reject);
    });
}
