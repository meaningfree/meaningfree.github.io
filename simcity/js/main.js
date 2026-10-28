import {
  TOOLS, SPEEDS, DIFFICULTY, BUILD_SIZE, Building, cityRank, formatMoney, MAP_W, MAP_H, TILE,
} from "./constants.js";
import { generateMap, landPercent } from "./mapgen.js";
import { City } from "./city.js";
import { Renderer } from "./render.js";
import { Input } from "./input.js";

const SAVE_KEY = "dotcity-sfc-v1";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

let city = null;
let renderer = null;
let input = null;
let tool = "pan";
let speedIdx = 1;
let lastStep = 0;
let lastDragCell = null;
let running = false;
let toastTimer = 0;

function init() {
  buildToolDock();
  bindTitleScreen();
  bindHud();
  bindSheets();

  const canvas = $("#game");
  renderer = new Renderer(canvas);
  window.addEventListener("resize", () => {
    renderer.resize();
    if (city) draw();
  });

  // タイトルのマッププレビュー
  updateMapPreview(61);

  // セーブがあれば続きから
  const saved = localStorage.getItem(SAVE_KEY);
  if (saved) $("#btn-continue").hidden = false;

  requestAnimationFrame(loop);
}

function buildToolDock() {
  const scroll = $(".tool-scroll");
  scroll.innerHTML = "";
  for (const t of TOOLS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tool" + (t.id === "zoneR" ? " zone-r" : t.id === "zoneC" ? " zone-c" : t.id === "zoneI" ? " zone-i" : "");
    btn.dataset.tool = t.id;
    btn.innerHTML = `<span class="ico" aria-hidden="true">${t.icon}</span><span class="name">${t.label}</span>`;
    if (t.id === tool) btn.classList.add("active");
    btn.addEventListener("click", () => selectTool(t.id));
    scroll.appendChild(btn);
  }
}

function selectTool(id) {
  tool = id;
  $$(".tool").forEach((b) => b.classList.toggle("active", b.dataset.tool === id));
  const t = TOOLS.find((x) => x.id === id);
  $("#dock-tool-name").textContent = t ? t.label : "";
  $("#dock-tool-cost").textContent = t && t.cost ? `$${t.cost}` : "";
  // ハプティクス
  if (navigator.vibrate) navigator.vibrate(8);
}

function bindTitleScreen() {
  const mapInput = $("#map-no");
  mapInput.addEventListener("input", () => {
    let n = parseInt(mapInput.value, 10);
    if (Number.isNaN(n)) n = 0;
    n = Math.max(0, Math.min(999, n));
    updateMapPreview(n);
  });
  $("#map-prev").addEventListener("click", () => {
    let n = (parseInt(mapInput.value, 10) || 0) - 1;
    if (n < 0) n = 999;
    mapInput.value = n;
    updateMapPreview(n);
  });
  $("#map-next").addEventListener("click", () => {
    let n = (parseInt(mapInput.value, 10) || 0) + 1;
    if (n > 999) n = 0;
    mapInput.value = n;
    updateMapPreview(n);
  });

  $$(".diff-pills button").forEach((b) => {
    b.addEventListener("click", () => {
      $$(".diff-pills button").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
    });
  });

  $("#btn-new").addEventListener("click", () => {
    const name = ($("#city-name").value || "マイシティ").slice(0, 12);
    const mapNo = Math.max(0, Math.min(999, parseInt($("#map-no").value, 10) || 61));
    const diff = $(".diff-pills button.active")?.dataset.diff || "easy";
    startGame({ name, mapNo, difficulty: diff });
  });

  $("#btn-continue").addEventListener("click", () => {
    try {
      const data = JSON.parse(localStorage.getItem(SAVE_KEY));
      city = City.fromJSON(data);
      enterGame();
      showToast("セーブデータを読みこんだよ", "info");
    } catch {
      showToast("セーブがよめなかった…", "bad");
    }
  });

  $("#btn-howto").addEventListener("click", () => {
    $("#sheet-howto").hidden = false;
  });
}

function updateMapPreview(mapNo) {
  const map = generateMap(mapNo);
  const c = $("#map-preview");
  c.width = MAP_W;
  c.height = MAP_H;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(MAP_W, MAP_H);
  for (let i = 0; i < map.terrain.length; i++) {
    const t = map.terrain[i];
    let r, g, b;
    if (t === 1) { r = 42; g = 106; b = 170; }
    else if (t === 2) { r = 45; g = 107; b = 40; }
    else if (t === 3) { r = 58; g = 138; b = 52; }
    else { r = 74; g = 143; b = 60; }
    img.data[i * 4] = r;
    img.data[i * 4 + 1] = g;
    img.data[i * 4 + 2] = b;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  $("#map-land").textContent = `陸地 ${landPercent(map)}% · マップ #${String(mapNo).padStart(3, "0")}`;
}

function startGame(opts) {
  city = new City(opts);
  city.addMessage(`ようこそ、市長！「${city.name}」のまちづくりをはじめよう。`, "good");
  city.addMessage("はつでんしょ → ゾーン → どうろ・でんせん のじゅんばんがコツだよ。", "info");
  enterGame();
}

function enterGame() {
  $("#title-screen").hidden = true;
  const gui = $("#game-ui");
  gui.hidden = false;
  gui.style.display = "contents";
  running = true;
  speedIdx = 1;
  updateSpeedButtons();
  renderer.resize();
  renderer.camX = MAP_W * TILE / 2;
  renderer.camY = MAP_H * TILE / 2;
  renderer.zoom = 3;

  if (!input) {
    input = new Input($("#game"), {
      getTool: () => tool,
      getZoom: () => renderer.zoom,
      onTap: handleTap,
      onDragBuild: handleDragBuild,
      onDragEnd: () => { lastDragCell = null; },
      onPan: (dx, dy) => {
        renderer.camX -= dx / renderer.zoom;
        renderer.camY -= dy / renderer.zoom;
        renderer.clampCam();
      },
      onZoom: (z, ax, ay) => renderer.setZoom(z, ax, ay),
      onHover: handleHover,
    });
  }

  selectTool("pan");
  updateHud();
  draw();
  // 初回アドバイス
  setTimeout(() => showAdvisor(city.advisorTip()), 600);
}

function bindHud() {
  $$(".speed-group button").forEach((b) => {
    b.addEventListener("click", () => {
      speedIdx = parseInt(b.dataset.speed, 10);
      updateSpeedButtons();
    });
  });
  $("#btn-menu").addEventListener("click", () => { $("#sheet-menu").hidden = false; });
  $("#btn-budget").addEventListener("click", () => openBudget());
  $("#btn-maps").addEventListener("click", () => openMaps());
  $("#btn-advisor").addEventListener("click", () => showAdvisor(city.advisorTip()));

  $("#minimap").addEventListener("pointerdown", onMinimapJump);
  $("#minimap").addEventListener("pointermove", (e) => {
    if (e.buttons) onMinimapJump(e);
  });
}

function onMinimapJump(e) {
  if (!city) return;
  const r = e.target.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * MAP_W;
  const y = ((e.clientY - r.top) / r.height) * MAP_H;
  renderer.camX = x * TILE;
  renderer.camY = y * TILE;
  renderer.clampCam();
}

function updateSpeedButtons() {
  $$(".speed-group button").forEach((b) => {
    b.classList.toggle("active", parseInt(b.dataset.speed, 10) === speedIdx);
  });
}

function bindSheets() {
  $$("[data-close]").forEach((b) => {
    b.addEventListener("click", () => {
      b.closest(".sheet").hidden = true;
    });
  });
  $$(".sheet").forEach((s) => {
    s.addEventListener("click", (e) => {
      if (e.target === s) s.hidden = true;
    });
  });

  $("#btn-save").addEventListener("click", () => {
    if (!city) return;
    localStorage.setItem(SAVE_KEY, JSON.stringify(city.toJSON()));
    showToast("セーブしたよ", "good");
    $("#sheet-menu").hidden = true;
  });
  $("#btn-title").addEventListener("click", () => {
    if (city) localStorage.setItem(SAVE_KEY, JSON.stringify(city.toJSON()));
    running = false;
    city = null;
    const gui = $("#game-ui");
    gui.hidden = true;
    gui.style.display = "";
    $("#title-screen").hidden = false;
    $("#sheet-menu").hidden = true;
    $("#btn-continue").hidden = !localStorage.getItem(SAVE_KEY);
  });
  $("#btn-disaster").addEventListener("click", () => {
    $("#sheet-menu").hidden = true;
    $("#sheet-disaster").hidden = false;
  });
  $$("[data-disaster]").forEach((b) => {
    b.addEventListener("click", () => {
      if (!city) return;
      city.triggerDisaster(b.dataset.disaster);
      $("#sheet-disaster").hidden = true;
      showToast(city.messages[0]?.text || "さいがい！", "bad");
    });
  });
  $("#chk-disaster").addEventListener("change", (e) => {
    if (city) city.disastersEnabled = e.target.checked;
  });

  // 予算スライダー
  ["tax", "fund-road", "fund-police", "fund-fire"].forEach((id) => {
    const el = $("#" + id);
    el?.addEventListener("input", () => {
      if (!city) return;
      if (id === "tax") city.taxRate = parseInt(el.value, 10);
      if (id === "fund-road") city.fundRoad = parseInt(el.value, 10);
      if (id === "fund-police") city.fundPolice = parseInt(el.value, 10);
      if (id === "fund-fire") city.fundFire = parseInt(el.value, 10);
      updateBudgetLabels();
    });
  });

  $$("[data-overlay]").forEach((b) => {
    b.addEventListener("click", () => {
      const o = b.dataset.overlay;
      renderer.overlay = renderer.overlay === o ? null : (o === "none" ? null : o);
      $("#sheet-maps").hidden = true;
      showToast(renderer.overlay ? `マップ: ${b.textContent}` : "マップを閉じた", "info");
    });
  });
}

function openBudget() {
  if (!city) return;
  $("#tax").value = city.taxRate;
  $("#fund-road").value = city.fundRoad;
  $("#fund-police").value = city.fundPolice;
  $("#fund-fire").value = city.fundFire;
  updateBudgetLabels();
  const b = city.lastBudget;
  $("#budget-summary").textContent = b
    ? `前回決算 税収$${b.taxIncome} / 支出$${b.roadCost + b.policeCost + b.fireCost}`
    : "まだ決算前だよ（毎年1月に決算）";
  $("#sheet-budget").hidden = false;
}

function updateBudgetLabels() {
  if (!city) return;
  $("#tax-val").textContent = city.taxRate + "%";
  $("#fund-road-val").textContent = city.fundRoad + "%";
  $("#fund-police-val").textContent = city.fundPolice + "%";
  $("#fund-fire-val").textContent = city.fundFire + "%";
}

function openMaps() {
  $("#sheet-maps").hidden = false;
}

function handleTap(sx, sy) {
  if (!city) return;
  const { x, y } = renderer.screenToWorld(sx, sy);
  if (tool === "pan") return;
  if (tool === "inspect") {
    showInspect(city.inspect(x, y));
    return;
  }
  const ok = city.applyTool(tool, x, y);
  if (ok) {
    if (navigator.vibrate) navigator.vibrate(6);
    updateHud();
  } else {
    const cost = city.toolCostAt(tool, x, y);
    if (city.funds < cost) showToast("おかねが足りないよ", "warn");
  }
}

function handleDragBuild(sx, sy, isStart) {
  if (!city) return;
  if (tool === "pan" || tool === "inspect") return;
  // 線系のみドラッグ建設
  const lineTools = ["road", "rail", "wire", "bulldoze", "park"];
  if (!lineTools.includes(tool) && !isStart) return;
  const { x, y } = renderer.screenToWorld(sx, sy);
  const key = `${x},${y}`;
  if (key === lastDragCell) return;
  lastDragCell = key;
  if (city.applyTool(tool, x, y)) {
    updateHud();
  }
}

function handleHover(sx, sy) {
  if (!city || !renderer) return;
  const { x, y } = renderer.screenToWorld(sx, sy);
  const t = TOOLS.find((a) => a.id === tool);
  if (!t || tool === "pan" || tool === "inspect") {
    renderer.ghost = null;
    return;
  }
  const size = t.size || 1;
  let ok = true;
  if (size > 1) {
    for (let dy = 0; dy < size && ok; dy++) {
      for (let dx = 0; dx < size && ok; dx++) {
        const tx = x + dx, ty = y + dy;
        if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) ok = false;
        else if (city.terrain[ty * MAP_W + tx] === 1) ok = false;
        else if (city.building[ty * MAP_W + tx]) ok = false;
      }
    }
    ok = ok && city.funds >= (t.cost || 0);
  } else {
    ok = city.funds >= city.toolCostAt(tool, x, y);
  }
  renderer.ghost = { x, y, size, ok };
  $("#dock-tool-cost").textContent = `$${city.toolCostAt(tool, x, y)}`;
}

function showInspect(info) {
  const card = $("#inspect-card");
  if (!info) { card.hidden = true; return; }
  const names = {
    0: "くち", 1: "みず", 2: "もり", 3: "き",
  };
  const bnames = {
    [Building.ZONE_R]: "じゅうたくゾーン",
    [Building.ZONE_C]: "しょうぎょうゾーン",
    [Building.ZONE_I]: "こうぎょうゾーン",
    [Building.POLICE]: "けいさつしょ",
    [Building.FIRE]: "しょうぼうしょ",
    [Building.STADIUM]: "スタジアム",
    [Building.SEAPORT]: "みなと",
    [Building.COAL]: "せきたんはつでん",
    [Building.NUCLEAR]: "げんしりょくはつでん",
    [Building.AIRPORT]: "くうこう",
  };
  const title = info.building ? (bnames[info.building] || "たてもの") : (names[info.terrain] || "とち");
  card.innerHTML = `
    <h3>${title}</h3>
    <p>(${info.x}, ${info.y})</p>
    <p>ちか $${info.landValue} · でんき ${info.powered ? "ON" : "OFF"}</p>
    <p>おせん ${info.pollution} · はんざい ${info.crime}</p>
    <p>レベル ${info.level} · こうつう ${info.traffic}</p>
  `;
  card.hidden = false;
}

function showToast(text, kind = "info") {
  const el = $("#toast");
  el.textContent = text;
  el.className = kind === "info" ? "" : kind;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
}

function showAdvisor(text) {
  const box = $("#advisor");
  box.hidden = false;
  $("#advisor-text").textContent = text;
  // 顔を描く
  const face = $("#advisor-face");
  const ctx = face.getContext("2d");
  face.width = 48; face.height = 48;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#3a5a48";
  ctx.fillRect(0, 0, 48, 48);
  // ドット博士
  ctx.fillStyle = "#f0d8b0";
  ctx.fillRect(12, 14, 24, 26);
  ctx.fillStyle = "#2a2a2a";
  ctx.fillRect(10, 8, 28, 8); // 髪
  ctx.fillRect(14, 6, 20, 4);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(16, 22, 6, 4); // 眼鏡
  ctx.fillRect(26, 22, 6, 4);
  ctx.fillRect(22, 23, 4, 2);
  ctx.fillStyle = "#fff";
  ctx.fillRect(17, 23, 4, 2);
  ctx.fillRect(27, 23, 4, 2);
  ctx.fillStyle = "#c45c3a";
  ctx.fillRect(20, 30, 8, 3); // 口ひげ
  ctx.fillStyle = "#5a3a20";
  ctx.fillRect(22, 34, 4, 2);
}

$("#advisor-dismiss")?.addEventListener("click", () => {
  $("#advisor").hidden = true;
});

function updateHud() {
  if (!city) return;
  const rank = cityRank(city.population);
  $("#hud-money").textContent = formatMoney(city.funds);
  $("#hud-pop").textContent = city.population.toLocaleString("ja-JP");
  $("#hud-date").textContent = `${city.year}/${String(city.month).padStart(2, "0")}`;
  $("#hud-rank").textContent = rank.name;

  // 需要バー: -1..1 → 幅
  setDemandBar(".demand.r i", city.demandR);
  setDemandBar(".demand.c i", city.demandC);
  setDemandBar(".demand.i i", city.demandI);

  // メッセージ
  if (city.messages.length) {
    const m = city.messages[0];
    if (m._shown !== m.t) {
      m._shown = m.t;
      showToast(m.text, m.kind);
    }
  }
}

function setDemandBar(sel, d) {
  const el = $(sel);
  if (!el) return;
  // d: -1..1 → 中央基準。簡易に 0–100% で正の需要を表示
  const pct = Math.round(((d + 1) / 2) * 100);
  el.style.width = pct + "%";
  el.style.marginLeft = "0";
}

function draw() {
  if (!city || !renderer) return;
  renderer.draw(city);
  renderer.drawMinimap($("#minimap"), city);
}

function loop(ts) {
  requestAnimationFrame(loop);
  if (!running || !city) return;

  const spd = SPEEDS[speedIdx];
  if (spd.ms > 0 && ts - lastStep >= spd.ms) {
    lastStep = ts;
    city.step();
    updateHud();
    // オートセーブ（年ごと）
    if (city.month === 1 && city.tick % 12 === 0) {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(city.toJSON())); } catch {}
    }
  }
  draw();
}

// advisor dismiss may bind before DOM — ensure after DOM
document.addEventListener("DOMContentLoaded", () => {
  init();
  const dismiss = $("#advisor-dismiss");
  if (dismiss) {
    dismiss.addEventListener("click", () => { $("#advisor").hidden = true; });
  }
});
