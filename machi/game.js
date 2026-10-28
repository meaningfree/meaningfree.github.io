'use strict';
(() => {
const W = 96, H = 96, TS = 16;
const WATER = 0, GRASS = 1, TREE = 2, RUBBLE = 3, WASTE = 4;
const D4 = [[0,-1],[1,0],[0,1],[-1,0]];
const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

const INK = '#1c2430';
const COL = {
  grass:'#4ea344', grassD:'#3b8734', grassL:'#78c45e', flower:'#f2d15a', flower2:'#ee7aa8',
  water:'#2a6fbe', waterD:'#1c4e96', waterL:'#7ec4f0', foam:'#e7f6ff',
  sand:'#e4d09a', sandD:'#c4a56e',
  trunk:'#6b4423', leaf:'#2f8a3a', leafD:'#1d5c28', leafL:'#8ed25f',
  road:'#6d727a', roadD:'#4a4f56', line:'#f0d04a',
  rail:'#c5ccd4', tie:'#7a5230',
  wall:'#f3e2c4', wallD:'#d7c09a', roofR:'#d24b3e', roofB:'#3c6ec0', roofG:'#3e8f4c', roofO:'#e08a2e', roofT:'#2f8f8a',
  win:'#243044', winL:'#f6e7a0', door:'#6b3e2a',
  brick:'#a85a42', brickD:'#7d3e2e', metal:'#c5ccd4', metalD:'#6e7680',
  glass:'#8ec8ee', glassD:'#3a6e98',
  coal:'#2a2e34', gold:'#e6c15a', white:'#f7f4ee',
  police:'#2c4c9a', fire:'#c5342c',
  purple:'#8d5cc0', belly:'#f0d8b0',
  waste:'#8fbf45', wasteD:'#3d6b28'
};

const SPEC = {
  R:{name:'住宅地区',w:3,h:3,cost:100,zone:1,pop:[0,120,420,1100,2800]},
  C:{name:'商業地区',w:3,h:3,cost:100,zone:1,jobs:[0,50,150,340,760]},
  I:{name:'工業地区',w:3,h:3,cost:100,zone:1,jobs:[0,90,220,480,480]},
  police:{name:'警察署',w:3,h:3,cost:500,upkeep:100,service:'police'},
  fire:{name:'消防署',w:3,h:3,cost:500,upkeep:100,service:'fire'},
  polhq:{name:'警察本部',w:3,h:3,cost:100,upkeep:200,service:'police',hq:1,gift:1},
  firehq:{name:'消防本部',w:3,h:3,cost:100,upkeep:200,service:'fire',hq:1,gift:1},
  stadium:{name:'スタジアム',w:4,h:4,cost:3000},
  port:{name:'港',w:4,h:4,cost:5000},
  coal:{name:'火力発電所',w:4,h:4,cost:3000,plant:40},
  nuke:{name:'原子力発電所',w:4,h:4,cost:5000,plant:120},
  air:{name:'空港',w:6,h:6,cost:10000},
  park:{name:'公園',w:1,h:1,cost:10,conduct:0},
  house:{name:'町長邸',w:3,h:3,cost:100,gift:1},
  bank:{name:'銀行',w:3,h:3,cost:100,gift:1},
  lib:{name:'図書館',w:3,h:3,cost:100,gift:1},
  bigpark:{name:'大公園',w:3,h:3,cost:100,gift:1,conduct:0},
  amuse:{name:'遊園地',w:3,h:3,cost:100,gift:1,income:200},
  casino:{name:'カジノ',w:3,h:3,cost:100,gift:1,income:300},
  zoo:{name:'動物園',w:3,h:3,cost:100,gift:1},
  station:{name:'駅',w:3,h:3,cost:100,gift:1},
  fountain:{name:'噴水',w:3,h:3,cost:100,gift:1},
  expo:{name:'博覧会',w:3,h:3,cost:100,gift:1,income:120},
  tower:{name:'展望台',w:3,h:3,cost:100,gift:1},
  statue:{name:'記念像',w:3,h:3,cost:100,gift:1},
  mill:{name:'風車',w:3,h:3,cost:100,gift:1}
};
const DEST = new Set(['C','I','police','fire','polhq','firehq','stadium','coal','port','air','house','bank','lib','bigpark','amuse','casino','zoo','station','fountain','expo','tower','statue','mill']);
const RANKS = [
  {id:'village', name:'ビレッジ', at:0},
  {id:'town', name:'タウン', at:2000},
  {id:'city', name:'シティ', at:10000},
  {id:'capital', name:'キャピタル', at:50000},
  {id:'metro', name:'メトロポリス', at:100000},
  {id:'mega', name:'メガロポリス', at:500000}
];
const GIFT_TEXT = {
  house:'人口が2,000人を超えました。町長邸をどうぞ。自然の欄から $100 で置けます。まわりの地価が上がります。',
  bank:'資金が心もとないシティに、銀行が届きました。財政の画面から $10,000 借りられます。',
  lib:'学校のある住宅地が育ち、図書館が届きました。',
  bigpark:'公園がまちを緑にしています。大公園をどうぞ。',
  firehq:'消防署が増え、消防本部が届きました。ふつうの署の倍はたらきます。',
  polhq:'警察署が増え、警察本部が届きました。',
  zoo:'スタジアムのあるまちに、動物園が届きました。',
  station:'線路が伸び、駅の建物が届きました。',
  fountain:'50年。噴水をどうぞ。',
  expo:'港と空港のあるまちに、博覧会が届きました。毎年少し収入があります。',
  tower:'キャピタルのしるしに、展望台が届きました。',
  statue:'メガロポリスです。記念像が届きました。',
  mill:'まちが育ち、風車が届きました。',
  land:'空き地が少なくなりました。埋立地で、3×3の水を土地にできます。',
  amuse:'遊園地は人を呼び、地価を上げます。犯罪は増えません。',
  casino:'カジノは毎年 $300 入りますが、まち全体の犯罪が少し増えます。'
};

const ground = new Uint8Array(W * H);
const road = new Uint8Array(W * H);
const rail = new Uint8Array(W * H);
const wire = new Uint8Array(W * H);
const fire = new Uint8Array(W * H);
const flood = new Uint8Array(W * H);
const traffic = new Uint8Array(W * H);
const poll = new Uint8Array(W * H);
const bid = new Int16Array(W * H);
const buildings = [];
const seen = new Uint32Array(W * H);
const parent = new Int32Array(W * H);
const queue = new Int32Array(W * H);
let seenToken = 1;
const poweredNet = new Uint8Array(W * H);
const emitBuf = new Uint16Array(W * H);
const pollA = new Float32Array(W * H);
const pollB = new Float32Array(W * H);

const cam = {x:0, y:0, z:2};
const msgQ = [];
let meta = {cleared:[], sound:'sfx'};
let stroke = null;
let loopOn = false;
let audio = null;
let nextNote = 0, noteI = 0;
let lastTs = 0, acc = 0, anim = 0;
let reduced = false;

const G = {
  playing:false, name:'マイタウン', seed:0, diff:1, scenario:null, mode:'free',
  year:1900, month:0, elapsed:0, funds:20000,
  tax:7, fTransit:100, fPolice:100, fFire:100,
  speed:1, paused:true, autoBudget:true, autoBulldoze:true, autoPause:true,
  disasters:{fire:false,flood:false,quake:false,tornado:false,crash:false,monster:false,ufo:false,melt:false},
  pending:[], given:{}, choice:null, loanYears:0, loanPay:0,
  resPop:0, comJobs:0, indJobs:0, rDem:0, cDem:40, iDem:70,
  approval:70, problems:[], crimePct:0, polPct:0, trafficPct:0, avgLv:40,
  powerUsed:0, powerCap:0, zoneCount:0,
  roadCount:0, railCount:0, parkCount:0, openCount:0, fireCount:0, schoolCount:0, casinoN:0,
  has:new Set(),
  log:[], yearly:[], flags:{}, goal:null, won:false, over:false,
  rankId:'village', said:{}, budgetPending:false, needBudget:false,
  monster:null, tornado:null, crash:null, ufo:null, fx:[],
  tool:'hand', cat:'move', hl:null, celebrate:0, grew:0,
  sound:'sfx', undo:[], sheet:null, resume:false, startOpts:null,
  floodLeft:0, boat:null
};

function $(id){ return document.getElementById(id); }
function clamp(v,a,b){ return v<a?a:v>b?b:v; }
function idx(x,y){ return y * W + x; }
function inside(x,y){ return x>=0 && y>=0 && x<W && y<H; }
function fmt(n){ return Math.round(n).toLocaleString('ja-JP'); }
function fmtPop(n){
  n = Math.floor(n);
  if (n >= 10000){
    const v = n / 10000;
    const s = n >= 100000 ? String(Math.floor(v)) : (Math.round(v * 10) / 10).toString();
    return s + '万';
  }
  return fmt(n);
}
function esc(s){
  return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}
function mulberry32(a){
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function makeNoise(rng, step){
  const gw = Math.ceil(W / step) + 2, gh = Math.ceil(H / step) + 2;
  const g = new Float32Array(gw * gh);
  for (let i = 0; i < g.length; i++) g[i] = rng();
  return function(x, y){
    const fx = x / step, fy = y / step;
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const tx = fx - x0, ty = fy - y0;
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const i00 = g[y0 * gw + x0], i10 = g[y0 * gw + x0 + 1];
    const i01 = g[(y0 + 1) * gw + x0], i11 = g[(y0 + 1) * gw + x0 + 1];
    const aa = i00 + (i10 - i00) * sx, bb = i01 + (i11 - i01) * sx;
    return aa + (bb - aa) * sy;
  };
}
function rankOf(pop){
  let r = RANKS[0];
  for (const x of RANKS) if (pop >= x.at) r = x;
  return r;
}
function hasType(t){ return G.has && G.has.has(t); }

function generateTerrain(arr, seed, opts){
  opts = opts || {};
  const rng = mulberry32(seed * 997 + 13);
  const n1 = makeNoise(rng, 22), n2 = makeNoise(rng, 9), n3 = makeNoise(rng, 5);
  let waterLine = 0.36 + (seed % 7) * 0.012;
  let fall = (seed % 4 === 0) ? 0.16 : 0.04;
  if (seed === 61){ waterLine = 0.2; fall = 0; }
  if (opts.practice){ waterLine = 0.42; fall = 0.22; }
  if (opts.plain){
    arr.fill(GRASS);
    const cx = W / 2, cy = H / 2;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
      const d = Math.hypot(x - cx, y - cy);
      if (d > 16 && d < 23 && ((x * 3 + y * 5) % 5) > 1) arr[idx(x, y)] = TREE;
    }
    return;
  }
  const cx = (W - 1) / 2, cy = (H - 1) / 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
    const d = Math.hypot((x - cx) / cx, (y - cy) / cy);
    let n = n1(x, y) * 0.62 + n2(x, y) * 0.26 + n3(x, y) * 0.12 - d * fall;
    if (opts.bay) n -= Math.max(0, 0.22 - x / W) * 0.55;
    if (opts.practice && d < 0.58) n += 0.28;
    if (seed % 5 === 1 && !opts.practice && !opts.bay){
      const yr = H * 0.55 + Math.sin(x * 0.16) * 5 + Math.sin(x * 0.05) * 2;
      if (Math.abs(y - yr) < 1.35) n = waterLine - 0.05;
    }
    const i = idx(x, y);
    if (n < waterLine) arr[i] = WATER;
    else if (n2(x, y) > 0.72 && n > waterLine + 0.05) arr[i] = TREE;
    else arr[i] = GRASS;
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
    const i = idx(x, y);
    if (arr[i] !== TREE) continue;
    for (let d = 0; d < 4; d++){
      const nx = x + D4[d][0], ny = y + D4[d][1];
      if (!inside(nx, ny) || arr[idx(nx, ny)] === WATER){ arr[i] = GRASS; break; }
    }
  }
}

function resetWorld(){
  ground.fill(WATER);
  road.fill(0); rail.fill(0); wire.fill(0);
  fire.fill(0); flood.fill(0); traffic.fill(0); poll.fill(0);
  bid.fill(-1);
  buildings.length = 0;
  G.undo = [];
  G.pending = [];
  G.given = {};
  G.log = [];
  G.yearly = [];
  G.flags = {};
  G.monster = G.tornado = G.crash = G.ufo = null;
  G.fx = [];
  G.won = false; G.over = false; G.choice = null;
  G.loanYears = 0; G.loanPay = 0;
  G.said = {};
  G.budgetPending = false; G.needBudget = false;
  G.rankId = 'village'; G.celebrate = 0; G.hl = null; G.grew = 0;
  G.goal = null; G.boat = null; G.floodLeft = 0;
  G.sheet = null;
  msgQ.length = 0;
  const sp = $('speech'); if (sp) sp.hidden = true;
}

function forcePlace(type, x, y, dens){
  const sp = SPEC[type];
  if (!sp) return null;
  for (let yy = 0; yy < sp.h; yy++) for (let xx = 0; xx < sp.w; xx++){
    if (!inside(x + xx, y + yy)) return null;
  }
  for (let yy = 0; yy < sp.h; yy++) for (let xx = 0; xx < sp.w; xx++){
    const i = idx(x + xx, y + yy);
    const old = bid[i];
    if (old >= 0 && buildings[old]) buildings[old].alive = false;
    bid[i] = -1;
    road[i] = rail[i] = wire[i] = fire[i] = flood[i] = 0;
    if (ground[i] !== GRASS) ground[i] = GRASS;
  }
  const b = {
    id: buildings.length, alive: true, type, x, y, w: sp.w, h: sp.h,
    dens: dens || 0, prog: 0, powered: false, lv: 46, crime: 18,
    variant: (x + y) % 3, access: 0, congested: false
  };
  buildings.push(b);
  for (let yy = 0; yy < sp.h; yy++) for (let xx = 0; xx < sp.w; xx++) bid[idx(x + xx, y + yy)] = b.id;
  return b;
}
function forceLine(x, y, kind){
  if (!inside(x, y)) return;
  const i = idx(x, y);
  if (bid[i] >= 0) return;
  if (ground[i] !== WATER) ground[i] = GRASS;
  if (kind === 'road') road[i] = 1;
  else if (kind === 'rail') rail[i] = 1;
  else if (kind === 'wire') wire[i] = 1;
}
function buildTown(o){
  const cols = o.cols || 5;
  const x0 = o.x, y0 = o.y;
  for (let y = y0 - 1; y < y0 + 12; y++) for (let x = x0 - 6; x < x0 + cols * 3 + 3; x++){
    if (!inside(x, y)) continue;
    const i = idx(x, y);
    if (bid[i] >= 0 && buildings[bid[i]]) buildings[bid[i]].alive = false;
    bid[i] = -1;
    road[i] = rail[i] = wire[i] = fire[i] = flood[i] = 0;
    if (ground[i] !== GRASS) ground[i] = GRASS;
  }
  forcePlace(o.plant || 'coal', x0 - 5, y0, 0);
  for (let c = 0; c < cols; c++){
    const x = x0 + c * 3;
    forcePlace('I', x, y0, o.densI ?? 1);
    forcePlace('R', x, y0 + 4, o.densR ?? 1);
    if ((o.densC ?? 0) > 0 || o.zoneC) forcePlace('C', x, y0 + 8, o.densC ?? 0);
  }
  for (let x = x0 - 1; x < x0 + cols * 3; x++){
    forceLine(x, y0 + 3, 'road'); forceLine(x, y0 + 3, 'wire');
    forceLine(x, y0 + 7, 'road'); forceLine(x, y0 + 7, 'wire');
    if (o.rails) forceLine(x, y0 + 7, 'rail');
  }
  for (let y = y0 + 3; y <= y0 + 7; y++) forceLine(x0 - 1, y, 'wire');
  if (o.police) forcePlace('police', x0 + cols * 3, y0 + 4, 0);
  if (o.fire) forcePlace('fire', x0 + cols * 3, y0 + 8, 0);
  if (o.jam){
    for (let y = y0; y < y0 + 12; y++) for (let x = x0 - 6; x < x0 + cols * 3 + 2; x++){
      if (!inside(x, y)) continue;
      const i = idx(x, y);
      if (road[i]) traffic[i] = 48;
    }
  }
  if (o.casinos){
    for (let k = 0; k < o.casinos; k++) forcePlace('casino', x0 + k * 4, y0 + 12, 0);
  }
  return {x: x0 + Math.floor(cols * 1.5), y: y0 + 5};
}
function findAnchor(rw, rh){
  let best = null, score = -1e9;
  for (let y = 2; y < H - rh; y += 3) for (let x = 8; x < W - rw; x += 3){
    let land = 0;
    for (let yy = 0; yy < rh; yy += 2) for (let xx = 0; xx < rw; xx += 2){
      if (ground[idx(x + xx, y + yy)] !== WATER) land++;
    }
    const cx = x + rw / 2 - W / 2, cy = y + rh / 2 - H / 2;
    const s = land - (cx * cx + cy * cy) / 800;
    if (s > score){ score = s; best = {x, y}; }
  }
  if (!best) best = {x: 16, y: 16};
  best.x = clamp(best.x, 12, W - rw - 1);
  best.y = clamp(best.y, 2, H - rh - 1);
  return best;
}

function conducts(i){
  if (wire[i]) return true;
  const id = bid[i];
  if (id < 0) return false;
  const b = buildings[id];
  if (!b || !b.alive) return false;
  return SPEC[b.type].conduct !== 0;
}
function bumpToken(){
  seenToken++;
  if (seenToken > 0xfffffff0){ seen.fill(0); seenToken = 1; }
  return seenToken;
}
function recomputePower(){
  const token = bumpToken();
  poweredNet.fill(0);
  for (const b of buildings) if (b) b.powered = false;
  const plantSeen = new Uint8Array(buildings.length);
  let capTotal = 0;
  for (const p of buildings){
    if (!p || !p.alive || !SPEC[p.type].plant) continue;
    const si = idx(p.x, p.y);
    if (seen[si] === token) continue;
    let qs = 0, qe = 0;
    seen[si] = token;
    queue[qe++] = si;
    const zones = [];
    let cap = 0;
    const net = [];
    while (qs < qe){
      const i = queue[qs++];
      net.push(i);
      poweredNet[i] = 1;
      const id = bid[i];
      if (id >= 0){
        const b = buildings[id];
        if (b && b.alive){
          if (SPEC[b.type].plant && !plantSeen[id]){
            plantSeen[id] = 1;
            cap += SPEC[b.type].plant;
          }
          if (SPEC[b.type].zone) zones.push(b);
        }
      }
      const x = i % W, y = (i / W) | 0;
      for (let d = 0; d < 4; d++){
        const nx = x + D4[d][0], ny = y + D4[d][1];
        if (!inside(nx, ny)) continue;
        const j = idx(nx, ny);
        if (seen[j] === token || !conducts(j)) continue;
        seen[j] = token;
        queue[qe++] = j;
      }
    }
    const usedZ = new Uint8Array(buildings.length);
    let used = 0;
    for (const z of zones){
      if (usedZ[z.id]) continue;
      usedZ[z.id] = 1;
      if (used < cap){ z.powered = true; used++; }
    }
    capTotal += cap;
    for (const i of net){
      const id = bid[i];
      if (id >= 0){
        const b = buildings[id];
        if (b && b.alive && !SPEC[b.type].zone) b.powered = true;
      }
    }
  }
  let zc = 0, pz = 0;
  for (const b of buildings){
    if (!b || !b.alive || !SPEC[b.type].zone) continue;
    zc++;
    if (b.powered) pz++;
  }
  G.powerCap = capTotal;
  G.powerUsed = pz;
  G.zoneCount = zc;
}

function recomputePollution(){
  emitBuf.fill(0);
  for (const b of buildings){
    if (!b || !b.alive) continue;
    const cx = b.x + (b.w >> 1), cy = b.y + (b.h >> 1);
    const i = idx(cx, cy);
    if (b.type === 'I') emitBuf[i] += 16 * b.dens;
    else if (b.type === 'coal') emitBuf[i] += 64;
    else if (b.type === 'air') emitBuf[i] += 48;
    else if (b.type === 'port') emitBuf[i] += 32;
    else if (b.type === 'casino') emitBuf[i] += 8;
  }
  for (let i = 0; i < W * H; i++){
    if (ground[i] === WASTE) emitBuf[i] += 110;
    if (road[i] && traffic[i] > 8) emitBuf[i] += traffic[i];
    pollA[i] = poll[i] * 0.78 + emitBuf[i];
  }
  let src = pollA, dst = pollB;
  for (let k = 0; k < 3; k++){
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
      const i = idx(x, y);
      let a = 0, n = 0;
      for (let d = 0; d < 4; d++){
        const nx = x + D4[d][0], ny = y + D4[d][1];
        if (!inside(nx, ny)) continue;
        a += src[idx(nx, ny)]; n++;
      }
      dst[i] = src[i] * 0.62 + (n ? a / n : 0) * 0.38;
    }
    const tmp = src; src = dst; dst = tmp;
  }
  for (let i = 0; i < W * H; i++) poll[i] = clamp(src[i], 0, 255);
}
function pollAt(b){
  return poll[idx(b.x + (b.w >> 1), b.y + (b.h >> 1))];
}
function isDest(id, self){
  if (id < 0 || id === self) return false;
  const o = buildings[id];
  return !!(o && o.alive && DEST.has(o.type));
}
function ringCells(b, fn){
  for (let y = b.y - 1; y <= b.y + b.h; y++) for (let x = b.x - 1; x <= b.x + b.w; x++){
    if (!inside(x, y)) continue;
    if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) continue;
    fn(x, y, idx(x, y));
  }
}
function touchTransit(b){
  let any = false, jam = false, byRail = false;
  ringCells(b, (x, y, i) => {
    if (rail[i]){ any = true; byRail = true; }
    if (road[i]){ any = true; if (traffic[i] >= 20) jam = true; }
  });
  if (byRail) jam = false;
  return {access: any ? 2 : 0, congested: any && jam};
}
function bfsResidential(b, addTraffic){
  const token = bumpToken();
  let qe = 0, qs = 0;
  ringCells(b, (x, y, i) => {
    if ((road[i] || rail[i]) && seen[i] !== token){
      seen[i] = token;
      parent[i] = i;
      queue[qe++] = i;
    }
  });
  if (qe === 0) return {access:0, congested:false};
  let found = -1, steps = 0;
  while (qs < qe && steps < 360 && found < 0){
    const i = queue[qs++];
    steps++;
    const x = i % W, y = (i / W) | 0;
    for (let d = 0; d < 4; d++){
      const nx = x + D4[d][0], ny = y + D4[d][1];
      if (!inside(nx, ny)) continue;
      const j = idx(nx, ny);
      if (isDest(bid[j], b.id)){ found = i; break; }
      if ((road[j] || rail[j]) && seen[j] !== token){
        seen[j] = token;
        parent[j] = i;
        queue[qe++] = j;
      }
    }
  }
  if (found < 0) return {access:1, congested:false};
  let congested = false, cur = found, guard = 0;
  while (guard++ < 400){
    if (road[cur]){
      if (traffic[cur] >= 20) congested = true;
      if (addTraffic) traffic[cur] = Math.min(220, traffic[cur] + 3);
    }
    if (parent[cur] === cur) break;
    cur = parent[cur];
  }
  return {access:2, congested};
}
function cheb(ax, ay, bx, by){ return Math.max(Math.abs(ax - bx), Math.abs(ay - by)); }
function servicesAndGrowth(opt){
  opt = opt || {grow:true, traffic:true};
  let casinoN = 0;
  for (const b of buildings) if (b && b.alive && b.type === 'casino') casinoN++;
  G.casinoN = casinoN;
  const parks = [], gifts = [], stads = [], airs = [], ports = [], stations = [];
  let sx = 0, sy = 0, sn = 0;
  for (const b of buildings){
    if (!b || !b.alive) continue;
    if (b.type === 'park' || b.type === 'bigpark') parks.push(b);
    if (SPEC[b.type].gift) gifts.push(b);
    if (b.type === 'stadium') stads.push(b);
    if (b.type === 'air') airs.push(b);
    if (b.type === 'port') ports.push(b);
    if (SPEC[b.type].service) stations.push(b);
    if (SPEC[b.type].zone && b.dens > 0){ sx += b.x; sy += b.y; sn++; }
  }
  const lists = {parks, gifts, stads, cx: sn ? sx / sn : W / 2, cy: sn ? sy / sn : H / 2};
  G._fireStations = stations.filter(s => SPEC[s.type].service === 'fire');
  for (const b of buildings){
    if (!b || !b.alive || !SPEC[b.type].zone) continue;
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    let lv = 32;
    let waterN = 0, treeN = 0;
    for (let y = b.y - 3; y < b.y + b.h + 3; y++) for (let x = b.x - 3; x < b.x + b.w + 3; x++){
      if (!inside(x, y)) continue;
      const d = cheb(x, y, cx, cy);
      if (d > 4) continue;
      const gnd = ground[idx(x, y)];
      if (gnd === WATER && d <= 3) waterN++;
      if (gnd === TREE && d <= 3) treeN++;
    }
    lv += Math.min(18, waterN * 1.4);
    lv += Math.min(8, treeN);
    let parkN = 0;
    for (const p of parks) if (cheb(p.x, p.y, cx, cy) <= 4) parkN++;
    lv += Math.min(22, parkN * 4);
    for (const g of gifts) if (cheb(g.x + g.w / 2, g.y + g.h / 2, cx, cy) <= 5) lv += 12;
    if (b.type === 'R') for (const s of stads) if (cheb(s.x + 2, s.y + 2, cx, cy) <= 8) lv += 10;
    if (cheb(cx, cy, lists.cx, lists.cy) < 16) lv += 6;
    const p = pollAt(b);
    lv -= p / 6;
    b.nearAir = airs.some(a => cheb(a.x + 3, a.y + 3, cx, cy) <= 16);
    b.nearPort = ports.some(a => cheb(a.x + 2, a.y + 2, cx, cy) <= 14);
    b.nearStad = stads.some(a => cheb(a.x + 2, a.y + 2, cx, cy) <= 8);
    lv = clamp(Math.round(lv), 1, 96);
    let crime = 8 + b.dens * 6 + (b.type === 'I' ? 16 : 0) + p / 8 + (100 - lv) / 6 + G.casinoN * 5;
    crime -= coverOf(b, stations, 'police');
    b.crime = clamp(Math.round(crime), 0, 100);
    lv = clamp(Math.round(lv - b.crime / 7), 1, 100);
    b.lv = lv;
    const tr = b.type === 'R' ? bfsResidential(b, !!opt.traffic) : touchTransit(b);
    b.access = tr.access;
    b.congested = tr.congested;
    if (opt.grow) growZone(b);
  }
}
function coverOf(b, stations, kind){
  const fund = kind === 'police' ? G.fPolice : G.fFire;
  const scale = 0.28 + 0.72 * (fund / 100);
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  let best = 0;
  for (const s of stations){
    if (SPEC[s.type].service !== kind) continue;
    const rad = (SPEC[s.type].hq ? 13 : 8) * scale;
    const d = cheb(s.x + s.w / 2, s.y + s.h / 2, cx, cy);
    if (d > rad) continue;
    let power = (SPEC[s.type].hq ? 82 : 56) * (fund / 100) * (1 - d / rad * 0.45);
    if (!s.powered) power *= 0.7;
    if (power > best) best = power;
  }
  return best;
}
function fireCover(x, y){
  const scale = 0.28 + 0.72 * (G.fFire / 100);
  let best = 0;
  for (const s of G._fireStations || []){
    const rad = (SPEC[s.type].hq ? 14 : 9) * scale;
    const d = cheb(s.x + s.w / 2, s.y + s.h / 2, x, y);
    if (d > rad) continue;
    let p = (SPEC[s.type].hq ? 1 : 0.75) * (G.fFire / 100) * (1 - d / rad * 0.35);
    if (!s.powered) p *= 0.65;
    if (p > best) best = p;
  }
  return best;
}
function densityCap(b){
  if (b.type === 'I') return 3;
  const lv = b.lv;
  let cap = lv < 26 ? 1 : lv < 48 ? 2 : lv < 72 ? 3 : 4;
  const p = pollAt(b);
  if (b.type === 'R' && p > 160) cap = Math.min(cap, 2);
  if (b.type === 'R' && p > 210) cap = Math.min(cap, 1);
  if (b.type === 'C' && p > 185) cap = Math.min(cap, 3);
  if (b.type === 'R' && b.crime > 80) cap = Math.min(cap, 2);
  return cap;
}
function growZone(b){
  const dem = b.type === 'R' ? G.rDem : b.type === 'C' ? G.cDem : G.iDem;
  if (!b.powered){ b.prog -= 12; return finishProg(b); }
  if (b.access <= 0){ b.prog -= 8; return finishProg(b); }
  if (b.type === 'R' && b.access < 2){ b.prog -= 7; return finishProg(b); }
  const cap = densityCap(b);
  if (b.dens > cap){ b.prog -= 10; return finishProg(b); }
  let add = 0;
  const blocked = b.congested && b.type !== 'I';
  if (dem > 6 && b.dens < cap && !blocked){
    add = dem * 0.22;
    if (b.type === 'C' && b.nearAir) add += 5;
    if (b.type === 'I' && b.nearPort) add += 5;
    if (b.type === 'R' && b.nearStad) add += 3;
    const p = pollAt(b);
    if (b.type === 'R' && p > 100) add -= (p - 100) / 10;
    if (b.type === 'R' && b.crime > 65) add -= 4;
    if (G.diff === 0) add *= 1.15;
    if (G.diff === 2) add *= 0.86;
  } else if (dem < -12 || blocked) add = -7;
  else add = -1;
  b.prog += add;
  finishProg(b);
}
function finishProg(b){
  if (b.prog >= 100){
    b.prog = 0;
    if (b.dens < 4 && !(b.type === 'I' && b.dens >= 3)){
      b.dens++;
      if (b.type === 'R' && b.dens >= 3 && b.lv >= 68) b.variant = 1 + ((b.x + b.y) % 3);
      G.grew++;
    }
  } else if (b.prog <= -100){
    b.prog = 0;
    if (b.dens > 0) b.dens--;
  }
  if (b.dens <= 0 && b.prog < 0) b.prog = 0;
  b.prog = clamp(b.prog, -100, 100);
}
function recount(){
  let pop = 0, cj = 0, ij = 0, roads = 0, rails = 0, parks = 0, open = 0, fires = 0, schools = 0, casino = 0;
  const has = new Set();
  for (let i = 0; i < W * H; i++){
    if (road[i]) roads++;
    if (rail[i]) rails++;
    if (fire[i]) fires++;
    if (ground[i] === GRASS && bid[i] < 0 && !road[i] && !rail[i] && !wire[i]) open++;
  }
  for (const b of buildings){
    if (!b || !b.alive) continue;
    has.add(b.type);
    const sp = SPEC[b.type];
    if (b.type === 'R'){
      pop += sp.pop[b.dens] || 0;
      if (b.variant >= 1 && b.dens >= 3) schools++;
    } else if (b.type === 'C') cj += sp.jobs[b.dens] || 0;
    else if (b.type === 'I') ij += sp.jobs[Math.min(3, b.dens)] || 0;
    if (b.type === 'park') parks++;
    if (b.type === 'casino') casino++;
  }
  G.resPop = pop; G.comJobs = cj; G.indJobs = ij;
  G.roadCount = roads; G.railCount = rails; G.parkCount = parks;
  G.openCount = open; G.fireCount = fires; G.schoolCount = schools; G.casinoN = casino;
  G.has = has;
}
function updateOpinion(){
  let pop = 0, crimePop = 0, polPop = 0, unpowered = 0, lvSum = 0, lvN = 0, low = 0, high = 0;
  for (const b of buildings){
    if (!b || !b.alive || b.type !== 'R' || b.dens <= 0) continue;
    const people = SPEC.R.pop[b.dens];
    pop += people;
    if (b.crime > 48) crimePop += people;
    if (pollAt(b) > 110) polPop += people;
    if (!b.powered) unpowered += people;
    lvSum += b.lv; lvN++;
    if (b.lv < 36) low++;
    if (b.lv > 72) high++;
  }
  G.crimePct = pop ? Math.round(crimePop / pop * 100) : 0;
  G.polPct = pop ? Math.round(polPop / pop * 100) : 0;
  let jammed = 0, roadsN = 0;
  for (let i = 0; i < road.length; i++) if (road[i]){ roadsN++; if (traffic[i] >= 20) jammed++; }
  G.trafficPct = roadsN ? Math.round(jammed / roadsN * 100) : 0;
  G.avgLv = lvN ? Math.round(lvSum / lvN) : 40;
  const problems = [];
  if (G.crimePct >= 15) problems.push({name:'犯罪', pct:G.crimePct});
  if (G.polPct >= 15) problems.push({name:'公害', pct:G.polPct});
  if (G.trafficPct >= 15) problems.push({name:'渋滞', pct:G.trafficPct});
  if (G.tax >= 9) problems.push({name:'税金', pct:(G.tax - 7) * 10});
  const jobs = G.comJobs + G.indJobs;
  if (G.resPop > 200 && jobs < G.resPop * 0.75){
    problems.push({name:'失業', pct:Math.round((1 - jobs / G.resPop) * 100)});
  }
  if (high > low && G.avgLv > 70 && G.rDem > 15) problems.push({name:'家賃', pct:28});
  if (G.fireCount > 0) problems.push({name:'火事', pct:40});
  else if (G.resPop > 1500 && G.fFire < 40) problems.push({name:'火事', pct:22});
  if (pop && unpowered / pop > 0.2) problems.push({name:'停電', pct:Math.round(unpowered / pop * 100)});
  problems.sort((a, b) => b.pct - a.pct);
  G.problems = problems;
  let a = 80;
  for (const p of problems) a -= p.pct * 0.34;
  if (hasType('police')) a += 3;
  if (hasType('fire')) a += 2;
  G.approval = clamp(Math.round(a), 0, 100);
}
function taxMod(rate){
  if (rate <= 7) return (7 - rate) * 3;
  return -(rate - 7) * 13;
}
function updateDemand(){
  const pop = G.resPop, cj = G.comJobs, ij = G.indJobs, jobs = cj + ij;
  const tm = taxMod(G.tax);
  const t = G.elapsed;
  let r = tm + 6 + Math.sin(t / 18) * 8;
  let c = tm * 0.55 + Math.sin(t / 23 + 1) * 8;
  let i = tm * 0.4 + 34 + Math.sin(t / 15) * 14;
  if (pop < 80){
    i = Math.max(i, 68);
    r = ij >= 80 ? Math.max(r, 42) : Math.min(r, 18);
    c = Math.min(c, -5);
  } else {
    if (jobs > pop * 0.9) r += 26 + Math.min(36, (jobs - pop) / 30);
    else if (pop > jobs * 1.45) r -= 28;
    const wantC = pop * 0.4;
    if (cj < wantC) c += Math.min(55, (wantC - cj) / 8);
    else c -= 16;
    if (pop >= 200 && cj === 0) c += 16;
    if (jobs < pop * 0.85) i += 24;
    if (ij > pop * 1.15 && pop > 200) i -= 18;
  }
  if (hasType('air')) c += 10;
  if (hasType('port')) i += 10;
  if (G.crimePct > 35) r -= 10;
  if (G.polPct > 35) r -= 8;
  if (G.diff === 2){ r -= 6; c -= 4; i -= 4; }
  if (G.diff === 0){ r += 4; i += 4; }
  G.rDem = clamp(Math.round(r), -100, 100);
  G.cDem = clamp(Math.round(c), -100, 100);
  G.iDem = clamp(Math.round(i), -100, 100);
}
function settle(){
  recomputePower();
  recomputePollution();
  servicesAndGrowth({grow:false, traffic:false});
  recount();
  updateOpinion();
  updateDemand();
}
function decayTraffic(){
  const fund = G.fTransit / 100;
  const decay = fund > 0.9 ? 5 : fund > 0.45 ? 3 : 1;
  for (let i = 0; i < traffic.length; i++){
    traffic[i] = traffic[i] > decay ? traffic[i] - decay : 0;
  }
}
function maintFactor(){ return G.diff === 2 ? 1.35 : G.diff === 0 ? 0.75 : 1; }
function calcEconomy(){
  const base = G.resPop + G.comJobs * 1.3 + G.indJobs * 1.15;
  let income = Math.round(base * G.tax * 0.03);
  let giftIn = 0, upP = 0, upF = 0;
  for (const b of buildings){
    if (!b || !b.alive) continue;
    const sp = SPEC[b.type];
    if (sp.income) giftIn += sp.income;
    if (sp.service === 'police') upP += sp.upkeep;
    if (sp.service === 'fire') upF += sp.upkeep;
  }
  income += giftIn;
  const transit = Math.round((G.roadCount * 1 + G.railCount * 2) * (G.fTransit / 100) * maintFactor());
  const police = Math.round(upP * (G.fPolice / 100));
  const fireC = Math.round(upF * (G.fFire / 100));
  const loan = G.loanYears > 0 ? G.loanPay : 0;
  const expense = transit + police + fireC + loan;
  return {income, expense, net: income - expense, transit, police, fire: fireC, loan, giftIn};
}
function deteriorate(){
  if (G.fTransit >= 100) return;
  const p = (100 - G.fTransit) / 100 * 0.045;
  for (let i = 0; i < road.length; i++){
    if (road[i] && ground[i] !== WATER && Math.random() < p){
      road[i] = 0;
      if (!rail[i] && !wire[i] && bid[i] < 0 && ground[i] === GRASS) ground[i] = RUBBLE;
    }
  }
}
function destroyBuilding(b, asRubble){
  if (!b || !b.alive) return;
  for (let yy = 0; yy < b.h; yy++) for (let xx = 0; xx < b.w; xx++){
    const X = b.x + xx, Y = b.y + yy;
    if (!inside(X, Y)) continue;
    const i = idx(X, Y);
    if (bid[i] === b.id) bid[i] = -1;
    road[i] = rail[i] = wire[i] = 0;
    if (ground[i] !== WASTE && ground[i] !== WATER) ground[i] = asRubble ? RUBBLE : GRASS;
  }
  b.alive = false;
  boom(b.x + b.w / 2, b.y + b.h / 2);
}
function boom(tx, ty){
  G.fx.push({x: tx * TS + 8, y: ty * TS + 8, t: 0, life: 0.7});
  G.shake = Math.max(G.shake || 0, 0.8);
}
function igniteCell(x, y){
  if (!inside(x, y)) return false;
  const i = idx(x, y);
  if (ground[i] === WATER || ground[i] === WASTE) return false;
  if (bid[i] < 0 && ground[i] !== TREE) return false;
  fire[i] = Math.min(5, Math.max(fire[i], 4));
  return true;
}
function igniteBuilding(b){
  if (!b || !b.alive) return;
  for (let yy = 0; yy < b.h; yy++) for (let xx = 0; xx < b.w; xx++) igniteCell(b.x + xx, b.y + yy);
}
function spreadFire(){
  const cur = [];
  for (let i = 0; i < fire.length; i++) if (fire[i] > 0) cur.push(i);
  for (const i of cur){
    const x = i % W, y = (i / W) | 0;
    const cov = fireCover(x, y);
    if (Math.random() < 0.18 + cov * 0.65) fire[i] = Math.max(0, fire[i] - 1);
    else if (Math.random() < (cov > 0.45 ? 0.1 : 0.58)){
      const d = D4[(Math.random() * 4) | 0];
      igniteCell(x + d[0], y + d[1]);
    }
    const id = bid[i];
    if (id >= 0 && fire[i] > 0 && buildings[id] && buildings[id].alive && Math.random() < 0.4){
      const b = buildings[id];
      if (SPEC[b.type].zone){
        if (b.dens > 0) b.dens--;
        else if (Math.random() < 0.45) destroyBuilding(b, true);
      } else if (!SPEC[b.type].plant && Math.random() < 0.22) destroyBuilding(b, true);
      else if (SPEC[b.type].plant && Math.random() < 0.06) destroyBuilding(b, true);
    }
    if (ground[i] === TREE && fire[i] > 2){ ground[i] = RUBBLE; fire[i] = Math.max(fire[i], 2); }
  }
}
function addLog(text){
  G.log.unshift(G.year + '年' + MONTHS[G.month] + ' ' + text);
  if (G.log.length > 40) G.log.pop();
}
function alertDisaster(name, text, x, y){
  addLog(name);
  say('dis-' + G.elapsed + '-' + name, text, {force:true, cooldown:0});
  if (x != null) centerOn(x, y);
  G.shake = 1.1;
  sfxDisaster();
  buzz(28);
  if (G.autoPause) G.paused = true;
}
function startFires(n){
  const list = buildings.filter(b => b && b.alive && (SPEC[b.type].zone || b.type === 'coal'));
  for (let k = 0; k < n && list.length; k++){
    const i = (Math.random() * list.length) | 0;
    igniteBuilding(list.splice(i, 1)[0]);
  }
}
function earthquake(){
  alertDisaster('地震', '地震です。火事が広がる前に、燃えているマスのまわりを整地して防火帯にしてください。', W / 2, H / 2);
  let n = 0;
  for (const b of buildings){
    if (!b || !b.alive) continue;
    if (Math.random() < 0.16){
      if (SPEC[b.type].zone && b.dens > 0) b.dens--;
      else if (!SPEC[b.type].zone && Math.random() < 0.35) destroyBuilding(b, true);
      if (n < 8 && Math.random() < 0.55){ igniteBuilding(b); n++; }
    }
  }
}
function damageCoast(){
  let hit = null;
  for (const b of buildings){
    if (!b || !b.alive) continue;
    let near = false;
    for (let yy = 0; yy < b.h && !near; yy++) for (let xx = 0; xx < b.w; xx++){
      const x = b.x + xx, y = b.y + yy;
      for (let d = 0; d < 4; d++){
        const nx = x + D4[d][0], ny = y + D4[d][1];
        if (inside(nx, ny) && ground[idx(nx, ny)] === WATER) near = true;
      }
    }
    if (!near) continue;
    if (!hit) hit = b;
    for (let yy = 0; yy < b.h; yy++) for (let xx = 0; xx < b.w; xx++) flood[idx(b.x + xx, b.y + yy)] = 1;
    if (SPEC[b.type].zone && b.dens > 0) b.dens = Math.max(0, b.dens - 1);
    else if (!SPEC[b.type].zone && Math.random() < 0.35) destroyBuilding(b, true);
  }
  G.floodLeft = 3;
  return hit;
}
function ageFlood(){
  if (G.floodLeft > 0){
    G.floodLeft--;
    if (G.floodLeft >= 2){
      const add = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
        const i = idx(x, y);
        if (!flood[i]) continue;
        for (let d = 0; d < 4; d++){
          const nx = x + D4[d][0], ny = y + D4[d][1];
          if (!inside(nx, ny)) continue;
          const j = idx(nx, ny);
          if (ground[j] !== WATER && !flood[j]) add.push(j);
        }
      }
      for (const j of add){
        flood[j] = 1;
        const id = bid[j];
        if (id >= 0 && buildings[id] && buildings[id].alive && SPEC[buildings[id].type].zone && buildings[id].dens > 0 && Math.random() < 0.5){
          buildings[id].dens--;
        }
      }
    }
  } else {
    let any = false;
    for (let i = 0; i < flood.length; i++) if (flood[i]){ flood[i] = 0; any = true; }
    if (any) { /* receded */ }
  }
}
function spawnMonster(){
  const edge = (Math.random() * 4) | 0;
  let x = 2, y = 2;
  if (edge === 0){ x = 2; y = (Math.random() * H) | 0; }
  if (edge === 1){ x = W - 3; y = (Math.random() * H) | 0; }
  if (edge === 2){ y = 2; x = (Math.random() * W) | 0; }
  if (edge === 3){ y = H - 3; x = (Math.random() * W) | 0; }
  G.monster = {x, y, px: x * TS, py: y * TS, tx: x * TS, ty: y * TS, life: 26, frame: 0};
  alertDisaster('怪獣モグドラ', 'モグドラが上陸しました。通った場所は壊れ、火事になることがあります。燃え広がる前に防火帯を。', x, y);
}
function stepMonster(){
  const m = G.monster;
  if (!m) return;
  let best = null, bd = 1e9;
  for (const b of buildings){
    if (!b || !b.alive || !SPEC[b.type].zone || b.dens <= 0) continue;
    const d = Math.abs(b.x - m.x) + Math.abs(b.y - m.y);
    if (d < bd){ bd = d; best = b; }
  }
  let dx = 0, dy = 0;
  if (best){ dx = Math.sign(best.x - m.x); dy = Math.sign(best.y - m.y); }
  if (Math.random() < 0.5) dy = 0; else dx = 0;
  if (dx === 0 && dy === 0) dx = 1;
  m.x = clamp(m.x + dx, 1, W - 2);
  m.y = clamp(m.y + dy, 1, H - 2);
  m.tx = m.x * TS; m.ty = m.y * TS; m.frame ^= 1;
  for (let yy = 0; yy < 2; yy++) for (let xx = 0; xx < 2; xx++){
    const X = m.x + xx, Y = m.y + yy;
    if (!inside(X, Y)) continue;
    const i = idx(X, Y);
    const id = bid[i];
    if (id >= 0 && buildings[id] && buildings[id].alive){
      const b = buildings[id];
      if (SPEC[b.type].zone && b.dens > 0) b.dens--;
      else destroyBuilding(b, true);
      if (Math.random() < 0.45) igniteCell(X, Y);
    } else if (ground[i] === TREE) ground[i] = RUBBLE;
  }
  m.life--;
  if (m.life <= 0) G.monster = null;
}
function spawnTornado(){
  const x = (Math.random() * (W - 4) + 2) | 0;
  const y = 1;
  G.tornado = {x, y, px: x * TS, py: y * TS, tx: x * TS, ty: y * TS, life: 20, vx: Math.random() < 0.5 ? -1 : 1};
  alertDisaster('竜巻', '竜巻が通った列は壊れます。火事だけは止められます。', x, y);
}
function stepTornado(){
  const t = G.tornado;
  if (!t) return;
  t.y += 1;
  if (Math.random() < 0.4) t.vx = Math.random() < 0.5 ? -1 : 1;
  t.x = clamp(t.x + t.vx, 1, W - 2);
  t.tx = t.x * TS; t.ty = t.y * TS;
  const i = idx(t.x, t.y);
  const id = bid[i];
  if (id >= 0 && buildings[id] && buildings[id].alive){
    const b = buildings[id];
    if (SPEC[b.type].zone && b.dens > 0) b.dens = Math.max(0, b.dens - 1);
    else destroyBuilding(b, true);
    if (Math.random() < 0.55) igniteCell(t.x, t.y);
  } else if (ground[i] === TREE) ground[i] = RUBBLE;
  t.life--;
  if (t.life <= 0 || t.y >= H - 1) G.tornado = null;
}
function spawnCrash(){
  const air = buildings.find(b => b && b.alive && b.type === 'air');
  if (!air) return;
  const targets = buildings.filter(b => b && b.alive && SPEC[b.type].zone && b.dens > 0);
  const tgt = targets.length ? targets[(Math.random() * targets.length) | 0] : air;
  G.crash = {
    x: air.x + 1, y: air.y + 1, tx: tgt.x + 1, ty: tgt.y + 1,
    px: (air.x + 1) * TS, py: (air.y + 1) * TS,
    destx: (air.x + 1) * TS, desty: (air.y + 1) * TS, life: 4
  };
  alertDisaster('墜落', '飛行機が落ちます。落ちた場所の火事を囲ってください。', tgt.x, tgt.y);
}
function stepCrash(){
  const c = G.crash;
  if (!c) return;
  c.life--;
  c.x += Math.sign(c.tx - c.x);
  c.y += Math.sign(c.ty - c.y);
  c.destx = c.x * TS; c.desty = c.y * TS;
  if (c.life <= 0 || (c.x === c.tx && c.y === c.ty)){
    for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++){
      igniteCell(c.tx + xx, c.ty + yy);
      const X = c.tx + xx, Y = c.ty + yy;
      if (!inside(X, Y)) continue;
      const id = bid[idx(X, Y)];
      if (id >= 0 && buildings[id] && buildings[id].alive){
        const b = buildings[id];
        if (SPEC[b.type].zone && b.dens > 0) b.dens = Math.max(0, b.dens - 1);
      }
    }
    boom(c.tx, c.ty);
    G.crash = null;
  }
}
function spawnUfo(){
  G.ufo = {x: 0, y: 8 + ((Math.random() * (H - 16)) | 0), px: 0, py: 0, tx: 0, ty: 0, life: 18};
  G.ufo.py = G.ufo.y * TS; G.ufo.ty = G.ufo.py;
  alertDisaster('円盤', '円盤がビームを落としていきます。消防で火事を囲むしかありません。', 4, G.ufo.y);
}
function stepUfo(){
  const u = G.ufo;
  if (!u) return;
  u.x += 2;
  u.tx = u.x * TS;
  if ((u.life % 2) === 0){
    const y = clamp(u.y + ((Math.random() * 5) | 0) - 2, 1, H - 2);
    igniteCell(clamp(u.x, 0, W - 1), y);
    const id = inside(u.x, y) ? bid[idx(clamp(u.x, 0, W - 1), y)] : -1;
    if (id >= 0 && buildings[id] && buildings[id].alive && SPEC[buildings[id].type].zone && buildings[id].dens > 0){
      buildings[id].dens--;
    }
    boom(clamp(u.x, 0, W - 1), y);
  }
  u.life--;
  if (u.life <= 0 || u.x >= W) G.ufo = null;
}
function meltdown(){
  const plants = buildings.filter(b => b && b.alive && b.type === 'nuke');
  if (!plants.length){ say('melt-none', '原子力はありません。事故は起きませんでした。', {force:true}); return; }
  const p = plants[(Math.random() * plants.length) | 0];
  const cx = p.x + 1, cy = p.y + 1;
  alertDisaster('炉心の事故', '原子力発電所が壊れ、核のごみが残りました。ごみは整地でも消えません。離れた場所に発電所を建てて、電線を引き直してください。', cx, cy);
  for (let y = cy - 6; y <= cy + 6; y++) for (let x = cx - 6; x <= cx + 6; x++){
    if (!inside(x, y)) continue;
    const d = Math.hypot(x - cx, y - cy);
    if (d > 6 || Math.random() > 1 - d / 8) continue;
    const i = idx(x, y);
    const id = bid[i];
    if (id >= 0 && buildings[id] && buildings[id].alive) destroyBuilding(buildings[id], false);
    ground[i] = WASTE;
    road[i] = rail[i] = wire[i] = fire[i] = flood[i] = 0;
  }
}
function triggerDisaster(kind){
  if (kind === 'fire'){ startFires(3); alertDisaster('火事', '火事です。まわりを整地すると燃え広がりません。消防署の範囲では消えやすくなります。', W/2, H/2); }
  else if (kind === 'flood'){
    const hit = damageCoast();
    alertDisaster('洪水', '岸の建物が水をかぶりました。水が引くまで、しばらく育ちにくくなります。', hit ? hit.x : W/2, hit ? hit.y : H/2);
  }
  else if (kind === 'quake') earthquake();
  else if (kind === 'tornado') spawnTornado();
  else if (kind === 'crash') spawnCrash();
  else if (kind === 'monster') spawnMonster();
  else if (kind === 'ufo') spawnUfo();
  else if (kind === 'melt') meltdown();
}
function maybeRandomDisaster(){
  if (G.elapsed < 18 && !G.scenario) return;
  const mult = G.diff === 2 ? 1.75 : G.diff === 0 ? 0.35 : 1;
  const yearP = {fire:0.18, flood:0.08, quake:0.055, tornado:0.05, crash:0.09, monster:0.04, ufo:0.02, melt:0.03};
  for (const k of Object.keys(yearP)){
    if (!G.disasters[k]) continue;
    if (k === 'crash' && !hasType('air')) continue;
    if (k === 'melt' && !hasType('nuke')) continue;
    const p = 1 - Math.pow(1 - Math.min(0.85, yearP[k] * mult), 1 / 12);
    if (Math.random() < p){ triggerDisaster(k); return; }
  }
}
function offerGift(kind){
  if (G.pending.length >= 4){
    say('giftfull', '贈り物が4つたまっています。先に置かないと、次が届きません。', {cooldown:6});
    return false;
  }
  if (G.pending.some(p => p.kind === kind)) return false;
  G.pending.push({kind});
  G.given[kind] = (G.given[kind] || 0) + 1;
  say('gift-' + kind + '-' + G.given[kind], GIFT_TEXT[kind] || '贈り物が届きました。', {force:true});
  return true;
}
function checkGifts(){
  const pop = G.resPop;
  if (!G.given.house && pop >= 2000){ offerGift('house'); return; }
  if (!G.given.bank && pop >= 10000 && G.funds < 2000){ offerGift('bank'); return; }
  if (!G.choice && (G.given.fun || 0) < 3 && G.roadCount >= 500 * ((G.given.fun || 0) + 1)){
    G.choice = 'fun';
    openFunChoice();
    return;
  }
  if ((G.given.bigpark || 0) < 3 && G.parkCount >= [40, 90, 150][G.given.bigpark || 0]){ offerGift('bigpark'); return; }
  const fires = buildings.filter(b => b && b.alive && b.type === 'fire').length;
  if ((G.given.firehq || 0) < 3 && fires >= [2, 4, 6][G.given.firehq || 0]){ offerGift('firehq'); return; }
  const pols = buildings.filter(b => b && b.alive && b.type === 'police').length;
  if ((G.given.polhq || 0) < 3 && pols >= [2, 4, 6][G.given.polhq || 0]){ offerGift('polhq'); return; }
  if ((G.given.zoo || 0) < 2 && hasType('stadium') && pop >= (G.given.zoo ? 20000 : 2000)){ offerGift('zoo'); return; }
  if ((G.given.station || 0) < 2 && G.railCount >= (G.given.station ? 200 : 80)){ offerGift('station'); return; }
  if (!G.given.fountain && G.elapsed >= 50 * 12){ offerGift('fountain'); return; }
  if (!G.given.expo && hasType('air') && hasType('port') && pop >= 10000){ offerGift('expo'); return; }
  if (!G.given.tower && pop >= 50000){ offerGift('tower'); return; }
  if (!G.given.statue && pop >= 500000){ offerGift('statue'); return; }
  if ((G.given.mill || 0) < 2 && G.zoneCount >= (G.given.mill ? 40 : 18)){ offerGift('mill'); return; }
  if ((G.given.lib || 0) < 2 && G.schoolCount >= (G.given.lib ? 6 : 2)){ offerGift('lib'); return; }
  if ((G.given.land || 0) < 4 && pop >= 25000 && G.openCount < 700){ offerGift('land'); return; }
}
function openFunChoice(){
  say('fun-choice', '道路が長くなりました。遊園地かカジノか、どちらかを選べます。遊園地は地価にやさしく、カジノは毎年 $300 ですが犯罪が少し増えます。', {
    force:true,
    actions:[
      {label:'遊園地', run(){ pickFun('amuse'); }},
      {label:'カジノ', run(){ pickFun('casino'); }}
    ]
  });
}
function pickFun(kind){
  G.choice = null;
  G.given.fun = (G.given.fun || 0) + 1;
  if (G.pending.length < 4) G.pending.push({kind});
  say('fun-picked', (kind === 'casino' ? 'カジノ' : '遊園地') + 'を、下の「自然」から置いてください。置くのに $100 いります。', {force:true});
  renderDock();
}
function checkRank(){
  const r = rankOf(G.resPop);
  if (r.id !== G.rankId){
    const prev = RANKS.findIndex(x => x.id === G.rankId);
    const next = RANKS.findIndex(x => x.id === r.id);
    G.rankId = r.id;
    if (G.elapsed > 0 && next > prev){
      addLog(r.name + 'になった');
      say('rank-' + r.id, '人口が増えて、' + r.name + 'になりました。', {force:true});
      G.celebrate = 1.4;
      sfxRank();
    }
  }
}
function checkGoal(){
  const g = G.goal;
  if (!g || G.won || G.over) return;
  let ok = G.resPop >= (g.needPop || 0);
  if (g.maxCrime != null && G.crimePct > g.maxCrime) ok = false;
  if (g.maxTraffic != null && G.trafficPct > g.maxTraffic) ok = false;
  if (g.needNoFire && G.fireCount > 0) ok = false;
  if (g.needApproval != null && G.approval < g.needApproval) ok = false;
  if (ok && !g.practice){
    G.won = true;
    if (G.scenario && !meta.cleared.includes(G.scenario)){
      meta.cleared.push(G.scenario);
      saveMeta();
    }
    showEnd(true);
  } else if (ok && g.practice && !g.celebrated){
    g.celebrated = true;
    say('practice-win', '目標の人口に届きました。このまま続けても、タイトルに戻っても大丈夫です。', {force:true});
    G.celebrate = 1.2;
    sfxRank();
  } else if (!g.practice && g.months && G.elapsed >= g.months){
    G.over = true;
    showEnd(false);
  } else if (g.practice && G.elapsed === g.months && !g.done){
    g.done = true;
    const msg = G.resPop >= 30000
      ? '5年がたち、人口は ' + fmtPop(G.resPop) + ' 人。練習は合格です。'
      : '5年がたちました。人口は ' + fmtPop(G.resPop) + ' 人。発電・電線・道路・三つの地区がそろうと伸びます。このまま続けられます。';
    say('practice-end', msg, {force:true});
  }
}
function reactTips(){
  if (G.scenario && G.scenario !== 'practice') return;
  if (!hasType('coal') && !hasType('nuke')){
    say('needplant', 'まずは発電所です。下の「電力」から、火力（$3,000、地区40まで）か原子力（$5,000、地区120まで）を置きます。');
    return;
  }
  if (G.zoneCount > 2 && G.powerCap > 0 && G.powerUsed < Math.min(G.zoneCount, G.powerCap) * 0.5 && G.zoneCount > G.powerUsed){
    say('nopower', '点滅する印は、電気が来ていません。電線は発電所から地区までつなぎます。道路の上にも引けます。となりの地区にも電気は流れます。');
    return;
  }
  if (G.zoneCount > 0 && G.roadCount < 3){
    say('needroad', '道路か線路が、地区の上下左右に接していないと育ちません。ななめだけでは足りません。');
    return;
  }
  const stuck = buildings.some(b => b && b.alive && b.type === 'R' && b.access === 1);
  if (stuck){
    say('needdest', '住宅は、道路の先に商業・工業・警察・消防・港・空港などがないと人が入りません。まず工業を道路でつなぐと仕事ができます。');
    return;
  }
  if (G.resPop > 0) say('firstpop', '人が引っ越してきました。仕事が多いと住宅が育ち、人口が多いと店が育ちます。税率は7%前後が目安です。');
  if (G.crimePct >= 25) say('crime', '犯罪が増えています。警察署を、悪い地区の近くに置いてください。財政で警察の予算を0にすると、ほとんど働きません。');
  if (G.trafficPct >= 20) say('traffic', '渋滞しています。混んでいる道路を線路に替えると、抜けやすく公害も少なめです。線路は道路の2倍の建設費です。');
  if (G.polPct >= 25) say('pol', '公害で住宅が育ちにくくなっています。工業と火力は、住宅から離すか、まちの端に寄せてください。公園は地価を上げ、公害をやわらげます。');
}
function scenarioScript(){
  const f = G.flags || {};
  if (f.quakeAt != null && G.elapsed === f.quakeAt && !f.quakeDone){ f.quakeDone = 1; earthquake(); }
  if (f.floodAt != null && G.elapsed === f.floodAt && !f.floodDone){ f.floodDone = 1; const hit = damageCoast(); alertDisaster('洪水', '岸があふれました。壊れたところを整地して、もう一度地区を置きます。', hit ? hit.x : 20, hit ? hit.y : 20); }
  if (f.meltAt != null && G.elapsed === f.meltAt && !f.meltDone){ f.meltDone = 1; meltdown(); }
  if (f.monsterAt != null && G.elapsed === f.monsterAt && !f.monsterDone){ f.monsterDone = 1; spawnMonster(); }
}
function simulateMonth(){
  if (G.over || G.budgetPending) return;
  scenarioScript();
  spreadFire();
  ageFlood();
  stepMonster();
  stepTornado();
  stepCrash();
  stepUfo();
  decayTraffic();
  recomputePower();
  recomputePollution();
  servicesAndGrowth({grow:true, traffic:true});
  recount();
  updateOpinion();
  updateDemand();
  checkGifts();
  checkRank();
  checkGoal();
  if (G.elapsed % 2 === 0) reactTips();
  if (G.grew){ sfxGrow(); G.grew = 0; }
  maybeRandomDisaster();
  G.month++;
  G.elapsed++;
  if (G.month >= 12){
    G.month = 0;
    G.year++;
    G.yearly.push({y:G.year, pop:G.resPop, crime:G.crimePct, pol:G.polPct, lv:G.avgLv});
    if (G.yearly.length > 130) G.yearly.shift();
    const eco = calcEconomy();
    if (!G.autoBudget || G.funds + eco.net < -5000){
      G.budgetPending = true;
      openSheet('budget');
      updateHUD();
      return;
    }
    G.funds += eco.net;
    if (G.loanYears > 0) G.loanYears--;
    deteriorate();
    toast(G.year + '年の決算 ' + (eco.net >= 0 ? '+' : '') + '$' + fmt(eco.net));
    sfxYear();
    saveGame();
    if (G.funds < -5000){ bankrupt(); return; }
  }
  updateHUD();
  renderDock();
}

function toolSpec(tool){
  if (tool === 'road') return {w:1,h:1,cost:10,water:20,kind:'road',name:'道路'};
  if (tool === 'rail') return {w:1,h:1,cost:20,water:40,kind:'rail',name:'線路'};
  if (tool === 'wire') return {w:1,h:1,cost:5,water:10,kind:'wire',name:'電線'};
  if (tool === 'bulldoze') return {w:1,h:1,cost:1,kind:'bulldoze',name:'整地'};
  if (tool === 'park') return {w:1,h:1,cost:10,kind:'park',name:'公園'};
  if (tool === 'query' || tool === 'hand') return null;
  if (String(tool).startsWith('gift:')){
    const k = tool.slice(5);
    if (k === 'land') return {w:3,h:3,cost:100,kind:'land',name:'埋立地'};
    return {w:SPEC[k].w,h:SPEC[k].h,cost:100,kind:k,name:SPEC[k].name,gift:true};
  }
  if (SPEC[tool]) return {w:SPEC[tool].w,h:SPEC[tool].h,cost:SPEC[tool].cost,kind:tool,name:SPEC[tool].name};
  return null;
}
function beginStroke(){
  if (stroke) return;
  stroke = {
    funds: G.funds,
    cells: [],
    seen: new Set(),
    spawned: [],
    pending: G.pending.map(p => ({...p})),
    choice: G.choice,
    told: false,
    lastA: null
  };
}
function markIndex(i){
  if (!stroke || stroke.seen.has(i)) return;
  stroke.seen.add(i);
  stroke.cells.push({i, g:ground[i], road:road[i], rail:rail[i], wire:wire[i], fire:fire[i], flood:flood[i], bid:bid[i]});
}
function endStroke(){
  if (!stroke) return;
  if (stroke.cells.length || stroke.spawned.length){
    G.undo.push(stroke);
    if (G.undo.length > 30) G.undo.shift();
    recomputePower();
    recount();
    updateHUD();
    renderDock();
  }
  stroke = null;
}
function undo(){
  const s = G.undo.pop();
  if (!s){ toast('取り消せる操作がありません'); return; }
  for (const id of s.spawned){
    const b = buildings[id];
    if (!b) continue;
    b.alive = false;
    for (let yy = 0; yy < b.h; yy++) for (let xx = 0; xx < b.w; xx++){
      const X = b.x + xx, Y = b.y + yy;
      if (inside(X, Y) && bid[idx(X, Y)] === id) bid[idx(X, Y)] = -1;
    }
  }
  for (const c of s.cells){
    ground[c.i] = c.g; road[c.i] = c.road; rail[c.i] = c.rail; wire[c.i] = c.wire;
    fire[c.i] = c.fire; flood[c.i] = c.flood; bid[c.i] = c.bid;
    if (c.bid >= 0 && buildings[c.bid]) buildings[c.bid].alive = true;
  }
  G.funds = s.funds;
  G.pending = s.pending;
  G.choice = s.choice;
  recomputePower();
  recount();
  updateHUD();
  renderDock();
  sfxUi();
}
function act(tool, x, y, dry){
  const spec = toolSpec(tool);
  if (!spec) return {ok:false, reason:'道具'};
  if (spec.kind === 'bulldoze') return doBulldoze(x, y, dry);
  if (spec.kind === 'road' || spec.kind === 'rail' || spec.kind === 'wire') return placeLinear(spec.kind, x, y, dry);
  if (spec.kind === 'land') return placeLand(x, y, dry);
  return placeBuilding(spec.kind, x, y, spec.cost, !!spec.gift, dry);
}
function placeLinear(kind, x, y, dry){
  if (!inside(x, y)) return {ok:false, reason:'画面の外です'};
  const i = idx(x, y);
  if (ground[i] === WASTE) return {ok:false, reason:'核のごみの上には置けません'};
  if (ground[i] === RUBBLE) return {ok:false, reason:'瓦礫は先に整地します'};
  if (bid[i] >= 0) return {ok:false, reason:'建物があります'};
  const arr = kind === 'road' ? road : kind === 'rail' ? rail : wire;
  if (arr[i]) return {ok:true, cost:0, noop:true};
  let cost = ground[i] === WATER ? (kind === 'road' ? 20 : kind === 'rail' ? 40 : 10) : (kind === 'road' ? 10 : kind === 'rail' ? 20 : 5);
  if (ground[i] === TREE){
    if (!G.autoBulldoze) return {ok:false, reason:'森があります。整地するか、自動整地をオンに'};
    cost += 1;
  }
  if (G.funds < cost) return {ok:false, reason:'お金がたりません'};
  if (dry) return {ok:true, cost, bridge: ground[i] === WATER};
  markIndex(i);
  G.funds -= cost;
  if (ground[i] === TREE) ground[i] = GRASS;
  arr[i] = 1;
  return {ok:true, cost, bridge: ground[i] === WATER};
}
function placeBuilding(type, x, y, cost, isGift, dry){
  const sp = SPEC[type];
  if (isGift && !G.pending.some(p => p.kind === type)) return {ok:false, reason:'その贈り物はいまありません'};
  let extra = 0;
  const cells = [];
  for (let yy = 0; yy < sp.h; yy++) for (let xx = 0; xx < sp.w; xx++){
    const X = x + xx, Y = y + yy;
    if (!inside(X, Y)) return {ok:false, reason:'画面の外です'};
    const i = idx(X, Y);
    if (ground[i] === WATER) return {ok:false, reason:'水の上には置けません'};
    if (ground[i] === WASTE) return {ok:false, reason:'核のごみの上には置けません'};
    if (ground[i] === RUBBLE) return {ok:false, reason:'瓦礫は先に整地します'};
    if (bid[i] >= 0 || road[i] || rail[i] || wire[i]) return {ok:false, reason:'ふさがっています'};
    if (ground[i] === TREE){
      if (!G.autoBulldoze) return {ok:false, reason:'森があります'};
      extra++;
    }
    cells.push(i);
  }
  const total = cost + extra;
  if (G.funds < total) return {ok:false, reason:'お金がたりません'};
  if (dry) return {ok:true, cost: total};
  for (const i of cells) markIndex(i);
  G.funds -= total;
  for (const i of cells) if (ground[i] === TREE) ground[i] = GRASS;
  const b = {
    id: buildings.length, alive: true, type, x, y, w: sp.w, h: sp.h,
    dens: 0, prog: 0, powered: false, lv: 40, crime: 12,
    variant: (x * 3 + y) % 3, access: 0, congested: false
  };
  buildings.push(b);
  if (stroke) stroke.spawned.push(b.id);
  for (const i of cells) bid[i] = b.id;
  if (isGift){
    const pi = G.pending.findIndex(p => p.kind === type);
    if (pi >= 0) G.pending.splice(pi, 1);
  }
  return {ok:true, cost: total};
}
function placeLand(x, y, dry){
  if (!G.pending.some(p => p.kind === 'land')) return {ok:false, reason:'埋立地はありません'};
  let water = 0, extra = 0;
  const cells = [];
  for (let yy = 0; yy < 3; yy++) for (let xx = 0; xx < 3; xx++){
    const X = x + xx, Y = y + yy;
    if (!inside(X, Y)) return {ok:false, reason:'画面の外です'};
    const i = idx(X, Y);
    if (ground[i] === WASTE || ground[i] === RUBBLE || bid[i] >= 0 || road[i] || rail[i]) return {ok:false, reason:'ふさがっています'};
    if (ground[i] === TREE){
      if (!G.autoBulldoze) return {ok:false, reason:'森があります'};
      extra++;
    }
    if (ground[i] === WATER) water++;
    cells.push(i);
  }
  if (!water) return {ok:false, reason:'水をふくむ3×3に置きます'};
  if (G.funds < 100 + extra) return {ok:false, reason:'お金がたりません'};
  if (dry) return {ok:true, cost: 100 + extra};
  for (const i of cells) markIndex(i);
  G.funds -= 100 + extra;
  for (const i of cells){
    ground[i] = GRASS;
    wire[i] = 0; fire[i] = 0;
  }
  const pi = G.pending.findIndex(p => p.kind === 'land');
  if (pi >= 0) G.pending.splice(pi, 1);
  return {ok:true, cost: 100 + extra};
}
function doBulldoze(x, y, dry){
  if (!inside(x, y)) return {ok:false, reason:'画面の外です'};
  const i = idx(x, y);
  if (ground[i] === WASTE) return {ok:false, reason:'核のごみは消せません'};
  if (bid[i] >= 0){
    const b = buildings[bid[i]];
    const cost = b.w * b.h;
    if (G.funds < cost) return {ok:false, reason:'お金がたりません'};
    if (dry) return {ok:true, cost};
    for (let yy = 0; yy < b.h; yy++) for (let xx = 0; xx < b.w; xx++) markIndex(idx(b.x + xx, b.y + yy));
    G.funds -= cost;
    for (let yy = 0; yy < b.h; yy++) for (let xx = 0; xx < b.w; xx++){
      const j = idx(b.x + xx, b.y + yy);
      if (bid[j] === b.id) bid[j] = -1;
      fire[j] = 0; flood[j] = 0;
      if (ground[j] !== WATER && ground[j] !== WASTE) ground[j] = GRASS;
      road[j] = rail[j] = wire[j] = 0;
    }
    b.alive = false;
    return {ok:true, cost};
  }
  const layered = wire[i] || rail[i] || road[i] || ground[i] === TREE || ground[i] === RUBBLE || fire[i] > 0;
  if (!layered){
    if (ground[i] === WATER) return {ok:false, reason:'水は埋められません'};
    return {ok:false, reason:'何もありません'};
  }
  if (G.funds < 1) return {ok:false, reason:'お金がたりません'};
  if (dry) return {ok:true, cost:1};
  markIndex(i);
  G.funds -= 1;
  fire[i] = 0;
  if (wire[i]) wire[i] = 0;
  else if (rail[i]) rail[i] = 0;
  else if (road[i]) road[i] = 0;
  else if (ground[i] === TREE || ground[i] === RUBBLE) ground[i] = GRASS;
  return {ok:true, cost:1};
}

const MAIN_SC = ['quake','crime','traffic','fire','melt','flood','monster'];
const SCENARIOS = [
  {id:'quake', name:'みなとの地震', years:5, text:'2か月後に地震。火事を止め、5年で人口1.2万に戻す。', goal:{months:60, needPop:12000, needNoFire:true}},
  {id:'crime', name:'けむりの犯罪', years:10, text:'工場ばかりで犯罪が多い。10年で人口1.6万、犯罪を25%未満に。', goal:{months:120, needPop:16000, maxCrime:25}},
  {id:'traffic', name:'交差点の渋滞', years:10, text:'道路が詰まっている。10年で人口1.5万、渋滞を20%未満に。', goal:{months:120, needPop:15000, maxTraffic:20}},
  {id:'fire', name:'港の大火', years:5, text:'すでに燃えています。火を消し、5年で人口1万。', goal:{months:60, needPop:10000, needNoFire:true}},
  {id:'melt', name:'炉心の事故', years:10, text:'まもなく原子力が壊れます。立て直して10年で人口1万。', goal:{months:120, needPop:10000}},
  {id:'flood', name:'あふれる海岸', years:5, text:'岸があふれます。5年で人口1万まで戻す。', goal:{months:60, needPop:10000}},
  {id:'monster', name:'怪獣モグドラ', years:6, text:'モグドラが来ます。6年で人口8,000を守る。', goal:{months:72, needPop:8000}},
  {id:'plain', name:'平原計画', years:0, bonus:true, text:'水のない平原。年限はありません。メガロポリスが目標です。', goal:null},
  {id:'neon', name:'ネオン通り', years:10, bonus:true, text:'カジノの収入と犯罪。10年で人口2万、支持50%以上。', goal:{months:120, needPop:20000, needApproval:50}}
];
function bonusOpen(){ return MAIN_SC.filter(id => meta.cleared.includes(id)).length >= 6; }
function setupScenario(id){
  const sc = SCENARIOS.find(s => s.id === id);
  G.scenario = id;
  G.name = sc.name;
  G.funds = id === 'crime' ? 4000 : id === 'traffic' ? 12000 : id === 'neon' ? 8000 : 7000;
  if (id === 'plain') G.funds = 20000;
  G.tax = 7;
  G.flags = {};
  const opt = {practice:false, bay: id === 'quake' || id === 'flood' || id === 'fire', plain: id === 'plain'};
  generateTerrain(ground, id === 'plain' ? 61 : (id.length * 47 + 9) % 1000, opt);
  if (id !== 'plain'){
    const a = findAnchor(36, 18);
    const jam = id === 'traffic';
    const town = buildTown({
      x: a.x, y: a.y, cols: id === 'crime' ? 6 : 5,
      densI: id === 'crime' ? 3 : 2,
      densR: id === 'monster' ? 2 : 2,
      densC: id === 'crime' ? 1 : 1,
      zoneC: true,
      plant: id === 'melt' ? 'nuke' : 'coal',
      police: id === 'crime' ? 0 : 1,
      fire: 1,
      jam,
      rails: false,
      casinos: id === 'neon' ? 2 : id === 'crime' ? 1 : 0
    });
    G._focus = town;
    if (id === 'quake') G.flags.quakeAt = 2;
    if (id === 'flood') G.flags.floodAt = 1;
    if (id === 'melt') G.flags.meltAt = 3;
    if (id === 'monster') G.flags.monsterAt = 2;
    if (id === 'fire') startFires(7);
  } else G._focus = {x: W / 2, y: H / 2};
  G.goal = sc.goal ? {...sc.goal, text: sc.text} : {text:'年限なし。人口50万のメガロポリスが、いちばん大きなまちです。', free:true};
  G.disasters = {fire:false,flood:false,quake:false,tornado:false,crash:false,monster:false,ufo:false,melt:false};
  if (id === 'fire'){
    say('sc-fire', '港の大火です。停止中に、燃えているマスの上下左右を整地すると防火帯になります。火が消えてから、壊れた地区を建て直してください。', {force:true});
  } else if (id === 'quake'){
    say('sc-quake', '静かな港まちです。まもなく地震が来ます。来たら、火事のまわりを整地してください。', {force:true});
  } else if (id === 'crime'){
    say('sc-crime', '工場が密集して犯罪が多いまちです。警察署を悪い場所の近くに置き、公園で地価を上げると人が戻ります。', {force:true});
  } else if (id === 'traffic'){
    say('sc-traffic', '道路が詰まっています。混んでいる道路をどかして線路にすると、住宅と店が息を吹き返します。', {force:true});
  } else if (id === 'melt'){
    say('sc-melt', 'このまちの電気は原子力です。事故が起きたら、ごみから離れた場所に火力を建て、電線を引き直してください。', {force:true});
  } else if (id === 'flood'){
    say('sc-flood', '岸があふれます。水が引いたあと、瓦礫を整地して地区を戻してください。', {force:true});
  } else if (id === 'monster'){
    say('sc-monster', 'モグドラが上陸します。壊れたあとの火事を止め、住宅を建て直してください。', {force:true});
  } else if (id === 'neon'){
    say('sc-neon', 'カジノは毎年お金を生み、犯罪も生みます。警察と公園で支持を戻しつつ、人口を増やしてください。', {force:true});
  } else if (id === 'plain'){
    say('sc-plain', '水のない平原です。好きなだけ造成できます。森の輪は、残すと近くの地価が上がります。', {force:true});
  }
}

function startGame(opts){
  opts = opts || {};
  resetWorld();
  closeSheet(true);
  G.playing = true;
  G.mode = opts.mode || 'free';
  G.paused = true;
  G.speed = 1;
  G.tool = 'hand';
  G.cat = 'move';
  G.autoBudget = true;
  G.autoBulldoze = true;
  G.autoPause = true;
  G.tax = 7; G.fTransit = 100; G.fPolice = 100; G.fFire = 100;
  G.year = 1900; G.month = 0; G.elapsed = 0;
  G.startOpts = opts;
  showScreen('play');
  layoutMap();
  if (opts.mode === 'practice'){
    G.scenario = 'practice';
    G.name = 'はじめての島';
    G.seed = 7;
    G.diff = 0;
    G.funds = 20000;
    G.disasters = {fire:false,flood:false,quake:false,tornado:false,crash:false,monster:false,ufo:false,melt:false};
    generateTerrain(ground, 7, {practice:true});
    G.goal = {months:60, needPop:30000, practice:true, text:'5年で人口3万。まずは発電所、電線、工業、道路、住宅。'};
    say('welcome', 'リンです。この島の市長はあなたです。時間は右上の「再開」まで止まります。まずは下の「電力」で発電所を置き、電線で地区とつないでください。工業が仕事を作り、道路の先の住宅に人が入ります。', {force:true});
    G._focus = null;
  } else if (opts.mode === 'scenario'){
    G.diff = 1;
    G.seed = 0;
    setupScenario(opts.scenario);
  } else {
    G.scenario = null;
    G.seed = opts.seed | 0;
    G.diff = opts.diff | 0;
    G.name = (opts.name || 'マイタウン').slice(0, 8) || 'マイタウン';
    G.funds = [20000, 10000, 5000][G.diff];
    G.disasters = G.diff === 0
      ? {fire:false,flood:false,quake:false,tornado:false,crash:false,monster:false,ufo:false,melt:false}
      : G.diff === 2
        ? {fire:true,flood:true,quake:true,tornado:true,crash:true,monster:true,ufo:false,melt:true}
        : {fire:true,flood:true,quake:false,tornado:false,crash:false,monster:false,ufo:false,melt:false};
    generateTerrain(ground, G.seed, {});
    G.goal = {text:'年限なし。人口50万でメガロポリス。地図番号 ' + String(G.seed).padStart(3, '0') + '。', free:true};
    say('welcome', '「電力」から発電所を置いてください。火力は安く煙が出ます。原子力は多くの地区をまかなえますが、事故るとごみが残ります。時間は「再開」で動きます。', {force:true});
  }
  settle();
  updateHUD();
  renderDock();
  saveGame();
  G.needCenter = true;
}

const SAVE_KEY = 'dotmachi-save-v1';
const META_KEY = 'dotmachi-meta-v1';
function saveMeta(){
  meta.sound = G.sound;
  try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) {}
}
function loadMeta(){
  try { meta = Object.assign({cleared:[], sound:'sfx'}, JSON.parse(localStorage.getItem(META_KEY) || '{}')); }
  catch (e) { meta = {cleared:[], sound:'sfx'}; }
  if (!Array.isArray(meta.cleared)) meta.cleared = [];
  G.sound = meta.sound || 'sfx';
}
function saveGame(manual){
  if (!G.playing) return;
  const data = {
    v:1, name:G.name, seed:G.seed, diff:G.diff, scenario:G.scenario, mode:G.mode,
    year:G.year, month:G.month, elapsed:G.elapsed, funds:G.funds,
    tax:G.tax, fTransit:G.fTransit, fPolice:G.fPolice, fFire:G.fFire,
    autoBudget:G.autoBudget, autoBulldoze:G.autoBulldoze, autoPause:G.autoPause,
    disasters:G.disasters, pending:G.pending, given:G.given, choice:G.choice,
    loanYears:G.loanYears, loanPay:G.loanPay, rankId:G.rankId, won:G.won,
    goal:G.goal, flags:G.flags, log:G.log, yearly:G.yearly, said:G.said,
    speed:G.speed, paused:G.paused,
    ground:Array.from(ground), road:Array.from(road), rail:Array.from(rail), wire:Array.from(wire),
    fire:Array.from(fire), traffic:Array.from(traffic),
    buildings: buildings.filter(b => b && b.alive).map(b => ({...b})),
    monster: G.monster ? {x:G.monster.x,y:G.monster.y,life:G.monster.life} : null,
    cam:{x:cam.x,y:cam.y,z:cam.z},
    startOpts: G.startOpts
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); if (manual) toast('セーブしました'); }
  catch (e) { toast('セーブできませんでした'); }
}
function loadGame(){
  let data;
  try { data = JSON.parse(localStorage.getItem(SAVE_KEY) || ''); }
  catch (e) { data = null; }
  if (!data || data.v !== 1){ toast('つづきのデータがありません'); return; }
  resetWorld();
  G.playing = true;
  const keys = ['name','seed','diff','scenario','mode','year','month','elapsed','funds','tax','fTransit','fPolice','fFire','autoBudget','autoBulldoze','autoPause','disasters','pending','given','choice','loanYears','loanPay','rankId','won','goal','flags','log','yearly','said','speed','paused','startOpts'];
  for (const k of keys) if (data[k] !== undefined) G[k] = data[k];
  ground.set(data.ground); road.set(data.road); rail.set(data.rail); wire.set(data.wire);
  fire.set(data.fire); traffic.set(data.traffic);
  bid.fill(-1);
  buildings.length = 0;
  for (const raw of data.buildings || []){
    raw.alive = true;
    raw.id = buildings.length;
    buildings.push(raw);
    for (let yy = 0; yy < raw.h; yy++) for (let xx = 0; xx < raw.w; xx++){
      if (inside(raw.x + xx, raw.y + yy)) bid[idx(raw.x + xx, raw.y + yy)] = raw.id;
    }
  }
  if (data.monster){
    G.monster = {x:data.monster.x,y:data.monster.y,life:data.monster.life,px:data.monster.x*TS,py:data.monster.y*TS,tx:data.monster.x*TS,ty:data.monster.y*TS,frame:0};
  }
  showScreen('play');
  layoutMap();
  if (data.cam){ cam.x = data.cam.x; cam.y = data.cam.y; cam.z = data.cam.z || 2; }
  settle();
  clampCam();
  updateHUD();
  renderDock();
  toast('つづきから再開します');
}

let currentMsg = null;
let hover = null;
let pointers = new Map();
let gesture = null;
let pinch = null;
const spriteCache = new Map();

function makeCanvas(w, h){
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
function painter(c){
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return function(x, y, col){
    if (!col || x < 0 || y < 0 || x >= c.width || y >= c.height) return;
    g.fillStyle = col;
    g.fillRect(x | 0, y | 0, 1, 1);
  };
}
function fill(px, x, y, w, h, col){
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) px(x + xx, y + yy, col);
}
function spr(key, w, h, draw){
  let c = spriteCache.get(key);
  if (!c){
    c = makeCanvas(w, h);
    draw(painter(c), w, h);
    spriteCache.set(key, c);
  }
  return c;
}

function drawGrass(px, v){
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++){
    const n = (x * 7 + y * 11 + v * 5) % 13;
    let c = n === 0 ? COL.grassD : n === 1 ? COL.grassL : COL.grass;
    if (v === 2 && x === 8 && y === 8) c = COL.flower;
    if (v === 3 && x === 5 && y === 11) c = COL.flower2;
    if (v === 1 && x === 12 && y === 4) c = COL.grassL;
    px(x, y, c);
  }
}
function drawWater(px, f){
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++){
    const n = Math.sin((x + f * 2) * 0.85) + Math.cos((y - f) * 0.75);
    let c = n > 0.65 ? COL.waterL : n < -0.45 ? COL.waterD : COL.water;
    if (((x * 7 + y * 5 + f * 3) % 61) === 0) c = COL.foam;
    px(x, y, c);
  }
}
function drawTree(px, v){
  const leaf = [COL.leaf, COL.leafD, '#3ea24a'][v % 3];
  const r = 5 + (v === 1 ? 0 : 1);
  const cy = 7, cx = 8;
  for (let y = 1; y <= 12; y++) for (let x = 2; x <= 13; x++){
    const dx = x - cx, dy = y - cy;
    if (dx * dx + dy * dy <= r * r + (v === 2 ? 2 : 0)){
      const edge = dx * dx + dy * dy > (r - 1.4) * (r - 1.4);
      px(x, y, edge ? COL.leafD : (x + y + v) % 5 === 0 ? COL.leafL : leaf);
    }
  }
  px(7, 11, COL.trunk); px(8, 11, '#8a5a32'); px(7, 12, COL.trunk); px(8, 12, COL.trunk);
  px(7, 13, COL.trunk); px(8, 13, COL.trunk); px(6, 14, COL.trunk); px(9, 14, COL.trunk);
}
function drawShore(px, mask){
  const sand = (x, y) => px(x, y, (x + y) % 3 === 0 ? COL.sandD : COL.sand);
  if (mask & 1) for (let y = 0; y < 3; y++) for (let x = 0; x < 16; x++) sand(x, y);
  if (mask & 4) for (let y = 13; y < 16; y++) for (let x = 0; x < 16; x++) sand(x, y);
  if (mask & 8) for (let x = 0; x < 3; x++) for (let y = 0; y < 16; y++) sand(x, y);
  if (mask & 2) for (let x = 13; x < 16; x++) for (let y = 0; y < 16; y++) sand(x, y);
}
function drawFoam(px, mask){
  const f = (x, y) => { if ((x + y) % 2 === 0) px(x, y, COL.foam); };
  if (mask & 1) for (let x = 0; x < 16; x++) f(x, 0);
  if (mask & 4) for (let x = 0; x < 16; x++) f(x, 15);
  if (mask & 8) for (let y = 0; y < 16; y++) f(0, y);
  if (mask & 2) for (let y = 0; y < 16; y++) f(15, y);
}
function drawRoad(px, mask){
  const N = mask & 1, E = mask & 2, S = mask & 4, W = mask & 8;
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++){
    const inV = x >= 5 && x <= 10 && ((y >= 5 && y <= 10) || (N && y <= 10) || (S && y >= 5));
    const inH = y >= 5 && y <= 10 && ((x >= 5 && x <= 10) || (W && x <= 10) || (E && x >= 5));
    if (!inV && !inH) continue;
    const rim = (x === 5 && !W && y >= 4 && y <= 11) || (x === 10 && !E && y >= 4 && y <= 11)
      || (y === 5 && !N && x >= 4 && x <= 11) || (y === 10 && !S && x >= 4 && x <= 11);
    px(x, y, rim ? '#3e444c' : ((x + y) % 6 === 0 ? '#80868e' : '#686e76'));
  }
  if (N && S && !E && !W){
    for (let y = 0; y < 16; y += 4){ px(7, y, COL.line); px(8, y, COL.line); px(7, y + 1, COL.line); px(8, y + 1, COL.line); }
  } else if (E && W && !N && !S){
    for (let x = 0; x < 16; x += 4){ px(x, 7, COL.line); px(x + 1, 7, COL.line); px(x, 8, COL.line); px(x + 1, 8, COL.line); }
  }
}
function drawBridge(px, mask){
  const vert = (mask & 1) || (mask & 4);
  const horiz = (mask & 2) || (mask & 8) || !vert;
  if (horiz && !vert){
    for (let y = 4; y <= 11; y++) for (let x = 0; x < 16; x++) px(x, y, y === 4 || y === 11 ? '#6b4423' : (x % 2 ? '#c4965c' : '#a67c4a'));
  } else if (vert && !horiz){
    for (let x = 4; x <= 11; x++) for (let y = 0; y < 16; y++) px(x, y, x === 4 || x === 11 ? '#6b4423' : (y % 2 ? '#c4965c' : '#a67c4a'));
  } else {
    for (let y = 4; y <= 11; y++) for (let x = 4; x <= 11; x++) px(x, y, '#b88850');
    for (let i = 0; i < 16; i++){ px(i, 4, '#6b4423'); px(i, 11, '#6b4423'); px(4, i, '#6b4423'); px(11, i, '#6b4423'); }
  }
}
function drawRail(px, mask){
  const N = mask & 1, E = mask & 2, S = mask & 4, W = mask & 8;
  const vert = N || S || (!E && !W);
  const horiz = E || W;
  if (vert){
    for (let y = 0; y < 16; y++){
      if (y % 4 === 0) for (let x = 4; x <= 11; x++) px(x, y, COL.tie);
      px(6, y, '#8e98a3'); px(9, y, '#e2e7ee');
    }
  }
  if (horiz){
    for (let x = 0; x < 16; x++){
      if (x % 4 === 0) for (let y = 4; y <= 11; y++) px(x, y, COL.tie);
      px(x, 6, '#8e98a3'); px(x, 9, '#e2e7ee');
    }
  }
}
function drawWireRoad(px, mask){
  const col = '#1c2026', hi = '#9aa3ad';
  const across = (mask & 2) || (mask & 8) || !((mask & 1) || (mask & 4));
  if (across) for (let x = 0; x < 16; x++){ px(x, 1, col); px(x, 2, hi); }
  if (mask & 1) for (let y = 0; y <= 2; y++){ px(3, y, col); px(4, y, hi); }
  if (mask & 4) for (let y = 2; y < 16; y++){ px(3, y, col); px(4, y, hi); }
}
function drawWire(px, mask){
  const col = '#24282e';
  if (mask & 1 || mask === 0) for (let y = 0; y <= 7; y++) px(7, y, col);
  if (mask & 4 || mask === 0) for (let y = 8; y < 16; y++) px(8, y, col);
  if (mask & 8) for (let x = 0; x <= 7; x++) px(x, 8, col);
  if (mask & 2) for (let x = 8; x < 16; x++) px(x, 7, col);
  px(7, 6, COL.white); px(8, 6, '#ddd');
  px(7, 7, '#333'); px(8, 7, '#333'); px(7, 8, '#333'); px(8, 8, '#333');
}
function drawRubble(px){
  fill(px, 0, 0, 16, 16, '#8d8478');
  for (let i = 0; i < 8; i++){
    const x = (i * 5 + 2) % 14, y = (i * 7 + 3) % 14;
    px(x, y, '#6a5344'); px(x + 1, y, '#c4b6a4');
  }
}
function drawWaste(px){
  fill(px, 0, 0, 16, 16, '#314028');
  fill(px, 3, 8, 4, 5, COL.waste);
  px(3, 8, INK); px(6, 8, INK); px(4, 9, '#e8f5b0'); px(5, 10, '#e8f5b0');
  fill(px, 9, 6, 4, 6, '#6a9a38');
  px(10, 7, '#d6ee9a'); px(11, 8, INK);
  px(2, 3, COL.wasteD); px(12, 12, COL.waste);
}
function drawFire(px, f){
  const cols = ['#ffd56a', '#ff8a2a', '#e23b2f', '#fff2b0'];
  for (let i = 0; i < 10; i++){
    const x = 4 + ((i * 3 + f) % 8);
    const y = 12 - ((i + f * 2) % 10);
    px(x, y, cols[(i + f) % 4]);
    px(x, y + 1, i % 2 ? '#e23b2f' : '#ff8a2a');
  }
  px(7, 4 + (f % 3), '#fff2b0'); px(8, 6, '#ffd56a');
}
function drawBolt(px){
  const s = ['..#.', '.##.', '####', '..#.', '.#..'];
  for (let y = 0; y < s.length; y++) for (let x = 0; x < 4; x++) if (s[y][x] === '#') px(x, y, '#ffe56a');
}
const FONT5 = {
  R: ['#..#.', '#..#.', '####.', '#..#.', '#..#.'],
  C: ['.####', '#....', '#....', '#....', '.####'],
  I: ['#####', '..#..', '..#..', '..#..', '#####']
};
function drawLetter(px, ch, ox, oy, col, s){
  const rows = FONT5[ch];
  if (!rows) return;
  for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++){
    if (rows[y][x] === '#') fill(px, ox + x * s, oy + y * s, s, s, col);
  }
}
function house(px, x, y, roof, wall){
  for (let i = 2; i <= 10; i++) px(x + i, y + 11, 'rgba(20,40,20,.45)');
  for (let yy = 5; yy <= 10; yy++) for (let xx = 2; xx <= 10; xx++){
    const e = xx === 2 || xx === 10 || yy === 10;
    let c = e ? INK : wall;
    if (!e && yy >= 8 && yy <= 9 && (xx === 6 || xx === 7)) c = COL.door;
    px(x + xx, y + yy, c);
  }
  [[5, 7], [4, 8], [3, 9], [2, 10], [2, 10]].forEach((rg, ri) => {
    for (let xx = rg[0]; xx <= rg[1]; xx++){
      const e = xx === rg[0] || xx === rg[1] || ri === 0;
      px(x + xx, y + ri, e ? INK : roof);
    }
  });
  px(x + 4, y + 6, COL.win); px(x + 5, y + 6, COL.winL); px(x + 4, y + 7, COL.win);
  px(x + 8, y + 6, COL.win); px(x + 8, y + 7, COL.winL);
  px(x + 7, y + 9, COL.gold);
}
function twoStory(px, x, y, roof, wall){
  fill(px, x, y + 4, 14, 12, INK);
  fill(px, x + 1, y + 5, 12, 10, wall);
  fill(px, x + 1, y + 1, 12, 4, roof);
  px(x + 1, y + 1, INK); px(x + 12, y + 1, INK);
  for (let i = 0; i < 12; i++) px(x + 1 + i, y, i % 2 ? roof : INK);
  for (let yy = 0; yy < 2; yy++) for (let xx = 0; xx < 3; xx++){
    px(x + 3 + xx * 4, y + 6 + yy, COL.win);
    px(x + 3 + xx * 4, y + 10 + yy, yy === 0 && xx === 1 ? COL.winL : COL.win);
  }
  fill(px, x + 6, y + 12, 3, 4, COL.door);
}
function apartment(px, x, y, w, h, wall, roof, lit){
  fill(px, x, y, w, h, INK);
  fill(px, x + 1, y + 3, w - 2, h - 4, wall);
  fill(px, x + 1, y + 1, w - 2, 2, roof);
  for (let yy = y + 5; yy < y + h - 3; yy += 4) for (let xx = x + 2; xx < x + w - 3; xx += 4){
    const on = lit && ((xx + yy) % 8 === 0);
    px(xx, yy, on ? COL.winL : COL.win); px(xx + 1, yy, COL.win);
    px(xx, yy + 1, COL.win); px(xx + 1, yy + 1, on ? COL.winL : COL.win);
  }
  fill(px, x + (w >> 1) - 1, y + h - 5, 3, 4, COL.door);
}
function shop(px, x, y, wall, awn){
  fill(px, x, y + 4, 16, 11, INK);
  fill(px, x + 1, y + 5, 14, 9, wall);
  for (let i = 0; i < 16; i++) px(x + i, y + 4, i % 2 ? awn : COL.white);
  fill(px, x + 2, y + 6, 6, 4, COL.glass);
  fill(px, x + 10, y + 8, 3, 5, COL.door);
  px(x + 3, y + 7, COL.winL);
}
function tower(px, x, y, w, h, glass, lit){
  fill(px, x, y, w, h, INK);
  fill(px, x + 1, y + 2, w - 2, h - 3, glass);
  fill(px, x + 1, y + 1, w - 2, 2, COL.metalD);
  for (let yy = y + 4; yy < y + h - 2; yy += 3) for (let xx = x + 2; xx < x + w - 2; xx += 3){
    px(xx, yy, lit && ((xx * 3 + yy) % 11 === 0) ? COL.winL : '#16324a');
  }
  px(x + (w >> 1), y - 1 < 0 ? 0 : y, COL.gold);
}
function factory(px, w, h, dens){
  const base = (x, y, c) => px(x, y, c);
  fill(base, 0, 0, w, h, COL.grass);
  fill(base, 2, 18, w - 4, h - 20, '#5c656e');
  fill(base, 4, 8, 22, 28, COL.brick);
  for (let x = 4; x < 26; x += 4) base(x, 8, COL.brickD);
  fill(base, 8, 16, 6, 8, '#243044');
  fill(base, 28, 20, 14, 16, '#6e7680');
  const stacks = dens >= 3 ? [6, 30] : [10];
  for (const sx of stacks){
    fill(base, sx, 2, 4, 16, INK);
    fill(base, sx + 1, 3, 2, 14, '#8a9098');
    fill(base, sx - 1, 2, 6, 2, INK);
  }
  if (dens >= 2){
    for (let yy = -5; yy <= 5; yy++) for (let xx = -5; xx <= 5; xx++){
      if (xx * xx + yy * yy <= 22) base(40 + xx, 16 + yy, xx * xx + yy * yy > 14 ? INK : '#8a939c');
    }
  }
  fill(base, 6, h - 10, 8, 6, '#3a4048');
}
function plaza(px, w, h){
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    px(x, y, (x + y) & 1 ? '#6a645c' : '#7c756c');
  }
}
function grassBase(px, w, h){
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    const n = (x * 13 + y * 7) % 17;
    px(x, y, n === 0 ? '#3f8d34' : n === 1 ? '#6cbc52' : '#4ea344');
  }
}
function drawBuilding(px, w, h, b, frame, lit){
  const t = b.type, d = b.dens | 0;
  if (t === 'R' || t === 'C' || t === 'I'){
    if (d === 0){
      const a = t === 'R' ? ['#3d8f3a', '#8ed07a'] : t === 'C' ? ['#2c649e', '#8ec4ea'] : ['#c48a28', '#f0d48a'];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px(x, y, ((x + y) & 1) ? a[0] : a[1]);
      drawLetter(px, t === 'R' ? 'R' : t === 'C' ? 'C' : 'I', 14, 16, INK, 3);
      return;
    }
  }
  if (t === 'R'){
    grassBase(px, w, h);
    const roofs = [COL.roofR, COL.roofB, COL.roofG, COL.roofO, COL.roofT];
    if (d === 1){
      house(px, 2, 4, roofs[0], COL.wall);
      house(px, 26, 3, roofs[1], '#f7f0e2');
      house(px, 6, 28, roofs[2], COL.wall);
      house(px, 28, 26, roofs[3], '#efe4cc');
    } else if (d === 2){
      house(px, 1, 2, roofs[0], COL.wall);
      house(px, 18, 1, roofs[1], COL.wall);
      house(px, 33, 3, roofs[4], COL.wall);
      twoStory(px, 2, 24, roofs[2], '#f6edd8');
      house(px, 22, 30, roofs[3], COL.wall);
      house(px, 34, 28, roofs[0], COL.wall);
    } else if (d >= 3 && b.variant === 1){
      grassBase(px, w, h);
      apartment(px, 4, 12, 40, 32, '#f4e7c8', COL.roofR, lit);
      fill(px, 14, 2, 20, 12, COL.white);
      fill(px, 14, 2, 20, 3, COL.police);
      fill(px, 22, 6, 4, 6, COL.police);
    } else if (d >= 3 && b.variant === 2){
      grassBase(px, w, h);
      apartment(px, 8, 4, 32, 40, '#f7f4ee', COL.roofB, lit);
      fill(px, 20, 16, 8, 8, '#d24b3e');
      fill(px, 22, 18, 4, 4, COL.white);
    } else if (d >= 3 && b.variant === 3){
      grassBase(px, w, h);
      house(px, 4, 26, COL.roofR, COL.wall);
      fill(px, 20, 8, 12, 28, COL.wall);
      fill(px, 18, 6, 16, 4, COL.roofB);
      fill(px, 24, 0, 4, 8, COL.roofB);
      px(24, 1, INK); px(27, 1, INK); px(25, 0, INK); px(26, 0, INK);
      px(25, 2, COL.gold); px(26, 2, COL.gold); px(25, 3, COL.gold); px(26, 3, COL.gold);
    } else {
      grassBase(px, w, h);
      tower(px, 16, 2, 18, 40, '#d7c4a4', lit);
      house(px, 1, 30, roofs[0], COL.wall);
      house(px, 34, 32, roofs[1], COL.wall);
    }
    return;
  }
  if (t === 'C'){
    if (d <= 1) grassBase(px, w, h);
    else plaza(px, w, h);
    if (d <= 1){
      shop(px, 2, 6, '#f4d7c4', COL.roofR);
      shop(px, 20, 16, COL.wall, COL.roofB);
      shop(px, 6, 28, '#f7e7a8', COL.roofO);
    } else if (d === 2){
      twoStory(px, 2, 4, COL.roofB, '#e7eef6');
      twoStory(px, 20, 8, COL.glassD, COL.wall);
      shop(px, 30, 30, COL.wall, COL.roofR);
    } else if (d === 3){
      apartment(px, 4, 6, 18, 36, '#d5e4f2', COL.glassD, lit);
      apartment(px, 26, 10, 18, 32, '#f4f7fb', COL.roofB, lit);
    } else {
      tower(px, 14, 2, 20, 44, COL.glass, lit);
      fill(px, 4, 28, 10, 16, COL.metal);
      fill(px, 34, 30, 10, 14, COL.glassD);
    }
    return;
  }
  if (t === 'I'){ factory(px, w, h, d); return; }
  if (t === 'park'){
    grassBase(px, 16, 16);
    drawTree(px, b.variant);
    if (b.variant === 1){ px(3, 12, COL.flower); px(4, 12, COL.flower2); px(12, 13, COL.flower); }
    return;
  }
  if (t === 'coal'){
    fill(px, 0, 0, w, h, '#5a6358');
    fill(px, 6, 18, 36, 40, COL.brick);
    for (let x = 6; x < 42; x += 6) px(x, 18, COL.brickD);
    fill(px, 10, 28, 16, 18, '#3a4048');
    fill(px, 30, 34, 10, 16, COL.coal);
    fill(px, 14, 6, 8, 28, INK);
    fill(px, 16, 8, 4, 24, '#9aa0a6');
    fill(px, 12, 4, 12, 4, INK);
    fill(px, 44, 24, 14, 22, '#4e555c');
    fill(px, 4, 48, 20, 10, COL.coal);
    return;
  }
  if (t === 'nuke'){
    fill(px, 0, 0, w, h, '#d5e2d4');
    fill(px, 4, 28, 56, 30, COL.white);
    for (let yy = -16; yy <= 16; yy++) for (let xx = -16; xx <= 16; xx++){
      if (xx * xx + yy * yy <= 16 * 16) px(24 + xx, 24 + yy, xx * xx + yy * yy > 196 ? INK : '#d7fff8');
    }
    fill(px, 40, 10, 10, 36, '#cfd8dc');
    fill(px, 38, 8, 14, 4, COL.metal);
    fill(px, 8, 40, 12, 10, '#7fd1c8');
    return;
  }
  if (t === 'police' || t === 'polhq'){
    grassBase(px, w, h);
    const bw = t === 'polhq' ? 40 : 34;
    fill(px, 6, 10, bw, 32, COL.police);
    fill(px, 6, 10, bw, 6, '#1d356e');
    fill(px, 18, 28, 10, 14, COL.door);
    px(22, 20, COL.gold); px(23, 20, COL.gold); px(21, 21, COL.gold); px(24, 21, COL.gold); px(22, 22, COL.gold); px(23, 22, COL.gold);
    if (t === 'polhq') fill(px, 8, 4, 8, 8, COL.gold);
    return;
  }
  if (t === 'fire' || t === 'firehq'){
    grassBase(px, w, h);
    fill(px, 4, 12, 40, 30, COL.fire);
    fill(px, 8, 26, 14, 16, '#f2d2a8');
    fill(px, 26, 26, 14, 16, '#f2d2a8');
    fill(px, 30, 4, 6, 16, '#f7f4ee');
    px(32, 2, COL.gold); px(33, 2, COL.gold);
    if (t === 'firehq') fill(px, 8, 6, 16, 8, COL.gold);
    return;
  }
  if (t === 'stadium'){
    fill(px, 0, 0, w, h, '#6b5344');
    fill(px, 6, 6, w - 12, h - 12, '#3f9a45');
    for (let x = 10; x < w - 10; x += 4) px(x, (h >> 1), COL.white);
    fill(px, (w >> 1) - 1, 8, 2, h - 16, 'rgba(255,255,255,.8)');
    if ((b.variant || 0) % 2 === 0){
      px(w >> 1, 14, COL.white); px((w >> 1) + 4, 20, COL.sand);
    }
    return;
  }
  if (t === 'port'){
    fill(px, 0, 0, w, h, '#1e4f8c');
    fill(px, 0, 0, 28, h, '#8d8478');
    fill(px, 8, 8, 8, 40, COL.brick);
    fill(px, 20, 20, 6, 28, '#c9a06a');
    fill(px, 30, 36, 26, 8, '#d7dde4');
    fill(px, 34, 30, 10, 6, COL.roofR);
    fill(px, 48, 8, 4, 28, '#6e7680');
    return;
  }
  if (t === 'air'){
    fill(px, 0, 0, w, h, '#7d868e');
    fill(px, 8, 40, 80, 14, '#c5ccd4');
    for (let x = 12; x < 80; x += 10) fill(px, x, 44, 5, 4, COL.white);
    fill(px, 8, 8, 36, 22, COL.glass);
    fill(px, 40, 4, 6, 24, COL.white);
    fill(px, 38, 4, 10, 5, COL.glassD);
    fill(px, 60, 48, 18, 6, COL.roofR);
    return;
  }
  if (t === 'house'){
    grassBase(px, w, h);
    const fancy = G.rankId === 'capital' || G.rankId === 'metro' || G.rankId === 'mega';
    twoStory(px, 8, 8, fancy ? COL.gold : COL.roofR, COL.wall);
    if (fancy) fill(px, 4, 4, 8, 10, COL.roofB);
    house(px, 28, 26, COL.roofG, COL.wall);
    return;
  }
  if (t === 'bank'){
    grassBase(px, w, h);
    fill(px, 6, 16, 36, 28, '#e7d7b0');
    for (let i = 0; i < 4; i++) fill(px, 10 + i * 8, 20, 3, 18, COL.white);
    fill(px, 18, 10, 12, 6, COL.gold);
    return;
  }
  if (t === 'lib'){
    grassBase(px, w, h);
    fill(px, 6, 14, 36, 28, COL.brick);
    fill(px, 10, 20, 28, 12, COL.win);
    fill(px, 20, 8, 8, 8, COL.roofR);
    return;
  }
  if (t === 'bigpark'){
    grassBase(px, w, h);
    drawTree(px, 0); 
    const px2 = (x, y, c) => px(x + 20, y + 8, c);
    drawTree(px2, 1);
    fill(px, 8, 28, 14, 10, COL.water);
    px(10, 30, COL.foam); px(16, 32, COL.foam);
    return;
  }
  if (t === 'amuse'){
    grassBase(px, w, h);
    const rot = frame % 2;
    for (let i = 0; i < 8; i++){
      const a = (i / 8) * Math.PI * 2 + (rot ? 0.3 : 0);
      const x = 24 + Math.round(Math.cos(a) * 12);
      const y = 18 + Math.round(Math.sin(a) * 8);
      px(x, y, i % 2 ? COL.roofR : COL.gold);
    }
    fill(px, 22, 18, 4, 20, '#6e7680');
    fill(px, 6, 30, 10, 12, COL.roofB);
    return;
  }
  if (t === 'casino'){
    fill(px, 0, 0, w, h, '#24183a');
    fill(px, 8, 16, 32, 26, '#3a2060');
    const on = frame % 2 === 0;
    fill(px, 12, 8, 24, 8, on ? '#e85ad0' : COL.gold);
    px(16, 22, COL.gold); px(24, 22, COL.white); px(30, 28, COL.roofR);
    return;
  }
  if (t === 'zoo'){
    grassBase(px, w, h);
    fill(px, 6, 20, 36, 20, COL.brick);
    fill(px, 18, 8, 4, 16, '#e6c15a');
    fill(px, 16, 6, 8, 4, '#f2d48a');
    px(17, 7, INK); px(22, 7, INK);
    fill(px, 8, 28, 8, 6, COL.white);
    return;
  }
  if (t === 'station'){
    grassBase(px, w, h);
    fill(px, 4, 18, 40, 22, COL.brick);
    fill(px, 2, 14, 44, 6, COL.roofB);
    fill(px, 8, 28, 32, 4, '#444');
    return;
  }
  if (t === 'fountain'){
    grassBase(px, w, h);
    for (let yy = -8; yy <= 8; yy++) for (let xx = -8; xx <= 8; xx++){
      if (xx * xx + yy * yy <= 60) px(24 + xx, 28 + yy, COL.water);
    }
    const hgt = 6 + (frame % 2 ? 4 : 0);
    fill(px, 23, 28 - hgt, 2, hgt, COL.waterL);
    px(22, 26 - hgt, COL.foam); px(25, 25 - hgt, COL.foam);
    return;
  }
  if (t === 'expo'){
    grassBase(px, w, h);
    for (let yy = -14; yy <= 10; yy++) for (let xx = -16; xx <= 16; xx++){
      if (xx * xx / 2 + yy * yy < 120 && yy > -8) px(24 + xx, 24 + yy, yy < -4 ? COL.white : COL.glass);
    }
    fill(px, 8, 30, 32, 10, COL.white);
    return;
  }
  if (t === 'tower'){
    grassBase(px, w, h);
    fill(px, 20, 6, 8, 36, COL.brick);
    fill(px, 16, 4, 16, 6, COL.roofR);
    fill(px, 22, 16, 4, 4, COL.winL);
    return;
  }
  if (t === 'statue'){
    grassBase(px, w, h);
    fill(px, 14, 28, 20, 8, COL.metal);
    fill(px, 20, 12, 8, 18, COL.gold);
    fill(px, 18, 8, 12, 6, COL.gold);
    px(22, 10, INK); px(26, 10, INK);
    return;
  }
  if (t === 'mill'){
    grassBase(px, w, h);
    fill(px, 20, 16, 12, 26, COL.wall);
    fill(px, 18, 12, 16, 8, COL.roofR);
    const a = frame % 2 ? 0.6 : 0;
    for (let i = 0; i < 4; i++){
      const ang = a + i * Math.PI / 2;
      for (let k = 1; k < 12; k++) px(26 + Math.round(Math.cos(ang) * k), 16 + Math.round(Math.sin(ang) * k), COL.white);
    }
    return;
  }
  grassBase(px, w, h);
  fill(px, 4, 4, w - 8, h - 8, COL.wall);
}
function buildingSprite(b, frame){
  const anim = (b.type === 'mill' || b.type === 'fountain' || b.type === 'amuse' || b.type === 'casino') ? (frame & 1) : 0;
  const lit = (b.type === 'C' || b.type === 'R') && b.dens >= 3 ? (frame & 1) : 0;
  const rank = b.type === 'house' ? G.rankId : '';
  const key = [b.type, b.dens | 0, b.variant | 0, anim, lit, rank, b.w, b.h].join(':');
  return spr(key, b.w * TS, b.h * TS, (px, w, h) => drawBuilding(px, w, h, b, anim, lit));
}
function tileSprite(kind, n){
  const size = 16;
  if (kind === 'grass') return spr('grass' + n, size, size, px => drawGrass(px, n));
  if (kind === 'water') return spr('water' + n, size, size, px => drawWater(px, n));
  if (kind === 'tree') return spr('tree' + n, size, size, px => drawTree(px, n));
  if (kind === 'shore') return spr('shore' + n, size, size, px => drawShore(px, n));
  if (kind === 'foam') return spr('foam' + n, size, size, px => drawFoam(px, n));
  if (kind === 'road') return spr('road' + n, size, size, px => drawRoad(px, n));
  if (kind === 'bridge') return spr('bridge' + n, size, size, px => drawBridge(px, n));
  if (kind === 'rail') return spr('rail' + n, size, size, px => drawRail(px, n));
  if (kind === 'wire') return spr('wire' + n, size, size, px => drawWire(px, n));
  if (kind === 'wireRoad') return spr('wireRoad' + n, size, size, px => drawWireRoad(px, n));
  if (kind === 'rubble') return spr('rubble', size, size, px => drawRubble(px));
  if (kind === 'waste') return spr('waste', size, size, px => drawWaste(px));
  if (kind === 'fire') return spr('fire' + n, size, size, px => drawFire(px, n));
  if (kind === 'bolt') return spr('bolt', 8, 8, px => drawBolt(px));
  return null;
}
function neighborMask(x, y, pred){
  let m = 0;
  if (y > 0 && pred(x, y - 1)) m |= 1;
  if (x < W - 1 && pred(x + 1, y)) m |= 2;
  if (y < H - 1 && pred(x, y + 1)) m |= 4;
  if (x > 0 && pred(x - 1, y)) m |= 8;
  return m;
}
function monsterSprite(frame){
  return spr('mogu' + frame, 32, 32, (px) => {
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++){
      const dx = x - 16, dy = y - 18;
      if (dx * dx + dy * dy < 100) px(x, y, dx * dx + dy * dy > 70 ? '#5a3480' : COL.purple);
      if (dx * dx / 2 + (dy - 2) * (dy - 2) < 28 && y > 16) px(x, y, COL.belly);
    }
    px(11, 14, INK); px(12, 14, COL.white); px(20, 14, INK); px(21, 14, COL.white);
    px(16, 12, '#f2c9a0'); px(16, 11, '#f2c9a0'); px(15, 10, '#e0a070');
    const foot = frame ? 2 : 0;
    fill(px, 8, 26 + (frame ? 0 : 1), 5, 3, '#5a3480');
    fill(px, 18, 26 + foot, 5, 3, '#5a3480');
    px(6, 20, COL.belly); px(25, 19, COL.belly);
  });
}
function planeSprite(){
  return spr('plane', 14, 10, (px) => {
    fill(px, 2, 4, 10, 2, COL.white);
    fill(px, 6, 1, 2, 8, COL.roofR);
    px(11, 4, COL.win); px(12, 4, COL.glass);
  });
}
function drawFace(annoy, blink){
  const c = $('face');
  if (!c) return;
  const px = painter(c);
  fill(px, 0, 0, 48, 48, '#1c2633');
  fill(px, 6, 36, 36, 12, '#2f6b4f');
  fill(px, 18, 33, 12, 5, '#f3e2c4');
  fill(px, 12, 10, 24, 22, '#2a211c');
  for (let y = 14; y < 34; y++) for (let x = 16; x < 32; x++){
    const dx = x - 24, dy = y - 24;
    if (dx * dx + dy * dy < 78) px(x, y, '#f0c8a0');
  }
  fill(px, 14, 12, 20, 6, '#2a211c');
  fill(px, 14, 16, 3, 8, '#2a211c');
  fill(px, 31, 16, 3, 8, '#2a211c');
  if (!blink){
    fill(px, 18, 22, 3, 2, INK);
    fill(px, 27, 22, 3, 2, INK);
    px(18, 22, COL.white); px(27, 22, COL.white);
  } else {
    fill(px, 18, 23, 3, 1, '#c09070');
    fill(px, 27, 23, 3, 1, '#c09070');
  }
  if (annoy){
    px(18, 20, INK); px(19, 21, INK); px(20, 21, INK);
    px(27, 20, INK); px(28, 21, INK); px(29, 21, INK);
    px(21, 29, INK); px(22, 29, INK); px(23, 29, INK); px(24, 29, INK);
  } else {
    px(21, 28, INK); px(22, 29, '#d25b6a'); px(23, 29, '#d25b6a'); px(24, 28, INK);
  }
  px(17, 26, '#e8a0a0'); px(29, 26, '#e8a0a0');
}

function layoutMap(){
  const canvas = $('map');
  if (!canvas) return;
  const r = canvas.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.round(r.width * dpr));
  const h = Math.max(1, Math.round(r.height * dpr));
  if (canvas.width !== w || canvas.height !== h){ canvas.width = w; canvas.height = h; }
}
function clampCam(){
  const canvas = $('map');
  if (!canvas) return;
  const vw = canvas.clientWidth / cam.z;
  const vh = canvas.clientHeight / cam.z;
  const maxX = W * TS - vw, maxY = H * TS - vh;
  cam.x = maxX < 0 ? maxX / 2 : clamp(cam.x, 0, maxX);
  cam.y = maxY < 0 ? maxY / 2 : clamp(cam.y, 0, maxY);
}
function centerOn(tx, ty){
  const canvas = $('map');
  if (!canvas || !canvas.clientWidth) return;
  cam.x = tx * TS - canvas.clientWidth / cam.z / 2;
  cam.y = ty * TS - canvas.clientHeight / cam.z / 2;
  clampCam();
}
function centerOnLand(){
  let sx = 0, sy = 0, n = 0;
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2){
    if (ground[idx(x, y)] !== WATER){ sx += x; sy += y; n++; }
  }
  centerOn(n ? sx / n : W / 2, n ? sy / n : H / 2);
}
function screenToWorld(cx, cy){
  const r = $('map').getBoundingClientRect();
  return {x: (cx - r.left) / cam.z + cam.x, y: (cy - r.top) / cam.z + cam.y};
}
function screenToTile(cx, cy){
  const p = screenToWorld(cx, cy);
  return {x: Math.floor(p.x / TS), y: Math.floor(p.y / TS)};
}
function setZoom(z, cx, cy){
  z = clamp(z | 0, 1, 3);
  const canvas = $('map');
  if (!canvas.clientWidth){ cam.z = z; return; }
  const r = canvas.getBoundingClientRect();
  const ax = cx == null ? r.left + r.width / 2 : cx;
  const ay = cy == null ? r.top + r.height / 2 : cy;
  const before = screenToWorld(ax, ay);
  cam.z = z;
  cam.x = before.x - (ax - r.left) / cam.z;
  cam.y = before.y - (ay - r.top) / cam.z;
  clampCam();
  updateChip();
}

function heatColor(t){
  t = clamp(t, 0, 1);
  const r = t < 0.5 ? Math.round(80 + 175 * (t * 2)) : 255;
  const g = t < 0.5 ? Math.round(170 - 40 * t) : Math.round(180 * (1 - (t - 0.5) * 2));
  return 'rgba(' + r + ',' + g + ',48,0.5)';
}
function draw(){
  const play = $('screen-play');
  if (!play || play.hidden){
    if ($('screen-title') && !$('screen-title').hidden) paintPostcard();
    return;
  }
  const canvas = $('map');
  layoutMap();
  if (G.needCenter && canvas.clientWidth){
    G.needCenter = false;
    if (G._focus) centerOn(G._focus.x, G._focus.y);
    else centerOnLand();
  }
  if (!canvas.clientWidth) return;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const dpr = canvas.width / canvas.clientWidth;
  let sx = 0, sy = 0;
  if ((G.shake || 0) > 0 && !reduced){
    sx = (Math.random() - 0.5) * G.shake * 8;
    sy = (Math.random() - 0.5) * G.shake * 6;
    G.shake *= 0.9;
    if (G.shake < 0.04) G.shake = 0;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#16345f';
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  ctx.setTransform(dpr * cam.z, 0, 0, dpr * cam.z, (-cam.x + sx) * dpr * cam.z, (-cam.y + sy) * dpr * cam.z);
  const viewW = canvas.clientWidth / cam.z, viewH = canvas.clientHeight / cam.z;
  const x0 = Math.max(0, Math.floor(cam.x / TS) - 6);
  const y0 = Math.max(0, Math.floor(cam.y / TS) - 6);
  const x1 = Math.min(W - 1, Math.ceil((cam.x + viewW) / TS) + 1);
  const y1 = Math.min(H - 1, Math.ceil((cam.y + viewH) / TS) + 1);
  const wf = Math.floor(anim * 3) % 4;
  const ff = Math.floor(anim * 8) % 4;
  const isWater = (x, y) => ground[idx(x, y)] === WATER;
  const isLand = (x, y) => ground[idx(x, y)] !== WATER;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++){
    const i = idx(x, y);
    const gnd = ground[i];
    if (gnd === WATER) ctx.drawImage(tileSprite('water', (wf + x + y) % 4), x * TS, y * TS);
    else ctx.drawImage(tileSprite('grass', (x * 3 + y) & 3), x * TS, y * TS);
    if (gnd !== WATER){
      const sm = neighborMask(x, y, isWater);
      if (sm && bid[i] < 0) ctx.drawImage(tileSprite('shore', sm), x * TS, y * TS);
    } else {
      const fm = neighborMask(x, y, isLand);
      if (fm) ctx.drawImage(tileSprite('foam', fm), x * TS, y * TS);
    }
    if (gnd === TREE && bid[i] < 0 && !road[i]) ctx.drawImage(tileSprite('tree', (x + y) % 3), x * TS, y * TS);
    if (gnd === RUBBLE && bid[i] < 0) ctx.drawImage(tileSprite('rubble', 0), x * TS, y * TS);
    if (gnd === WASTE && bid[i] < 0) ctx.drawImage(tileSprite('waste', 0), x * TS, y * TS);
    if (road[i] && bid[i] < 0){
      const m = neighborMask(x, y, (X, Y) => road[idx(X, Y)] && bid[idx(X, Y)] < 0);
      ctx.drawImage(tileSprite(gnd === WATER ? 'bridge' : 'road', m), x * TS, y * TS);
      if (traffic[i] >= 10 && gnd !== WATER && ((x + y) % 2 === 0)){
        const o = Math.floor(anim * 18 + x * 3) % 12;
        ctx.fillStyle = (x + y) % 3 === 0 ? '#d24b3e' : '#3c6ec0';
        if (m & 1 || m & 4) ctx.fillRect(x * TS + 6, y * TS + o, 3, 4);
        else ctx.fillRect(x * TS + o, y * TS + 6, 4, 3);
      }
    }
    if (rail[i] && bid[i] < 0){
      const m = neighborMask(x, y, (X, Y) => rail[idx(X, Y)]);
      ctx.drawImage(tileSprite('rail', m), x * TS, y * TS);
    }
    if (wire[i] && bid[i] < 0){
      const onRoad = road[i] || rail[i];
      const m = neighborMask(x, y, (X, Y) => wire[idx(X, Y)] || (!onRoad && bid[idx(X, Y)] >= 0));
      ctx.drawImage(tileSprite(onRoad ? 'wireRoad' : 'wire', m), x * TS, y * TS);
    }
    if (flood[i]){
      ctx.fillStyle = 'rgba(80,160,230,.35)';
      ctx.fillRect(x * TS, y * TS + 8, TS, 8);
    }
  }
  const frame = Math.floor(anim * 2);
  for (const b of buildings){
    if (!b || !b.alive) continue;
    if (b.x + b.w < x0 || b.y + b.h < y0 || b.x > x1 || b.y > y1) continue;
    ctx.drawImage(buildingSprite(b, frame), b.x * TS, b.y * TS);
    if (SPEC[b.type].zone && !b.powered && (frame % 2 === 0)){
      ctx.drawImage(tileSprite('bolt', 0), b.x * TS + (b.w * TS >> 1) - 4, b.y * TS + 2);
    }
    if ((b.type === 'coal' || (b.type === 'I' && b.dens >= 2))){
      const origins = b.type === 'coal' ? [[18, 8], [48, 20]] : [[12, 6], [32, 4]];
      ctx.fillStyle = 'rgba(230,234,236,.9)';
      origins.forEach((o, k) => {
        if (b.type === 'I' && b.dens < 3 && k > 0) return;
        const puff = (Math.floor(anim * 6) + k * 3) % 10;
        ctx.fillRect(b.x * TS + o[0], b.y * TS + o[1] - puff, 3, 2);
        ctx.fillRect(b.x * TS + o[0] + 2, b.y * TS + o[1] - puff - 3, 2, 2);
      });
    }
  }
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++){
    if (fire[idx(x, y)] > 0) ctx.drawImage(tileSprite('fire', ff), x * TS, y * TS);
  }
  if (G.overlay && G.overlay !== 'none') drawOverlay(ctx, x0, y0, x1, y1);
  if (G.hl){
    ctx.strokeStyle = '#fff6c8';
    ctx.lineWidth = 1;
    ctx.strokeRect(G.hl.x * TS + 0.5, G.hl.y * TS + 0.5, G.hl.w * TS - 1, G.hl.h * TS - 1);
  }
  if (hover && G.tool !== 'hand'){
    const ok = hover.eval && hover.eval.ok;
    ctx.globalAlpha = 0.55;
    if (G.tool !== 'query' && G.tool !== 'bulldoze'){
      const fake = {type: toolSpec(G.tool) ? toolSpec(G.tool).kind : 'park', dens:0, variant:0, w:hover.w, h:hover.h, x:0, y:0};
      if (SPEC[fake.type] || fake.type === 'road'){
        if (SPEC[fake.type]) ctx.drawImage(buildingSprite(fake, frame), hover.x * TS, hover.y * TS);
      }
    }
    ctx.fillStyle = ok ? 'rgba(125,222,160,.45)' : 'rgba(239,91,91,.45)';
    ctx.fillRect(hover.x * TS, hover.y * TS, hover.w * TS, hover.h * TS);
    ctx.globalAlpha = 1;
  }
  drawActors(ctx);
  if (G.sheet === 'map') paintMinimap();
  updateChip();
}
function drawOverlay(ctx, x0, y0, x1, y1){
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++){
    const i = idx(x, y);
    let t = null;
    if (G.overlay === 'power'){
      if (bid[i] >= 0 && buildings[bid[i]] && SPEC[buildings[bid[i]].type].zone) t = buildings[bid[i]].powered ? 0.1 : 0.9;
      else if (wire[i]) t = poweredNet[i] ? 0.15 : 0.55;
    } else if (G.overlay === 'traffic' && road[i]) t = traffic[i] / 40;
    else if (G.overlay === 'pol') t = poll[i] / 180;
    else if ((G.overlay === 'crime' || G.overlay === 'lv') && bid[i] >= 0){
      const b = buildings[bid[i]];
      if (b && SPEC[b.type].zone) t = G.overlay === 'crime' ? b.crime / 100 : 1 - b.lv / 100;
    } else if (G.overlay === 'fire' || G.overlay === 'police'){
      if (bid[i] >= 0 && buildings[bid[i]] && SPEC[buildings[bid[i]].type].zone){
        const b = buildings[bid[i]];
        const cov = coverOf(b, buildings.filter(s => s && s.alive && SPEC[s.type].service === (G.overlay === 'fire' ? 'fire' : 'police')), G.overlay === 'fire' ? 'fire' : 'police');
        t = 1 - clamp(cov / 70, 0, 1);
      }
    }
    if (t == null) continue;
    ctx.fillStyle = heatColor(t);
    ctx.fillRect(x * TS, y * TS, TS, TS);
  }
}
function drawActors(ctx){
  const ease = (e) => { if (!e) return; e.px += (e.tx - e.px) * 0.2; e.py += (e.ty - e.py) * 0.2; };
  if (G.monster){
    ease(G.monster);
    ctx.drawImage(monsterSprite(Math.floor(anim * 4) % 2), G.monster.px - 8, G.monster.py - 18);
  }
  if (G.tornado){
    ease(G.tornado);
    const f = Math.floor(anim * 10);
    ctx.fillStyle = 'rgba(230,230,236,.85)';
    for (let i = 0; i < 8; i++){
      const a = f + i;
      ctx.fillRect(G.tornado.px + Math.cos(a) * (6 + i), G.tornado.py + i * 2, 3, 3);
    }
  }
  if (G.ufo){
    ease(G.ufo);
    ctx.fillStyle = '#d7dde8';
    ctx.fillRect(G.ufo.px, G.ufo.py, 18, 6);
    ctx.fillStyle = '#8ec8ee';
    ctx.fillRect(G.ufo.px + 5, G.ufo.py - 4, 8, 5);
    ctx.fillStyle = 'rgba(255,220,80,.35)';
    ctx.fillRect(G.ufo.px + 6, G.ufo.py + 6, 4, 28);
  }
  if (G.crash){
    ease(G.crash);
    ctx.drawImage(planeSprite(), G.crash.px, G.crash.py);
  } else if (hasType('air')){
    const p = (anim * 36) % (W * TS + 30) - 20;
    ctx.drawImage(planeSprite(), p, 24 + Math.sin(anim) * 10);
  }
  if (hasType('air') && !G.crash){
    const ang = anim * 0.45;
    ctx.fillStyle = '#d24b3e';
    ctx.fillRect(W * TS / 2 + Math.cos(ang) * 70, H * TS / 2 + Math.sin(ang) * 40, 6, 3);
  }
  for (let i = G.fx.length - 1; i >= 0; i--){
    const f = G.fx[i];
    f.t += 0.016;
    const r = 4 + f.t * 18;
    ctx.fillStyle = f.t < 0.3 ? '#ffe08a' : '#e23b2f';
    ctx.globalAlpha = Math.max(0, 1 - f.t / f.life);
    ctx.fillRect(f.x - r / 2, f.y - r / 2, r, r);
    ctx.globalAlpha = 1;
    if (f.t > f.life) G.fx.splice(i, 1);
  }
}
function paintPostcard(){
  const c = $('postcard');
  if (!c) return;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#8ec8ee';
  ctx.fillRect(0, 0, 240, 132);
  ctx.fillStyle = '#f6e7a0';
  ctx.fillRect(200, 8, 10, 10);
  const wf = Math.floor(anim * 3) % 4;
  for (let y = 0; y < 5; y++) for (let x = 0; x < 15; x++){
    ctx.drawImage(tileSprite('grass', (x + y) & 3), x * 16, 36 + y * 16);
  }
  for (let x = 0; x < 15; x++){
    ctx.drawImage(tileSprite('shore', 4), x * 16, 36 + 64);
    ctx.drawImage(tileSprite('water', wf), x * 16, 36 + 80);
  }
  ctx.drawImage(tileSprite('tree', 0), 4, 40);
  ctx.drawImage(tileSprite('tree', 2), 208, 44);
  for (let x = 1; x < 14; x++) ctx.drawImage(tileSprite('road', x === 1 ? 2 : x === 13 ? 8 : 10), x * 16, 84);
  ctx.drawImage(buildingSprite({type:'R', dens:2, variant:0, w:3, h:3}, 0), 18, 40);
  ctx.drawImage(buildingSprite({type:'C', dens:2, variant:0, w:3, h:3}, 1), 76, 40);
  ctx.drawImage(buildingSprite({type:'coal', dens:0, variant:0, w:4, h:4}, 0), 148, 24);
}
function paintMinimap(){
  const c = $('mini');
  if (!c) return;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(W, H);
  const d = img.data;
  for (let i = 0; i < W * H; i++){
    let r = 30, g = 90, b = 180;
    const gnd = ground[i];
    if (gnd !== WATER){ r = 70; g = 150; b = 60; }
    if (gnd === TREE){ r = 30; g = 110; b = 40; }
    if (gnd === WASTE){ r = 140; g = 190; b = 60; }
    if (gnd === RUBBLE){ r = 140; g = 120; b = 100; }
    if (road[i]){ r = 90; g = 96; b = 104; }
    if (rail[i]){ r = 180; g = 170; b = 80; }
    const id = bid[i];
    if (id >= 0 && buildings[id] && buildings[id].alive){
      const t = buildings[id].type;
      if (t === 'R'){ r = 220; g = 90; b = 80; }
      else if (t === 'C'){ r = 80; g = 150; b = 230; }
      else if (t === 'I'){ r = 210; g = 170; b = 60; }
      else { r = 240; g = 240; b = 240; }
    }
    if (fire[i]){ r = 255; g = 60; b = 20; }
    const o = i * 4;
    d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  ctx.strokeStyle = '#f0c84a';
  const vw = $('map').clientWidth / cam.z, vh = $('map').clientHeight / cam.z;
  ctx.strokeRect(cam.x / TS, cam.y / TS, vw / TS, vh / TS);
}

function updateChip(){
  const el = $('toolChip');
  if (!el) return;
  const s = toolSpec(G.tool);
  if (G.tool === 'hand') el.textContent = '移動・1本指で地図、2本指で拡大';
  else if (G.tool === 'query') el.textContent = '調べる・長押しでも見られます';
  else if (!s) el.textContent = '';
  else {
    const cost = hover && hover.eval && hover.eval.cost != null ? hover.eval.cost : s.cost;
    const bridge = hover && hover.eval && hover.eval.bridge;
    let name = s.name;
    if (bridge && s.kind === 'road') name = '橋';
    if (bridge && s.kind === 'rail') name = '鉄橋';
    if (bridge && s.kind === 'wire') name = '水上の電線';
    el.textContent = name + '  $' + fmt(cost) + (s.w > 1 ? '  ' + s.w + '×' + s.h : '');
  }
}
function updateHUD(){
  if (!$('hudName')) return;
  $('hudName').textContent = G.name || 'まち';
  const funds = $('hudFunds');
  funds.textContent = '$' + fmt(G.funds);
  funds.classList.toggle('bad', G.funds < 1000);
  $('hudRank').textContent = rankOf(G.resPop).name;
  $('hudPop').textContent = fmtPop(G.resPop) + '人';
  $('hudDate').textContent = G.year + '年' + MONTHS[G.month];
  const pow = $('hudPower');
  if (!G.powerCap) pow.textContent = '電気なし';
  else if (G.zoneCount > G.powerCap) pow.innerHTML = '電気 ' + G.powerUsed + '/' + G.powerCap + ' <span class="hot">不足</span>';
  else pow.textContent = '電気 ' + G.powerUsed + '/' + G.powerCap;
  setMeter('mR', G.rDem); setMeter('mC', G.cDem); setMeter('mI', G.iDem);
  const goal = $('goalLine');
  if (G.goal && G.goal.text){ goal.hidden = false; goal.textContent = G.goal.text; }
  else goal.hidden = true;
  $('btnPause').textContent = G.paused ? '再開' : '停止';
  $('btnPause').classList.toggle('go', !!G.paused);
  $('btnSpeed').textContent = '×' + G.speed;
  const soundLabel = G.sound === 'all' ? '曲' : G.sound === 'off' ? '消' : '音';
  $('btnSound').textContent = soundLabel;
  $('hud').classList.toggle('cele', G.celebrate > 0);
}
function setMeter(id, dem){
  const m = $(id);
  if (!m) return;
  m.querySelector('.pos').style.width = (dem > 0 ? dem / 2 : 0) + '%';
  m.querySelector('.neg').style.width = (dem < 0 ? -dem / 2 : 0) + '%';
  m.setAttribute('aria-valuenow', String(dem));
  m.setAttribute('aria-valuemin', '-100');
  m.setAttribute('aria-valuemax', '100');
}
function toast(s){
  const el = $('toast');
  if (!el) return;
  el.hidden = false;
  el.textContent = s;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.hidden = true; }, 2200);
}
function say(id, text, opt){
  opt = opt || {};
  const now = G.elapsed || 0;
  if (!opt.force && id){
    const last = G.said[id];
    if (last != null && now - last < (opt.cooldown == null ? 8 : opt.cooldown)) return;
  }
  if (id && (msgQ.some(q => q.id === id) || (currentMsg && currentMsg.id === id))) return;
  if (id) G.said[id] = now;
  msgQ.push({id, text, annoy: !!opt.annoy, actions: opt.actions || null});
  if ($('speech') && $('speech').hidden) nextMsg();
}
function nextMsg(){
  currentMsg = msgQ.shift() || null;
  const box = $('speech');
  if (!box) return;
  if (!currentMsg){ box.hidden = true; return; }
  box.hidden = false;
  $('speechText').textContent = currentMsg.text;
  $('speechName').textContent = currentMsg.annoy ? 'リン' : '相談役リン';
  const act = $('speechActions');
  act.innerHTML = '';
  if (currentMsg.actions){
    $('speechOk').hidden = true;
    for (const a of currentMsg.actions){
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = a.label;
      b.addEventListener('click', () => { a.run(); nextMsg(); });
      act.appendChild(b);
    }
    const later = document.createElement('button');
    later.type = 'button';
    later.textContent = 'あとで';
    later.addEventListener('click', () => nextMsg());
    act.appendChild(later);
  } else $('speechOk').hidden = false;
  drawFace(currentMsg.annoy, false);
}
function manualAdvice(){
  if (G.choice === 'fun'){ openFunChoice(); return; }
  const times = G.adviceTimes = (G.adviceTimes || []).filter(t => G.elapsed - t < 12);
  if (times.length >= 3){
    say('annoy-' + G.elapsed, 'リンは横を向きました。「少し、ひとりで考えさせてください。またあとで。」', {force:true, annoy:true});
    return;
  }
  times.push(G.elapsed);
  let text;
  if (!hasType('coal') && !hasType('nuke')) text = '発電所がまだありません。火力は $3,000 で地区40、原子力は $5,000 で地区120です。原子力は事故ると、消えないごみが残ります。';
  else if (G.zoneCount > G.powerUsed) text = '電気が足りない地区があります。電線でつなぐか、発電所を増やしてください。電線は道路の上にも置けます。';
  else if (G.problems[0]) text = 'いま住民がいちばん困っているのは「' + G.problems[0].name + '」です。世論で割合を見られます。20%を超えると大きな不満です。';
  else if (G.resPop < 2000) text = 'この調子です。工業で仕事、道路の先に住宅、人が増えたら商業。税率は7%が基準です。';
  else text = rankOf(G.resPop).name + 'です。人口 ' + fmtPop(G.resPop) + '人、支持 ' + G.approval + '%。公園と水辺は地価を上げ、高い地価だと大きな建物になります。';
  say('manual-' + G.elapsed, text, {force:true});
}

const CATS = [
  {id:'move', name:'移動'},
  {id:'zone', name:'地区'},
  {id:'road', name:'交通'},
  {id:'power', name:'電力'},
  {id:'civic', name:'公共'},
  {id:'nature', name:'自然'},
  {id:'query', name:'調査'},
  {id:'menu', name:'メニュー'}
];
function toolsFor(cat){
  if (cat === 'zone') return ['R','C','I','bulldoze'];
  if (cat === 'road') return ['road','rail','bulldoze'];
  if (cat === 'power') return ['wire','coal','nuke'];
  if (cat === 'civic') return ['police','fire','stadium','port','air'];
  if (cat === 'nature') return ['park','bulldoze'];
  return [];
}
function iconFor(tool){
  const fake = {
    R:{type:'R',dens:1,w:3,h:3,variant:0},
    C:{type:'C',dens:2,w:3,h:3,variant:0},
    I:{type:'I',dens:2,w:3,h:3,variant:0},
    coal:{type:'coal',dens:0,w:4,h:4,variant:0},
    nuke:{type:'nuke',dens:0,w:4,h:4,variant:0},
    police:{type:'police',dens:0,w:3,h:3,variant:0},
    fire:{type:'fire',dens:0,w:3,h:3,variant:0},
    stadium:{type:'stadium',dens:0,w:4,h:4,variant:0},
    port:{type:'port',dens:0,w:4,h:4,variant:0},
    air:{type:'air',dens:0,w:6,h:6,variant:0},
    park:{type:'park',dens:0,w:1,h:1,variant:0},
    house:{type:'house',dens:0,w:3,h:3,variant:0}
  };
  const c = makeCanvas(32, 32);
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  if (fake[tool] || (SPEC[tool] && tool !== 'bulldoze')){
    const b = fake[tool] || {type:tool, dens:0, w:SPEC[tool].w, h:SPEC[tool].h, variant:0};
    g.drawImage(buildingSprite(b, 0), 0, 0, 32, 32);
    return c;
  }
  const small = makeCanvas(16, 16);
  const px = painter(small);
  if (tool === 'road'){ fill(px,0,0,16,16,COL.grass); drawRoad(px, 10); }
  else if (tool === 'rail'){ fill(px,0,0,16,16,COL.grass); drawRail(px, 10); }
  else if (tool === 'wire'){ fill(px,0,0,16,16,COL.grass); drawWire(px, 10); }
  else if (tool === 'bulldoze'){
    fill(px,0,0,16,16,'#3a241c');
    for (let i = 2; i < 14; i++){ px(i, i, '#f2d2a8'); px(i, 15 - i, '#f2d2a8'); }
  } else if (tool === 'query'){
    fill(px,0,0,16,16,'#1c2633');
    for (let y = 2; y < 10; y++) for (let x = 2; x < 10; x++){
      const dx = x - 6, dy = y - 6;
      if (dx*dx+dy*dy < 16 && dx*dx+dy*dy > 8) px(x,y,COL.gold);
    }
    px(10,10,COL.gold); px(11,11,COL.gold); px(12,12,COL.gold);
  } else {
    fill(px,0,0,16,16,'#1c2633');
    px(8,2,COL.gold); px(8,13,COL.gold); px(2,8,COL.gold); px(13,8,COL.gold);
  }
  g.drawImage(small, 0, 0, 32, 32);
  return c;
}
function renderDock(){
  const cats = $('cats');
  const shelf = $('shelf');
  if (!cats || !shelf) return;
  cats.innerHTML = '';
  const giftsN = G.pending.length + (G.choice ? 1 : 0);
  const pulse = !hasType('coal') && !hasType('nuke') && G.elapsed < 12;
  for (const cat of CATS){
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = cat.name;
    b.setAttribute('aria-pressed', G.cat === cat.id ? 'true' : 'false');
    if (cat.id === 'power' && pulse && G.cat !== 'power') b.classList.add('pulse');
    if (cat.id === 'nature' && giftsN){
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = String(giftsN);
      b.appendChild(badge);
    }
    b.addEventListener('click', () => selectCat(cat.id));
    cats.appendChild(b);
  }
  shelf.innerHTML = '';
  if (G.cat === 'move'){
    shelf.dataset.empty = '0';
    const p = document.createElement('div');
    p.className = 'hintline';
    p.textContent = 'ドラッグで移動。建物を選ぶと、ドラッグで連続して置けます。長押しでそのマスを調べます。';
    shelf.appendChild(p);
    return;
  }
  if (G.cat === 'query'){
    shelf.dataset.empty = '0';
    const p = document.createElement('div');
    p.className = 'hintline';
    p.textContent = 'タップしたマスの人口、電気、地価、公害、犯罪が分かります。';
    shelf.appendChild(p);
    return;
  }
  if (G.cat === 'menu'){ shelf.dataset.empty = '1'; return; }
  const list = toolsFor(G.cat).slice();
  if (G.cat === 'nature'){
    if (G.choice === 'fun') list.unshift('choose-fun');
    for (const p of G.pending) list.push(p.kind === 'land' ? 'gift:land' : 'gift:' + p.kind);
  }
  shelf.dataset.empty = list.length ? '0' : '1';
  for (const tool of list){
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tool';
    if (tool === 'choose-fun'){
      b.textContent = '贈り物を選ぶ';
      b.addEventListener('click', () => openFunChoice());
    } else {
      const spec = toolSpec(tool);
      const cv = iconFor(spec && spec.gift ? spec.kind : tool === 'gift:land' ? 'park' : tool);
      b.appendChild(cv);
      const name = document.createElement('div');
      name.textContent = spec ? spec.name : tool;
      const cost = document.createElement('small');
      cost.textContent = spec ? '$' + fmt(spec.cost) : '';
      b.appendChild(name); b.appendChild(cost);
      b.setAttribute('aria-pressed', G.tool === tool ? 'true' : 'false');
      b.addEventListener('click', () => { G.tool = tool; renderDock(); updateChip(); sfxUi(); });
    }
    shelf.appendChild(b);
  }
}
function selectCat(id){
  if (id === 'menu'){ openSheet('menu'); return; }
  G.cat = id;
  if (id === 'move') G.tool = 'hand';
  else if (id === 'query') G.tool = 'query';
  else {
    const list = toolsFor(id);
    if (list.length && !list.includes(G.tool) && !String(G.tool).startsWith('gift:')) G.tool = list[0];
  }
  renderDock();
  updateChip();
  sfxUi();
}

function showScreen(name){
  for (const id of ['title','setup','scenario','play','end']){
    const el = $('screen-' + id);
    if (el) el.hidden = id !== name;
  }
  document.body.dataset.screen = name;
  if (name === 'title') refreshTitle();
}
function refreshTitle(){
  const btn = $('btnContinue');
  if (!btn) return;
  let has = false;
  try { has = !!localStorage.getItem(SAVE_KEY); } catch (e) {}
  btn.hidden = !has;
}
function openSheet(kind){
  if (!G.sheet){
    G.resume = !G.paused;
    G.paused = true;
  }
  G.sheet = kind;
  $('sheet').hidden = false;
  $('sheetClose').hidden = !!G.budgetPending;
  renderSheet();
  updateHUD();
}
function closeSheet(force){
  if (G.budgetPending && !force) return;
  const el = $('sheet');
  if (el) el.hidden = true;
  G.sheet = null;
  if (G.resume && !G.budgetPending && !G.over) G.paused = false;
  G.resume = false;
  updateHUD();
}
function renderSheet(){
  const body = $('sheetBody');
  const title = $('sheetTitle');
  if (!body) return;
  if (G.sheet === 'menu'){
    title.textContent = 'メニュー';
    body.innerHTML = '<div class="menu-list">' +
      ['budget:財政','map:地図','graph:グラフ','voice:世論','stats:統計','disaster:災害','history:履歴','help:遊び方'].map(s => {
        const [id, name] = s.split(':');
        return '<button type="button" data-go="' + id + '">' + name + '</button>';
      }).join('') +
      '<button type="button" id="btnAdvice">相談役リン</button>' +
      '<button type="button" id="btnSave">セーブ</button>' +
      '<button type="button" id="btnLeave">タイトルへ</button></div>';
    body.querySelectorAll('[data-go]').forEach(b => b.onclick = () => openSheet(b.dataset.go));
    $('btnAdvice').onclick = () => { closeSheet(true); manualAdvice(); };
    $('btnSave').onclick = () => { saveGame(true); };
    $('btnLeave').onclick = () => openSheet('leave');
  } else if (G.sheet === 'leave'){
    title.textContent = 'タイトルへ';
    body.innerHTML = '<p>いまのまちをセーブして、タイトルに戻ります。</p><div class="row"><button type="button" id="leaveYes">セーブして戻る</button><button type="button" id="leaveNo">やめる</button></div>';
    $('leaveYes').onclick = () => { saveGame(true); G.playing = false; closeSheet(true); showScreen('title'); };
    $('leaveNo').onclick = () => openSheet('menu');
  } else if (G.sheet === 'budget'){
    title.textContent = G.budgetPending ? '1月の決算' : '財政';
    const eco = calcEconomy();
    const after = G.funds + (G.budgetPending ? eco.net : 0);
    body.innerHTML =
      (G.budgetPending ? '<p class="warn">年に一度、税が入って維持費が出ていきます。この数字で決めます。</p>' : '<p>税率と予算は、いつでも変えられます。決算は毎年1月です。</p>') +
      stepper('税率', 'tax', G.tax, '%') +
      stepper('交通', 'fTransit', G.fTransit, '%') +
      stepper('警察', 'fPolice', G.fPolice, '%') +
      stepper('消防', 'fFire', G.fFire, '%') +
      '<div class="statgrid">' +
      stat('税と贈り物', '$' + fmt(eco.income)) + stat('支出', '$' + fmt(eco.expense)) +
      stat('差引', (eco.net >= 0 ? '+' : '') + '$' + fmt(eco.net)) + stat(G.budgetPending ? '決算後の資金' : 'いまの資金', '$' + fmt(G.budgetPending ? after : G.funds)) +
      '</div>' +
      (hasType('bank') ? '<div class="row"><span>銀行</span><button type="button" id="loanBtn">' + (G.loanYears > 0 ? '返済中 あと' + G.loanYears + '年' : '$10,000 借りる') + '</button></div>' : '') +
      '<label class="check"><input type="checkbox" id="autoBudget"' + (G.autoBudget ? ' checked' : '') + '> 足りていれば決算を自動で進める</label>' +
      '<label class="check"><input type="checkbox" id="autoBull"' + (G.autoBulldoze ? ' checked' : '') + '> 森は自動で整地する（+$1）</label>' +
      '<label class="check"><input type="checkbox" id="autoPause"' + (G.autoPause ? ' checked' : '') + '> 災害が起きたら時間を止める</label>' +
      '<div class="row"><button type="button" class="primary" id="budgetOk">' + (G.budgetPending ? 'このよさんで決める' : '閉じる') + '</button></div>' +
      (G.budgetPending && after < -5000 ? '<p class="warn">このままだと資金が尽きて解任されます。税率を上げるか、予算を下げてください。</p>' : '');
    bindSteppers(body);
    const ab = $('autoBudget'); if (ab) ab.onchange = () => { G.autoBudget = ab.checked; };
    const au = $('autoBull'); if (au) au.onchange = () => { G.autoBulldoze = au.checked; };
    const ap = $('autoPause'); if (ap) ap.onchange = () => { G.autoPause = ap.checked; };
    const loan = $('loanBtn');
    if (loan) loan.onclick = () => {
      if (G.loanYears > 0){ toast('まだ返済中です'); return; }
      G.funds += 10000; G.loanYears = 20; G.loanPay = 700;
      toast('銀行から $10,000。毎年 $700 を20年');
      renderSheet(); updateHUD();
    };
    $('budgetOk').onclick = () => {
      if (!G.budgetPending){ closeSheet(); return; }
      const e2 = calcEconomy();
      G.funds += e2.net;
      if (G.loanYears > 0) G.loanYears--;
      deteriorate();
      G.budgetPending = false;
      toast('決算 ' + (e2.net >= 0 ? '+' : '') + '$' + fmt(e2.net));
      sfxYear();
      saveGame();
      if (G.funds < -5000){ bankrupt(); return; }
      closeSheet(true);
    };
  } else if (G.sheet === 'map'){
    title.textContent = '地図';
    const modes = [['none','ふつう'],['power','電気'],['traffic','交通'],['pol','公害'],['crime','犯罪'],['lv','地価'],['fire','消防'],['police','警察']];
    body.innerHTML = '<canvas id="mini" width="96" height="96" aria-label="全体地図"></canvas><div class="chips">' +
      modes.map(m => '<button type="button" data-ov="' + m[0] + '"' + (G.overlay === m[0] || (!G.overlay && m[0] === 'none') ? ' aria-pressed="true"' : '') + '>' + m[1] + '</button>').join('') +
      '</div><p>ミニマップをタップすると、そこへ移動します。色は、赤いほど問題が大きいです。</p>';
    body.querySelectorAll('[data-ov]').forEach(b => b.onclick = () => { G.overlay = b.dataset.ov; renderSheet(); });
    $('mini').addEventListener('pointerdown', (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      centerOn((e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H);
      paintMinimap();
    });
    paintMinimap();
  } else if (G.sheet === 'graph'){
    title.textContent = 'グラフ';
    body.innerHTML = '<div class="chips" id="gChips"><button type="button" data-g="pop" aria-pressed="true">人口</button><button type="button" data-g="crime">犯罪</button><button type="button" data-g="pol">公害</button><button type="button" data-g="lv">地価</button></div><canvas id="graph" width="520" height="320"></canvas><p id="gCap"></p>';
    const drawG = (key) => {
      const cv = $('graph'); const ctx = cv.getContext('2d');
      ctx.fillStyle = '#0e141c'; ctx.fillRect(0, 0, cv.width, cv.height);
      const data = G.yearly;
      const label = {pop:'人口（人）', crime:'犯罪（%）', pol:'公害（%）', lv:'地価'}[key];
      $('gCap').textContent = data.length < 2 ? '年が改まると線が伸びます。' : '毎年1月の記録。' + label;
      if (data.length < 2) return;
      const vals = data.map(d => d[key] || 0);
      const max = Math.max(1, ...vals);
      ctx.strokeStyle = '#f0c84a'; ctx.lineWidth = 3; ctx.beginPath();
      vals.forEach((v, i) => {
        const x = 16 + i * ((cv.width - 32) / (vals.length - 1));
        const y = cv.height - 16 - (v / max) * (cv.height - 36);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.fillStyle = '#a9b6c8'; ctx.font = '20px sans-serif';
      ctx.fillText(label, 16, 28);
      ctx.fillText(String(data[0].y), 16, cv.height - 4);
      ctx.fillText(String(data[data.length - 1].y), cv.width - 70, cv.height - 4);
    };
    drawG('pop');
    body.querySelectorAll('[data-g]').forEach(b => b.onclick = () => {
      body.querySelectorAll('[data-g]').forEach(x => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
      drawG(b.dataset.g);
    });
  } else if (G.sheet === 'voice'){
    title.textContent = '世論';
    const face = G.approval >= 65 ? '好調' : G.approval >= 40 ? '普通' : '不満';
    body.innerHTML = '<div class="stat"><b>' + G.approval + '%</b><span>支持・' + face + '</span></div>' +
      (G.problems.length ? G.problems.map(p => '<div class="log">' + esc(p.name) + ' ' + p.pct + '%</div>').join('') : '<p>大きな不満はありません。</p>') +
      '<p>20%を超えると、住民はそれを大きな問題だと言います。</p>';
  } else if (G.sheet === 'stats'){
    title.textContent = '統計';
    const jobs = G.comJobs + G.indJobs;
    body.innerHTML = '<div class="statgrid">' +
      stat('人口', fmt(G.resPop)) + stat('雇用', fmt(jobs)) +
      stat('住宅需要', G.rDem) + stat('商業需要', G.cDem) +
      stat('工業需要', G.iDem) + stat('支持', G.approval + '%') +
      stat('道路', G.roadCount + 'マス') + stat('線路', G.railCount + 'マス') +
      stat('地区', G.zoneCount) + stat('発電の上限', G.powerCap) +
      stat('公園', G.parkCount) + stat('空き地', G.openCount) +
      stat('マップ', String(G.seed).padStart(3,'0')) + stat('階級', rankOf(G.resPop).name) +
      '</div><p>人口の階級は、ビレッジ、タウン（2千）、シティ（1万）、キャピタル（5万）、メトロポリス（10万）、メガロポリス（50万）です。</p>';
  } else if (G.sheet === 'disaster'){
    title.textContent = '災害';
    const names = {fire:'火事', flood:'洪水', quake:'地震', tornado:'竜巻', crash:'墜落', monster:'怪獣', ufo:'円盤', melt:'メルトダウン'};
    body.innerHTML = '<p>シナリオの出来事は、ここを切っても起きます。</p>' +
      Object.keys(names).map(k => '<label class="check"><input type="checkbox" data-dis="' + k + '"' + (G.disasters[k] ? ' checked' : '') + '>' + names[k] + '</label>').join('') +
      '<div class="chips"><button type="button" id="dNone">なし</button><button type="button" id="dNorm">ふつう</button><button type="button" id="dAll">全部</button></div>';
    body.querySelectorAll('[data-dis]').forEach(b => b.onchange = () => { G.disasters[b.dataset.dis] = b.checked; });
    $('dNone').onclick = () => { for (const k in G.disasters) G.disasters[k] = false; renderSheet(); };
    $('dNorm').onclick = () => { for (const k in G.disasters) G.disasters[k] = k === 'fire' || k === 'flood'; renderSheet(); };
    $('dAll').onclick = () => { for (const k in G.disasters) G.disasters[k] = true; renderSheet(); };
  } else if (G.sheet === 'history'){
    title.textContent = '履歴';
    body.innerHTML = G.log.length ? G.log.map(l => '<div class="log">' + esc(l) + '</div>').join('') : '<p>まだ大きな出来事はありません。</p>';
  } else if (G.sheet === 'help'){
    title.textContent = '遊び方';
    body.innerHTML = helpHTML();
  }
}
function stepper(label, key, val, unit){
  return '<div class="row"><span>' + label + '</span><div class="stepper"><button type="button" data-k="' + key + '" data-d="-1">−</button><b>' + val + unit + '</b><button type="button" data-k="' + key + '" data-d="1">＋</button></div></div>';
}
function stat(name, val){ return '<div class="stat"><b>' + val + '</b><span>' + name + '</span></div>'; }
function bindSteppers(body){
  body.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
    const k = b.dataset.k, d = +b.dataset.d;
    if (k === 'tax') G.tax = clamp(G.tax + d, 0, 20);
    else G[k] = clamp(G[k] + d * (k === 'tax' ? 1 : 5), 0, 100);
    if (k !== 'tax') G[k] = clamp(G[k], 0, 100);
    renderSheet();
  });
}
function helpHTML(){
  return '<div class="help">' +
    '<p>1991年の16ビット都市シミュレーションの遊び方（地区、電力、交通、財政、災害、人口の階級）を参考に、絵も名前も独自に作ったまちです。</p>' +
    '<h3>はじめの手順</h3><p>発電所を置く。電線でつなぐ。工業地区を道路か線路に接するように置く。その道路の先に住宅、人が増えたら商業。時間は右上の「再開」で動きます。</p>' +
    '<h3>三大地区</h3><p>住宅・商業・工業は3×3で $100。電気がないと衰え、点滅します。商業と工業は道路か線路に接すれば育ちます。住宅は、その先に店、工場、警察、消防、港、空港、贈り物などがある必要があります。ななめでは接したことになりません。</p>' +
    '<h3>電力</h3><p>火力は地区40まで、煙と公害が出ます。原子力は120まで、普段はきれいですが、事故ると消えないごみが残ります。電線は1マス $5、道路の上にも引けます。となり合う地区にも電気は流れます。</p>' +
    '<h3>交通と財政</h3><p>道路は $10（水上は橋で $20）、線路は $20。線路は渋滞と公害が少なめです。税は毎年1月に入ります。7%前後が目安で、上げすぎると人が来なくなります。交通・警察・消防の予算を下げると、道が崩れ、犯罪と火事に弱くなります。</p>' +
    '<h3>地価・公害・犯罪</h3><p>水辺、森、公園、贈り物は地価を上げ、地価が高いとマンションや高層ビルになります。工業と火力と渋滞は公害を出し、近くの住宅を苦しめます。警察は近くの犯罪を下げます。</p>' +
    '<h3>災害</h3><p>火事は上下左右に燃え広がります。燃えるマスのまわりを整地すると防火帯です。洪水、地震、竜巻、墜落、怪獣モグドラ、円盤、原子力の事故があります。災害が起きたら時間が止まるので、落ち着いて消せます。</p>' +
    '<h3>操作</h3><p>下の欄で道具を選び、地図をドラッグすると連続して置けます。「移動」のときはドラッグで地図が動きます。2本指でも移動と拡大ができます。長押しでマスを調べられます。取消は左下。パソコンはスペースで一時停止、Uで取消、ホイールで拡大、右ドラッグで移動です。</p>' +
    '</div>';
}
function showEnd(win){
  G.paused = true;
  showScreen('end');
  const broke = G.funds < -5000;
  $('endTitle').textContent = win ? '合格' : broke ? '解任' : '年限切れ';
  const pop = '人口 ' + fmtPop(G.resPop) + '人、支持 ' + G.approval + '%、' + G.year + '年。';
  $('endText').textContent = win
    ? '立て直せました。' + pop + ' このまま市長を続けられます。'
    : broke
      ? '資金が尽きて、市長をやめさせられました。' + pop
      : '年限までに目標へ届きませんでした。' + pop;
  $('endContinue').hidden = !win;
}
function bankrupt(){
  G.over = true;
  G.paused = true;
  G.budgetPending = false;
  closeSheet(true);
  showEnd(false);
}

function queryAt(tx, ty){
  if (!inside(tx, ty)) return;
  const i = idx(tx, ty);
  const lines = [];
  if (bid[i] >= 0 && buildings[bid[i]] && buildings[bid[i]].alive){
    const b = buildings[bid[i]];
    const sp = SPEC[b.type];
    lines.push(sp.name + (sp.zone ? '  発展 ' + b.dens : ''));
    if (sp.zone){
      if (b.type === 'R') lines.push('人口 ' + fmt(sp.pop[b.dens] || 0));
      else lines.push('雇用 ' + fmt((sp.jobs && sp.jobs[b.dens]) || 0));
      lines.push((b.powered ? '電気あり' : '電気なし') + '、' + (b.access >= 2 ? '交通は足りている' : b.access === 1 ? '道路の先に行き先がない' : '道路も線路も接していない'));
      lines.push('地価 ' + b.lv + '  公害 ' + Math.round(pollAt(b) / 2.55) + '  犯罪 ' + b.crime);
      if (b.congested) lines.push('まわりの道路が渋滞');
    } else if (sp.plant) lines.push('地区を ' + sp.plant + ' までまかなえる');
    else if (sp.income) lines.push('毎年 $' + sp.income);
    G.hl = b;
  } else {
    lines.push(['水','更地','森','瓦礫','核のごみ'][ground[i]] || '更地');
    if (road[i]) lines.push(ground[i] === WATER ? '橋' : '道路' + (traffic[i] >= 20 ? '（渋滞）' : ''));
    if (rail[i]) lines.push('線路');
    if (wire[i]) lines.push('電線' + (poweredNet[i] ? '（通電）' : ''));
    if (fire[i]) lines.push('火災');
    if (ground[i] === TREE) lines.push('整地すると $1');
    G.hl = {x:tx, y:ty, w:1, h:1};
  }
  const el = $('query');
  el.hidden = false;
  el.innerHTML = '<div>' + esc(lines.join('\n')).replace(/\n/g, '<br>') + '</div><button type="button" id="queryClose">閉じる</button>';
  $('queryClose').onclick = () => { el.hidden = true; G.hl = null; };
}

function tileAnchor(tool, tx, ty){
  const s = toolSpec(tool);
  if (!s) return {x:tx, y:ty, w:1, h:1};
  return {x: tx - Math.floor((s.w - 1) / 2), y: ty - Math.floor((s.h - 1) / 2), w:s.w, h:s.h};
}
function paintCell(tx, ty){
  const a = tileAnchor(G.tool, tx, ty);
  const spec = toolSpec(G.tool);
  if (spec && spec.w > 1 && stroke && stroke.lastA){
    if (Math.abs(stroke.lastA.x - a.x) < spec.w && Math.abs(stroke.lastA.y - a.y) < spec.h) return {ok:true, noop:true};
  }
  const r = act(G.tool, a.x, a.y, false);
  if (r.ok && !r.noop){
    if (stroke) stroke.lastA = a;
    sfxPlace();
    buzz(8);
  }
  return r;
}
function bresenham(x0, y0, x1, y1, fn){
  let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  for (;;){
    fn(x0, y0);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy){ err -= dy; x0 += sx; }
    if (e2 < dx){ err += dx; y0 += sy; }
  }
}
function bindInput(){
  const map = $('map');
  map.addEventListener('contextmenu', e => e.preventDefault());
  map.addEventListener('pointerdown', onDown);
  map.addEventListener('pointermove', onMove, {passive:false});
  map.addEventListener('pointerup', onUp);
  map.addEventListener('pointercancel', onUp);
  map.addEventListener('wheel', onWheel, {passive:false});
  $('btnUndo').onclick = () => undo();
  $('btnZin').onclick = () => setZoom(cam.z + 1);
  $('btnZout').onclick = () => setZoom(cam.z - 1);
  $('btnPause').onclick = () => togglePause();
  $('btnSpeed').onclick = () => { G.speed = G.speed >= 3 ? 1 : G.speed + 1; updateHUD(); sfxUi(); };
  $('btnSound').onclick = () => {
    G.sound = G.sound === 'sfx' ? 'all' : G.sound === 'all' ? 'off' : 'sfx';
    saveMeta(); updateHUD(); if (G.sound !== 'off') unlockAudio();
  };
  $('speechOk').onclick = () => nextMsg();
  window.addEventListener('keydown', onKey);
  window.addEventListener('pointerdown', () => unlockAudio(), {once:false});
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });
  window.addEventListener('resize', () => { layoutMap(); clampCam(); });
  if (window.ResizeObserver) new ResizeObserver(() => { layoutMap(); clampCam(); }).observe($('mapWrap'));
}
function togglePause(){
  if (G.over) return;
  if (G.budgetPending){ openSheet('budget'); return; }
  G.paused = !G.paused;
  if (!G.paused) $('btnPause').classList.remove('pulse');
  updateHUD();
  sfxUi();
}
function onDown(e){
  if (G.sheet) return;
  unlockAudio();
  pointers.set(e.pointerId, {x:e.clientX, y:e.clientY});
  try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
  if (pointers.size >= 2){ pinch = null; if (stroke) endStroke(); gesture = null; return; }
  const tile = screenToTile(e.clientX, e.clientY);
  const pan = e.button === 1 || e.button === 2 || G.tool === 'hand' || e.shiftKey;
  gesture = {id:e.pointerId, x:e.clientX, y:e.clientY, tile, moved:false, long:false, painting:false, pan, cx:cam.x, cy:cam.y};
  gesture.timer = setTimeout(() => {
    if (gesture && !gesture.moved){
      gesture.long = true;
      queryAt(gesture.tile.x, gesture.tile.y);
      buzz(12);
    }
  }, 460);
}
function onMove(e){
  if (e.cancelable) e.preventDefault();
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, {x:e.clientX, y:e.clientY});
  if (pointers.size >= 2){ doPinch(); return; }
  const tile = screenToTile(e.clientX, e.clientY);
  if (!gesture || gesture.id !== e.pointerId){
    updateHover(tile);
    return;
  }
  const dist = Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y);
  if (dist > 8){
    gesture.moved = true;
    clearTimeout(gesture.timer);
  }
  if (gesture.pan){
    if (gesture.moved){
      cam.x = gesture.cx - (e.clientX - gesture.x) / cam.z;
      cam.y = gesture.cy - (e.clientY - gesture.y) / cam.z;
      clampCam();
    }
    return;
  }
  if (gesture.long || G.tool === 'query'){ updateHover(tile); return; }
  if (gesture.moved && G.tool !== 'hand'){
    if (!gesture.painting){
      beginStroke();
      gesture.painting = true;
      const spec = toolSpec(G.tool);
      if (spec && spec.w === 1) paintCell(gesture.tile.x, gesture.tile.y);
      else paintCell(gesture.tile.x, gesture.tile.y);
      gesture.last = gesture.tile;
    }
    const spec = toolSpec(G.tool);
    if (spec && spec.w === 1 && gesture.last) bresenham(gesture.last.x, gesture.last.y, tile.x, tile.y, (x, y) => paintCell(x, y));
    else paintCell(tile.x, tile.y);
    gesture.last = tile;
  }
  updateHover(tile);
}
function onUp(e){
  pointers.delete(e.pointerId);
  if (gesture && gesture.id === e.pointerId){
    clearTimeout(gesture.timer);
    if (!gesture.long && !gesture.moved && !gesture.pan){
      if (G.tool === 'query') queryAt(gesture.tile.x, gesture.tile.y);
      else if (G.tool !== 'hand'){
        beginStroke();
        const r = paintCell(gesture.tile.x, gesture.tile.y);
        if (!r.ok) toast(r.reason || '置けません');
        if (!r.ok) sfxErr();
        endStroke();
      }
    } else if (gesture.painting){
      endStroke();
      if (stroke === null && G.tool !== 'hand') { /* placed */ }
    }
    gesture = null;
  }
  if (pointers.size < 2) pinch = null;
}
function updateHover(tile){
  if (!$('screen-play') || $('screen-play').hidden) return;
  if (G.tool === 'hand'){ hover = null; return; }
  const a = tileAnchor(G.tool, tile.x, tile.y);
  const ev = (G.tool === 'query') ? {ok:true, cost:0} : act(G.tool, a.x, a.y, true);
  hover = {x:a.x, y:a.y, w:a.w, h:a.h, eval:ev};
}
function onWheel(e){
  e.preventDefault();
  setZoom(cam.z + (e.deltaY > 0 ? -1 : 1), e.clientX, e.clientY);
}
function doPinch(){
  const pts = [...pointers.values()];
  if (pts.length < 2) return;
  const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
  const mid = {x:(pts[0].x + pts[1].x) / 2, y:(pts[0].y + pts[1].y) / 2};
  if (!pinch){ pinch = {dist, mid}; return; }
  cam.x -= (mid.x - pinch.mid.x) / cam.z;
  cam.y -= (mid.y - pinch.mid.y) / cam.z;
  if (dist > pinch.dist * 1.22){ setZoom(cam.z + 1, mid.x, mid.y); pinch.dist = dist; }
  else if (dist < pinch.dist * 0.82){ setZoom(cam.z - 1, mid.x, mid.y); pinch.dist = dist; }
  pinch.mid = mid;
  clampCam();
}
function onKey(e){
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (!$('screen-play') || $('screen-play').hidden) return;
  const k = e.key.toLowerCase();
  if (k === ' ' || e.code === 'Space'){ e.preventDefault(); togglePause(); }
  else if (k === 'u' || k === 'z' && (e.metaKey || e.ctrlKey)){ e.preventDefault(); undo(); }
  else if (k === 'escape'){ if (G.sheet && !G.budgetPending) closeSheet(); else { G.tool = 'hand'; G.cat = 'move'; renderDock(); } }
  else if (k === '+' || k === '=') setZoom(cam.z + 1);
  else if (k === '-' || k === '_') setZoom(cam.z - 1);
  else if (k === 'arrowleft' || k === 'a') cam.x -= 32;
  else if (k === 'arrowright' || k === 'd') cam.x += 32;
  else if (k === 'arrowup' || k === 'w') cam.y -= 32;
  else if (k === 'arrowdown' || k === 's') cam.y += 32;
  else {
    const mapk = {1:'R',2:'C',3:'I',4:'road',5:'rail',6:'wire',7:'police',8:'fire',b:'bulldoze',q:'query',h:'hand'};
    if (mapk[k]){
      G.tool = mapk[k];
      G.cat = k === 'h' ? 'move' : k === 'q' || k === 'b' ? G.cat : (['1','2','3'].includes(k) ? 'zone' : ['4','5'].includes(k) ? 'road' : k === '6' ? 'power' : 'civic');
      if (k === 'b') G.cat = 'zone';
      renderDock();
    }
  }
  clampCam();
}

let audioUnlocked = false;
function unlockAudio(){
  if (audioUnlocked) return;
  audioUnlocked = true;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audio = new AC();
    if (audio.state === 'suspended') audio.resume();
  } catch (e) { audio = null; }
}
function toneAt(t, freq, dur, type, vol){
  if (!audio || G.sound === 'off') return;
  const o = audio.createOscillator(), g = audio.createGain();
  o.type = type || 'triangle';
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol || 0.04, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(audio.destination);
  o.start(t); o.stop(t + dur + 0.02);
}
function blip(freq, dur, type, vol){
  if (!audio) return;
  toneAt(audio.currentTime, freq, dur, type, vol);
}
function sfxPlace(){ if (G.sound !== 'off') blip(660, 0.05, 'square', 0.035); }
function sfxErr(){ if (G.sound !== 'off') blip(140, 0.09, 'square', 0.05); }
function sfxUi(){ if (G.sound !== 'off') blip(480, 0.03, 'triangle', 0.03); }
function sfxGrow(){ if (G.sound !== 'off') blip(880, 0.07, 'triangle', 0.04); }
function sfxYear(){ if (!audio || G.sound === 'off') return; const t = audio.currentTime; toneAt(t, 523, 0.12, 'triangle', 0.04); toneAt(t + 0.1, 659, 0.12, 'triangle', 0.04); toneAt(t + 0.2, 784, 0.18, 'triangle', 0.04); }
function sfxRank(){ sfxYear(); }
function sfxDisaster(){ if (G.sound !== 'off') blip(90, 0.28, 'sawtooth', 0.05); }
function buzz(ms){ try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }
const TUNES = {
  village:[262,330,392,330,294,330,392,440],
  town:[330,392,494,392,440,392,330,294],
  city:[392,494,587,494,523,494,392,330],
  capital:[440,554,659,554,587,523,440,392],
  metro:[494,659,784,659,698,587,494,440],
  mega:[523,659,784,880,784,659,523,392]
};
function bgmTick(){
  if (!audio || G.sound !== 'all' || !G.playing) { nextNote = 0; return; }
  if (!nextNote) nextNote = audio.currentTime + 0.05;
  const tune = TUNES[G.rankId] || TUNES.village;
  const step = G.rankId === 'village' || G.rankId === 'town' ? 0.42 : 0.3;
  while (nextNote < audio.currentTime + 0.25){
    toneAt(nextNote, tune[noteI % tune.length], step * 0.8, 'triangle', 0.03);
    noteI++;
    nextNote += step;
  }
}

function renderScenarios(){
  const list = $('scList');
  list.innerHTML = '';
  const open = bonusOpen();
  for (const sc of SCENARIOS){
    const b = document.createElement('button');
    b.type = 'button';
    const done = meta.cleared.includes(sc.id);
    if (done) b.classList.add('done');
    if (sc.bonus && !open) b.classList.add('lock');
    const years = sc.years ? sc.years + '年' : '制限なし';
    b.innerHTML = '<b>' + esc(sc.name) + (done ? ' ・クリア' : '') + '</b><span>' + esc(sc.text) + '（' + years + '）</span>';
    b.onclick = () => {
      if (sc.bonus && !open){ toast('シナリオを6つクリアすると開きます'); return; }
      startGame({mode:'scenario', scenario:sc.id});
    };
    list.appendChild(b);
  }
}
let setupSeed = 61, setupDiff = 1;
function drawPreview(){
  const arr = new Uint8Array(W * H);
  generateTerrain(arr, setupSeed, {});
  const cv = $('preview');
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(W, H);
  let land = 0;
  for (let i = 0; i < arr.length; i++){
    const water = arr[i] === WATER, tree = arr[i] === TREE;
    if (!water) land++;
    const o = i * 4;
    img.data[o] = water ? 32 : tree ? 36 : 78;
    img.data[o+1] = water ? 96 : tree ? 130 : 168;
    img.data[o+2] = water ? 180 : tree ? 52 : 72;
    img.data[o+3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  $('mapNum').textContent = String(setupSeed).padStart(3, '0');
  const note = land > 7500 ? '陸が広い。大きなまち向き。' : land < 4500 ? '水が多い。橋と港のまち。' : '海と陸が混ざった地形。';
  $('mapNote').textContent = 'マップ ' + String(setupSeed).padStart(3, '0') + '。' + note + (setupSeed === 61 ? ' 陸が広い番号です。' : '');
}
function bindUI(){
  reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('btnPractice').onclick = () => startGame({mode:'practice'});
  $('btnNew').onclick = () => { showScreen('setup'); drawPreview(); };
  $('btnScenario').onclick = () => { renderScenarios(); showScreen('scenario'); };
  $('btnContinue').onclick = () => loadGame();
  $('btnHelp').onclick = () => { showScreen('play'); G.playing = false; openSheet('help'); $('sheetClose').onclick = () => { closeSheet(true); showScreen('title'); }; };
  $('setupBack').onclick = () => showScreen('title');
  $('scBack').onclick = () => showScreen('title');
  $('nM10').onclick = () => { setupSeed = (setupSeed + 990) % 1000; drawPreview(); };
  $('nM1').onclick = () => { setupSeed = (setupSeed + 999) % 1000; drawPreview(); };
  $('nP1').onclick = () => { setupSeed = (setupSeed + 1) % 1000; drawPreview(); };
  $('nP10').onclick = () => { setupSeed = (setupSeed + 10) % 1000; drawPreview(); };
  $('nRand').onclick = () => { setupSeed = (Math.random() * 1000) | 0; drawPreview(); };
  document.querySelectorAll('.diff button').forEach(b => b.onclick = () => {
    setupDiff = +b.dataset.diff;
    document.querySelectorAll('.diff button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
  });
  $('btnStart').onclick = () => startGame({mode:'free', seed:setupSeed, diff:setupDiff, name:$('cityName').value});
  $('sheetClose').onclick = () => closeSheet();
  $('sheetBack').onclick = () => closeSheet();
  $('endContinue').onclick = () => { showScreen('play'); G.paused = false; updateHUD(); };
  $('endRetry').onclick = () => { if (G.startOpts) startGame(G.startOpts); };
  $('endTitleBtn').onclick = () => { saveGame(); G.playing = false; showScreen('title'); };
  bindInput();
  const params = new URLSearchParams(location.search);
  if (params.get('test') === '1') runSelfTest();
  const shot = params.get('shot');
  if (shot === 'play' || shot === 'phone'){
    startGame({mode:'scenario', scenario:'quake'});
    selectCat('zone');
    G.needCenter = true;
    window.__SHOT_LEFT__ = 4;
  } else if (shot === 'setup'){
    showScreen('setup');
    drawPreview();
    window.__SHOT_LEFT__ = 2;
  } else if (shot === 'scenario'){
    renderScenarios();
    showScreen('scenario');
    window.__SHOT_LEFT__ = 2;
  } else if (shot){
    window.__SHOT_LEFT__ = 2;
  }
}
function loop(ts){
  const dt = Math.min(0.05, lastTs ? (ts - lastTs) / 1000 : 0.016);
  lastTs = ts;
  anim += dt;
  if (G.playing && !G.paused && !G.over && $('screen-play') && !$('screen-play').hidden){
    const step = G.speed === 1 ? 0.52 : G.speed === 2 ? 0.22 : 0.09;
    acc += dt;
    let guard = 0;
    while (acc >= step && guard++ < 3 && !G.paused && !G.budgetPending && !G.over){
      acc -= step;
      simulateMonth();
    }
  }
  if (G.celebrate > 0) G.celebrate -= dt;
  bgmTick();
  draw();
  if ($('speech') && !$('speech').hidden && Math.floor(anim * 3) !== loop._blink){
    loop._blink = Math.floor(anim * 3);
    if (loop._blink % 8 === 0) drawFace(currentMsg && currentMsg.annoy, true);
    else if (loop._blink % 8 === 1) drawFace(currentMsg && currentMsg.annoy, false);
  }
  if (window.__SHOT_LEFT__ != null){
    window.__SHOT_LEFT__--;
    if (window.__SHOT_LEFT__ <= 0) window.__TEST_DONE__ = true;
  }
  if (window.__TEST_DONE__) return;
  requestAnimationFrame(loop);
}
function runSelfTest(){
  const report = {errors:[]};
  try {
    const tmp = new Uint8Array(W * H);
    generateTerrain(tmp, 61, {});
    let land = 0; for (const v of tmp) if (v !== WATER) land++;
    report.land61 = land;
    generateTerrain(tmp, 7, {practice:true});
    let pl = 0; for (const v of tmp) if (v !== WATER) pl++;
    report.practiceLand = pl;
    const rs = buildingSprite({type:'R', dens:1, variant:0, w:3, h:3}, 0);
    const data = rs.getContext('2d').getImageData(0, 0, rs.width, rs.height).data;
    let px = 0; for (let i = 3; i < data.length; i += 4) if (data[i] > 10) px++;
    report.pixels = px;
    startGame({mode:'free', seed:61, diff:0, name:'テスト'});
    G.paused = true;
    buildTown({x:30, y:30, cols:4, densI:0, densR:0, densC:0, zoneC:true, plant:'coal'});
    settle();
    report.afterSettle = {powered:G.powerUsed, cap:G.powerCap, zones:G.zoneCount, i:G.iDem, r:G.rDem};
    for (let n = 0; n < 36; n++) simulateMonth();
    report.after = {pop:G.resPop, funds:G.funds, jobs:G.comJobs + G.indJobs, year:G.year, month:G.month, pending:G.budgetPending};
    const dens = {};
    for (const b of buildings) if (b && b.alive && SPEC[b.type].zone) dens[b.type] = Math.max(dens[b.type] || 0, b.dens);
    report.dens = dens;
    report.ok = report.land61 > 6000 && report.practiceLand > 2500 && report.pixels > 200
      && report.afterSettle.powered > 0 && report.after.pop > 200 && !report.after.pending
      && dens.R >= 1 && dens.C >= 1 && dens.I >= 1;
  } catch (e) {
    report.ok = false;
    report.errors.push(String(e && e.stack || e));
  }
  window.__TEST__ = report;
  window.__TEST_DONE__ = true;
  const pre = document.createElement('pre');
  pre.id = 'testOut';
  pre.style.cssText = 'position:fixed;left:0;bottom:0;z-index:50;background:#fff;color:#000;font-size:12px;max-height:40vh;overflow:auto;padding:8px';
  pre.textContent = JSON.stringify(report, null, 2);
  document.body.appendChild(pre);
}

window.DM = {
  startGame, forcePlace, forceLine, buildTown, settle, simulateMonth, act,
  generateTerrain, ground, buildings, G, W, H, SPEC, showScreen, cam
};

loadMeta();
bindUI();
if (!new URLSearchParams(location.search).get('shot')) showScreen('title');
drawPreview();
requestAnimationFrame(loop);
window.addEventListener('error', (e) => {
  const el = $('bootErr');
  if (el && !el.textContent) el.textContent = e.message || 'エラー';
});
})();
