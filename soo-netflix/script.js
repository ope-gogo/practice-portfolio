const API_URL = "https://api.themoviedb.org/3/movie/now_playing";
const IMG_BASE = "https://image.tmdb.org/t/p";

const heroEl = document.getElementById("hero");
const heroTitle = document.getElementById("hero-title");
const heroOverview = document.getElementById("hero-overview");
const rowEl = document.getElementById("row-posters");
const gridEl = document.getElementById("movie-grid");
const messageEl = document.getElementById("message");

// .env 파일을 읽어서 key=value 객체로 변환
async function loadEnv() {
  const res = await fetch(".env");
  if (!res.ok) throw new Error(".env 파일을 불러올 수 없습니다.");
  const text = await res.text();
  const env = {};
  text.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    env[key] = value;
  });
  return env;
}

// API Key(v3) 또는 Read Access Token(v4) 둘 다 지원
async function fetchNowPlaying(apiKey) {
  const params = new URLSearchParams({ language: "ko-KR", region: "KR", page: "1" });
  const options = { headers: { accept: "application/json" } };

  if (apiKey.startsWith("eyJ")) {
    options.headers.Authorization = `Bearer ${apiKey}`;
  } else {
    params.set("api_key", apiKey);
  }

  const res = await fetch(`${API_URL}?${params}`, options);
  if (!res.ok) throw new Error(`API 요청 실패 (${res.status})`);
  const data = await res.json();
  return data.results;
}

function createMovieCard(movie) {
  const card = document.createElement("div");
  card.className = "movie-card";

  if (movie.poster_path) {
    const img = document.createElement("img");
    img.src = `${IMG_BASE}/w342${movie.poster_path}`;
    img.alt = movie.title;
    img.loading = "lazy";
    card.appendChild(img);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "no-poster";
    placeholder.textContent = "포스터 없음";
    card.appendChild(placeholder);
  }

  const title = document.createElement("p");
  title.className = "movie-title";
  title.textContent = movie.title;
  card.appendChild(title);

  return card;
}

function renderHero(movie) {
  heroTitle.textContent = movie.title;
  heroOverview.textContent = movie.overview || "";
  if (movie.backdrop_path) {
    heroEl.style.backgroundImage = `url(${IMG_BASE}/original${movie.backdrop_path})`;
  }
}

function renderMovies(movies) {
  rowEl.innerHTML = "";
  gridEl.innerHTML = "";
  movies.forEach((movie) => {
    rowEl.appendChild(createMovieCard(movie));
    gridEl.appendChild(createMovieCard(movie));
  });
}

function setupRowArrows() {
  document.querySelector(".row-arrow.left").addEventListener("click", () => {
    rowEl.scrollBy({ left: -rowEl.clientWidth * 0.8 });
  });
  document.querySelector(".row-arrow.right").addEventListener("click", () => {
    rowEl.scrollBy({ left: rowEl.clientWidth * 0.8 });
  });
}

function setupHeaderScroll() {
  const header = document.getElementById("header");
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 50);
  });
}

async function init() {
  setupRowArrows();
  setupHeaderScroll();

  try {
    const env = await loadEnv();
    const apiKey = env.TMDB_API_KEY;
    if (!apiKey || apiKey.includes("여기에")) {
      throw new Error(".env 파일에 TMDB_API_KEY 값을 넣어주세요.");
    }

    const movies = await fetchNowPlaying(apiKey);
    if (!movies || movies.length === 0) {
      heroTitle.textContent = "현재 상영작이 없습니다.";
      return;
    }

    const heroMovie = movies.find((m) => m.backdrop_path) || movies[0];
    renderHero(heroMovie);
    renderMovies(movies);
  } catch (err) {
    console.error(err);
    heroTitle.textContent = "영화를 불러오지 못했습니다";
    messageEl.textContent = err.message + " (로컬 서버로 실행했는지 확인하세요: 예) python3 -m http.server 8000)";
  }
}

init();
