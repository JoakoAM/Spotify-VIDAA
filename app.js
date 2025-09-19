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
  document.getElementById("player-section").style.display = "flex";

  // Perfil del usuario
  fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(profile => {
      document.getElementById("profile-pic").src = profile.images?.[0]?.url || "";
      document.getElementById("display-name").textContent = profile.display_name;
      document.getElementById("email").textContent = profile.email;
    });

  // Playlists
  fetch("https://api.spotify.com/v1/me/playlists", {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      const playlistsDiv = document.getElementById("playlists");
      data.items.forEach(pl => {
        const div = document.createElement("div");
        div.className = "playlist";
        div.innerHTML = `
          <img src="${pl.images?.[0]?.url || ''}" alt="Cover" style="width:100px">
          <p>${pl.name}</p>
          <p>Tracks: ${pl.tracks.total}</p>
        `;
        div.onclick = () => loadTracks(pl.id);
        playlistsDiv.appendChild(div);
      });
    });

  // Spotify Web Playback SDK
  window.onSpotifyWebPlaybackSDKReady = () => {
    const player = new Spotify.Player({
      name: "Mini Spotify Web Player",
      getOAuthToken: cb => { cb(token); },
      volume: 0.8
    });

    window.spotifyPlayer = player;

    // Ready
    player.addListener('ready', ({ device_id }) => {
      console.log('Ready with Device ID', device_id);
      window.device_id = device_id;
    });

    // Cambios de estado
    player.addListener('player_state_changed', state => {
      if (!state || !state.track_window) return;

      const track = state.track_window.current_track;
      const progress = state.position;
      const duration = track.duration_ms;

      document.getElementById("card-track").textContent = track.name;
      document.getElementById("card-artist").textContent = track.artists.map(a => a.name).join(", ");
      document.getElementById("card-cover").src = track.album.images[0]?.url || "";

      const percent = (progress / duration) * 100;
      document.getElementById("card-progress").style.width = percent + "%";

      document.getElementById("card-time-now").textContent =
        Math.floor(progress/60000) + ":" + String(Math.floor((progress%60000)/1000)).padStart(2,'0');
      document.getElementById("card-time-full").textContent =
        Math.floor(duration/60000) + ":" + String(Math.floor((duration%60000)/1000)).padStart(2,'0');
    });

    player.connect();

    // Botones
    document.getElementById("play").onclick = () => player.togglePlay();
    document.getElementById("next").onclick = () => player.nextTrack();
    document.getElementById("prev").onclick = () => player.previousTrack();
  };

  // Cargar SDK
  const script = document.createElement("script");
  script.src = "https://sdk.scdn.co/spotify-player.js";
  document.body.appendChild(script);
}

// Reproducir playlist
function loadTracks(playlistId) {
  if (!window.device_id) return;

  fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      const uris = data.items.map(item => item.track.uri);
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