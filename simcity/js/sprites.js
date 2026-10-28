import { TILE, Terrain, Feature, Building } from "./constants.js";

/** SNES風の暖色・緑のパレット（紫偏り回避） */
export const P = {
  grass: "#4a8f3c",
  grass2: "#3d7a32",
  grassLight: "#6bb85a",
  dirt: "#8b6b3e",
  sand: "#c4a66a",
  water: "#2a6aaa",
  water2: "#3a7ec4",
  waterDeep: "#1e4f82",
  foam: "#a8d4f0",
  forest: "#2d6b28",
  forest2: "#1f4f1c",
  tree: "#3a8a34",
  trunk: "#6b4423",
  road: "#5a5a5a",
  roadLine: "#cfcfcf",
  rail: "#3a3a3a",
  railTie: "#7a5230",
  wire: "#222",
  pole: "#8a7a5a",
  park: "#55a848",
  parkFlower: "#e87898",
  zoneR: "#3db84a",
  zoneC: "#3a7ad9",
  zoneI: "#d4a017",
  zoneEmpty: "#2a2a2a",
  houseRoof: "#c45c3a",
  houseWall: "#f0e6d0",
  shop: "#5a9fd4",
  shopRoof: "#2a5a8a",
  factory: "#8a8a78",
  smoke: "#666",
  police: "#2a4a8a",
  fireSt: "#c43030",
  stadium: "#6a8a5a",
  port: "#4a6a7a",
  coal: "#4a4a4a",
  nuclear: "#c8d890",
  airport: "#9aa8b4",
  rubble: "#6a5a4a",
  fire1: "#ff6a1a",
  fire2: "#ffd040",
  flood: "#4a90c8",
  outline: "#1a1a1a",
  powerOn: "#ffe040",
  powerOff: "#222",
};

function px(ctx, x, y, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, 1, 1);
}

function rect(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

function makeCanvas(s = TILE) {
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  return { c, ctx };
}

function drawGrass(ctx, variant = 0) {
  rect(ctx, 0, 0, 16, 16, variant ? P.grass2 : P.grass);
  for (let i = 0; i < 8; i++) {
    const x = (i * 5 + variant * 3) % 16;
    const y = (i * 7 + variant) % 16;
    px(ctx, x, y, variant ? P.grass : P.grass2);
  }
}

function drawWater(ctx, frame = 0) {
  rect(ctx, 0, 0, 16, 16, P.waterDeep);
  const o = frame % 4;
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const n = ((x + o) ^ (y * 3)) & 7;
      if (n < 2) px(ctx, x, y, P.water);
      else if (n < 4) px(ctx, x, y, P.water2);
    }
  }
  for (let i = 0; i < 3; i++) {
    const x = (i * 5 + o * 2) % 14;
    const y = 2 + ((i * 3 + o) % 12);
    px(ctx, x, y, P.foam);
    px(ctx, x + 1, y, P.foam);
  }
}

function drawForest(ctx) {
  drawGrass(ctx, 1);
  // 木々
  const trees = [[3, 4], [10, 3], [6, 9], [12, 10], [2, 12]];
  for (const [tx, ty] of trees) {
    rect(ctx, tx, ty + 4, 2, 3, P.trunk);
    rect(ctx, tx - 2, ty, 6, 5, P.forest);
    rect(ctx, tx - 1, ty - 1, 4, 3, P.forest2);
    px(ctx, tx + 1, ty, P.tree);
  }
}

function drawTree(ctx) {
  drawGrass(ctx, 0);
  rect(ctx, 7, 10, 2, 5, P.trunk);
  rect(ctx, 4, 4, 8, 7, P.forest);
  rect(ctx, 5, 2, 6, 4, P.tree);
  px(ctx, 6, 5, P.forest2);
}

function drawRoad(ctx, mask) {
  // mask: N=1 E=2 S=4 W=8
  rect(ctx, 0, 0, 16, 16, P.grass);
  const ns = mask & 5;
  const ew = mask & 10;
  if (!mask || ns || (!ew && !ns)) rect(ctx, 5, 0, 6, 16, P.road);
  if (!mask || ew || (!ew && !ns)) rect(ctx, 0, 5, 16, 6, P.road);
  if (mask & 1) rect(ctx, 5, 0, 6, 8, P.road);
  if (mask & 4) rect(ctx, 5, 8, 6, 8, P.road);
  if (mask & 2) rect(ctx, 8, 5, 8, 6, P.road);
  if (mask & 8) rect(ctx, 0, 5, 8, 6, P.road);
  // 中央線
  if ((mask & 5) === 5 || mask === 0) {
    for (let y = 1; y < 15; y += 4) rect(ctx, 7, y, 2, 2, P.roadLine);
  }
  if ((mask & 10) === 10) {
    for (let x = 1; x < 15; x += 4) rect(ctx, x, 7, 2, 2, P.roadLine);
  }
}

function drawRail(ctx, mask) {
  rect(ctx, 0, 0, 16, 16, P.grass);
  const drawNS = !mask || (mask & 5) || (!(mask & 10) && !(mask & 5));
  const drawEW = !mask || (mask & 10) || (!(mask & 10) && !(mask & 5));
  if (drawNS || (mask & 1) || (mask & 4)) {
    if (mask & 1 || !mask || (mask & 5)) rect(ctx, 6, 0, 4, 16, P.rail);
    if (mask & 4) rect(ctx, 6, 8, 4, 8, P.rail);
    for (let y = 1; y < 16; y += 3) rect(ctx, 4, y, 8, 1, P.railTie);
  }
  if (drawEW || (mask & 2) || (mask & 8)) {
    if (mask & 2 || !mask || (mask & 10)) rect(ctx, 0, 6, 16, 4, P.rail);
    if (mask & 8) rect(ctx, 0, 6, 8, 4, P.rail);
    for (let x = 1; x < 16; x += 3) rect(ctx, x, 4, 1, 8, P.railTie);
  }
}

function drawWire(ctx, mask, overRoad = false) {
  if (!overRoad) drawGrass(ctx, 0);
  // 電柱
  rect(ctx, 7, 6, 2, 8, P.pole);
  rect(ctx, 6, 5, 4, 2, P.pole);
  if (mask & 1 || !mask) rect(ctx, 7, 0, 2, 6, P.wire);
  if (mask & 4 || !mask) rect(ctx, 7, 10, 2, 6, P.wire);
  if (mask & 2 || !mask) rect(ctx, 10, 7, 6, 2, P.wire);
  if (mask & 8 || !mask) rect(ctx, 0, 7, 6, 2, P.wire);
}

function drawPark(ctx) {
  rect(ctx, 0, 0, 16, 16, P.park);
  rect(ctx, 2, 2, 12, 12, "#4e9c42");
  // 木
  rect(ctx, 4, 8, 2, 4, P.trunk);
  rect(ctx, 2, 4, 6, 5, P.forest);
  rect(ctx, 10, 9, 2, 3, P.trunk);
  rect(ctx, 8, 6, 6, 4, P.tree);
  px(ctx, 7, 12, P.parkFlower);
  px(ctx, 12, 4, P.parkFlower);
  px(ctx, 3, 11, "#f0d050");
}

function drawZoneFrame(ctx, color, letter) {
  rect(ctx, 0, 0, 16, 16, "#2e5a28");
  rect(ctx, 1, 1, 14, 14, color);
  rect(ctx, 2, 2, 12, 12, "#1a3a18");
  // 斜線パターン
  ctx.fillStyle = color;
  for (let i = -16; i < 32; i += 3) {
    for (let y = 2; y < 14; y++) {
      const x = i + y;
      if (x >= 2 && x < 14) px(ctx, x, y, color);
    }
  }
  // 中央の文字エリア
  rect(ctx, 5, 5, 6, 6, "#0a1a08");
  ctx.fillStyle = "#fff";
  ctx.font = "bold 8px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(letter, 8, 8.5);
}

function drawHouse(ctx, level) {
  drawGrass(ctx, 0);
  const roofs = ["#c45c3a", "#a84830", "#8a3020", "#6a2010", "#4a1010"];
  const walls = ["#f0e6d0", "#e8d8c0", "#d0c8b8", "#b8b0a0", "#909090"];
  const lv = Math.min(level, 4);
  if (lv === 0) {
    // 空き地の小屋
    rect(ctx, 5, 8, 6, 5, walls[0]);
    rect(ctx, 4, 6, 8, 3, roofs[0]);
    px(ctx, 7, 10, "#4a3020");
    return;
  }
  if (lv <= 2) {
    rect(ctx, 3, 7, 10, 7, walls[lv]);
    rect(ctx, 2, 4, 12, 4, roofs[lv]);
    px(ctx, 5, 9, "#6a90c0");
    px(ctx, 10, 9, "#6a90c0");
    rect(ctx, 7, 10, 2, 4, "#5a3a20");
  } else {
    // アパート
    rect(ctx, 2, 2, 12, 13, walls[lv]);
    rect(ctx, 1, 1, 14, 2, roofs[lv]);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        rect(ctx, 4 + col * 3, 4 + row * 3, 2, 2, "#6a90c0");
      }
    }
  }
}

function drawShop(ctx, level) {
  drawGrass(ctx, 0);
  const lv = Math.min(level, 4);
  if (lv === 0) {
    rect(ctx, 4, 8, 8, 5, P.shop);
    rect(ctx, 3, 6, 10, 3, P.shopRoof);
    return;
  }
  if (lv <= 2) {
    rect(ctx, 2, 6, 12, 9, P.shop);
    rect(ctx, 1, 3, 14, 4, P.shopRoof);
    rect(ctx, 4, 9, 8, 4, "#c0e0f0");
    rect(ctx, 6, 11, 4, 4, "#3a3a3a");
  } else {
    rect(ctx, 1, 1, 14, 14, "#3a6a9a");
    rect(ctx, 0, 0, 16, 2, "#1a3a5a");
    for (let y = 3; y < 14; y += 3) {
      for (let x = 2; x < 14; x += 3) rect(ctx, x, y, 2, 2, "#a0d0f0");
    }
  }
}

function drawFactory(ctx, level) {
  drawGrass(ctx, 0);
  const lv = Math.min(level, 4);
  rect(ctx, 2, 6, 12, 9, P.factory);
  rect(ctx, 1, 5, 14, 2, "#6a6a5a");
  if (lv >= 1) {
    rect(ctx, 4, 2, 3, 5, "#5a5a4a");
    rect(ctx, 10, 1, 3, 6, "#5a5a4a");
    px(ctx, 5, 1, P.smoke);
    px(ctx, 11, 0, P.smoke);
  }
  for (let x = 3; x < 14; x += 3) rect(ctx, x, 8, 2, 2, "#303028");
  if (lv >= 3) {
    rect(ctx, 0, 4, 5, 11, "#707060");
    rect(ctx, 1, 6, 2, 2, "#ffaa20");
  }
}

function drawPolice(ctx) {
  rect(ctx, 0, 0, 16, 16, P.grass);
  rect(ctx, 1, 4, 14, 11, P.police);
  rect(ctx, 0, 3, 16, 2, "#1a2a5a");
  rect(ctx, 6, 1, 4, 3, "#c43030");
  rect(ctx, 3, 7, 4, 3, "#a0c0e0");
  rect(ctx, 9, 7, 4, 3, "#a0c0e0");
  rect(ctx, 6, 11, 4, 4, "#1a1a2a");
  ctx.fillStyle = "#fff";
  ctx.font = "bold 6px monospace";
  ctx.textAlign = "center";
  ctx.fillText("P", 8, 10);
}

function drawFireDept(ctx) {
  rect(ctx, 0, 0, 16, 16, P.grass);
  rect(ctx, 1, 4, 14, 11, P.fireSt);
  rect(ctx, 0, 3, 16, 2, "#8a2020");
  rect(ctx, 3, 7, 10, 5, "#1a1a1a");
  rect(ctx, 4, 8, 3, 3, "#f0d040");
  rect(ctx, 9, 8, 3, 3, "#f0d040");
  ctx.fillStyle = "#fff";
  ctx.font = "bold 6px monospace";
  ctx.textAlign = "center";
  ctx.fillText("F", 8, 6);
}

function drawStadium(ctx, ox, oy) {
  // 4x4の一部。ox,oy = 0..3
  const c = makeCanvas();
  const { ctx: g } = c;
  rect(g, 0, 0, 16, 16, P.stadium);
  // フィールド風
  if (ox >= 1 && ox <= 2 && oy >= 1 && oy <= 2) {
    rect(g, 0, 0, 16, 16, "#5aaa48");
    if (ox === 1 && oy === 1) rect(g, 8, 8, 8, 8, "#6aba58");
    if (ox === 2 && oy === 1) rect(g, 0, 8, 8, 8, "#6aba58");
    if (ox === 1 && oy === 2) rect(g, 8, 0, 8, 8, "#6aba58");
    if (ox === 2 && oy === 2) rect(g, 0, 0, 8, 8, "#6aba58");
  } else {
    rect(g, 0, 0, 16, 16, "#5a6a7a");
    for (let y = 2; y < 14; y += 3) rect(g, 2, y, 12, 1, "#8a9aaa");
  }
  return c.c;
}

function drawSeaport(ctx, ox, oy) {
  const c = makeCanvas();
  const { ctx: g } = c;
  rect(g, 0, 0, 16, 16, P.port);
  if (oy >= 2) {
    rect(g, 0, 0, 16, 16, P.water);
    rect(g, 2, 4, 12, 6, "#8a6a4a");
  } else {
    rect(g, 1, 2, 14, 12, "#5a7080");
    rect(g, 3, 5, 4, 4, "#304050");
    if (ox === 0) rect(g, 10, 1, 4, 10, "#406070");
  }
  return c.c;
}

function drawCoal(ctx, ox, oy) {
  const c = makeCanvas();
  const { ctx: g } = c;
  rect(g, 0, 0, 16, 16, P.coal);
  rect(g, 2, 4, 12, 10, "#3a3a3a");
  if (ox === 0 && oy === 0) {
    rect(g, 4, 0, 4, 8, "#2a2a2a");
    px(g, 5, 0, P.smoke);
  }
  if (ox === 1 && oy === 0) {
    rect(g, 8, 0, 4, 8, "#2a2a2a");
    px(g, 9, 0, P.smoke);
  }
  rect(g, 4, 8, 3, 3, "#ffaa20");
  return c.c;
}

function drawNuclear(ctx, ox, oy) {
  const c = makeCanvas();
  const { ctx: g } = c;
  rect(g, 0, 0, 16, 16, P.nuclear);
  rect(g, 2, 6, 12, 8, "#a0b070");
  if ((ox === 0 || ox === 1) && oy === 0) {
    // クーリングタワー
    rect(g, 4, 2, 8, 10, "#c8d8a0");
    rect(g, 5, 0, 6, 4, "#d8e8b0");
    px(g, 7, 0, "#ddd");
  }
  if (ox === 0 && oy === 1) {
    // 放射能マーク風
    rect(g, 5, 5, 6, 6, "#222");
    px(g, 7, 7, "#ffe040");
  }
  return c.c;
}

function drawAirport(ctx, ox, oy) {
  const c = makeCanvas();
  const { ctx: g } = c;
  rect(g, 0, 0, 16, 16, P.airport);
  // 滑走路
  if (oy === 1 || oy === 2) {
    rect(g, 0, 6, 16, 4, "#6a7078");
    for (let x = 1; x < 16; x += 4) rect(g, x, 7, 2, 2, "#fff");
  } else {
    rect(g, 2, 3, 12, 10, "#708090");
    rect(g, 4, 5, 3, 3, "#405060");
  }
  return c.c;
}

function drawRubble(ctx) {
  drawGrass(ctx, 1);
  for (const [x, y] of [[3, 5], [8, 4], [5, 9], [11, 8], [2, 11], [9, 12]]) {
    rect(ctx, x, y, 3, 2, P.rubble);
    px(ctx, x + 1, y, "#4a3a2a");
  }
}

function drawFire(ctx, frame) {
  drawRubble(ctx);
  const f = frame % 2;
  const cols = f ? [P.fire1, P.fire2, "#ff2000"] : [P.fire2, P.fire1, "#ff8000"];
  for (let i = 0; i < 6; i++) {
    const x = 3 + (i * 2 + f) % 10;
    const h = 4 + ((i + f) % 5);
    for (let y = 0; y < h; y++) px(ctx, x, 14 - y, cols[y % 3]);
  }
}

function drawFlood(ctx) {
  rect(ctx, 0, 0, 16, 16, P.flood);
  for (let i = 0; i < 10; i++) {
    px(ctx, (i * 3) % 16, (i * 5) % 16, P.foam);
  }
}

/**
 * スプライトシートを生成して返す
 */
export function createSprites() {
  const sheet = {};

  // 地形
  for (let v = 0; v < 2; v++) {
    const { c, ctx } = makeCanvas();
    drawGrass(ctx, v);
    sheet[`land${v}`] = c;
  }
  for (let f = 0; f < 4; f++) {
    const { c, ctx } = makeCanvas();
    drawWater(ctx, f);
    sheet[`water${f}`] = c;
  }
  {
    const { c, ctx } = makeCanvas();
    drawForest(ctx);
    sheet.forest = c;
  }
  {
    const { c, ctx } = makeCanvas();
    drawTree(ctx);
    sheet.tree = c;
  }

  // 道路・線路・電線（接続マスク 0–15）
  for (let m = 0; m < 16; m++) {
    let { c, ctx } = makeCanvas();
    drawRoad(ctx, m);
    sheet[`road${m}`] = c;
    ({ c, ctx } = makeCanvas());
    drawRail(ctx, m);
    sheet[`rail${m}`] = c;
    ({ c, ctx } = makeCanvas());
    drawWire(ctx, m, false);
    sheet[`wire${m}`] = c;
  }

  {
    const { c, ctx } = makeCanvas();
    drawPark(ctx);
    sheet.park = c;
  }
  {
    const { c, ctx } = makeCanvas();
    drawZoneFrame(ctx, P.zoneR, "R");
    sheet.zoneR = c;
  }
  {
    const { c, ctx } = makeCanvas();
    drawZoneFrame(ctx, P.zoneC, "C");
    sheet.zoneC = c;
  }
  {
    const { c, ctx } = makeCanvas();
    drawZoneFrame(ctx, P.zoneI, "I");
    sheet.zoneI = c;
  }

  for (let lv = 0; lv <= 4; lv++) {
    let { c, ctx } = makeCanvas();
    drawHouse(ctx, lv);
    sheet[`house${lv}`] = c;
    ({ c, ctx } = makeCanvas());
    drawShop(ctx, lv);
    sheet[`shop${lv}`] = c;
    ({ c, ctx } = makeCanvas());
    drawFactory(ctx, lv);
    sheet[`factory${lv}`] = c;
  }

  {
    const { c, ctx } = makeCanvas();
    drawPolice(ctx);
    sheet.police = c;
  }
  {
    const { c, ctx } = makeCanvas();
    drawFireDept(ctx);
    sheet.fire = c;
  }

  for (let oy = 0; oy < 4; oy++) {
    for (let ox = 0; ox < 4; ox++) {
      sheet[`stadium_${ox}_${oy}`] = drawStadium(null, ox, oy);
      sheet[`seaport_${ox}_${oy}`] = drawSeaport(null, ox, oy);
      sheet[`coal_${ox}_${oy}`] = drawCoal(null, ox, oy);
      sheet[`nuclear_${ox}_${oy}`] = drawNuclear(null, ox, oy);
      sheet[`airport_${ox}_${oy}`] = drawAirport(null, ox, oy);
    }
  }

  {
    const { c, ctx } = makeCanvas();
    drawRubble(ctx);
    sheet.rubble = c;
  }
  for (let f = 0; f < 2; f++) {
    const { c, ctx } = makeCanvas();
    drawFire(ctx, f);
    sheet[`fireAnim${f}`] = c;
  }
  {
    const { c, ctx } = makeCanvas();
    drawFlood(ctx);
    sheet.flood = c;
  }

  // 通電インジケータ
  {
    const { c, ctx } = makeCanvas();
    rect(ctx, 12, 1, 3, 3, P.powerOn);
    sheet.powerOn = c;
  }
  {
    const { c, ctx } = makeCanvas();
    rect(ctx, 12, 1, 3, 3, "#222");
    px(ctx, 13, 2, "#f44");
    sheet.powerOff = c;
  }

  return sheet;
}

export function terrainSprite(sheet, t, frame) {
  if (t === Terrain.WATER) return sheet[`water${frame % 4}`];
  if (t === Terrain.FOREST) return sheet.forest;
  if (t === Terrain.TREE) return sheet.tree;
  return sheet[`land${0}`];
}

export function featureSprite(sheet, f, mask) {
  if (f === Feature.ROAD || f === Feature.ROAD_WIRE || f === Feature.ROAD_RAIL) return sheet[`road${mask}`];
  if (f === Feature.RAIL || f === Feature.RAIL_WIRE) return sheet[`rail${mask}`];
  if (f === Feature.WIRE) return sheet[`wire${mask}`];
  if (f === Feature.PARK) return sheet.park;
  if (f === Feature.RUBBLE) return sheet.rubble;
  if (f === Feature.FIRE) return sheet[`fireAnim${0}`];
  if (f === Feature.FLOOD) return sheet.flood;
  return null;
}

export function buildingSprite(sheet, type, level, ox, oy) {
  switch (type) {
    case Building.ZONE_R:
      return level <= 0 ? sheet.zoneR : sheet[`house${Math.min(level, 4)}`];
    case Building.ZONE_C:
      return level <= 0 ? sheet.zoneC : sheet[`shop${Math.min(level, 4)}`];
    case Building.ZONE_I:
      return level <= 0 ? sheet.zoneI : sheet[`factory${Math.min(level, 4)}`];
    case Building.POLICE:
      return sheet.police;
    case Building.FIRE:
      return sheet.fire;
    case Building.STADIUM:
      return sheet[`stadium_${ox}_${oy}`];
    case Building.SEAPORT:
      return sheet[`seaport_${ox}_${oy}`];
    case Building.COAL:
      return sheet[`coal_${ox}_${oy}`];
    case Building.NUCLEAR:
      return sheet[`nuclear_${ox}_${oy}`];
    case Building.AIRPORT:
      return sheet[`airport_${ox}_${oy}`];
    default:
      return null;
  }
}
