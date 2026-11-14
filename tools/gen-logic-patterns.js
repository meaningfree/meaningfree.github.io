#!/usr/bin/env node
/**
 * Generate a high-quality catalog of Japanese Illust Logic (nonogram)
 * silhouette patterns. Hand-authored shapes via drawing helpers — not noise.
 *
 *   node tools/gen-logic-patterns.js
 *   -> writes tools/logic-patterns.json
 */

"use strict";

const fs = require("fs");
const path = require("path");

// ─── grid helpers ───────────────────────────────────────────────────────────

function blank(n) {
  return Array.from({ length: n }, () => Array(n).fill(0));
}

function toRows(g) {
  return g.map((r) => r.join(""));
}

function inBounds(g, x, y) {
  return y >= 0 && y < g.length && x >= 0 && x < g[0].length;
}

function set(g, x, y, v = 1) {
  if (inBounds(g, x, y)) g[y][x] = v;
}

function fillRect(g, x, y, w, h, v = 1) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) set(g, xx, yy, v);
  }
}

function fillCircle(g, cx, cy, r, v = 1) {
  const r2 = r * r;
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2 + 0.25) set(g, x, y, v);
    }
  }
}

function fillEllipse(g, cx, cy, rx, ry, v = 1) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1.05) set(g, x, y, v);
    }
  }
}

/** Bresenham line */
function line(g, x0, y0, x1, y1, v = 1, thick = 1) {
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0;
  let y = y0;
  for (;;) {
    if (thick <= 1) set(g, x, y, v);
    else fillCircle(g, x, y, thick / 2, v);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

/** Scanline polygon fill (integer vertices). */
function fillPolygon(g, pts, v = 1) {
  if (pts.length < 3) return;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [, y] of pts) {
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  minY = Math.floor(minY);
  maxY = Math.ceil(maxY);
  for (let y = minY; y <= maxY; y++) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[(i + 1) % pts.length];
      if (y1 === y2) continue;
      if (y < Math.min(y1, y2) || y >= Math.max(y1, y2)) continue;
      const t = (y - y1) / (y2 - y1);
      xs.push(x1 + t * (x2 - x1));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const a = Math.ceil(xs[i]);
      const b = Math.floor(xs[i + 1]);
      for (let x = a; x <= b; x++) set(g, x, y, v);
    }
  }
}

function stamp(g, x, y, rows, v = 1) {
  for (let yy = 0; yy < rows.length; yy++) {
    for (let xx = 0; xx < rows[yy].length; xx++) {
      if (rows[yy][xx] === "1" || rows[yy][xx] === 1) set(g, x + xx, y + yy, v);
    }
  }
}

function cloneGrid(g) {
  return g.map((r) => r.slice());
}

/** Bounding box of filled cells. */
function bbox(g) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (let y = 0; y < g.length; y++) {
    for (let x = 0; x < g[0].length; x++) {
      if (g[y][x]) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (!isFinite(minX)) return null;
  return { minX, minY, maxX, maxY };
}

/** Center content in an n×n grid (trim empty margins). */
function centerIn(g, n) {
  const b = bbox(g);
  if (!b) return blank(n);
  const w = b.maxX - b.minX + 1;
  const h = b.maxY - b.minY + 1;
  const ox = Math.floor((n - w) / 2);
  const oy = Math.floor((n - h) / 2);
  const out = blank(n);
  for (let y = b.minY; y <= b.maxY; y++) {
    for (let x = b.minX; x <= b.maxX; x++) {
      if (g[y][x]) set(out, ox + (x - b.minX), oy + (y - b.minY), 1);
    }
  }
  return out;
}

function density(g) {
  let f = 0;
  const n = g.length;
  for (const r of g) for (const c of r) if (c) f++;
  return f / (n * n);
}

function fromRows(rows) {
  return rows.map((r) => [...r].map((c) => (c === "1" ? 1 : 0)));
}

function make(id, name, size, drawOrRows) {
  let g;
  if (typeof drawOrRows === "function") {
    g = blank(size);
    drawOrRows(g);
    g = centerIn(g, size);
  } else if (Array.isArray(drawOrRows)) {
    // Hand-stamped grids are authored in-place; only recenter if they
    // were drawn smaller than the canvas (uneven empty margins).
    g = fromRows(drawOrRows);
    if (g.length !== size || g.some((r) => r.length !== size)) {
      throw new Error(id + " rows must be " + size + "×" + size);
    }
    const b = bbox(g);
    if (b) {
      const padT = b.minY;
      const padB = size - 1 - b.maxY;
      const padL = b.minX;
      const padR = size - 1 - b.maxX;
      // Recenter only when margins are clearly lopsided
      if (Math.abs(padT - padB) > 1 || Math.abs(padL - padR) > 1) {
        g = centerIn(g, size);
      }
    }
  } else {
    throw new Error("bad pattern " + id);
  }
  return { id, name, size, rows: toRows(g), _dens: density(g) };
}

// ─── Size 5 (~35) — classic tiny silhouettes ────────────────────────────────

const SIZE5 = [
  make("heart5", "ハート", 5, ["01010", "11111", "11111", "01110", "00100"]),
  make("star5", "ほし", 5, ["00100", "11111", "01110", "11111", "01010"]),
  make("house5", "いえ", 5, ["00100", "01110", "11111", "01010", "01110"]),
  make("tree5", "き", 5, ["00100", "01110", "11111", "00100", "00100"]),
  make("cat5", "ねこ", 5, ["10001", "11111", "10101", "11111", "01110"]),
  make("dog5", "いぬ", 5, ["01100", "11110", "11110", "01010", "01010"]),
  make("fish5", "さかな", 5, ["00100", "01111", "11110", "01111", "00100"]),
  make("mountain5", "やま", 5, ["00100", "01110", "11111", "01010", "00000"]),
  make("flower5", "はな", 5, ["00100", "01110", "11111", "01110", "00100"]),
  make("boat5", "ふね", 5, ["00100", "01110", "00100", "11111", "01110"]),
  make("moon5", "つき", 5, ["01110", "11000", "11000", "11000", "01110"]),
  make("cloud5", "くも", 5, ["01100", "11110", "11111", "01110", "00000"]),
  make("apple5", "りんご", 5, ["00100", "01110", "11111", "11111", "01110"]),
  make("bird5", "とり", 5, ["00110", "01111", "11110", "00100", "01010"]),
  make("cup5", "カップ", 5, ["01010", "11111", "01110", "01110", "00100"]),
  make("mushroom5", "きのこ", 5, ["01110", "11111", "01110", "00100", "01110"]),
  make("umbrella5", "かさ", 5, ["01110", "11111", "00100", "00100", "01100"]),
  make("bunny5", "うさぎ", 5, ["10100", "11110", "10101", "11110", "01100"]),
  make("snail5", "かたつむり", 5, ["01100", "11110", "01111", "00001", "00000"]),
  make("car5", "くるま", 5, ["00000", "01110", "11111", "10101", "00000"]),
  make("train5", "でんしゃ", 5, ["01110", "11111", "10101", "11111", "01010"]),
  make("ice5", "アイス", 5, ["01110", "01110", "01110", "00100", "00100"]),
  make("penguin5", "ぺんぎん", 5, ["01110", "11111", "10101", "11111", "01010"]),
  make("turtle5", "かめ", 5, ["00100", "01110", "11111", "01010", "01010"]),
  make("frog5", "かえる", 5, ["10101", "01110", "11111", "01110", "01010"]),
  make("butterfly5", "ちょう", 5, ["10001", "11011", "01110", "11011", "10001"]),
  make("guitar5", "ギター", 5, ["00100", "00100", "01110", "11111", "01110"]),
  make("camera5", "カメラ", 5, ["00100", "11111", "11011", "11111", "00000"]),
  make("anpan5", "あんぱん", 5, ["01110", "11111", "10101", "11111", "00100"]),
  make("sunflower5", "ひまわり", 5, ["10101", "01110", "11111", "01110", "00100"]),
  make("castle5", "おしろ", 5, ["10101", "11111", "10101", "01010", "11111"]),
  make("arrow5", "やじるし", 5, ["00100", "01110", "11111", "00100", "00100"]),
  make("cross5", "クロス", 5, ["00100", "00100", "11111", "00100", "00100"]),
  make("smiley5", "えがお", 5, ["01110", "10101", "11111", "10001", "01110"]),
  make("crown5", "かんむり", 5, ["10101", "11111", "01110", "01110", "00000"]),
];

// ─── Size 8 (~30) ───────────────────────────────────────────────────────────

const SIZE8 = [
  make("heart8", "ハート", 8, (g) => {
    fillCircle(g, 2.2, 2.5, 2.2);
    fillCircle(g, 5.2, 2.5, 2.2);
    fillPolygon(g, [
      [0, 3],
      [3.7, 7],
      [7.4, 3],
      [7.4, 2],
      [0, 2],
    ]);
  }),
  make("star8", "ほし", 8, (g) => {
    fillPolygon(g, [
      [4, 0],
      [5, 3],
      [8, 3],
      [5.5, 5],
      [6.5, 8],
      [4, 6],
      [1.5, 8],
      [2.5, 5],
      [0, 3],
      [3, 3],
    ]);
  }),
  make("house8", "いえ", 8, (g) => {
    fillPolygon(g, [
      [4, 0],
      [7, 3],
      [1, 3],
    ]);
    fillRect(g, 1, 3, 6, 5);
    fillRect(g, 3, 5, 2, 3, 0); // door
    set(g, 5, 4, 0);
    set(g, 6, 4, 0); // window hint
  }),
  make("tree8", "き", 8, (g) => {
    fillCircle(g, 3.5, 2.5, 2.6);
    fillCircle(g, 3.5, 4, 2.4);
    fillRect(g, 3, 6, 2, 2);
  }),
  make("cat8", "ねこ", 8, (g) => {
    // ears
    fillPolygon(g, [
      [1, 0],
      [2, 2],
      [0, 2],
    ]);
    fillPolygon(g, [
      [6, 0],
      [7, 2],
      [5, 2],
    ]);
    fillEllipse(g, 3.5, 4, 3.2, 3);
    set(g, 2, 3, 0);
    set(g, 5, 3, 0); // eyes
    fillRect(g, 3, 5, 2, 1); // muzzle
  }),
  make("dog8", "いぬ", 8, (g) => {
    fillEllipse(g, 3.5, 4, 3, 2.8); // head
    fillRect(g, 0, 2, 2, 2); // ear
    fillEllipse(g, 6.5, 5.5, 1.2, 1); // snout
    set(g, 2, 3, 0);
    set(g, 4, 3, 0);
  }),
  make("fish8", "さかな", 8, (g) => {
    fillEllipse(g, 3.5, 3.5, 3.2, 2.2);
    fillPolygon(g, [
      [6, 2],
      [8, 1],
      [8, 6],
      [6, 5],
    ]);
    set(g, 1, 3, 0); // eye
  }),
  make("mountain8", "やま", 8, (g) => {
    fillPolygon(g, [
      [0, 7],
      [2, 2],
      [4, 5],
      [5, 1],
      [7, 7],
    ]);
  }),
  make("flower8", "はな", 8, (g) => {
    fillCircle(g, 3.5, 1.5, 1.3);
    fillCircle(g, 1.5, 3.5, 1.3);
    fillCircle(g, 5.5, 3.5, 1.3);
    fillCircle(g, 2.2, 5.5, 1.3);
    fillCircle(g, 4.8, 5.5, 1.3);
    fillCircle(g, 3.5, 3.5, 1.5);
  }),
  make("boat8", "ふね", 8, (g) => {
    fillRect(g, 3, 1, 1, 4); // mast
    fillPolygon(g, [
      [4, 1],
      [7, 4],
      [4, 4],
    ]); // sail
    fillPolygon(g, [
      [0, 5],
      [7, 5],
      [6, 7],
      [1, 7],
    ]); // hull
  }),
  make("moon8", "つき", 8, [
    "00111100",
    "01111000",
    "11100000",
    "11100000",
    "11100000",
    "01111000",
    "00111100",
    "00000000",
  ]),
  make("cloud8", "くも", 8, (g) => {
    fillCircle(g, 2.5, 4, 2.2);
    fillCircle(g, 4.5, 3, 2.4);
    fillCircle(g, 6, 4.2, 2);
    fillRect(g, 1, 4, 6, 3);
  }),
  make("castle8", "おしろ", 8, (g) => {
    for (const x of [0, 2, 4, 6]) fillRect(g, x, 1, 1, 1);
    fillRect(g, 0, 2, 7, 1);
    fillRect(g, 1, 3, 5, 4);
    fillRect(g, 2, 0, 3, 2); // keep
    fillRect(g, 3, 5, 1, 2, 0); // gate
    set(g, 2, 4, 0);
    set(g, 4, 4, 0);
  }),
  make("apple8", "りんご", 8, (g) => {
    fillCircle(g, 3.5, 4.2, 3);
    fillRect(g, 3, 0, 1, 2); // stem
    set(g, 4, 1, 1);
    set(g, 5, 1, 1); // leaf
  }),
  make("bird8", "とり", 8, (g) => {
    fillEllipse(g, 3.5, 4, 2.5, 2);
    fillPolygon(g, [
      [0, 3],
      [3, 4],
      [0, 5],
    ]); // beak area as wing
    fillPolygon(g, [
      [5, 2],
      [7, 1],
      [7, 4],
      [5, 4],
    ]);
    fillRect(g, 3, 6, 1, 2);
    fillRect(g, 5, 6, 1, 2);
  }),
  make("penguin8", "ぺんぎん", 8, (g) => {
    fillEllipse(g, 3.5, 4, 2.6, 3.5);
    fillEllipse(g, 3.5, 4.5, 1.6, 2.2, 0); // belly cut? keep solid silhouette
    // re-fill solid classic penguin
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) g[y][x] = 0;
    fillEllipse(g, 3.5, 4.2, 2.5, 3.3);
    fillRect(g, 1, 3, 1, 3); // wing
    fillRect(g, 6, 3, 1, 3);
    fillRect(g, 2, 7, 2, 1); // feet
    fillRect(g, 4, 7, 2, 1);
    set(g, 2, 2, 0);
    set(g, 5, 2, 0); // eyes
  }),
  make("turtle8", "かめ", 8, (g) => {
    fillEllipse(g, 3.5, 3.5, 3, 2.5); // shell
    fillCircle(g, 3.5, 1, 1.2); // head
    fillRect(g, 0, 4, 1, 2);
    fillRect(g, 7, 4, 1, 2);
    fillRect(g, 2, 6, 1, 2);
    fillRect(g, 5, 6, 1, 2);
  }),
  make("train8", "でんしゃ", 8, [
    "01100000",
    "11111110",
    "10110110",
    "10110110",
    "11111110",
    "01000100",
    "11101110",
    "00000000",
  ]),
  make("car8", "くるま", 8, (g) => {
    fillRect(g, 1, 3, 6, 3);
    fillPolygon(g, [
      [2, 3],
      [3, 1],
      [5, 1],
      [6, 3],
    ]);
    fillCircle(g, 2.5, 6, 1.2);
    fillCircle(g, 5.5, 6, 1.2);
    set(g, 3, 2, 0);
    set(g, 4, 2, 0);
  }),
  make("cup8", "カップ", 8, (g) => {
    fillRect(g, 1, 1, 5, 5);
    fillRect(g, 2, 6, 3, 1);
    fillRect(g, 3, 7, 1, 1);
    // handle
    fillRect(g, 6, 2, 1, 3);
    set(g, 7, 2, 1);
    set(g, 7, 4, 1);
  }),
  make("ice8", "アイス", 8, (g) => {
    fillCircle(g, 3.5, 2, 2.3);
    fillPolygon(g, [
      [1.5, 3],
      [5.5, 3],
      [3.5, 8],
    ]);
  }),
  make("snail8", "かたつむり", 8, (g) => {
    fillCircle(g, 4.5, 3.5, 2.5); // shell
    fillCircle(g, 4.5, 3.5, 1, 0);
    fillEllipse(g, 2, 5, 2, 1.2); // body
    set(g, 0, 3, 1);
    set(g, 1, 2, 1); // antennae
    set(g, 0, 2, 1);
  }),
  make("umbrella8", "かさ", 8, (g) => {
    fillEllipse(g, 3.5, 2.5, 3.5, 2.2);
    fillRect(g, 0, 3, 7, 1);
    fillRect(g, 3, 3, 1, 4);
    fillRect(g, 2, 6, 2, 1); // handle curl
  }),
  make("mushroom8", "きのこ", 8, [
    "00111100",
    "01111110",
    "11100111",
    "01111110",
    "00111100",
    "00111100",
    "00111100",
    "00000000",
  ]),
  make("sunflower8", "ひまわり", 8, (g) => {
    for (const [x, y] of [
      [3.5, 0.8],
      [6.2, 2.5],
      [5.5, 5.5],
      [1.5, 5.5],
      [0.8, 2.5],
    ])
      fillCircle(g, x, y, 1.4);
    fillCircle(g, 3.5, 3.2, 1.8);
    fillRect(g, 3, 6, 1, 2);
  }),
  make("bunny8", "うさぎ", 8, (g) => {
    fillEllipse(g, 2, 1.5, 1, 2.2); // ear
    fillEllipse(g, 5, 1.5, 1, 2.2);
    fillEllipse(g, 3.5, 4.5, 3, 2.8);
    set(g, 2, 4, 0);
    set(g, 5, 4, 0);
  }),
  make("frog8", "かえる", 8, (g) => {
    fillCircle(g, 2, 2, 1.3);
    fillCircle(g, 5, 2, 1.3); // eyes
    fillEllipse(g, 3.5, 4.5, 3.2, 2.5);
    fillRect(g, 0, 6, 2, 1);
    fillRect(g, 6, 6, 2, 1);
  }),
  make("butterfly8", "ちょう", 8, [
    "10000001",
    "11000011",
    "01100110",
    "00111100",
    "01100110",
    "11000011",
    "10000001",
    "00000000",
  ]),
  make("guitar8", "ギター", 8, (g) => {
    fillCircle(g, 3.5, 5.5, 2.3);
    fillRect(g, 3, 0, 1, 4);
    fillRect(g, 2, 0, 3, 1);
  }),
  make("camera8", "カメラ", 8, (g) => {
    fillRect(g, 0, 2, 8, 5);
    fillRect(g, 2, 1, 2, 1);
    fillCircle(g, 4, 4.5, 2);
    fillCircle(g, 4, 4.5, 1, 0);
  }),
];

// ─── Size 10 (~25) ──────────────────────────────────────────────────────────

const SIZE10 = [
  make("heart10", "ハート", 10, (g) => {
    fillCircle(g, 2.8, 3, 2.8);
    fillCircle(g, 6.8, 3, 2.8);
    fillPolygon(g, [
      [0.2, 4],
      [4.8, 9.5],
      [9.4, 4],
    ]);
  }),
  make("star10", "ほし", 10, (g) => {
    fillPolygon(g, [
      [5, 0],
      [6.2, 3.5],
      [10, 3.5],
      [7, 5.8],
      [8.2, 9.5],
      [5, 7.2],
      [1.8, 9.5],
      [3, 5.8],
      [0, 3.5],
      [3.8, 3.5],
    ]);
  }),
  make("house10", "いえ", 10, (g) => {
    fillPolygon(g, [
      [5, 0],
      [9, 4],
      [1, 4],
    ]);
    fillRect(g, 1, 4, 8, 6);
    fillRect(g, 4, 6, 2, 4, 0);
    fillRect(g, 2, 5, 1, 1, 0);
    fillRect(g, 7, 5, 1, 1, 0);
  }),
  make("tree10", "き", 10, (g) => {
    fillCircle(g, 4.5, 3, 3.2);
    fillCircle(g, 4.5, 5, 3);
    fillRect(g, 4, 7, 2, 3);
  }),
  make("cat10", "ねこ", 10, (g) => {
    fillPolygon(g, [
      [1, 0],
      [3, 3],
      [0, 3],
    ]);
    fillPolygon(g, [
      [8, 0],
      [9, 3],
      [6, 3],
    ]);
    fillEllipse(g, 4.5, 5.5, 4, 3.5);
    set(g, 3, 4, 0);
    set(g, 6, 4, 0);
    fillRect(g, 4, 6, 2, 1);
  }),
  make("dog10", "いぬ", 10, (g) => {
    fillEllipse(g, 4.5, 5, 3.8, 3.5);
    fillRect(g, 0, 2, 3, 3); // floppy ear
    fillEllipse(g, 8, 6.5, 1.8, 1.5); // snout
    set(g, 3, 4, 0);
    set(g, 5, 4, 0);
  }),
  make("fish10", "さかな", 10, (g) => {
    fillEllipse(g, 4, 4.5, 4, 2.8);
    fillPolygon(g, [
      [7, 2],
      [10, 1],
      [10, 8],
      [7, 7],
    ]);
    set(g, 1, 4, 0);
    fillRect(g, 4, 1, 1, 1); // fin top
    fillRect(g, 4, 8, 1, 1);
  }),
  make("mountain10", "やま", 10, (g) => {
    fillPolygon(g, [
      [0, 9],
      [3, 2],
      [5, 6],
      [7, 1],
      [9, 9],
    ]);
  }),
  make("flower10", "はな", 10, [
    "0001110000",
    "0011111000",
    "1101110110",
    "1110101110",
    "1111011110",
    "0111111100",
    "1101110110",
    "0011111000",
    "0001110000",
    "0000100000",
  ]),
  make("boat10", "ふね", 10, (g) => {
    fillRect(g, 4, 1, 1, 5);
    fillPolygon(g, [
      [5, 1],
      [9, 5],
      [5, 5],
    ]);
    fillPolygon(g, [
      [0, 6],
      [9, 6],
      [8, 9],
      [1, 9],
    ]);
  }),
  make("moon10", "つき", 10, (g) => {
    fillCircle(g, 5, 4.5, 4.2);
    fillCircle(g, 7, 4.5, 3.3, 0);
  }),
  make("cloud10", "くも", 10, (g) => {
    fillCircle(g, 3, 5, 2.8);
    fillCircle(g, 5.5, 3.5, 3);
    fillCircle(g, 8, 5, 2.5);
    fillRect(g, 1, 5, 8, 3);
  }),
  make("castle10", "おしろ", 10, [
    "1010010100",
    "1110111000",
    "1110111000",
    "1111111100",
    "1101110100",
    "1111111100",
    "1110001100",
    "1110001100",
    "1111111100",
    "0000000000",
  ]),
  make("apple10", "りんご", 10, (g) => {
    fillCircle(g, 4.5, 5.5, 3.8);
    fillRect(g, 4, 0, 1, 3);
    fillEllipse(g, 6, 2, 1.5, 1);
  }),
  make("bird10", "とり", 10, (g) => {
    fillEllipse(g, 4.5, 5, 3, 2.5);
    fillCircle(g, 7, 3.5, 2);
    fillPolygon(g, [
      [8.5, 3],
      [10, 2.5],
      [8.5, 4.5],
    ]); // beak
    fillPolygon(g, [
      [0, 4],
      [4, 5],
      [0, 7],
    ]); // wing/tail
    fillRect(g, 3, 8, 1, 2);
    fillRect(g, 5, 8, 1, 2);
  }),
  make("penguin10", "ぺんぎん", 10, (g) => {
    fillEllipse(g, 4.5, 5, 3.2, 4.2);
    fillRect(g, 1, 4, 1, 4);
    fillRect(g, 8, 4, 1, 4);
    fillRect(g, 2, 9, 2, 1);
    fillRect(g, 6, 9, 2, 1);
    set(g, 3, 3, 0);
    set(g, 6, 3, 0);
    fillRect(g, 4, 4, 2, 1); // beak hint
  }),
  make("turtle10", "かめ", 10, (g) => {
    fillEllipse(g, 4.5, 4.5, 3.8, 3);
    fillCircle(g, 4.5, 1.2, 1.5);
    fillRect(g, 0, 5, 1, 2);
    fillRect(g, 9, 5, 1, 2);
    fillRect(g, 2, 8, 1, 2);
    fillRect(g, 7, 8, 1, 2);
  }),
  make("train10", "でんしゃ", 10, (g) => {
    fillRect(g, 0, 2, 10, 5);
    fillRect(g, 1, 0, 2, 2);
    fillRect(g, 1, 3, 2, 2, 0);
    fillRect(g, 4, 3, 2, 2, 0);
    fillRect(g, 7, 3, 2, 2, 0);
    fillCircle(g, 2, 8, 1.3);
    fillCircle(g, 7.5, 8, 1.3);
  }),
  make("car10", "くるま", 10, [
    "0001111000",
    "0011011100",
    "0111111110",
    "1111111111",
    "1111111111",
    "1011111101",
    "1101111011",
    "0110000110",
    "0000000000",
    "0000000000",
  ]),
  make("cup10", "カップ", 10, (g) => {
    fillRect(g, 1, 1, 6, 6);
    fillRect(g, 2, 7, 4, 1);
    fillRect(g, 3, 8, 2, 2);
    fillRect(g, 7, 2, 2, 4);
    set(g, 9, 2, 1);
    set(g, 9, 5, 1);
  }),
  make("ice10", "アイス", 10, (g) => {
    fillCircle(g, 4.5, 2.5, 2.8);
    fillPolygon(g, [
      [2, 4],
      [7, 4],
      [4.5, 10],
    ]);
  }),
  make("snail10", "かたつむり", 10, (g) => {
    fillCircle(g, 5.5, 4, 3.2);
    fillCircle(g, 5.5, 4, 1.2, 0);
    fillEllipse(g, 2.5, 7, 2.5, 1.5);
    line(g, 1, 4, 1, 2);
    line(g, 2, 4, 3, 2);
    set(g, 1, 1, 1);
    set(g, 3, 1, 1);
  }),
  make("umbrella10", "かさ", 10, (g) => {
    fillEllipse(g, 4.5, 3, 4.5, 2.8);
    fillRect(g, 0, 3, 9, 2);
    fillRect(g, 4, 4, 1, 5);
    fillRect(g, 2, 8, 3, 1);
  }),
  make("mushroom10", "きのこ", 10, (g) => {
    fillEllipse(g, 4.5, 3, 4.5, 3);
    fillRect(g, 3, 5, 3, 5);
  }),
  make("sunflower10", "ひまわり", 10, [
    "0010101000",
    "0111111100",
    "1110111110",
    "0101111010",
    "1110111110",
    "0111111100",
    "0010101000",
    "0000100000",
    "0000100000",
    "0001110000",
  ]),
];

// ─── Size 15 (~20) — hand-stamped recognizable silhouettes ──────────────────

const SIZE15 = [
  // おしろ — three towers, battlements, wide gate, open walls
  make("castle15", "おしろ", 15, [
    "000000000000000",
    "101000010001010",
    "111000111001110",
    "101000101001010",
    "111000111001110",
    "111011111011110",
    "111111111111111",
    "110110001100111",
    "111110001110111",
    "111100011110111",
    "111100011110111",
    "111100011111111",
    "111111111111111",
    "000000000000000",
    "000000000000000",
  ]),
  // さかな — edge-to-edge; eye + dorsal/tail fins
  make("fish15", "さかな", 15, [
    "000001000000100",
    "000011100001100",
    "000111110011110",
    "001111111011111",
    "011011111111111",
    "111111111111110",
    "111111111111111",
    "111111111111110",
    "011111111111111",
    "001111111011111",
    "000111110011110",
    "000011100001100",
    "000001100000100",
    "000000100000000",
    "000000100000000",
  ]),
  // ぺんぎん — head, eye, flippers, feet (touches top+bottom)
  make("penguin15", "ぺんぎん", 15, [
    "000001110000000",
    "000011111000000",
    "000110111100000",
    "000111111100000",
    "001111111110000",
    "011011111101100",
    "010111111101100",
    "001111111110000",
    "001111111110000",
    "000111111100000",
    "000111111100000",
    "000011111000000",
    "000110001100000",
    "000110001100000",
    "000111011100000",
  ]),
  make("train15", "でんしゃ", 15, [
    "001110000000000",
    "000100000000000",
    "111110000000000",
    "111111111111111",
    "111111111111111",
    "101101101101101",
    "101101101101101",
    "111111111111111",
    "111111111111111",
    "111111111111111",
    "010010010010010",
    "111011101110111",
    "010010010010010",
    "000000000000000",
    "000000000000000",
  ]),
  make("tree15", "き", 15, [
    "000001110000000",
    "000011111000000",
    "000111111100000",
    "001111111110000",
    "000111111100000",
    "001111111110000",
    "011111111111000",
    "001111111110000",
    "011111111111000",
    "001111111110000",
    "000011111000000",
    "000001110000000",
    "000001110000000",
    "000001110000000",
    "000011111000000",
  ]),
  make("house15", "いえ", 15, [
    "000000100000000",
    "000001110000000",
    "000011111000000",
    "000111111100100",
    "001111111110100",
    "011111111111100",
    "111111111111110",
    "011111111111100",
    "011101110111100",
    "011101110111100",
    "011111111111100",
    "011110001111100",
    "011110001111100",
    "011110001111100",
    "000000000000000",
  ]),
  make("dog15", "いぬ", 15, [
    "000000000110000",
    "011000001111000",
    "111100011111100",
    "011110111110111",
    "001111111111111",
    "001111111111110",
    "001111111111100",
    "011111111111000",
    "111111111110000",
    "111111111100000",
    "110110110000000",
    "110110110000000",
    "110110110000000",
    "110000110000000",
    "000000000000000",
  ]),
  make("cat15", "ねこ", 15, [
    "010000000000100",
    "111000000001110",
    "011100000011100",
    "001111111111000",
    "001110111011000",
    "001111111111000",
    "000111111110000",
    "000011111100000",
    "000111111110000",
    "001111111111000",
    "001111111111100",
    "001110111011000",
    "001100000001100",
    "001100000001100",
    "000000000000000",
  ]),
  make("flower15", "はな", 15, [
    "000001110000000",
    "000011111000000",
    "011011111011000",
    "111111111111100",
    "011111111111000",
    "001111111110000",
    "011111011111000",
    "111110001111100",
    "011111011111000",
    "001111111110000",
    "011111111111000",
    "111011111011100",
    "011000111000000",
    "000000111000000",
    "000000111000000",
  ]),
  make("boat15", "ふね", 15, [
    "000000111000000",
    "000000100000000",
    "000000110000000",
    "000000111000000",
    "000000111100000",
    "000100111110000",
    "000110111111000",
    "000111111111100",
    "001111111111110",
    "011111111111111",
    "001111111111110",
    "000111111111100",
    "000011111111000",
    "000000000000000",
    "000000000000000",
  ]),
  make("heart15", "ハート", 15, [
    "000000000000000",
    "001110000111000",
    "011111001111100",
    "111111111111110",
    "111111111111110",
    "111111111111110",
    "011111111111100",
    "001111111111000",
    "000111111110000",
    "000011111100000",
    "000001111000000",
    "000000110000000",
    "000000000000000",
    "000000000000000",
    "000000000000000",
  ]),
  make("mountain15", "やま", 15, [
    "000000000100000",
    "000000001110000",
    "000100011111000",
    "000110111111100",
    "001111111011110",
    "011111110001111",
    "111111100000111",
    "111111000000011",
    "111110000000001",
    "111100000000001",
    "111000000000011",
    "110000000000111",
    "100000000001111",
    "000000000011111",
    "000000000111111",
  ]),
  make("apple15", "りんご", 15, [
    "000000100000000",
    "000000110010000",
    "000000011111000",
    "000011111111100",
    "000111111111110",
    "001111111111111",
    "001111111111111",
    "001111111111111",
    "001111111111111",
    "000111111111110",
    "000111111111100",
    "000011111111000",
    "000001111110000",
    "000000000000000",
    "000000000000000",
  ]),
  make("cloud15", "くも", 15, [
    "000000000000000",
    "000001111000000",
    "000011111100000",
    "001111111111000",
    "011111111111100",
    "111111111111110",
    "111111111111111",
    "111111111111111",
    "011111111111110",
    "001111111111100",
    "000000000000000",
    "000000000000000",
    "000000000000000",
    "000000000000000",
    "000000000000000",
  ]),
  make("moon15", "つき", 15, [
    "000001111000000",
    "000111111100000",
    "001111000000000",
    "011110000000000",
    "011100000000000",
    "111100000000000",
    "111100000000000",
    "111100000000000",
    "011100000000000",
    "011110000000000",
    "001111000000000",
    "000111111100000",
    "000001111000000",
    "000000000000000",
    "000000000000000",
  ]),
  make("mushroom15", "きのこ", 15, [
    "000001111000000",
    "000111111110000",
    "001110111111000",
    "011111111101100",
    "011111111111100",
    "111101111111110",
    "111111111011110",
    "011111111111100",
    "000001111000000",
    "000001111000000",
    "000001111000000",
    "000001111000000",
    "000001111000000",
    "000011111100000",
    "000000000000000",
  ]),
  make("car15", "くるま", 15, [
    "000000000000000",
    "000001111100000",
    "000011111110000",
    "000110111011000",
    "001110111011100",
    "011111111111110",
    "111111111111111",
    "111111111111111",
    "110111111111011",
    "111011111110111",
    "011101111011100",
    "001110000111000",
    "000000000000000",
    "000000000000000",
    "000000000000000",
  ]),
  make("umbrella15", "かさ", 15, [
    "000000100000000",
    "000011111000000",
    "001111111110000",
    "011111111111000",
    "111111111111100",
    "111111111111100",
    "000000100000000",
    "000000100000000",
    "000000100000000",
    "000000100000000",
    "000000100000000",
    "000000100000000",
    "000001100000000",
    "000011000000000",
    "000000000000000",
  ]),
  make("bunny15", "うさぎ", 15, [
    "001100000011000",
    "011100000011100",
    "011100000011100",
    "001100000011000",
    "000111111110000",
    "001110111011000",
    "001111111111000",
    "000111111110000",
    "000011111100000",
    "000111111110000",
    "001111111111000",
    "001111111111000",
    "001100000011000",
    "001100000011000",
    "000000000000000",
  ]),
  make("guitar15", "ギター", 15, [
    "000011110000000",
    "000001100000000",
    "000001100000000",
    "000001100000000",
    "000001100000000",
    "000001100000000",
    "000011110000000",
    "000111111000000",
    "001111111100000",
    "001110011100000",
    "001111111100000",
    "000111111000000",
    "001111111100000",
    "000111111000000",
    "000011110000000",
  ]),
  make("snail15", "かたつむり", 15, [
    "001000010000000",
    "000100101000000",
    "000011111000000",
    "000111011100000",
    "001110001110000",
    "001100000110000",
    "001110001110000",
    "000111011100000",
    "000011111000000",
    "111111111000000",
    "111111111000000",
    "000000001000000",
    "000000001000000",
    "000000000000000",
    "000000000000000",
  ]),
];

// ─── Extra patterns to pad toward targets & variety ─────────────────────────

const EXTRA5 = [
  make("ghost5", "おばけ", 5, ["01110", "10101", "11111", "11111", "10001"]),
  make("diamond5", "ダイヤ", 5, ["00100", "01110", "11111", "01110", "00100"]),
  make("key5", "かぎ", 5, ["01110", "01010", "00100", "00100", "01110"]),
  make("leaf5", "はっぱ", 5, ["00100", "01110", "11110", "01100", "00100"]),
];

const EXTRA8 = [
  make("ghost8", "おばけ", 8, [
    "00111100",
    "01111110",
    "11011011",
    "11111111",
    "01111110",
    "10101010",
    "10001000",
    "00000000",
  ]),
  make("crown8", "かんむり", 8, (g) => {
    fillPolygon(g, [
      [0, 3],
      [1, 0],
      [2, 3],
      [4, 0],
      [5, 3],
      [7, 0],
      [7, 6],
      [0, 6],
    ]);
  }),
  make("anpan8", "あんぱん", 8, (g) => {
    fillCircle(g, 3.5, 3.5, 3.3);
    set(g, 2, 2, 0);
    set(g, 5, 2, 0);
    set(g, 3, 4, 0);
  }),
];

const EXTRA10 = [
  make("ghost10", "おばけ", 10, [
    "0011111000",
    "0111111100",
    "1101101110",
    "1111111110",
    "1111111110",
    "1111111110",
    "1010101010",
    "1010101010",
    "0000000000",
    "0000000000",
  ]),
  make("frog10", "かえる", 10, (g) => {
    fillCircle(g, 2.5, 2.5, 1.6);
    fillCircle(g, 7, 2.5, 1.6);
    fillEllipse(g, 4.5, 5.5, 4, 3);
    fillRect(g, 0, 8, 2, 1);
    fillRect(g, 8, 8, 2, 1);
  }),
  make("butterfly10", "ちょう", 10, [
    "1100000011",
    "1110000111",
    "0111001110",
    "0011111100",
    "0001111000",
    "0011111100",
    "0111001110",
    "1110000111",
    "1100000011",
    "0000000000",
  ]),
  make("camera10", "カメラ", 10, [
    "0011100000",
    "1111111110",
    "1111111110",
    "1101111010",
    "1101001010",
    "1101111010",
    "1111111110",
    "0000000000",
    "0000000000",
    "0000000000",
  ]),
  make("anpan10", "あんぱん", 10, (g) => {
    fillCircle(g, 4.5, 4.5, 4.2);
    set(g, 2, 3, 0);
    set(g, 7, 3, 0);
    fillRect(g, 3, 5, 3, 1, 0);
  }),
];

// ─── Assemble & validate ────────────────────────────────────────────────────

const ALL = [...SIZE5, ...EXTRA5, ...SIZE8, ...EXTRA8, ...SIZE10, ...EXTRA10, ...SIZE15];

function asciiPreview(p, filled = "█", empty = "·") {
  return p.rows.map((r) => r.replace(/0/g, empty).replace(/1/g, filled)).join("\n");
}

function main() {
  const ids = new Set();
  const warnings = [];
  for (const p of ALL) {
    if (ids.has(p.id)) warnings.push("duplicate id " + p.id);
    ids.add(p.id);
    if (!/^[ぁ-んァ-ンーa-zA-Z0-9]+$/.test(p.name) && !/[一-龯]/.test(p.name)) {
      // allow kana + some latin loanwords already in names; skip strict
    }
    if (/[甲乙丙丁]/.test(p.name)) warnings.push("bad suffix name " + p.name);
    if (p.rows.length !== p.size) warnings.push(p.id + " bad height");
    if (p.rows.some((r) => r.length !== p.size || /[^01]/.test(r)))
      warnings.push(p.id + " bad rows");
    // size 5 silhouettes run denser by nature; allow a wider band there
    const lo = 0.22;
    const hi = p.size <= 5 ? 0.72 : 0.65;
    if (p._dens < lo || p._dens > hi)
      warnings.push(`${p.id} density ${(p._dens * 100).toFixed(1)}%`);
  }

  const bySize = { 5: 0, 8: 0, 10: 0, 15: 0 };
  for (const p of ALL) bySize[p.size] = (bySize[p.size] || 0) + 1;

  const out = ALL.map(({ id, name, size, rows }) => ({ id, name, size, rows }));
  const outPath = path.join(__dirname, "logic-patterns.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n", "utf8");

  console.log("Wrote", outPath);
  console.log("Total patterns:", out.length);
  console.log("Counts by size:", bySize);
  if (warnings.length) {
    console.log("\nWarnings (" + warnings.length + "):");
    for (const w of warnings.slice(0, 40)) console.log(" -", w);
    if (warnings.length > 40) console.log(" - ...");
  }

  console.log("\n── ASCII previews (15×15) ──\n");
  for (const want of ["castle15", "fish15", "penguin15"]) {
    const p = ALL.find((x) => x.id === want);
    if (!p) continue;
    console.log(`# ${p.name} (${p.id})  density=${(p._dens * 100).toFixed(1)}%\n`);
    console.log(asciiPreview(p));
    console.log("");
  }
}

main();
