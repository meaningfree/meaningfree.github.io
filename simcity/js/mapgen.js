import { MAP_W, MAP_H, Terrain } from "./constants.js";

/** 決定論的PRNG（マップ番号から再現） */
export function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothNoise(rand, w, h, scale) {
  const gw = Math.ceil(w / scale) + 2;
  const gh = Math.ceil(h / scale) + 2;
  const grid = new Float32Array(gw * gh);
  for (let i = 0; i < grid.length; i++) grid[i] = rand();
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const fx = x / scale;
      const fy = y / scale;
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const tx = fx - x0;
      const ty = fy - y0;
      const sx = tx * tx * (3 - 2 * tx);
      const sy = ty * ty * (3 - 2 * ty);
      const a = grid[y0 * gw + x0];
      const b = grid[y0 * gw + x0 + 1];
      const c = grid[(y0 + 1) * gw + x0];
      const d = grid[(y0 + 1) * gw + x0 + 1];
      out[y * w + x] = a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    }
  }
  return out;
}

/**
 * SFC版のような地形を生成。mapNo 0–999。
 * 水域比率はマップ番号で変化（#061風＝陸地多め）。
 */
export function generateMap(mapNo = 61) {
  const rand = mulberry32(mapNo * 9973 + 17);
  const w = MAP_W;
  const h = MAP_H;
  const terrain = new Uint8Array(w * h);

  // マップ番号で水の量を変える（SFC #061 は陸地多め）
  const waterBias = 0.18 + ((mapNo * 17) % 50) / 200; // ~0.18–0.43
  const targetWater = mapNo === 61 ? 0.14 : waterBias;

  const n1 = smoothNoise(rand, w, h, 14);
  const n2 = smoothNoise(rand, w, h, 6);
  const elev = new Float32Array(w * h);
  for (let i = 0; i < elev.length; i++) elev[i] = n1[i] * 0.7 + n2[i] * 0.3;

  // 外周を少し低くして海岸感
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const edge = Math.min(x, y, w - 1 - x, h - 1 - y) / 8;
      elev[y * w + x] += Math.min(edge, 1) * 0.08;
    }
  }

  const sorted = Array.from(elev).sort((a, b) => a - b);
  const waterThresh = sorted[Math.floor(sorted.length * targetWater)] ?? 0.3;

  for (let i = 0; i < elev.length; i++) {
    if (elev[i] < waterThresh) terrain[i] = Terrain.WATER;
    else if (elev[i] > waterThresh + 0.22 && rand() < 0.35) terrain[i] = Terrain.FOREST;
    else if (rand() < 0.08) terrain[i] = Terrain.TREE;
    else terrain[i] = Terrain.LAND;
  }

  // 小さな湖をいくつか追加
  const lakes = 2 + (mapNo % 4);
  for (let L = 0; L < lakes; L++) {
    const cx = 8 + Math.floor(rand() * (w - 16));
    const cy = 8 + Math.floor(rand() * (h - 16));
    const r = 2 + Math.floor(rand() * 4);
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) {
          terrain[y * w + x] = Terrain.WATER;
        }
      }
    }
  }

  let water = 0;
  for (let i = 0; i < terrain.length; i++) if (terrain[i] === Terrain.WATER) water++;

  return {
    mapNo,
    w,
    h,
    terrain,
    waterRatio: water / terrain.length,
  };
}

export function landPercent(map) {
  return Math.round((1 - map.waterRatio) * 1000) / 10;
}
