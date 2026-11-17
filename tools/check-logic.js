#!/usr/bin/env node
/**
 * src/logic.html の PATTERNS が全部「行ごとの論理だけで、答えが1つに決まる」かを確認する。
 * （1行・1列ずつ見て確定できるマスを埋めていくだけで、推測なしに最後まで解ける）
 *
 *   node tools/check-logic.js
 */
"use strict";
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "..", "src", "logic.html"), "utf8");
const a = src.indexOf("const PATTERNS");
const b = src.indexOf("/* ---- random generation ---- */");
const code = src.slice(a, b).replace("const PATTERNS", "var PATTERNS");
const { PATTERNS, parseRows, cluesFromGrid, lineSolve, isFullySolved, gridsEqual } =
  new Function(code + "\nreturn {PATTERNS,parseRows,cluesFromGrid,lineSolve,isFullySolved,gridsEqual};")();

const json = JSON.parse(fs.readFileSync(path.join(__dirname, "logic-patterns.json"), "utf8"));
let bad = 0;
if (JSON.stringify(json) !== JSON.stringify(PATTERNS)) {
  console.log("NG: tools/logic-patterns.json と src/logic.html の PATTERNS が一致しません");
  bad++;
}
for (const p of PATTERNS) {
  const g = parseRows(p.rows);
  const { rows, cols } = cluesFromGrid(g);
  const s = lineSolve(rows, cols);
  if (!s || !isFullySolved(s) || !gridsEqual(s, g)) {
    console.log("NG:", p.id, p.name);
    bad++;
  }
}
console.log(`${PATTERNS.length}問中 ${PATTERNS.length - bad}問 OK`);
process.exit(bad ? 1 : 0);
