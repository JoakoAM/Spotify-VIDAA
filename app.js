// Leer token de URL o localStorage
const hash = window.location.hash;
let token = null;

if (hash) {
  const params = new URLSearchParams(hash.substring(1));
  token = params.get("access_token");
  if (token) localStorage.setItem("spotify_token", token);
  window.location.hash = ""; // limpiar URL
} else {
  token = localStorage.getItem("spotify_token");
}

// Mostrar sección de perfil si hay token
if (token) {
  document.getElementById("login-section").style.display = "none";
  document.getElementById("profile-section").style.display = "block";

  // Obtener perfil del usuario
  fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(profile => {
      document.getElementById("profile-pic").src = profile.images?.[0]?.url || "";
      document.getElementById("display-name").textContent = profile.display_name;
      document.getElementById("email").textContent = profile.email;
    });

  // Obtener playlists
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
}

// Función para cargar tracks de una playlist y reproducir
function loadTracks(playlistId) {
  if (!window.device_id) {
    console.error("El reproductor aún no está listo");
    return;
  }

  fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      const uris = data.items.map(item => item.track.uri).filter(Boolean);
      if (uris.length === 0) return;

      fetch(`https://api.spotify.com/v1/me/player/play?device_id=${window.device_id}`, {
        method: "PUT",
        body: JSON.stringify({ uris }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
    });
}

// Cargar Spotify Web Playback SDK
const script = document.createElement("script");
script.src = "https://sdk.scdn.co/spotify-player.js";
document.body.appendChild(script);

// Inicializar reproductor
window.onSpotifyWebPlaybackSDKReady = () => {
  const player = new Spotify.Player({
    name: "Mini Spotify Web Player",
    getOAuthToken: cb => cb(token),
    volume: 0.8
  });

  window.spotifyPlayer = player;

  // Listener: reproductor listo
  player.addListener("ready", ({ device_id }) => {
    console.log("Ready with Device ID", device_id);
    window.device_id = device_id;
    const controls = document.getElementById("player-controls");
    if (controls) controls.style.display = "block";
  });

  // Listener: cambios de estado de la reproducción
  player.addListener("player_state_changed", state => {
    if (!state || !state.track_window) return;

    const track = state.track_window.current_track;
    if (!track) return;

    // Actualizar tarjeta de reproducción
    const cover = document.getElementById("card-cover");
    const trackName = document.getElementById("card-track");
    const artistName = document.getElementById("card-artist");
    const progressBar = document.getElementById("card-progress");
    const timeNow = document.getElementById("card-time-now");
    const timeFull = document.getElementById("card-time-full");

    if (cover) cover.src = track.album.images?.[0]?.url || "";
    if (trackName) trackName.textContent = track.name;
    if (artistName) artistName.textContent = track.artists.map(a => a.name).join(", ");

    const progress = state.position;
    const duration = track.duration_ms;
    if (progressBar) progressBar.style.width = ((progress / duration) * 100) + "%";
    if (timeNow) timeNow.textContent = `${Math.floor(progress / 60000)}:${String(Math.floor((progress % 60000) / 1000)).padStart(2, "0")}`;
    if (timeFull) timeFull.textContent = `${Math.floor(duration / 60000)}:${String(Math.floor((duration % 60000) / 1000)).padStart(2, "0")}`;
  });

  player.connect();
};

// Controles de reproducción
document.getElementById("play")?.addEventListener("click", () => {
  window.spotifyPlayer?.togglePlay();
});
document.getElementById("next")?.addEventListener("click", () => {
  window.spotifyPlayer?.nextTrack();
});
document.getElementById("prev")?.addEventListener("click", () => {
  window.spotifyPlayer?.previousTrack();
});
