const loginBtn = document.getElementById("login");
const userDiv = document.getElementById("user");

// Al hacer click, vamos a tu backend en Render
loginBtn.addEventListener("click", () => {
  window.location.href = "https://spotifyvidaabackend.onrender.com/login";
});

// Cuando Spotify redirige al frontend con el token en URL
window.addEventListener("load", () => {
  const hash = window.location.hash;
  if (hash) {
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get("access_token");
    if (token) {
      localStorage.setItem("spotify_token", token);
      loginBtn.style.display = "none";
      userDiv.innerHTML = `<p>✅ Conectado a Spotify</p>`;
    }
  }
});
