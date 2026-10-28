/** SFC版シムシティ準拠の定数（コスト・サイズ・都市ランク） */

export const TILE = 16;
export const MAP_W = 80;
export const MAP_H = 80;

export const Terrain = Object.freeze({
  LAND: 0,
  WATER: 1,
  FOREST: 2,
  TREE: 3,
});

export const Feature = Object.freeze({
  NONE: 0,
  ROAD: 1,
  RAIL: 2,
  WIRE: 3,
  PARK: 4,
  RUBBLE: 5,
  FIRE: 6,
  FLOOD: 7,
  ROAD_WIRE: 8,
  RAIL_WIRE: 9,
  ROAD_RAIL: 10,
});

/** 建築物の種類。サイズは中心起点の占有マス */
export const Building = Object.freeze({
  NONE: 0,
  ZONE_R: 1,
  ZONE_C: 2,
  ZONE_I: 3,
  POLICE: 4,
  FIRE: 5,
  STADIUM: 6,
  SEAPORT: 7,
  COAL: 8,
  NUCLEAR: 9,
  AIRPORT: 10,
  HOUSE: 11, // 市長の家などギフト
  ZOO: 12,
  PARK_LG: 13,
});

export const BUILD_SIZE = {
  [Building.ZONE_R]: 3,
  [Building.ZONE_C]: 3,
  [Building.ZONE_I]: 3,
  [Building.POLICE]: 3,
  [Building.FIRE]: 3,
  [Building.STADIUM]: 4,
  [Building.SEAPORT]: 4,
  [Building.COAL]: 4,
  [Building.NUCLEAR]: 4,
  [Building.AIRPORT]: 4,
  [Building.HOUSE]: 2,
  [Building.ZOO]: 3,
  [Building.PARK_LG]: 3,
};

/** SFC版の建設コスト */
export const COST = {
  bulldoze: 1,
  road: 10,
  roadWater: 20,
  rail: 20,
  railWater: 40,
  wire: 5,
  wireWater: 10,
  park: 10,
  zoneR: 100,
  zoneC: 100,
  zoneI: 100,
  police: 500,
  fire: 500,
  stadium: 3000,
  seaport: 5000,
  coal: 3000,
  nuclear: 5000,
  airport: 10000,
};

/** 発電所の供給ゾーン数（SFC準拠） */
export const POWER_CAPACITY = {
  [Building.COAL]: 40,
  [Building.NUCLEAR]: 120,
};

export const CITY_RANKS = [
  { name: "むら", nameEn: "Village", min: 0 },
  { name: "まち", nameEn: "Town", min: 2000 },
  { name: "とし", nameEn: "City", min: 10000 },
  { name: "しゅと", nameEn: "Capital", min: 50000 },
  { name: "だいとし", nameEn: "Metropolis", min: 100000 },
  { name: "きょだいとし", nameEn: "Megalopolis", min: 500000 },
];

export const DIFFICULTY = {
  easy: { label: "かんたん", funds: 20000, taxDefault: 7 },
  normal: { label: "ふつう", funds: 10000, taxDefault: 7 },
  hard: { label: "むずかしい", funds: 5000, taxDefault: 9 },
};

export const SPEEDS = [
  { id: "pause", label: "⏸", ms: 0 },
  { id: "slow", label: "▶", ms: 800 },
  { id: "med", label: "▶▶", ms: 350 },
  { id: "fast", label: "▶▶▶", ms: 120 },
];

export const TOOLS = [
  { id: "pan", label: "移動", icon: "✋", group: "nav", cost: 0 },
  { id: "inspect", label: "しらべる", icon: "🔍", group: "nav", cost: 0 },
  { id: "bulldoze", label: "ブルドーザー", icon: "💥", group: "build", cost: COST.bulldoze },
  { id: "road", label: "どうろ", icon: "🛣", group: "build", cost: COST.road },
  { id: "rail", label: "でんしゃ", icon: "🚃", group: "build", cost: COST.rail },
  { id: "wire", label: "でんせん", icon: "⚡", group: "build", cost: COST.wire },
  { id: "park", label: "こうえん", icon: "🌳", group: "build", cost: COST.park },
  { id: "zoneR", label: "じゅうたく", icon: "🏠", group: "zone", cost: COST.zoneR, size: 3, building: Building.ZONE_R },
  { id: "zoneC", label: "しょうぎょう", icon: "🏪", group: "zone", cost: COST.zoneC, size: 3, building: Building.ZONE_C },
  { id: "zoneI", label: "こうぎょう", icon: "🏭", group: "zone", cost: COST.zoneI, size: 3, building: Building.ZONE_I },
  { id: "police", label: "けいさつ", icon: "🚓", group: "svc", cost: COST.police, size: 3, building: Building.POLICE },
  { id: "fire", label: "しょうぼう", icon: "🚒", group: "svc", cost: COST.fire, size: 3, building: Building.FIRE },
  { id: "stadium", label: "きゅうじょう", icon: "🏟", group: "spec", cost: COST.stadium, size: 4, building: Building.STADIUM },
  { id: "seaport", label: "みなと", icon: "🚢", group: "spec", cost: COST.seaport, size: 4, building: Building.SEAPORT },
  { id: "coal", label: "せきたんはつでん", icon: "🏭⚡", group: "power", cost: COST.coal, size: 4, building: Building.COAL },
  { id: "nuclear", label: "げんしりょく", icon: "☢", group: "power", cost: COST.nuclear, size: 4, building: Building.NUCLEAR },
  { id: "airport", label: "くうこう", icon: "✈", group: "spec", cost: COST.airport, size: 4, building: Building.AIRPORT },
];

export function cityRank(pop) {
  let r = CITY_RANKS[0];
  for (const c of CITY_RANKS) if (pop >= c.min) r = c;
  return r;
}

export function formatMoney(n) {
  const s = Math.floor(n).toLocaleString("ja-JP");
  return `$${s}`;
}
