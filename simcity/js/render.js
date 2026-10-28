import { TILE, MAP_W, MAP_H, Terrain, Feature, Building, BUILD_SIZE } from "./constants.js";
import { createSprites, terrainSprite, buildingSprite } from "./sprites.js";

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.sprites = createSprites();
    this.camX = MAP_W * TILE / 2;
    this.camY = MAP_H * TILE / 2;
    this.zoom = 3; // 整数倍がきれい
    this.frame = 0;
    this.overlay = null; // null | 'pollution' | 'crime' | 'power' | 'land' | 'traffic'
    this.ghost = null; // {tool, x, y, ok}
    this.dpr = 1;
  }

  resize() {
    const parent = this.canvas.parentElement;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.floor(w * this.dpr);
    this.canvas.height = Math.floor(h * this.dpr);
    this.canvas.style.width = w + "px";
    this.canvas.style.height = h + "px";
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  }

  screenToWorld(sx, sy) {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const wx = this.camX + (sx - w / 2) / this.zoom;
    const wy = this.camY + (sy - h / 2) / this.zoom;
    return { x: Math.floor(wx / TILE), y: Math.floor(wy / TILE) };
  }

  clampCam() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const halfW = w / (2 * this.zoom);
    const halfH = h / (2 * this.zoom);
    const maxX = MAP_W * TILE - halfW;
    const maxY = MAP_H * TILE - halfH;
    this.camX = Math.max(halfW, Math.min(maxX, this.camX));
    this.camY = Math.max(halfH, Math.min(maxY, this.camY));
  }

  setZoom(z, anchorSx, anchorSy) {
    const before = this.screenToWorld(anchorSx, anchorSy);
    this.zoom = Math.max(1.5, Math.min(6, z));
    // アンカー維持
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.camX = before.x * TILE + TILE / 2 - (anchorSx - w / 2) / this.zoom;
    this.camY = before.y * TILE + TILE / 2 - (anchorSy - h / 2) / this.zoom;
    this.clampCam();
  }

  draw(city) {
    this.frame++;
    this.clampCam();
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    ctx.fillStyle = "#1a3040";
    ctx.fillRect(0, 0, w, h);

    const z = this.zoom;
    const left = this.camX - w / (2 * z);
    const top = this.camY - h / (2 * z);
    const x0 = Math.max(0, Math.floor(left / TILE) - 1);
    const y0 = Math.max(0, Math.floor(top / TILE) - 1);
    const x1 = Math.min(MAP_W - 1, Math.ceil((left + w / z) / TILE) + 1);
    const y1 = Math.min(MAP_H - 1, Math.ceil((top + h / z) / TILE) + 1);

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(z, z);
    ctx.translate(-this.camX, -this.camY);
    ctx.imageSmoothingEnabled = false;

    const anim = (this.frame / 12) | 0;

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = y * MAP_W + x;
        const px = x * TILE;
        const py = y * TILE;

        // 地形
        const ts = terrainSprite(this.sprites, city.terrain[i], anim);
        ctx.drawImage(ts, px, py);

        // 地物
        const f = city.feature[i];
        if (f === Feature.PARK) {
          ctx.drawImage(this.sprites.park, px, py);
        } else if (f === Feature.RUBBLE) {
          ctx.drawImage(this.sprites.rubble, px, py);
        } else if (f === Feature.FIRE) {
          ctx.drawImage(this.sprites[`fireAnim${anim % 2}`], px, py);
        } else if (f === Feature.FLOOD) {
          ctx.drawImage(this.sprites.flood, px, py);
        } else if (f === Feature.ROAD || f === Feature.ROAD_WIRE || f === Feature.ROAD_RAIL) {
          const m = city.connectionMask(x, y, "road");
          ctx.drawImage(this.sprites[`road${m}`], px, py);
          if (city.traffic[i] > 80) {
            ctx.fillStyle = `rgba(255,80,40,${Math.min(0.45, city.traffic[i] / 400)})`;
            ctx.fillRect(px + 5, py + 5, 6, 6);
          }
          if (f === Feature.ROAD_WIRE) {
            const wm = city.connectionMask(x, y, "wire");
            // 電線を薄く重ねる
            ctx.globalAlpha = 0.85;
            ctx.drawImage(this.sprites[`wire${wm}`], px, py);
            ctx.globalAlpha = 1;
          }
        } else if (f === Feature.RAIL || f === Feature.RAIL_WIRE) {
          const m = city.connectionMask(x, y, "rail");
          ctx.drawImage(this.sprites[`rail${m}`], px, py);
          if (f === Feature.RAIL_WIRE) {
            ctx.globalAlpha = 0.85;
            ctx.drawImage(this.sprites[`wire${city.connectionMask(x, y, "wire")}`], px, py);
            ctx.globalAlpha = 1;
          }
        } else if (f === Feature.WIRE) {
          const m = city.connectionMask(x, y, "wire");
          ctx.drawImage(this.sprites[`wire${m}`], px, py);
        }

        // 建物（各タイル）
        const b = city.building[i];
        if (b) {
          const ox = city.bOx[i];
          const oy = city.bOy[i];
          const size = BUILD_SIZE[b] || 1;
          // 3x3ゾーンは中心タイルに発展スプライト、外周はレベルに応じた小建物 or 枠
          if (b === Building.ZONE_R || b === Building.ZONE_C || b === Building.ZONE_I) {
            if (city.level[i] === 0) {
              // 空きゾーン枠は中心だけ大きく、外周は薄く
              if (ox === 1 && oy === 1) {
                const sp = b === Building.ZONE_R ? this.sprites.zoneR
                  : b === Building.ZONE_C ? this.sprites.zoneC : this.sprites.zoneI;
                ctx.drawImage(sp, px, py);
              } else {
                const color = b === Building.ZONE_R ? "rgba(61,184,74,0.35)"
                  : b === Building.ZONE_C ? "rgba(58,122,217,0.35)" : "rgba(212,160,23,0.35)";
                ctx.fillStyle = color;
                ctx.fillRect(px + 1, py + 1, 14, 14);
                ctx.strokeStyle = color.replace("0.35", "0.8");
                ctx.strokeRect(px + 0.5, py + 0.5, 15, 15);
              }
            } else {
              // 発展済み: 各セルに小建物
              const lv = city.level[i];
              const sp = buildingSprite(this.sprites, b, Math.max(1, lv - (ox + oy) % 2), 0, 0);
              if (sp) ctx.drawImage(sp, px, py);
            }
            // 通電インジケータ（中心）
            if (ox === 1 && oy === 1) {
              ctx.drawImage(city.powered[i] ? this.sprites.powerOn : this.sprites.powerOff, px, py);
            }
          } else if (size >= 4) {
            const sp = buildingSprite(this.sprites, b, 0, ox, oy);
            if (sp) ctx.drawImage(sp, px, py);
            if (ox === 0 && oy === 0) {
              ctx.drawImage(city.powered[i] ? this.sprites.powerOn : this.sprites.powerOff, px, py);
            }
          } else {
            // 3x3サービス
            if (ox === 1 && oy === 1) {
              const sp = buildingSprite(this.sprites, b, 0, 0, 0);
              if (sp) ctx.drawImage(sp, px, py);
              ctx.drawImage(city.powered[i] ? this.sprites.powerOn : this.sprites.powerOff, px, py);
            } else {
              const colors = {
                [Building.POLICE]: "#2a4a8a",
                [Building.FIRE]: "#c43030",
              };
              ctx.fillStyle = colors[b] || "#555";
              ctx.fillRect(px + 1, py + 1, 14, 14);
            }
          }
        }

        // オーバーレイ
        if (this.overlay) {
          let a = 0;
          let col = "255,0,0";
          if (this.overlay === "pollution") { a = city.pollution[i] / 255; col = "180,80,20"; }
          else if (this.overlay === "crime") { a = city.crime[i] / 255; col = "160,40,160"; }
          else if (this.overlay === "power") { a = city.powered[i] ? 0.25 : (city.building[i] ? 0.45 : 0); col = city.powered[i] ? "40,200,80" : "200,40,40"; }
          else if (this.overlay === "land") { a = city.landValue[i] / 300; col = "40,160,80"; }
          else if (this.overlay === "traffic") { a = city.traffic[i] / 255; col = "220,60,40"; }
          if (a > 0.05) {
            ctx.fillStyle = `rgba(${col},${Math.min(0.55, a)})`;
            ctx.fillRect(px, py, TILE, TILE);
          }
        }
      }
    }

    // モンスター
    if (city.monster) {
      const mx = city.monster.x * TILE;
      const my = city.monster.y * TILE;
      this._drawMonster(ctx, mx, my, anim);
    }

    // ゴースト（建設プレビュー）
    if (this.ghost) {
      const { x, y, size, ok } = this.ghost;
      ctx.fillStyle = ok ? "rgba(80,220,120,0.35)" : "rgba(220,60,60,0.4)";
      ctx.strokeStyle = ok ? "rgba(80,220,120,0.9)" : "rgba(220,60,60,0.9)";
      ctx.lineWidth = 1 / z;
      const s = (size || 1) * TILE;
      ctx.fillRect(x * TILE, y * TILE, s, s);
      ctx.strokeRect(x * TILE + 0.5, y * TILE + 0.5, s - 1, s - 1);
    }

    ctx.restore();
  }

  _drawMonster(ctx, x, y, anim) {
    // 独自ドット怪獣（緑のうろこ＋トゲ）
    const bob = (anim % 2);
    ctx.fillStyle = "#2d6b28";
    ctx.fillRect(x + 2, y + 4 + bob, 12, 10);
    ctx.fillStyle = "#1f4f1c";
    ctx.fillRect(x + 4, y + 2 + bob, 3, 3);
    ctx.fillRect(x + 9, y + 2 + bob, 3, 3);
    ctx.fillStyle = "#f0e040";
    ctx.fillRect(x + 4, y + 7 + bob, 2, 2);
    ctx.fillRect(x + 10, y + 7 + bob, 2, 2);
    ctx.fillStyle = "#c43030";
    ctx.fillRect(x + 6, y + 10 + bob, 4, 2);
  }

  drawMinimap(canvas, city) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const sx = w / MAP_W;
    const sy = h / MAP_H;
    const img = ctx.createImageData(w, h);
    // 簡易: 1セル1px想定でスケール
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const i = y * MAP_W + x;
        let r = 74, g = 143, b = 60;
        if (city.terrain[i] === Terrain.WATER) { r = 42; g = 106; b = 170; }
        else if (city.terrain[i] === Terrain.FOREST) { r = 45; g = 107; b = 40; }
        const f = city.feature[i];
        if (f === Feature.ROAD || f === Feature.ROAD_WIRE) { r = 90; g = 90; b = 90; }
        if (f === Feature.RAIL || f === Feature.RAIL_WIRE) { r = 50; g = 50; b = 50; }
        if (f === Feature.PARK) { r = 85; g = 180; b = 70; }
        if (f === Feature.FIRE) { r = 255; g = 100; b = 30; }
        const bd = city.building[i];
        if (bd === Building.ZONE_R) { r = 60; g = 200; b = 70; }
        if (bd === Building.ZONE_C) { r = 60; g = 120; b = 220; }
        if (bd === Building.ZONE_I) { r = 220; g = 180; b = 40; }
        if (bd === Building.COAL || bd === Building.NUCLEAR) { r = 200; g = 80; b = 40; }
        if (bd === Building.POLICE) { r = 40; g = 60; b = 160; }
        if (bd === Building.FIRE) { r = 200; g = 40; b = 40; }
        const px = Math.floor(x * sx);
        const py = Math.floor(y * sy);
        for (let dy = 0; dy < Math.ceil(sy); dy++) {
          for (let dx = 0; dx < Math.ceil(sx); dx++) {
            const p = ((py + dy) * w + (px + dx)) * 4;
            if (p + 3 >= img.data.length) continue;
            img.data[p] = r;
            img.data[p + 1] = g;
            img.data[p + 2] = b;
            img.data[p + 3] = 255;
          }
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    // カメラ枠
    const viewW = this.canvas.clientWidth / this.zoom / TILE;
    const viewH = this.canvas.clientHeight / this.zoom / TILE;
    const cx = this.camX / TILE;
    const cy = this.camY / TILE;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.strokeRect((cx - viewW / 2) * sx, (cy - viewH / 2) * sy, viewW * sx, viewH * sy);
  }
}
