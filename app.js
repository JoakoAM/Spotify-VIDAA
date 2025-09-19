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

// Funciones de reproducción
function play() {
  fetch("https://api.spotify.com/v1/me/player/play", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` }
  });
}

function pause() {
  fetch("https://api.spotify.com/v1/me/player/pause", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` }
  });
}

// Cargar canciones de una playlist
function loadTracks(playlistId) {
  fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      const controls = document.getElementById("player-controls");
      controls.style.display = "block";
      const current = document.getElementById("current-track");
      current.textContent = "Selecciona una canción para reproducir";
      // Por simplicidad solo mostramos las canciones
      console.log("Tracks:", data.items);
    });
}
