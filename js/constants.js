// ══════════════════════════════════════════════
// GLOBALS
// ══════════════════════════════════════════════
let allData = [];
let studioAlbums = [];

const ALBUM_COLOR_MAP = {};
const METAL_PALETTE = [
  "#d4e600",
  "#e8512a",
  "#3b9eff",
  "#ff3d6e",
  "#2ecc71",
  "#e67e22",
  "#9b59b6",
  "#1abc9c",
  "#f1c40f",
  "#e74c3c",
  "#5dade2",
  "#bdc3c7",
  "#d4e600",
];

const STUDIO_ALBUM_KEYS = [
  "Kill 'Em All",
  "Ride the Lightning",
  "Master of Puppets",
  "...And Justice for All",
  "Metallica",
  "Load",
  "Reload",
  "St. Anger",
  "Death Magnetic",
  "Hardwired...to Self-Destruct",
  "72 Seasons",
];

function normaliseAlbum(s) {
  return s
    .replace(/\u2026/g, "...")
    .replace(/\s*\(.*\)\s*$/, "")
    .trim()
    .toLowerCase();
}

const STUDIO_ALBUM_NORMALISED = STUDIO_ALBUM_KEYS.map(normaliseAlbum);

const tooltip = document.getElementById("tooltip");

function showTip(html, event) {
  tooltip.innerHTML = html;
  tooltip.style.opacity = 1;
  moveTip(event);
}
function moveTip(event) {
  const x = event.clientX + 16;
  const y = event.clientY - 10;
  tooltip.style.left = Math.min(x, window.innerWidth - 280) + "px";
  tooltip.style.top = y + "px";
}
function hideTip() {
  tooltip.style.opacity = 0;
}

function showTab(name) {
  document
    .querySelectorAll(".viz-section")
    .forEach((s) => s.classList.remove("active"));
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById("tab-" + name).classList.add("active");
  event.target.classList.add("active");
}

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  return lines.slice(1).map((line) => {
    const vals = [];
    let cur = "",
      inQ = false;
    for (let ch of line) {
      if (ch === '"') {
        inQ = !inQ;
      } else if (ch === "," && !inQ) {
        vals.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    vals.push(cur);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = vals[i] ? vals[i].replace(/"/g, "").trim() : "";
    });
    return obj;
  });
}

function isStudio(row) {
  return matchStudio(row.album) !== undefined;
}

function matchStudio(albumName) {
  const lower = albumName.toLowerCase();
  if (
    lower.includes("live") ||
    lower.includes("binge") ||
    lower.includes("motion picture") ||
    lower.includes("s&m") ||
    lower.includes("garage") ||
    lower.includes("lulu") ||
    lower.includes("six feet") ||
    lower.includes("helping hands") ||
    lower.includes("through the never")
  ) {
    return undefined;
  }
  const norm = normaliseAlbum(albumName);
  const idx = STUDIO_ALBUM_NORMALISED.indexOf(norm);
  return idx >= 0 ? STUDIO_ALBUM_KEYS[idx] : undefined;
}

function initData(raw) {
  raw.forEach((d) => {
    d.energy = +d.energy;
    d.danceability = +d.danceability;
    d.valence = +d.valence;
    d.tempo = +d.tempo;
    d.loudness = +d.loudness;
    d.acousticness = +d.acousticness;
    d.instrumentalness = +d.instrumentalness;
    d.liveness = +d.liveness;
    d.speechiness = +d.speechiness;
    d.popularity = +d.popularity;
    d.duration_ms = +d.duration_ms;
    const yr = d.release_date ? +d.release_date.split("-")[0] : 0;
    d.year = yr;
    d.loudness_abs = Math.abs(d.loudness);
    d.studioAlbum = matchStudio(d.album) || null;
  });

  allData = raw.filter(
    (d) => d.energy > 0 && d.name && !d.name.toLowerCase().includes("(null)"),
  );

  const albumMap = {};
  allData.forEach((d) => {
    if (d.studioAlbum && !albumMap[d.studioAlbum]) {
      albumMap[d.studioAlbum] = d.year;
    }
  });

  studioAlbums = Object.entries(albumMap)
    .sort((a, b) => a[1] - b[1])
    .map((e) => e[0]);

  studioAlbums.forEach((a, i) => {
    ALBUM_COLOR_MAP[a] = METAL_PALETTE[i % METAL_PALETTE.length];
  });

  document.getElementById("s-songs").textContent =
    allData.length.toLocaleString();
  document.getElementById("s-albums").textContent = studioAlbums.length;
  document.getElementById("s-energy").textContent = d3
    .mean(allData, (d) => d.energy)
    .toFixed(3);
  document.getElementById("s-tempo").textContent = Math.round(
    d3.mean(allData, (d) => d.tempo),
  );
  document.getElementById("s-loud").textContent = d3
    .mean(allData, (d) => d.loudness)
    .toFixed(1);

  document.getElementById("loading").style.display = "none";
  document.getElementById("tab-energy").classList.add("active");

  buildRadarControls();
  buildTimelineControls();
  buildSongPickerGrid();
  renderEnergy();
}
