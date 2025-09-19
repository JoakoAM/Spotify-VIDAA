
const hash = window.location.hash;
let token = null;

if (hash) {
  const params = new URLSearchParams(hash.substring(1));
  token = params.get("access_token");
  if (token) localStorage.setItem("spotify_token", token);
  window.location.hash = "";
} else {
  token = localStorage.getItem("spotify_token");
}

if (token) {
  document.getElementById("login-section").style.display = "none";
  document.getElementById("profile-section").style.display = "block";

  // Perfil
  fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(profile => {
      document.getElementById("profile-pic").src = profile.images?.[0]?.url || "";
      document.getElementById("display-name").textContent = profile.display_name;
      document.getElementById("email").textContent = profile.email;
    });

  // // Playlists
  // fetch("https://api.spotify.com/v1/me/playlists", {
  //   headers: { Authorization: `Bearer ${token}` }
  // })
  //   .then(res => res.json())
  //   .then(data => {
  //     const playlistsDiv = document.getElementById("playlists");
  //     data.items.forEach(pl => {
  //       const div = document.createElement("div");
  //       div.className = "playlist";
  //       div.innerHTML = `
  //           <img src="${pl.images?.[0]?.url || ''}" alt="Cover" style="width:100px">
  //           <p>${pl.name}</p>
  //           <p>Tracks: ${pl.tracks.total}</p>
  //         `;
  //       div.onclick = () => loadTracks(pl.id);
  //       playlistsDiv.appendChild(div);
  //     });
  //   });
}

// Web Playback SDK
window.onSpotifyWebPlaybackSDKReady = () => {
  const player = new Spotify.Player({
    name: "Mini Spotify Web Player",
    getOAuthToken: cb => { cb(token); },
    volume: 0.8
  });

  player.addListener('ready', ({ device_id }) => {
    console.log('Ready with Device ID', device_id);
    window.device_id = device_id;
    document.getElementById("player-controls").style.display = "block";
  });

  player.addListener('player_state_changed', state => {
    if (!state) return;
    fetch("https://api.spotify.com/v1/me/player", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (!data.item) {
          console.log("No hay canción reproduciéndose ahora.");
          return;
        }
        const containerTrack = document.getElementById("current-track")
        const trackName = data.item.name;
        const artistName = data.item.artists.map(a => a.name).join(", ");
        containerTrack.textContent =
      `Canción actual: ${trackName} - ${artistName}`;
        const albumCover = data.item.album.images[0].url;
        containerTrack.insertAdjacentHTML("beforeend",`
          <img class="spotify-Port" src=${albumCover} alt="Spotify Port">
          `)      
      });
  });

  player.connect();
  window.spotifyPlayer = player;
};

function play() { window.spotifyPlayer?.resume(); }
function pause() { window.spotifyPlayer?.pause(); }
function next() { window.spotifyPlayer?.nextTrack(); }
function previous() { window.spotifyPlayer?.previousTrack(); }

// Cargar tracks de una playlist y reproducir
function loadTracks(playlistId) {
  fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      const uris = data.items.map(item => item.track.uri);
      // Reproducir todos los tracks de la playlist
      fetch(`https://api.spotify.com/v1/me/player/play?device_id=${window.device_id}`, {
        method: 'PUT',
        body: JSON.stringify({ uris }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    });
}



function llamarFoto() {
  fetch("https://api.spotify.com/v1/me/player", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(data => {
      if (!data.item) {
        console.log("No hay canción reproduciéndose ahora.");
        return;
      }

      const trackName = data.item.name;
      const artistName = data.item.artists.map(a => a.name).join(", ");
      const albumCover = data.item.album.images[0].url;

      console.log("Canción:", trackName);
      console.log("Artista:", artistName);
      console.log("Portada:", albumCover);
    });
}