window.addEventListener("DOMContentLoaded", () => {
  loadData();
});

// ══════════════════════════════════════════════
// 6. SONG RADAR
// ══════════════════════════════════════════════
const SONG_RADAR_METRICS = [
  "energy",
  "danceability",
  "valence",
  "acousticness",
  "instrumentalness",
  "liveness",
  "speechiness",
];
const SONG_RADAR_LABELS = [
  "Energy",
  "Dance",
  "Valence",
  "Acoustic",
  "Instrum.",
  "Liveness",
  "Speech",
];
let selectedSongs = [];

const SONG_COLORS = [
  "#d4e600",
  "#e8512a",
  "#3b9eff",
  "#ff3d6e",
  "#2ecc71",
  "#9b59b6",
];

function buildSongPickerGrid() {
  const grid = document.getElementById("songPickerGrid");
  grid.innerHTML = "";

  studioAlbums.forEach((album) => {
    const songs = allData
      .filter((d) => d.studioAlbum === album)
      .sort((a, b) => (+a.track_number || 0) - (+b.track_number || 0));
    if (!songs.length) return;

    const block = document.createElement("div");
    block.className = "album-picker-block";

    const albumColor = ALBUM_COLOR_MAP[album] || "#d4e600";
    block.style.borderTopColor = albumColor;

    block.innerHTML = `<h4 style="color:${albumColor}">${album}</h4>
      <div class="song-checkbox-list" id="songs-${cssId(album)}"></div>`;
    grid.appendChild(block);

    const list = block.querySelector(".song-checkbox-list");
    songs.forEach((song) => {
      const lbl = document.createElement("label");
      lbl.className = "song-check-label";
      const safeId = "song-" + song.spotify_id;
      lbl.innerHTML = `<input type="checkbox" id="${safeId}" value="${song.spotify_id}" onchange="toggleSong(this, '${safeId}')">
        <span>${song.name}</span>`;
      list.appendChild(lbl);
    });
  });
}

function cssId(str) {
  return str.replace(/[^a-zA-Z0-9]/g, "_");
}

function toggleSong(el, safeId) {
  const song = allData.find((d) => d.spotify_id === el.value);
  if (!song) return;

  if (el.checked) {
    if (selectedSongs.length >= 6) {
      el.checked = false;
      return;
    }
    const colorIdx = selectedSongs.length;
    song._radarColor = SONG_COLORS[colorIdx];
    selectedSongs.push(song);
    el.parentElement.classList.add("selected");
    el.parentElement.style.color = song._radarColor;
  } else {
    selectedSongs = selectedSongs.filter(
      (s) => s.spotify_id !== song.spotify_id,
    );
    el.parentElement.classList.remove("selected");
    el.parentElement.style.color = "";
    selectedSongs.forEach((s, i) => {
      s._radarColor = SONG_COLORS[i];
    });
    selectedSongs.forEach((s) => {
      const lbl = document.querySelector(
        `#song-${s.spotify_id}`,
      )?.parentElement;
      if (lbl) lbl.style.color = s._radarColor;
    });
  }

  document.getElementById("songRadarCount").textContent = selectedSongs.length;
  renderSongRadar();
}

function clearSongRadar() {
  selectedSongs = [];
  document
    .querySelectorAll('#songPickerGrid input[type="checkbox"]')
    .forEach((cb) => {
      cb.checked = false;
      cb.parentElement.classList.remove("selected");
      cb.parentElement.style.color = "";
    });
  document.getElementById("songRadarCount").textContent = "0";
  renderSongRadar();
}

function renderSongRadar() {
  const container = document.getElementById("songRadarChart");
  container.innerHTML = "";

  if (selectedSongs.length === 0) {
    container.innerHTML =
      '<div style="text-align:center;padding:60px;color:var(--silver);font-size:13px;letter-spacing:2px">SELECT SONGS ABOVE TO SEE THE RADAR</div>';
    return;
  }

  const W = Math.max(container.clientWidth - 20, 560);
  const H = 520;
  const legendW = 220;
  const cx = (W - legendW) / 2;
  const cy = H / 2;
  const r = Math.min(W - legendW, H) / 2 - 70;
  const N = SONG_RADAR_METRICS.length;
  const angleSlice = (Math.PI * 2) / N;

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", W)
    .attr("height", H);
  const g = svg.append("g").attr("transform", `translate(${cx},${cy})`);

  const rScale = d3.scaleLinear().domain([0, 1]).range([0, r]);

  const levels = 5;
  for (let lvl = 1; lvl <= levels; lvl++) {
    const rr = (r * lvl) / levels;
    g.append("polygon")
      .attr(
        "points",
        SONG_RADAR_METRICS.map((_, i) => {
          const a = angleSlice * i - Math.PI / 2;
          return `${rr * Math.cos(a)},${rr * Math.sin(a)}`;
        }).join(" "),
      )
      .attr("fill", "none")
      .attr("stroke", "#1e1e1e")
      .attr("stroke-width", 1);
    if (lvl % 2 === 0) {
      g.append("text")
        .attr("x", 4)
        .attr("y", -rr + 3)
        .style("fill", "#444")
        .style("font-size", "9px")
        .text(`${((lvl / levels) * 100).toFixed(0)}%`);
    }
  }

  SONG_RADAR_METRICS.forEach((_, i) => {
    const a = angleSlice * i - Math.PI / 2;
    g.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", r * Math.cos(a))
      .attr("y2", r * Math.sin(a))
      .attr("stroke", "#2a2a2a")
      .attr("stroke-width", 1.5);

    const labelR = r + 22;
    const lx = labelR * Math.cos(a);
    const ly = labelR * Math.sin(a);
    g.append("text")
      .attr("x", lx)
      .attr("y", ly + 4)
      .attr(
        "text-anchor",
        Math.abs(lx) < 10 ? "middle" : lx > 0 ? "start" : "end",
      )
      .style("fill", "#95a5a6")
      .style("font-size", "11px")
      .style("letter-spacing", "1px")
      .text(SONG_RADAR_LABELS[i]);
  });

  selectedSongs.forEach((song, si) => {
    const pts = SONG_RADAR_METRICS.map((key, i) => {
      const val = Math.max(0, Math.min(1, +song[key] || 0));
      const a = angleSlice * i - Math.PI / 2;
      const rr = rScale(val);
      return [rr * Math.cos(a), rr * Math.sin(a)];
    });

    const color = song._radarColor || SONG_COLORS[si % SONG_COLORS.length];

    g.append("polygon")
      .attr("points", pts.map((p) => p.join(",")).join(" "))
      .attr("fill", color)
      .attr("fill-opacity", 0.12)
      .attr("stroke", color)
      .attr("stroke-width", 2)
      .attr("class", "radar-area")
      .on("mousemove", (event) => {
        const lines = SONG_RADAR_METRICS.map(
          (key, i) =>
            `${SONG_RADAR_LABELS[i]}: ${(+song[key] * 100).toFixed(1)}%`,
        ).join("<br>");
        showTip(
          `<strong>${song.name}</strong>${song.studioAlbum}<br><br>${lines}`,
          event,
        );
      })
      .on("mouseleave", hideTip);

    pts.forEach(([px, py], i) => {
      g.append("circle")
        .attr("cx", px)
        .attr("cy", py)
        .attr("r", 3.5)
        .attr("fill", color)
        .attr("stroke", "#080808")
        .attr("stroke-width", 1);
    });
  });

  const legG = svg
    .append("g")
    .attr(
      "transform",
      `translate(${cx + r + 48}, ${cy - selectedSongs.length * 14})`,
    );
  legG
    .append("text")
    .attr("y", -10)
    .style("fill", "#555")
    .style("font-size", "10px")
    .style("letter-spacing", "2px")
    .text("SONGS");

  selectedSongs.forEach((song, i) => {
    const color = song._radarColor || SONG_COLORS[i];
    const row = legG.append("g").attr("transform", `translate(0,${i * 28})`);
    row
      .append("line")
      .attr("x1", 0)
      .attr("x2", 14)
      .attr("y1", 7)
      .attr("y2", 7)
      .attr("stroke", color)
      .attr("stroke-width", 2.5);
    row
      .append("circle")
      .attr("cx", 7)
      .attr("cy", 7)
      .attr("r", 3)
      .attr("fill", color);
    const nameShort =
      song.name.length > 22 ? song.name.slice(0, 20) + "…" : song.name;
    row
      .append("text")
      .attr("x", 20)
      .attr("y", 11)
      .style("fill", color)
      .style("font-size", "11px")
      .text(nameShort);
    row
      .append("text")
      .attr("x", 20)
      .attr("y", 22)
      .style("fill", "#555")
      .style("font-size", "9px")
      .text(
        song.studioAlbum.length > 24
          ? song.studioAlbum.slice(0, 22) + "…"
          : song.studioAlbum,
      );
  });
}

const _originalShowTab = showTab;
window.showTab = function (name) {
  _originalShowTab(name);
  if (name === "scatter") renderScatter();
  else if (name === "tempo") renderTempo();
  else if (name === "radar") renderRadar();
  else if (name === "timeline") renderTimeline();
  else if (name === "energy") renderEnergy();
  else if (name === "songradar") renderSongRadar();
};
