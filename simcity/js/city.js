import {
  MAP_W, MAP_H, Terrain, Feature, Building, BUILD_SIZE, COST,
  POWER_CAPACITY, cityRank, DIFFICULTY,
} from "./constants.js";
import { generateMap } from "./mapgen.js";

const DIR = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // N E S W
const DIR_MASK = [1, 2, 4, 8];

function idx(x, y) {
  return y * MAP_W + x;
}

function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
}

export class City {
  constructor({ mapNo = 61, difficulty = "easy", name = "マイシティ" } = {}) {
    const map = generateMap(mapNo);
    this.name = name;
    this.mapNo = mapNo;
    this.difficulty = difficulty;
    this.w = MAP_W;
    this.h = MAP_H;

    this.terrain = map.terrain;
    this.feature = new Uint8Array(MAP_W * MAP_H);
    this.building = new Uint8Array(MAP_W * MAP_H);
    this.bOx = new Uint8Array(MAP_W * MAP_H); // 建物内オフセット
    this.bOy = new Uint8Array(MAP_W * MAP_H);
    this.level = new Uint8Array(MAP_W * MAP_H); // ゾーン発展度 0–5
    this.powered = new Uint8Array(MAP_W * MAP_H);
    this.traffic = new Uint8Array(MAP_W * MAP_H);
    this.pollution = new Uint8Array(MAP_W * MAP_H);
    this.crime = new Uint8Array(MAP_W * MAP_H);
    this.landValue = new Uint8Array(MAP_W * MAP_H);
    this.fireCov = new Uint8Array(MAP_W * MAP_H);
    this.policeCov = new Uint8Array(MAP_W * MAP_H);

    this.funds = DIFFICULTY[difficulty].funds;
    this.taxRate = DIFFICULTY[difficulty].taxDefault;
    this.fundRoad = 100;
    this.fundPolice = 100;
    this.fundFire = 100;

    this.year = 1900;
    this.month = 1;
    this.tick = 0;
    this.population = 0;
    this.prevPop = 0;
    this.score = 500;

    this.demandR = 0;
    this.demandC = 0;
    this.demandI = 0;

    this.messages = [];
    this.gifts = [];
    this.pendingGift = null;
    this.disastersEnabled = true;
    this.lastDisasterYear = 1899;
    this.history = []; // {year, pop, funds}

    this.hasStadium = false;
    this.hasSeaport = false;
    this.hasAirport = false;
    this.rankAnnounced = new Set(["むら"]);

    this._fillLandValue();
  }

  _fillLandValue() {
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const i = idx(x, y);
        if (this.terrain[i] === Terrain.WATER) {
          this.landValue[i] = 0;
          continue;
        }
        let v = 30;
        // 水辺ボーナス
        for (const [dx, dy] of DIR) {
          const nx = x + dx, ny = y + dy;
          if (inBounds(nx, ny) && this.terrain[idx(nx, ny)] === Terrain.WATER) v += 12;
        }
        if (this.terrain[i] === Terrain.FOREST) v += 5;
        this.landValue[i] = Math.min(250, v);
      }
    }
  }

  isWater(x, y) {
    return this.terrain[idx(x, y)] === Terrain.WATER;
  }

  isBuildableLand(x, y) {
    if (!inBounds(x, y)) return false;
    const i = idx(x, y);
    if (this.terrain[i] === Terrain.WATER) return false;
    if (this.building[i]) return false;
    if (this.feature[i] === Feature.FIRE || this.feature[i] === Feature.FLOOD) return false;
    return true;
  }

  canPlaceLine(x, y) {
    if (!inBounds(x, y)) return false;
    const i = idx(x, y);
    if (this.building[i]) return false;
    if (this.feature[i] === Feature.FIRE) return false;
    return true;
  }

  /** 接続マスク（道路・線路・電線） */
  connectionMask(x, y, kind) {
    let m = 0;
    for (let d = 0; d < 4; d++) {
      const nx = x + DIR[d][0];
      const ny = y + DIR[d][1];
      if (!inBounds(nx, ny)) continue;
      const f = this.feature[idx(nx, ny)];
      const match =
        (kind === "road" && (f === Feature.ROAD || f === Feature.ROAD_WIRE || f === Feature.ROAD_RAIL)) ||
        (kind === "rail" && (f === Feature.RAIL || f === Feature.RAIL_WIRE || f === Feature.ROAD_RAIL)) ||
        (kind === "wire" && (f === Feature.WIRE || f === Feature.ROAD_WIRE || f === Feature.RAIL_WIRE));
      // 建物も電線接続可
      const b = this.building[idx(nx, ny)];
      const wireB = kind === "wire" && b && this.poweredBuilding(b);
      if (match || wireB) m |= DIR_MASK[d];
    }
    return m;
  }

  poweredBuilding(b) {
    return b === Building.ZONE_R || b === Building.ZONE_C || b === Building.ZONE_I ||
      b === Building.POLICE || b === Building.FIRE || b === Building.STADIUM ||
      b === Building.SEAPORT || b === Building.COAL || b === Building.NUCLEAR ||
      b === Building.AIRPORT || b === Building.HOUSE || b === Building.ZOO;
  }

  spend(n) {
    if (this.funds < n) return false;
    this.funds -= n;
    return true;
  }

  addMessage(text, kind = "info") {
    this.messages.unshift({ text, kind, t: Date.now() });
    if (this.messages.length > 12) this.messages.pop();
  }

  /** ツール実行。成功なら true */
  applyTool(toolId, x, y) {
    switch (toolId) {
      case "bulldoze": return this.bulldoze(x, y);
      case "road": return this.placeRoad(x, y);
      case "rail": return this.placeRail(x, y);
      case "wire": return this.placeWire(x, y);
      case "park": return this.placePark(x, y);
      case "zoneR": return this.placeBuilding(x, y, Building.ZONE_R, COST.zoneR);
      case "zoneC": return this.placeBuilding(x, y, Building.ZONE_C, COST.zoneC);
      case "zoneI": return this.placeBuilding(x, y, Building.ZONE_I, COST.zoneI);
      case "police": return this.placeBuilding(x, y, Building.POLICE, COST.police);
      case "fire": return this.placeBuilding(x, y, Building.FIRE, COST.fire);
      case "stadium": return this.placeBuilding(x, y, Building.STADIUM, COST.stadium);
      case "seaport": return this.placeBuilding(x, y, Building.SEAPORT, COST.seaport);
      case "coal": return this.placeBuilding(x, y, Building.COAL, COST.coal);
      case "nuclear": return this.placeBuilding(x, y, Building.NUCLEAR, COST.nuclear);
      case "airport": return this.placeBuilding(x, y, Building.AIRPORT, COST.airport);
      default: return false;
    }
  }

  toolCostAt(toolId, x, y) {
    const water = inBounds(x, y) && this.isWater(x, y);
    switch (toolId) {
      case "bulldoze": return COST.bulldoze;
      case "road": return water ? COST.roadWater : COST.road;
      case "rail": return water ? COST.railWater : COST.rail;
      case "wire": return water ? COST.wireWater : COST.wire;
      case "park": return COST.park;
      case "zoneR": return COST.zoneR;
      case "zoneC": return COST.zoneC;
      case "zoneI": return COST.zoneI;
      case "police": return COST.police;
      case "fire": return COST.fire;
      case "stadium": return COST.stadium;
      case "seaport": return COST.seaport;
      case "coal": return COST.coal;
      case "nuclear": return COST.nuclear;
      case "airport": return COST.airport;
      default: return 0;
    }
  }

  bulldoze(x, y) {
    if (!inBounds(x, y)) return false;
    const i = idx(x, y);
    if (this.feature[i] === Feature.FIRE || this.feature[i] === Feature.FLOOD) return false;

    if (this.building[i]) {
      // 建物は中心（ox=oy=サイズの中央寄り）を狙うか、どのタイルでも可
      const type = this.building[i];
      const size = BUILD_SIZE[type] || 1;
      const ox = this.bOx[i];
      const oy = this.bOy[i];
      const bx = x - ox;
      const by = y - oy;
      if (!this.spend(COST.bulldoze * size * size)) return false;
      for (let dy = 0; dy < size; dy++) {
        for (let dx = 0; dx < size; dx++) {
          const j = idx(bx + dx, by + dy);
          this.building[j] = Building.NONE;
          this.bOx[j] = 0;
          this.bOy[j] = 0;
          this.level[j] = 0;
          this.powered[j] = 0;
          this.feature[j] = Feature.RUBBLE;
        }
      }
      if (type === Building.STADIUM) this.hasStadium = this.countBuilding(Building.STADIUM) > 0;
      if (type === Building.SEAPORT) this.hasSeaport = this.countBuilding(Building.SEAPORT) > 0;
      if (type === Building.AIRPORT) this.hasAirport = this.countBuilding(Building.AIRPORT) > 0;
      return true;
    }

    if (this.feature[i] && this.feature[i] !== Feature.NONE) {
      if (!this.spend(COST.bulldoze)) return false;
      this.feature[i] = Feature.NONE;
      // 森も整地
      if (this.terrain[i] === Terrain.FOREST || this.terrain[i] === Terrain.TREE) {
        this.terrain[i] = Terrain.LAND;
      }
      return true;
    }

    if (this.terrain[i] === Terrain.FOREST || this.terrain[i] === Terrain.TREE) {
      if (!this.spend(COST.bulldoze)) return false;
      this.terrain[i] = Terrain.LAND;
      return true;
    }
    return false;
  }

  placeRoad(x, y) {
    if (!this.canPlaceLine(x, y)) return false;
    const i = idx(x, y);
    const cost = this.isWater(x, y) ? COST.roadWater : COST.road;
    const f = this.feature[i];
    if (f === Feature.ROAD || f === Feature.ROAD_WIRE || f === Feature.ROAD_RAIL) return false;
    if (!this.spend(cost)) return false;
    if (f === Feature.WIRE) this.feature[i] = Feature.ROAD_WIRE;
    else if (f === Feature.RAIL || f === Feature.RAIL_WIRE) this.feature[i] = Feature.ROAD_RAIL;
    else this.feature[i] = Feature.ROAD;
    if (this.terrain[i] === Terrain.FOREST || this.terrain[i] === Terrain.TREE) this.terrain[i] = Terrain.LAND;
    return true;
  }

  placeRail(x, y) {
    if (!this.canPlaceLine(x, y)) return false;
    const i = idx(x, y);
    const cost = this.isWater(x, y) ? COST.railWater : COST.rail;
    const f = this.feature[i];
    if (f === Feature.RAIL || f === Feature.RAIL_WIRE || f === Feature.ROAD_RAIL) return false;
    if (!this.spend(cost)) return false;
    if (f === Feature.WIRE) this.feature[i] = Feature.RAIL_WIRE;
    else if (f === Feature.ROAD || f === Feature.ROAD_WIRE) this.feature[i] = Feature.ROAD_RAIL;
    else this.feature[i] = Feature.RAIL;
    if (this.terrain[i] === Terrain.FOREST || this.terrain[i] === Terrain.TREE) this.terrain[i] = Terrain.LAND;
    return true;
  }

  placeWire(x, y) {
    if (!this.canPlaceLine(x, y)) return false;
    const i = idx(x, y);
    const cost = this.isWater(x, y) ? COST.wireWater : COST.wire;
    const f = this.feature[i];
    if (f === Feature.WIRE || f === Feature.ROAD_WIRE || f === Feature.RAIL_WIRE) return false;
    if (!this.spend(cost)) return false;
    if (f === Feature.ROAD) this.feature[i] = Feature.ROAD_WIRE;
    else if (f === Feature.RAIL) this.feature[i] = Feature.RAIL_WIRE;
    else this.feature[i] = Feature.WIRE;
    if (this.terrain[i] === Terrain.FOREST || this.terrain[i] === Terrain.TREE) this.terrain[i] = Terrain.LAND;
    return true;
  }

  placePark(x, y) {
    if (!this.isBuildableLand(x, y)) return false;
    const i = idx(x, y);
    if (this.feature[i] && this.feature[i] !== Feature.RUBBLE) return false;
    if (!this.spend(COST.park)) return false;
    this.feature[i] = Feature.PARK;
    if (this.terrain[i] === Terrain.FOREST || this.terrain[i] === Terrain.TREE) this.terrain[i] = Terrain.LAND;
    return true;
  }

  placeBuilding(cx, cy, type, cost) {
    const size = BUILD_SIZE[type];
    // カーソルを建物の左上として扱う（スマホで分かりやすい）
    const x0 = cx;
    const y0 = cy;
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        const x = x0 + dx, y = y0 + dy;
        if (!inBounds(x, y)) return false;
        const i = idx(x, y);
        if (this.terrain[i] === Terrain.WATER) return false;
        if (this.building[i]) return false;
        if (this.feature[i] === Feature.FIRE || this.feature[i] === Feature.FLOOD) return false;
      }
    }
    if (!this.spend(cost)) return false;
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        const i = idx(x0 + dx, y0 + dy);
        this.building[i] = type;
        this.bOx[i] = dx;
        this.bOy[i] = dy;
        this.level[i] = 0;
        this.feature[i] = Feature.NONE;
        if (this.terrain[i] === Terrain.FOREST || this.terrain[i] === Terrain.TREE) {
          this.terrain[i] = Terrain.LAND;
        }
      }
    }
    if (type === Building.STADIUM) {
      this.hasStadium = true;
      this.addMessage("スタジアムができたよ！じゅうたくがよろこぶはず。", "good");
    }
    if (type === Building.SEAPORT) {
      this.hasSeaport = true;
      this.addMessage("みなとが開港！こうぎょうがかっぱつになるよ。", "good");
    }
    if (type === Building.AIRPORT) {
      this.hasAirport = true;
      this.addMessage("くうこうオープン！しょうぎょうがのびやすくなるよ。", "good");
    }
    if (type === Building.COAL || type === Building.NUCLEAR) {
      this.addMessage("はつでんしょが稼働開始。でんせんでつなごう！", "good");
    }
    return true;
  }

  countBuilding(type) {
    let n = 0;
    const size = BUILD_SIZE[type] || 1;
    for (let i = 0; i < this.building.length; i++) {
      if (this.building[i] === type && this.bOx[i] === 0 && this.bOy[i] === 0) n++;
    }
    return n;
  }

  countZones() {
    let r = 0, c = 0, i = 0, rDev = 0, cDev = 0, iDev = 0;
    for (let p = 0; p < this.building.length; p++) {
      if (this.bOx[p] !== 1 || this.bOy[p] !== 1) continue; // 3x3中心
      const b = this.building[p];
      if (b === Building.ZONE_R) { r++; if (this.level[p] > 0) rDev++; }
      if (b === Building.ZONE_C) { c++; if (this.level[p] > 0) cDev++; }
      if (b === Building.ZONE_I) { i++; if (this.level[p] > 0) iDev++; }
    }
    return { r, c, i, rDev, cDev, iDev };
  }

  // —— シミュレーション ——

  step() {
    this.tick++;
    // 1 tick ≈ 少しの時間。12 tick で1ヶ月
    if (this.tick % 12 === 0) {
      this.month++;
      if (this.month > 12) {
        this.month = 1;
        this.year++;
        this.yearlyBudget();
        this.checkGifts();
        this.history.push({ year: this.year, pop: this.population, funds: this.funds });
        if (this.history.length > 120) this.history.shift();
      }
    }

    if (this.tick % 3 === 0) this.updatePower();
    if (this.tick % 4 === 0) this.updateCoverage();
    if (this.tick % 5 === 0) this.updatePollutionCrime();
    if (this.tick % 2 === 0) this.growZones();
    if (this.tick % 6 === 0) this.updateDemand();
    if (this.tick % 3 === 0) this.updatePopulation();
    if (this.tick % 8 === 0) this.updateTraffic();
    if (this.tick % 4 === 0) this.spreadFires();
    if (this.floodTicks > 0) {
      this.floodTicks--;
      if (this.floodTicks === 0) {
        for (let i = 0; i < this.feature.length; i++) {
          if (this.feature[i] === Feature.FLOOD) this.feature[i] = Feature.NONE;
        }
      }
    }
    if (this.disastersEnabled && this.tick % 40 === 0) this.maybeDisaster();
    if (this.monster) this.stepMonster();

    this.checkRankUp();
  }

  updatePower() {
    this.powered.fill(0);
    const isWire = (i) => {
      const f = this.feature[i];
      return f === Feature.WIRE || f === Feature.ROAD_WIRE || f === Feature.RAIL_WIRE;
    };
    // 導体: 電線、または電力を受け取る建物タイル
    const isConductor = (i) => isWire(i) || (this.building[i] && this.poweredBuilding(this.building[i]));

    const plants = [];
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const i = idx(x, y);
        if ((this.building[i] === Building.COAL || this.building[i] === Building.NUCLEAR) &&
            this.bOx[i] === 0 && this.bOy[i] === 0) {
          plants.push({ x, y, type: this.building[i] });
        }
      }
    }

    // 全発電所から電線・建物ネットワークへBFS（容量はゾーン中心のみ消費）
    let globalCap = 0;
    for (const p of plants) globalCap += POWER_CAPACITY[p.type] || 40;

    const q = [];
    const seen = new Uint8Array(MAP_W * MAP_H);
    for (const plant of plants) {
      const size = BUILD_SIZE[plant.type];
      for (let dy = 0; dy < size; dy++) {
        for (let dx = 0; dx < size; dx++) {
          const i = idx(plant.x + dx, plant.y + dy);
          this.powered[i] = 1;
          seen[i] = 1;
          q.push(i);
        }
      }
    }

    const zonesPowered = new Set();
    while (q.length) {
      const i = q.shift();
      const x = i % MAP_W;
      const y = (i / MAP_W) | 0;
      for (const [dx, dy] of DIR) {
        const nx = x + dx, ny = y + dy;
        if (!inBounds(nx, ny)) continue;
        const ni = idx(nx, ny);
        if (seen[ni]) continue;
        if (!isConductor(ni)) continue;

        // ゾーンは容量チェック
        const b = this.building[ni];
        const isZoneCenter = (b === Building.ZONE_R || b === Building.ZONE_C || b === Building.ZONE_I) &&
          this.bOx[ni] === 1 && this.bOy[ni] === 1;
        if (isZoneCenter && !zonesPowered.has(ni)) {
          if (zonesPowered.size >= globalCap) continue;
          zonesPowered.add(ni);
        }

        seen[ni] = 1;
        this.powered[ni] = 1;
        q.push(ni);

        // ゾーンの他タイルも通電扱い
        if (b === Building.ZONE_R || b === Building.ZONE_C || b === Building.ZONE_I) {
          const bx = nx - this.bOx[ni];
          const by = ny - this.bOy[ni];
          for (let oy = 0; oy < 3; oy++) {
            for (let ox = 0; ox < 3; ox++) {
              const zi = idx(bx + ox, by + oy);
              this.powered[zi] = 1;
              seen[zi] = 1;
            }
          }
        }
      }
    }
  }

  updateCoverage() {
    this.policeCov.fill(0);
    this.fireCov.fill(0);
    const addCov = (arr, cx, cy, radius, strength) => {
      for (let y = cy - radius; y <= cy + radius; y++) {
        for (let x = cx - radius; x <= cx + radius; x++) {
          if (!inBounds(x, y)) continue;
          const d = Math.abs(x - cx) + Math.abs(y - cy);
          if (d > radius) continue;
          const v = Math.max(0, strength - d * 8);
          const i = idx(x, y);
          arr[i] = Math.min(255, arr[i] + v);
        }
      }
    };
    const fundP = this.fundPolice / 100;
    const fundF = this.fundFire / 100;
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const i = idx(x, y);
        if (this.bOx[i] !== 1 || this.bOy[i] !== 1) continue;
        if (this.building[i] === Building.POLICE && this.powered[i]) {
          addCov(this.policeCov, x, y, 12, Math.floor(100 * fundP));
        }
        if (this.building[i] === Building.FIRE && this.powered[i]) {
          addCov(this.fireCov, x, y, 12, Math.floor(100 * fundF));
        }
      }
    }
  }

  updatePollutionCrime() {
    this.pollution.fill(0);
    this.crime.fill(0);
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const i = idx(x, y);
        let pol = 0;
        const b = this.building[i];
        if (b === Building.ZONE_I && this.bOx[i] === 1 && this.bOy[i] === 1) {
          pol = 20 + this.level[i] * 12;
        }
        if (b === Building.COAL && this.bOx[i] === 0 && this.bOy[i] === 0) pol = 60;
        if (b === Building.SEAPORT && this.bOx[i] === 0 && this.bOy[i] === 0) pol = 40;
        if (b === Building.AIRPORT && this.bOx[i] === 0 && this.bOy[i] === 0) pol = 50;
        if (this.feature[i] === Feature.ROAD || this.feature[i] === Feature.ROAD_WIRE) {
          pol += Math.min(15, this.traffic[i] / 10);
        }
        if (pol) {
          for (let dy = -3; dy <= 3; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
              const nx = x + dx, ny = y + dy;
              if (!inBounds(nx, ny)) continue;
              const d = Math.abs(dx) + Math.abs(dy);
              this.pollution[idx(nx, ny)] = Math.min(255, this.pollution[idx(nx, ny)] + Math.max(0, pol - d * 6));
            }
          }
        }
        // 公園は汚染軽減
        if (this.feature[i] === Feature.PARK) {
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              const nx = x + dx, ny = y + dy;
              if (!inBounds(nx, ny)) continue;
              const j = idx(nx, ny);
              this.pollution[j] = Math.max(0, this.pollution[j] - 8);
            }
          }
        }
      }
    }
    // 犯罪 = 人口密度 - 警察
    for (let i = 0; i < this.crime.length; i++) {
      const dens = this.level[i] * 20;
      this.crime[i] = Math.max(0, Math.min(255, dens + this.pollution[i] / 4 - this.policeCov[i]));
    }
    // 地価更新
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const i = idx(x, y);
        if (this.terrain[i] === Terrain.WATER) continue;
        let v = 40;
        for (const [dx, dy] of DIR) {
          if (inBounds(x + dx, y + dy) && this.terrain[idx(x + dx, y + dy)] === Terrain.WATER) v += 15;
        }
        if (this.feature[i] === Feature.PARK) v += 20;
        v += Math.min(40, this.policeCov[i] / 3);
        v -= this.pollution[i] / 3;
        v -= this.crime[i] / 4;
        if (this.hasStadium) v += 5;
        this.landValue[i] = Math.max(5, Math.min(250, v));
      }
    }
  }

  hasRoadAccess(x, y, size) {
    for (let dy = -1; dy <= size; dy++) {
      for (let dx = -1; dx <= size; dx++) {
        if (dy >= 0 && dy < size && dx >= 0 && dx < size) continue;
        const nx = x + dx, ny = y + dy;
        if (!inBounds(nx, ny)) continue;
        const f = this.feature[idx(nx, ny)];
        if (f === Feature.ROAD || f === Feature.ROAD_WIRE || f === Feature.ROAD_RAIL ||
            f === Feature.RAIL || f === Feature.RAIL_WIRE) return true;
      }
    }
    return false;
  }

  growZones() {
    const taxPenalty = Math.max(0, this.taxRate - 7) * 0.08;
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const i = idx(x, y);
        if (this.bOx[i] !== 1 || this.bOy[i] !== 1) continue;
        const b = this.building[i];
        if (b !== Building.ZONE_R && b !== Building.ZONE_C && b !== Building.ZONE_I) continue;

        const powered = this.powered[i];
        const road = this.hasRoadAccess(x - 1, y - 1, 3);
        const lv = this.landValue[i];
        const pol = this.pollution[i];
        const crm = this.crime[i];

        // ゾーン全体のlevelを同期
        const sync = (lv) => {
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              this.level[idx(x + dx, y + dy)] = lv;
            }
          }
        };

        if (!powered || !road) {
          if (this.level[i] > 0 && Math.random() < 0.15) sync(this.level[i] - 1);
          continue;
        }

        let chance = 0.12;
        if (b === Building.ZONE_R) {
          chance += this.demandR * 0.15;
          chance += (lv - 50) / 400;
          chance -= pol / 500;
          chance -= crm / 400;
          if (this.hasStadium) chance += 0.05;
        } else if (b === Building.ZONE_C) {
          chance += this.demandC * 0.15;
          chance += (lv - 40) / 350;
          if (this.hasAirport) chance += 0.08;
        } else {
          chance += this.demandI * 0.15;
          chance -= pol / 800;
          if (this.hasSeaport) chance += 0.08;
        }
        chance -= taxPenalty;

        if (Math.random() < Math.max(0.02, chance)) {
          if (this.level[i] < 5) sync(this.level[i] + 1);
        } else if (chance < 0 && this.level[i] > 0 && Math.random() < 0.1) {
          sync(this.level[i] - 1);
        }
      }
    }
  }

  updateDemand() {
    const z = this.countZones();
    // 住民 : 仕事(商業+工業) のバランス
    const jobs = z.cDev * 2 + z.iDev * 3 + 1;
    const homes = z.rDev * 3 + 1;
    const ratio = homes / jobs;
    // R需要: 仕事が多いと住宅需要
    this.demandR = Math.max(-1, Math.min(1, (jobs - homes) / 20 + (z.r === 0 ? 0.5 : 0)));
    this.demandC = Math.max(-1, Math.min(1, (homes - z.cDev * 2) / 15 + (this.population > 500 ? 0.2 : 0)));
    this.demandI = Math.max(-1, Math.min(1, (homes - z.iDev * 2) / 15 + (z.i === 0 ? 0.4 : 0)));
    if (this.population > 2000 && !this.hasStadium) this.demandR += 0.1;
    if (this.population > 5000 && !this.hasSeaport) this.demandI += 0.15;
    if (this.population > 8000 && !this.hasAirport) this.demandC += 0.15;
  }

  updatePopulation() {
    this.prevPop = this.population;
    let pop = 0;
    for (let i = 0; i < this.building.length; i++) {
      if (this.building[i] !== Building.ZONE_R) continue;
      if (this.bOx[i] !== 1 || this.bOy[i] !== 1) continue;
      const lv = this.level[i];
      // SFC風: レベルに応じた人口
      const table = [0, 50, 150, 350, 700, 1200];
      pop += table[lv] || 0;
      // 地価ボーナス
      pop += Math.floor(this.landValue[i] / 20) * lv;
    }
    this.population = pop;
  }

  updateTraffic() {
    this.traffic.fill(0);
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const i = idx(x, y);
        if (this.building[i] && this.bOx[i] === 1 && this.bOy[i] === 1 && this.level[i] > 0) {
          // 近傍道路に交通を加算
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              const nx = x + dx, ny = y + dy;
              if (!inBounds(nx, ny)) continue;
              const j = idx(nx, ny);
              const f = this.feature[j];
              if (f === Feature.ROAD || f === Feature.ROAD_WIRE || f === Feature.ROAD_RAIL) {
                this.traffic[j] = Math.min(255, this.traffic[j] + this.level[i] * 8);
              }
            }
          }
        }
      }
    }
  }

  yearlyBudget() {
    const z = this.countZones();
    const developed = z.rDev + z.cDev + z.iDev;
    const taxIncome = Math.floor(this.population * this.taxRate * 0.08 + developed * this.taxRate * 2);
    let roadTiles = 0, railTiles = 0;
    for (let i = 0; i < this.feature.length; i++) {
      const f = this.feature[i];
      if (f === Feature.ROAD || f === Feature.ROAD_WIRE || f === Feature.ROAD_RAIL) roadTiles++;
      if (f === Feature.RAIL || f === Feature.RAIL_WIRE || f === Feature.ROAD_RAIL) railTiles++;
    }
    const roadCost = Math.floor(roadTiles * 0.7 * (this.fundRoad / 100) + railTiles * 1.4 * (this.fundRoad / 100));
    const policeN = this.countBuilding(Building.POLICE);
    const fireN = this.countBuilding(Building.FIRE);
    const policeCost = Math.floor(policeN * 100 * (this.fundPolice / 100));
    const fireCost = Math.floor(fireN * 100 * (this.fundFire / 100));
    const totalExp = roadCost + policeCost + fireCost;
    const net = taxIncome - totalExp;
    this.funds += net;
    this.lastBudget = { taxIncome, roadCost, policeCost, fireCost, net };
    this.addMessage(
      `${this.year}年の決算: 税収 $${taxIncome} / 支出 $${totalExp} → ${net >= 0 ? "+" : ""}$${net}`,
      net >= 0 ? "good" : "warn"
    );
    if (this.funds < 0) {
      this.funds = 0;
      this.addMessage("ざいせいがピンチ！税率をあげるか、けんせつをひかえよう。", "bad");
    }
    // 評価
    let score = 500;
    score += Math.min(200, this.population / 100);
    score -= Math.min(100, this.taxRate * 5);
    this.score = Math.max(0, Math.min(1000, score));
  }

  checkRankUp() {
    const rank = cityRank(this.population);
    if (!this.rankAnnounced.has(rank.name)) {
      this.rankAnnounced.add(rank.name);
      this.addMessage(`おめでとう！「${this.name}」は ${rank.name}（${rank.nameEn}）になったよ！`, "good");
      if (rank.min >= 2000) {
        this.pendingGift = { id: "house", name: "しちょうのいえ", desc: "地価が少し上がるよ" };
      }
    }
  }

  checkGifts() {
    if (this.population >= 2000 && this.hasStadium && !this.gifts.includes("zoo")) {
      this.pendingGift = { id: "zoo", name: "どうぶつえん", desc: "毎年 $100 の収入" };
    }
  }

  acceptGift() {
    if (!this.pendingGift) return;
    this.gifts.push(this.pendingGift.id);
    if (this.pendingGift.id === "zoo") this.funds += 100;
    this.addMessage(`ギフト「${this.pendingGift.name}」をうけとった！`, "good");
    this.pendingGift = null;
  }

  spreadFires() {
    for (let i = 0; i < this.feature.length; i++) {
      if (this.feature[i] !== Feature.FIRE) continue;
      const x = i % MAP_W;
      const y = (i / MAP_W) | 0;
      // 消化
      const extinguish = 0.08 + this.fireCov[i] / 400;
      if (Math.random() < extinguish) {
        this.feature[i] = Feature.RUBBLE;
        continue;
      }
      // 延焼
      if (Math.random() < 0.12) {
        const [dx, dy] = DIR[Math.floor(Math.random() * 4)];
        const nx = x + dx, ny = y + dy;
        if (!inBounds(nx, ny)) continue;
        const ni = idx(nx, ny);
        if (this.terrain[ni] === Terrain.WATER) continue;
        if (this.feature[ni] === Feature.FIRE) continue;
        if (this.building[ni] || this.feature[ni] || this.terrain[ni] === Terrain.FOREST) {
          if (this.building[ni]) {
            const type = this.building[ni];
            const size = BUILD_SIZE[type] || 1;
            const bx = nx - this.bOx[ni];
            const by = ny - this.bOy[ni];
            for (let dy2 = 0; dy2 < size; dy2++) {
              for (let dx2 = 0; dx2 < size; dx2++) {
                const j = idx(bx + dx2, by + dy2);
                this.building[j] = 0;
                this.bOx[j] = 0;
                this.bOy[j] = 0;
                this.level[j] = 0;
                this.feature[j] = Feature.FIRE;
              }
            }
          } else {
            this.feature[ni] = Feature.FIRE;
            if (this.terrain[ni] === Terrain.FOREST || this.terrain[ni] === Terrain.TREE) {
              this.terrain[ni] = Terrain.LAND;
            }
          }
        }
      }
    }
  }

  maybeDisaster() {
    if (this.year === this.lastDisasterYear) return;
    if (this.population < 300) return;
    if (Math.random() > 0.08) return;
    this.lastDisasterYear = this.year;
    const kinds = ["fire", "flood", "quake", "monster"];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    this.triggerDisaster(kind);
  }

  triggerDisaster(kind) {
    if (kind === "fire") {
      // ランダムな建物に火災
      const candidates = [];
      for (let i = 0; i < this.building.length; i++) {
        if (this.building[i] && this.bOx[i] === 0 && this.bOy[i] === 0) candidates.push(i);
      }
      if (!candidates.length) return;
      const i = candidates[Math.floor(Math.random() * candidates.length)];
      const x = i % MAP_W, y = (i / MAP_W) | 0;
      const type = this.building[i];
      const size = BUILD_SIZE[type] || 1;
      for (let dy = 0; dy < size; dy++) {
        for (let dx = 0; dx < size; dx++) {
          const j = idx(x + dx, y + dy);
          this.building[j] = 0;
          this.bOx[j] = 0;
          this.bOy[j] = 0;
          this.feature[j] = Feature.FIRE;
        }
      }
      this.addMessage("火災発生！しょうぼうしょのカバーを確認して！", "bad");
    } else if (kind === "flood") {
      let n = 0;
      for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
          if (this.terrain[idx(x, y)] !== Terrain.WATER) continue;
          for (const [dx, dy] of DIR) {
            const nx = x + dx, ny = y + dy;
            if (!inBounds(nx, ny)) continue;
            const ni = idx(nx, ny);
            if (this.terrain[ni] === Terrain.WATER) continue;
            if (Math.random() < 0.15) {
              if (this.building[ni]) continue;
              this.feature[ni] = Feature.FLOOD;
              n++;
            }
          }
        }
      }
      this.addMessage("こうずい！みずべのあきちが水につかったよ。", "bad");
      this.floodTicks = 48; // 約4ヶ月でひく
    } else if (kind === "quake") {
      let hits = 8 + Math.floor(Math.random() * 20);
      while (hits--) {
        const x = Math.floor(Math.random() * MAP_W);
        const y = Math.floor(Math.random() * MAP_H);
        const i = idx(x, y);
        if (this.building[i]) {
          const type = this.building[i];
          const size = BUILD_SIZE[type] || 1;
          const bx = x - this.bOx[i];
          const by = y - this.bOy[i];
          for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
              const j = idx(bx + dx, by + dy);
              this.building[j] = 0;
              this.bOx[j] = 0;
              this.bOy[j] = 0;
              this.feature[j] = Math.random() < 0.3 ? Feature.FIRE : Feature.RUBBLE;
            }
          }
        } else if (this.feature[i]) {
          this.feature[i] = Feature.RUBBLE;
        }
      }
      this.addMessage("じしんがきた！がれきと火事に注意！", "bad");
    } else if (kind === "monster") {
      // クッパ風モンスター（独自ドットキャラ）
      let x = Math.floor(Math.random() * MAP_W);
      let y = Math.floor(Math.random() * MAP_H);
      this.monster = { x, y, life: 25 };
      this.addMessage("かいじゅう出現！！まちをあるきまわっている！", "bad");
    }
  }

  stepMonster() {
    if (!this.monster) return;
    const m = this.monster;
    m.x = Math.max(0, Math.min(MAP_W - 1, m.x + (Math.random() < 0.5 ? -1 : 1)));
    m.y = Math.max(0, Math.min(MAP_H - 1, m.y + (Math.random() < 0.5 ? -1 : 1)));
    const i = idx(m.x, m.y);
    if (this.building[i]) {
      const type = this.building[i];
      const size = BUILD_SIZE[type] || 1;
      const bx = m.x - this.bOx[i];
      const by = m.y - this.bOy[i];
      for (let dy = 0; dy < size; dy++) {
        for (let dx = 0; dx < size; dx++) {
          const j = idx(bx + dx, by + dy);
          this.building[j] = 0;
          this.bOx[j] = 0;
          this.bOy[j] = 0;
          this.feature[j] = Feature.FIRE;
        }
      }
    } else if (this.feature[i] && this.feature[i] !== Feature.FIRE) {
      this.feature[i] = Feature.RUBBLE;
    }
    m.life--;
    if (m.life <= 0) {
      this.monster = null;
      this.addMessage("かいじゅうはさっていった…ひと安心。", "info");
    }
  }

  inspect(x, y) {
    if (!inBounds(x, y)) return null;
    const i = idx(x, y);
    return {
      x, y,
      terrain: this.terrain[i],
      feature: this.feature[i],
      building: this.building[i],
      level: this.level[i],
      powered: !!this.powered[i],
      landValue: this.landValue[i],
      pollution: this.pollution[i],
      crime: this.crime[i],
      traffic: this.traffic[i],
      police: this.policeCov[i],
      fire: this.fireCov[i],
    };
  }

  advisorTip() {
    const tips = [];
    const z = this.countZones();
    if (this.countBuilding(Building.COAL) + this.countBuilding(Building.NUCLEAR) === 0) {
      tips.push("まずははつでんしょをたてよう。せきたんは $3000 だよ。");
    }
    if (z.r + z.c + z.i === 0) {
      tips.push("R・C・I のゾーンを置いて、どうろとでんせんでつなごう。");
    }
    let unpowered = 0;
    for (let i = 0; i < this.building.length; i++) {
      if ((this.building[i] === Building.ZONE_R || this.building[i] === Building.ZONE_C || this.building[i] === Building.ZONE_I) &&
          this.bOx[i] === 1 && this.bOy[i] === 1 && !this.powered[i]) unpowered++;
    }
    if (unpowered > 0) tips.push(`でんきがきてないゾーンが ${unpowered} あるよ。でんせんを確認して！`);
    if (this.demandR > 0.4) tips.push("じゅうたくゾーンがもっとほしいみたい。");
    if (this.demandC > 0.4) tips.push("しょうぎょうゾーンをふやしてみよう。");
    if (this.demandI > 0.4) tips.push("こうぎょうゾーンのじゅようが高いよ。");
    if (this.demandR < -0.4) tips.push("じゅうたくが余っているかも。しごと（C/I）をふやそう。");
    if (this.population > 1000 && this.countBuilding(Building.POLICE) === 0) {
      tips.push("はんざいがふえそう。けいさつしょをたてよう。");
    }
    if (this.population > 1000 && this.countBuilding(Building.FIRE) === 0) {
      tips.push("しょうぼうしょがあると火災に強いよ。");
    }
    if (this.taxRate > 12) tips.push("税率が高すぎると人が出ていくよ。");
    if (this.population > 2000 && !this.hasStadium) tips.push("スタジアムを求める声があるよ。");
    if (this.population > 5000 && !this.hasSeaport) tips.push("みなとがあるとこうぎょうがのびるよ。");
    if (this.population > 8000 && !this.hasAirport) tips.push("くうこうがあるとしょうぎょうがかっぱつに。");
    if (!tips.length) tips.push("まちは順調そうだね。この調子！");
    return tips[Math.floor(Math.random() * Math.min(3, tips.length))] || tips[0];
  }

  toJSON() {
    return {
      name: this.name,
      mapNo: this.mapNo,
      difficulty: this.difficulty,
      funds: this.funds,
      taxRate: this.taxRate,
      fundRoad: this.fundRoad,
      fundPolice: this.fundPolice,
      fundFire: this.fundFire,
      year: this.year,
      month: this.month,
      tick: this.tick,
      population: this.population,
      score: this.score,
      terrain: Array.from(this.terrain),
      feature: Array.from(this.feature),
      building: Array.from(this.building),
      bOx: Array.from(this.bOx),
      bOy: Array.from(this.bOy),
      level: Array.from(this.level),
      gifts: this.gifts,
      disastersEnabled: this.disastersEnabled,
      hasStadium: this.hasStadium,
      hasSeaport: this.hasSeaport,
      hasAirport: this.hasAirport,
      rankAnnounced: [...this.rankAnnounced],
    };
  }

  static fromJSON(data) {
    const c = new City({ mapNo: data.mapNo, difficulty: data.difficulty, name: data.name });
    c.funds = data.funds;
    c.taxRate = data.taxRate;
    c.fundRoad = data.fundRoad;
    c.fundPolice = data.fundPolice;
    c.fundFire = data.fundFire;
    c.year = data.year;
    c.month = data.month;
    c.tick = data.tick;
    c.population = data.population;
    c.score = data.score;
    c.terrain = Uint8Array.from(data.terrain);
    c.feature = Uint8Array.from(data.feature);
    c.building = Uint8Array.from(data.building);
    c.bOx = Uint8Array.from(data.bOx);
    c.bOy = Uint8Array.from(data.bOy);
    c.level = Uint8Array.from(data.level);
    c.gifts = data.gifts || [];
    c.disastersEnabled = data.disastersEnabled !== false;
    c.hasStadium = !!data.hasStadium;
    c.hasSeaport = !!data.hasSeaport;
    c.hasAirport = !!data.hasAirport;
    c.rankAnnounced = new Set(data.rankAnnounced || ["むら"]);
    return c;
  }
}
