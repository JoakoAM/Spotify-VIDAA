// Extraer access token si viene en la URL
const hash = window.location.hash.substring(1).split("&").reduce((acc, item) => {
  const [key, value] = item.split("=");
  acc[key] = value;
  return acc;
}, {});
const accessToken = hash.access_token || null;

// Si hay access token, ocultar login y mostrar perfil
if (accessToken) {
  document.getElementById("login-section").style.display = "none";
  document.getElementById("profile-section").style.display = "block";
  fetchProfile();
  startPlayerUpdates();
}

// Obtener perfil del usuario
async function fetchProfile() {
  try {
    const res = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    document.getElementById("profile-pic").src = data.images[0]?.url || "";
    document.getElementById("display-name").innerText = data.display_name;
    document.getElementById("email").innerText = data.email;
  } catch (err) {
    console.error("Error obteniendo perfil:", err);
  }
}

// Actualizar canción actual y barra de progreso
let songDuration = 0;
let progressInterval;

async function startPlayerUpdates() {
  await fetchCurrentTrack();
  setInterval(fetchCurrentTrack, 5000); // refresca cada 5s
}

async function fetchCurrentTrack() {
  try {
    const res = await fetch("https://spotifyvidaabackend.onrender.com/current");
    const data = await res.json();

    if (!data.item) {
      document.getElementById("current-track").innerText = "Canción actual: -";
      return;
    }

    const track = data.item;
    const progress_ms = data.progress_ms || 0;
    songDuration = track.duration_ms;

    document.getElementById("current-track").innerHTML = `
      <img src="${track.album.images[0].url}" alt="Portada" style="width:80px; display:block; margin:auto; border-radius:5px;">
      <strong>${track.name}</strong> - ${track.artists.map(a => a.name).join(", ")}
      <div style="margin-top:5px;">
        <span id="currentTime">0:00</span>
        <input id="progressBar" type="range" min="0" max="100" value="${(progress_ms/songDuration)*100}" style="width:60%;">
        <span id="duration">${formatTime(songDuration)}</span>
      </div>
    `;

    clearInterval(progressInterval);
    let startTime = progress_ms;
    progressInterval = setInterval(() => {
      startTime += 1000;
      if (startTime > songDuration) startTime = songDuration;
      const progressBar = document.getElementById("progressBar");
      progressBar.value = (startTime / songDuration) * 100;
      document.getElementById("currentTime").innerText = formatTime(startTime);
    }, 1000);

  } catch (err) {
    console.error("Error obteniendo canción:", err);
  }
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2,"0")}`;
}

// Controles de reproducción usando Web API de Spotify
async function play() {
  await controlPlayer("play");
}
async function pause() {
  await controlPlayer("pause");
}
async function next() {
  await controlPlayer("next");
}
async function previous() {
  await controlPlayer("previous");
}

async function controlPlayer(action) {
  try {
    const endpoint = `https://api.spotify.com/v1/me/player/${action}`;
    await fetch(endpoint, {
      method: action === "play" ? "PUT" : "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (err) {
    console.error("Error controlando reproductor:", err);
  }
}

// Botón extra de prueba
function llamarFoto() {
  alert("Esto puede usarse para llamar la foto de la canción o perfil");
}
