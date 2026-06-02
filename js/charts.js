// ══════════════════════════════════════════════
// 1. ENERGY BAR CHART
// ══════════════════════════════════════════════
function renderEnergy() {
  const container = document.getElementById("energyChart");
  container.innerHTML = "";

  const studioData = studioAlbums
    .map((album) => {
      const songs = allData.filter((d) => d.studioAlbum === album);
      return {
        album,
        energy: d3.mean(songs, (d) => d.energy),
        year: songs[0]?.year || 0,
        count: songs.length,
      };
    })
    .filter((d) => d.energy > 0);

  const sort = document.getElementById("energySort").value;
  if (sort === "value") studioData.sort((a, b) => b.energy - a.energy);
  else if (sort === "year") studioData.sort((a, b) => a.year - b.year);
  else studioData.sort((a, b) => a.album.localeCompare(b.album));

  const margin = { top: 20, right: 30, bottom: 110, left: 60 };
  const W = Math.max(container.clientWidth - 20, 600);
  const H = 420;
  const w = W - margin.left - margin.right;
  const h = H - margin.top - margin.bottom;

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", W)
    .attr("height", H);
  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3
    .scaleBand()
    .domain(studioData.map((d) => d.album))
    .range([0, w])
    .padding(0.22);
  const y = d3.scaleLinear().domain([0, 1]).range([h, 0]);

  g.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(""));

  g.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${h})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-40)")
    .attr("text-anchor", "end")
    .attr("dx", "-0.5em")
    .attr("dy", "0.2em")
    .style("fill", "#95a5a6")
    .style("font-size", "11px");
  g.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0%")));

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -h / 2)
    .attr("y", -46)
    .attr("text-anchor", "middle")
    .style("fill", "#7f8c8d")
    .style("font-size", "11px")
    .style("letter-spacing", "2px")
    .text("ENERGY (avg)");

  const bars = g
    .selectAll(".bar-rect")
    .data(studioData)
    .enter()
    .append("rect")
    .attr("class", "bar-rect")
    .attr("x", (d) => x(d.album))
    .attr("width", x.bandwidth())
    .attr("y", h)
    .attr("height", 0)
    .attr("fill", (d) => ALBUM_COLOR_MAP[d.album] || "#d4e600")
    .attr("opacity", 0.85);

  bars
    .transition()
    .duration(700)
    .delay((d, i) => i * 60)
    .attr("y", (d) => y(d.energy))
    .attr("height", (d) => h - y(d.energy));

  bars
    .on("mousemove", (event, d) => {
      showTip(
        `<strong>${d.album}</strong>Avg Energy: ${(d.energy * 100).toFixed(1)}%<br>Year: ${d.year}<br>Tracks: ${d.count}`,
        event,
      );
    })
    .on("mouseleave", hideTip);

  g.selectAll(".bar-label")
    .data(studioData)
    .enter()
    .append("text")
    .attr("x", (d) => x(d.album) + x.bandwidth() / 2)
    .attr("y", (d) => y(d.energy) - 6)
    .attr("text-anchor", "middle")
    .style("fill", "#d4e600")
    .style("font-size", "10px")
    .style("font-weight", "bold")
    .text((d) => (d.energy * 100).toFixed(0) + "%")
    .attr("opacity", 0)
    .transition()
    .delay((d, i) => i * 60 + 500)
    .attr("opacity", 1);
}

// ══════════════════════════════════════════════
// 2. SCATTER PLOT
// ══════════════════════════════════════════════
function renderScatter() {
  const container = document.getElementById("scatterChart");
  container.innerHTML = "";

  const xKey = document.getElementById("scatterX").value;
  const yKey = document.getElementById("scatterY").value;

  const data = allData.filter((d) => d.studioAlbum);

  const margin = { top: 20, right: 160, bottom: 60, left: 70 };
  const W = Math.max(container.clientWidth - 20, 680);
  const H = 500;
  const w = W - margin.left - margin.right;
  const h = H - margin.top - margin.bottom;

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", W)
    .attr("height", H);
  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const xVals = data.map((d) =>
    xKey === "loudness" ? d.loudness_abs : d[xKey],
  );
  const yVals = data.map((d) => d[yKey]);

  const x = d3
    .scaleLinear()
    .domain([d3.min(xVals) * 0.98, d3.max(xVals) * 1.02])
    .range([0, w]);
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(yVals) * 1.05])
    .range([h, 0]);

  const popExtent = d3.extent(data, (d) => d.popularity);
  const rScale = d3.scaleLinear().domain(popExtent).range([3, 10]);

  g.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y).ticks(6).tickSize(-w).tickFormat(""));
  g.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0,${h})`)
    .call(d3.axisBottom(x).ticks(6).tickSize(-h).tickFormat(""));

  g.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${h})`)
    .call(d3.axisBottom(x).ticks(6));
  g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(6));

  const labelMap = {
    energy: "Energy",
    danceability: "Danceability",
    tempo: "Tempo (BPM)",
    loudness: "Loudness (abs dB)",
    valence: "Valence",
    acousticness: "Acousticness",
    instrumentalness: "Instrumentalness",
    liveness: "Liveness",
  };
  g.append("text")
    .attr("x", w / 2)
    .attr("y", h + 48)
    .attr("text-anchor", "middle")
    .style("fill", "#7f8c8d")
    .style("font-size", "11px")
    .style("letter-spacing", "2px")
    .text(labelMap[xKey] || xKey.toUpperCase());
  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -h / 2)
    .attr("y", -52)
    .attr("text-anchor", "middle")
    .style("fill", "#7f8c8d")
    .style("font-size", "11px")
    .style("letter-spacing", "2px")
    .text(labelMap[yKey] || yKey.toUpperCase());

  const getXVal = (d) => (xKey === "loudness" ? d.loudness_abs : d[xKey]);
  g.selectAll(".scatter-dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "scatter-dot")
    .attr("cx", (d) => x(getXVal(d)))
    .attr("cy", (d) => y(d[yKey]))
    .attr("r", 0)
    .attr("fill", (d) => ALBUM_COLOR_MAP[d.studioAlbum] || "#d4e600")
    .attr("opacity", 0.6)
    .attr("stroke", "none")
    .on("mousemove", (event, d) => {
      showTip(
        `<strong>${d.name}</strong>${d.studioAlbum}<br>${labelMap[xKey]}: ${getXVal(d).toFixed(3)}<br>${labelMap[yKey]}: ${d[yKey].toFixed(3)}<br>Popularity: ${d.popularity}`,
        event,
      );
    })
    .on("mouseleave", hideTip)
    .transition()
    .duration(400)
    .delay((d, i) => Math.random() * 300)
    .attr("r", (d) => rScale(d.popularity));

  const legG = svg
    .append("g")
    .attr("transform", `translate(${margin.left + w + 16},${margin.top})`);
  legG
    .append("text")
    .attr("y", -4)
    .style("fill", "#7f8c8d")
    .style("font-size", "10px")
    .style("letter-spacing", "2px")
    .text("ALBUM");

  studioAlbums.forEach((a, i) => {
    const row = legG
      .append("g")
      .attr("transform", `translate(0,${i * 18 + 8})`)
      .style("cursor", "pointer");
    row
      .append("rect")
      .attr("width", 10)
      .attr("height", 10)
      .attr("rx", 2)
      .attr("fill", ALBUM_COLOR_MAP[a] || "#888");
    row
      .append("text")
      .attr("x", 14)
      .attr("y", 9)
      .style("fill", "#95a5a6")
      .style("font-size", "9px")
      .text(a.length > 20 ? a.slice(0, 18) + "…" : a);
  });

  legG
    .append("text")
    .attr("y", studioAlbums.length * 18 + 20)
    .style("fill", "#555")
    .style("font-size", "9px")
    .text("Size = popularity");
}

// ══════════════════════════════════════════════
// 3. TEMPO HISTOGRAM
// ══════════════════════════════════════════════
function renderTempo() {
  const binsEl = document.getElementById("tempoBins");
  const bins = +binsEl.value;
  document.getElementById("tempoBinVal").textContent = bins;

  const container = document.getElementById("tempoChart");
  container.innerHTML = "";

  const tempoData = allData
    .map((d) => d.tempo)
    .filter((t) => t > 40 && t < 280);

  const margin = { top: 20, right: 30, bottom: 60, left: 60 };
  const W = Math.max(container.clientWidth - 20, 600);
  const H = 420;
  const w = W - margin.left - margin.right;
  const h = H - margin.top - margin.bottom;

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", W)
    .attr("height", H);
  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([40, 280]).range([0, w]);
  const histogram = d3.bin().domain(x.domain()).thresholds(x.ticks(bins));
  const binned = histogram(tempoData);
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(binned, (d) => d.length)])
    .range([h, 0]);

  g.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y).ticks(6).tickSize(-w).tickFormat(""));
  g.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${h})`)
    .call(d3.axisBottom(x).ticks(10));
  g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(6));

  g.append("text")
    .attr("x", w / 2)
    .attr("y", h + 48)
    .attr("text-anchor", "middle")
    .style("fill", "#7f8c8d")
    .style("font-size", "11px")
    .style("letter-spacing", "2px")
    .text("TEMPO (BPM)");
  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -h / 2)
    .attr("y", -46)
    .attr("text-anchor", "middle")
    .style("fill", "#7f8c8d")
    .style("font-size", "11px")
    .style("letter-spacing", "2px")
    .text("TRACK COUNT");

  const defs = svg.append("defs");
  const grad = defs
    .append("linearGradient")
    .attr("id", "barGrad")
    .attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", 0)
    .attr("y2", h);
  grad.append("stop").attr("offset", "0%").attr("stop-color", "#d4e600");
  grad.append("stop").attr("offset", "100%").attr("stop-color", "#4a5a00");

  g.selectAll(".hist-bar")
    .data(binned)
    .enter()
    .append("rect")
    .attr("class", "bar-rect")
    .attr("x", (d) => x(d.x0) + 1)
    .attr("width", (d) => Math.max(0, x(d.x1) - x(d.x0) - 2))
    .attr("y", h)
    .attr("height", 0)
    .attr("fill", "url(#barGrad)")
    .attr("opacity", 0.85)
    .on("mousemove", (event, d) => {
      showTip(`<strong>${d.x0}–${d.x1} BPM</strong>Tracks: ${d.length}`, event);
    })
    .on("mouseleave", hideTip)
    .transition()
    .duration(500)
    .delay((d, i) => i * 15)
    .attr("y", (d) => y(d.length))
    .attr("height", (d) => h - y(d.length));

  const mean = d3.mean(tempoData);
  g.append("line")
    .attr("x1", x(mean))
    .attr("x2", x(mean))
    .attr("y1", 0)
    .attr("y2", h)
    .attr("stroke", "#e8f200")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "6,4")
    .attr("opacity", 0.8);
  g.append("text")
    .attr("x", x(mean) + 6)
    .attr("y", 16)
    .style("fill", "#e8f200")
    .style("font-size", "11px")
    .text(`μ = ${mean.toFixed(0)} BPM`);
}

// ══════════════════════════════════════════════
// 4. RADAR CHART
// ══════════════════════════════════════════════
const RADAR_METRICS = [
  "energy",
  "danceability",
  "valence",
  "acousticness",
  "instrumentalness",
  "liveness",
  "speechiness",
];
const RADAR_LABELS = [
  "Energy",
  "Dance",
  "Valence",
  "Acoustic",
  "Instrum.",
  "Liveness",
  "Speech",
];
let selectedRadarAlbums = [];

function buildRadarControls() {
  const wrap = document.getElementById("radarAlbumControls");
  wrap.innerHTML =
    '<span class="control-label" style="margin-right:8px">Select albums (max 4):</span>';
  selectedRadarAlbums = studioAlbums.slice(0, 4);

  studioAlbums.forEach((album) => {
    const checked = selectedRadarAlbums.includes(album);
    const lbl = document.createElement("label");
    lbl.className = "legend-item";
    lbl.innerHTML = `<span class="legend-swatch" style="background:${ALBUM_COLOR_MAP[album]};border:1px solid #333"></span>
      <input type="checkbox" style="display:none" value="${album}" ${checked ? "checked" : ""} onchange="toggleRadarAlbum(this)">
      ${album.length > 18 ? album.slice(0, 16) + "…" : album}`;
    wrap.appendChild(lbl);
  });
}

function toggleRadarAlbum(el) {
  if (el.checked) {
    if (selectedRadarAlbums.length >= 4) {
      el.checked = false;
      return;
    }
    selectedRadarAlbums.push(el.value);
  } else {
    selectedRadarAlbums = selectedRadarAlbums.filter((a) => a !== el.value);
  }
  renderRadar();
}

function renderRadar() {
  const container = document.getElementById("radarChart");
  container.innerHTML = "";

  const W = Math.max(container.clientWidth - 20, 500);
  const H = 500;
  const cx = W / 2,
    cy = H / 2,
    r = Math.min(W, H) / 2 - 80;
  const N = RADAR_METRICS.length;
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
        RADAR_METRICS.map((_, i) => {
          const a = angleSlice * i - Math.PI / 2;
          return `${rr * Math.cos(a)},${rr * Math.sin(a)}`;
        }).join(" "),
      )
      .attr("fill", "none")
      .attr("stroke", "#1e1e1e")
      .attr("stroke-width", 1);
    g.append("text")
      .attr("x", 4)
      .attr("y", -rr)
      .style("fill", "#444")
      .style("font-size", "9px")
      .text(((lvl / levels) * 100).toFixed(0) + "%");
  }

  RADAR_METRICS.forEach((m, i) => {
    const a = angleSlice * i - Math.PI / 2;
    const xEnd = r * Math.cos(a),
      yEnd = r * Math.sin(a);
    g.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", xEnd)
      .attr("y2", yEnd)
      .attr("stroke", "#2a2a2a")
      .attr("stroke-width", 1);
    const labelR = r + 22;
    g.append("text")
      .attr("x", labelR * Math.cos(a))
      .attr("y", labelR * Math.sin(a))
      .attr(
        "text-anchor",
        Math.abs(Math.cos(a)) < 0.1
          ? "middle"
          : Math.cos(a) < 0
            ? "end"
            : "start",
      )
      .attr("dominant-baseline", "middle")
      .style("fill", "#95a5a6")
      .style("font-size", "11px")
      .style("letter-spacing", "1px")
      .text(RADAR_LABELS[i]);
  });

  const lineGen = d3
    .lineRadial()
    .radius((d) => rScale(d.value))
    .angle((d, i) => angleSlice * i)
    .curve(d3.curveLinearClosed);

  selectedRadarAlbums.forEach((album, ai) => {
    const songs = allData.filter((d) => d.studioAlbum === album);
    const points = RADAR_METRICS.map((m) => ({
      metric: m,
      value: d3.mean(songs, (d) => d[m]) || 0,
    }));
    const color = ALBUM_COLOR_MAP[album] || "#d4e600";

    const pathData = points.map((p, i) => {
      const a = angleSlice * i - Math.PI / 2;
      return [rScale(p.value) * Math.cos(a), rScale(p.value) * Math.sin(a)];
    });

    g.append("path")
      .datum(points.map((p, i) => [angleSlice * i, p.value]))
      .attr("class", "radar-area")
      .attr(
        "d",
        d3
          .radialLine()
          .radius((d) => rScale(d[1]))
          .angle((d) => d[0])
          .curve(d3.curveLinearClosed)(
          points.map((p, i) => [angleSlice * i, p.value]),
        ),
      )
      .attr("fill", color)
      .attr("fill-opacity", 0.15)
      .attr("stroke", color)
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.9);

    points.forEach((p, i) => {
      const a = angleSlice * i - Math.PI / 2;
      g.append("circle")
        .attr("cx", rScale(p.value) * Math.cos(a))
        .attr("cy", rScale(p.value) * Math.sin(a))
        .attr("r", 4)
        .attr("fill", color)
        .attr("stroke", "#000")
        .attr("stroke-width", 1)
        .on("mousemove", (event) => {
          showTip(
            `<strong>${album}</strong>${RADAR_LABELS[i]}: ${(p.value * 100).toFixed(1)}%`,
            event,
          );
        })
        .on("mouseleave", hideTip);
    });
  });

  const legY = r + 50;
  const legX = -(selectedRadarAlbums.length - 1) * 80;
  selectedRadarAlbums.forEach((album, i) => {
    const lx = legX + i * 160;
    const legG = g
      .append("g")
      .attr("transform", `translate(${lx - 60}, ${legY})`);
    legG
      .append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("rx", 2)
      .attr("fill", ALBUM_COLOR_MAP[album] || "#888");
    legG
      .append("text")
      .attr("x", 16)
      .attr("y", 10)
      .style("fill", "#aaa")
      .style("font-size", "10px")
      .text(album.length > 20 ? album.slice(0, 18) + "…" : album);
  });
}

// ══════════════════════════════════════════════
// 5. TIMELINE LINE CHART
// ══════════════════════════════════════════════
const TIMELINE_METRICS = [
  { key: "energy", label: "Energy", color: "#d4e600" },
  { key: "danceability", label: "Danceability", color: "#e8512a" },
  { key: "valence", label: "Valence", color: "#2ecc71" },
  { key: "acousticness", label: "Acousticness", color: "#3b9eff" },
  { key: "instrumentalness", label: "Instrumentalness", color: "#9b59b6" },
];
let activeTimelineMetrics = ["energy", "valence"];

function buildTimelineControls() {
  const wrap = document.getElementById("timelineMetricControls");
  wrap.innerHTML =
    '<span class="control-label" style="margin-right:8px">Show:</span>';
  TIMELINE_METRICS.forEach((m) => {
    const lbl = document.createElement("label");
    lbl.className = "legend-item";
    const checked = activeTimelineMetrics.includes(m.key);
    lbl.innerHTML = `<span class="legend-swatch" style="background:${m.color}"></span>
      <input type="checkbox" style="display:none" value="${m.key}" ${checked ? "checked" : ""} onchange="toggleTimelineMetric(this)">
      ${m.label}`;
    wrap.appendChild(lbl);
  });
}

function toggleTimelineMetric(el) {
  if (el.checked) activeTimelineMetrics.push(el.value);
  else
    activeTimelineMetrics = activeTimelineMetrics.filter((k) => k !== el.value);
  renderTimeline();
}

function renderTimeline() {
  const container = document.getElementById("timelineChart");
  container.innerHTML = "";

  const albumAvgs = studioAlbums
    .map((album) => {
      const songs = allData.filter((d) => d.studioAlbum === album);
      const obj = { album, year: songs[0]?.year || 0 };
      TIMELINE_METRICS.forEach((m) => {
        obj[m.key] = d3.mean(songs, (d) => d[m.key]) || 0;
      });
      return obj;
    })
    .sort((a, b) => a.year - b.year);

  const margin = { top: 30, right: 160, bottom: 80, left: 60 };
  const W = Math.max(container.clientWidth - 20, 680);
  const H = 440;
  const w = W - margin.left - margin.right;
  const h = H - margin.top - margin.bottom;

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", W)
    .attr("height", H);
  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3
    .scaleLinear()
    .domain(d3.extent(albumAvgs, (d) => d.year))
    .range([0, w]);
  const y = d3.scaleLinear().domain([0, 1]).range([h, 0]);

  g.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(""));
  g.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${h})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(albumAvgs.length));
  g.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0%")));

  g.selectAll(".album-tick")
    .data(albumAvgs)
    .enter()
    .append("text")
    .attr("x", (d) => x(d.year))
    .attr("y", h + 42)
    .attr("text-anchor", "end")
    .attr("transform", (d) => `rotate(-35, ${x(d.year)}, ${h + 42})`)
    .style("fill", "#555")
    .style("font-size", "9px")
    .text((d) => d.album.slice(0, 16));

  activeTimelineMetrics.forEach((key) => {
    const meta = TIMELINE_METRICS.find((m) => m.key === key);
    if (!meta) return;

    const line = d3
      .line()
      .x((d) => x(d.year))
      .y((d) => y(d[key]))
      .curve(d3.curveCatmullRom);

    g.append("path")
      .datum(albumAvgs)
      .attr("fill", "none")
      .attr("stroke", meta.color)
      .attr("stroke-width", 2.5)
      .attr("stroke-opacity", 0.9)
      .attr("d", line)
      .attr("stroke-dasharray", function () {
        return this.getTotalLength();
      })
      .attr("stroke-dashoffset", function () {
        return this.getTotalLength();
      })
      .transition()
      .duration(1200)
      .attr("stroke-dashoffset", 0);

    g.selectAll(`.dot-${key}`)
      .data(albumAvgs)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.year))
      .attr("cy", (d) => y(d[key]))
      .attr("r", 5)
      .attr("fill", meta.color)
      .attr("stroke", "#000")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("mousemove", (event, d) => {
        showTip(
          `<strong>${d.album} (${d.year})</strong>${meta.label}: ${(d[key] * 100).toFixed(1)}%`,
          event,
        );
      })
      .on("mouseleave", hideTip);
  });

  const legG = svg
    .append("g")
    .attr("transform", `translate(${margin.left + w + 16},${margin.top})`);
  legG
    .append("text")
    .attr("y", -4)
    .style("fill", "#7f8c8d")
    .style("font-size", "10px")
    .style("letter-spacing", "2px")
    .text("METRIC");
  activeTimelineMetrics.forEach((key, i) => {
    const meta = TIMELINE_METRICS.find((m) => m.key === key);
    if (!meta) return;
    const row = legG
      .append("g")
      .attr("transform", `translate(0,${i * 20 + 8})`);
    row
      .append("line")
      .attr("x1", 0)
      .attr("x2", 16)
      .attr("y1", 5)
      .attr("y2", 5)
      .attr("stroke", meta.color)
      .attr("stroke-width", 2.5);
    row
      .append("text")
      .attr("x", 22)
      .attr("y", 9)
      .style("fill", "#95a5a6")
      .style("font-size", "11px")
      .text(meta.label);
  });
}
