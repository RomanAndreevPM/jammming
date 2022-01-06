const clientId = '846ebcbbaf3c4c84a6c53b2127c16fea';
const redirectUri = 'http://localhost:3000/';


let accessToken;
const Spotify = {
    getAccessToken() {
        if(accessToken) {
            return accessToken;
        }

        // check for access token match
        const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
        const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);

        if (accessTokenMatch && expiresInMatch) {
            accessToken = accessTokenMatch[1];
            const expiresIn = Number(expiresInMatch[1]);
            // clear the parameters to grab the new access after token expiration

            window.setTimeout(() => accessToken = '', expiresIn * 1000);
            window.history.pushState('Access Token', null, '/');
            return accessToken;
        } else {
            const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUri}`;
            window.location = accessUrl;
        }
    },

    async search(term) {
        const accessToken = Spotify.getAccessToken();
        
        try {
            const response = await fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, {
                headers: {
                  Authorization: `Bearer ${accessToken}`
                }
            });
            if (response.ok) {
                const jsonResponse = await response.json();
                
                if (!jsonResponse.tracks) {
                    return [];
                }
                return jsonResponse.tracks.items.map(track => ({
                    id: track.id,
                    name: track.name,
                    artist: track.artists[0].name,
                    album: track.album.name,
                    uri: track.uri
                }))
            }
            throw new Error('Request failed!');
        } catch(e) {
            console.log(e);
        }
    },

    savePlaylist(playlistName, tracksUris) {
        if(!playlistName || !tracksUris) {
            return;
        }

        const accessToken = Spotify.getAccessToken();
        const headers = { Authorization: `Bearer ${accessToken}` };
        let userId;

        return fetch('https://api.spotify.com/v1/me', { headers: headers }).then(response => {
            if(response.ok) {
                return response.json();
            }
            throw new Error('Request failed!')
        }).then(jsonResponse => {
            userId = jsonResponse.id;
            fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ name: playlistName })
            }).then(response => {
                if(response.ok) {
                    return response.json();
                }
                throw new Error('Request failed!')
            }).then(jsonResponse => {
                const playlistId = jsonResponse.id;
                return fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({ uris: tracksUris })
                })
            })
        })
    }
};

export default Spotify;