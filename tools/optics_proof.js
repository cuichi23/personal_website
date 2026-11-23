#!/usr/bin/env node
/* Proof-read the optics applet without a browser.
 *
 *     node --check static/media/optics-lab/applet.js   # it parses
 *     node tools/optics_proof.js                       # it is solvable
 *
 * static/media/optics-lab/applet.js keeps its physics in pure functions on the
 * station objects: start(), clamp(), solve() and the task predicates touch no
 * DOM. So the file can be loaded against a stub window, the stations pulled out
 * through the window.__OLAB_TEST__ hook, and the whole control space swept.
 *
 * Two questions a browser cannot answer by looking:
 *
 *   1. Is every task reachable at all? A task whose window the sliders cannot
 *      enter is not a hard task, it is a broken one.
 *   2. Is any task satisfied nearly everywhere? Then it teaches nothing, and
 *      the child ticks it off by loading the page.
 *
 * The reported share is the fraction of the swept grid that solves the task.
 * The grid is coarser than the sliders, so a small share is a real finding and
 * a zero is a failure; an exact share has no meaning.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const APPLET = path.join(__dirname, "..", "static", "media", "optics-lab",
                         "applet.js");

function loadStations() {
  const sandbox = {
    navigator: { language: "de" },
    document: {
      readyState: "loading",
      addEventListener() {},
      querySelectorAll: () => [],
      createElement: () => ({ setAttribute() {}, appendChild() {} }),
      head: { appendChild() {} }
    },
    localStorage: { getItem: () => null, setItem() {} },
    console
  };
  sandbox.window = sandbox;
  sandbox.window.__OLAB_TEST__ = {};
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(APPLET, "utf8"), sandbox, { filename: APPLET });
  const hook = sandbox.window.__OLAB_TEST__;
  if (!hook || !hook.stations) throw new Error("the test hook did not appear");
  return hook;
}

/* The values each control is swept over. Coarser than the slider steps, and
   deliberately so: the sweep has to finish, and a task that needs a value
   between two grid points is still reachable on the real slider. */
const GRID = {
  shadow: { lampX: [2, 34, 2], lampY: [-12, 12, 4], objX: [12, 95, 2],
            wallX: [40, 95, 2], two: [false, true], lamp2Y: [-20, 20, 4] },
  mirror: { aim: [-1, 1, 0.02], tilt: [-45, 45, 1], ghost: [false, true] },
  refract: { ang: [0, 85, 0.5], mat: ["water", "glass"], from: ["top", "bot"] },
  lens: { f: [8, 44, 0.5], tilt: [-20, 20, 0.5], kind: ["conv", "div"] },
  bench: { objX: [10, 69, 1], lensX: [26, 72, 2], scrX: [29, 97, 0.5],
           f: [6, 30, 0.5] }
};

function axis(spec) {
  if (!Array.isArray(spec)) throw new Error("bad axis");
  if (typeof spec[0] !== "number") return spec;        // a list of choices
  const [lo, hi, step] = spec;
  const out = [];
  for (let v = lo; v <= hi + 1e-9; v += step) out.push(Math.round(v * 100) / 100);
  return out;
}

function sweep(station, grid, visit) {
  const keys = Object.keys(grid);
  const axes = keys.map((k) => axis(grid[k]));
  const base = station.start();
  const state = Object.assign({}, base);
  let seen = 0;
  const walk = (i) => {
    if (i === keys.length) {
      const s = Object.assign({}, state);
      station.clamp(s);
      // Grid points the clamp had to move are not states the controls can
      // reach, and counting them would pile thousands of copies of one legal
      // state onto the share. Drop them.
      if (keys.some((k) => s[k] !== state[k])) return;
      seen += 1;
      visit(s, station.solve(s));
      return;
    }
    for (const value of axes[i]) {
      state[keys[i]] = value;
      walk(i + 1);
    }
  };
  walk(0);
  return seen;
}

function near(got, want, tol, what) {
  if (Math.abs(got - want) <= tol) return true;
  console.log(`  FAIL ${what}: got ${got}, expected ${want} +- ${tol}`);
  return false;
}

function physics(stations) {
  const by = {};
  stations.forEach((st) => { by[st.id] = st; });
  let ok = true;
  console.log("physics, against values worked out by hand:");

  // Snell's law, air into water at 40 degrees.
  let s = Object.assign(by.refract.start(), { ang: 40, mat: "water", from: "top" });
  let d = by.refract.solve(s);
  ok = near(d.theta2, 28.90, 0.02, "air->water 40 deg refracts to 28.9 deg") && ok;

  // The critical angle out of water, and out of glass.
  s = Object.assign(by.refract.start(), { ang: 10, mat: "water", from: "bot" });
  d = by.refract.solve(s);
  ok = near(d.crit, 48.75, 0.02, "critical angle water->air") && ok;
  s.mat = "glass";
  d = by.refract.solve(s);
  ok = near(d.crit, 41.81, 0.02, "critical angle glass->air") && ok;

  // Past the critical angle nothing gets out.
  s = Object.assign(by.refract.start(), { ang: 60, mat: "water", from: "bot" });
  d = by.refract.solve(s);
  if (!d.total) { console.log("  FAIL water->air at 60 deg should be total"); ok = false; }

  // A mirror returns the ray at the angle it arrived, whatever the tilt.
  let worst = 0;
  for (let tilt = -45; tilt <= 45; tilt += 3) {
    for (let aim = -1; aim <= 1; aim += 0.1) {
      const ms = { aim: aim, tilt: tilt, ghost: false };
      const md = by.mirror.solve(ms);
      const dotIn = -(md.dir[0] * md.n[0] + md.dir[1] * md.n[1]);
      const dotOut = md.refl[0] * md.n[0] + md.refl[1] * md.n[1];
      worst = Math.max(worst, Math.abs(dotIn - dotOut));
    }
  }
  ok = near(worst, 0, 1e-12, "angle in equals angle out, over every tilt") && ok;

  // The thin lens equation, at the symmetric point and at 2:1.
  s = Object.assign(by.bench.start(), { lensX: 50, objX: 30, f: 10, scrX: 70 });
  d = by.bench.solve(s);
  ok = near(d.b, 20, 1e-9, "g = 2f gives b = 2f") && ok;
  ok = near(d.mag, 1, 1e-9, "g = 2f gives magnification 1") && ok;
  if (!d.sharp) { console.log("  FAIL the screen at b should be sharp"); ok = false; }
  s = Object.assign(by.bench.start(), { lensX: 50, objX: 35, f: 10, scrX: 80 });
  d = by.bench.solve(s);
  ok = near(d.b, 30, 1e-9, "g = 1.5f gives b = 3f") && ok;
  ok = near(d.mag, 2, 1e-9, "g = 1.5f gives magnification 2") && ok;

  // An object inside the focal length has no image on any screen.
  s = Object.assign(by.bench.start(), { lensX: 50, objX: 45, f: 20, scrX: 80 });
  d = by.bench.solve(s);
  if (d.real || !d.inside) {
    console.log("  FAIL an object inside f should give a virtual image"); ok = false;
  }
  if (d.hi <= 0) { console.log("  FAIL a virtual image should stand upright"); ok = false; }

  // The parallel bundle meets on the focal plane, f behind the lens.
  s = Object.assign(by.lens.start(), { f: 26, tilt: 0, kind: "conv" });
  d = by.lens.solve(s);
  ok = near(d.meet[0] - 50, 26, 1e-9, "a parallel bundle meets f behind the lens") && ok;
  ok = near(d.missA, 0, 1e-9, "and at the first target") && ok;
  s.tilt = 15;
  d = by.lens.solve(s);
  ok = near(d.missB, 0, 1e-9, "a bundle tilted 15 deg meets the second target") && ok;

  // The shadow grows with the lamp-to-object distance and nothing else.
  s = Object.assign(by.shadow.start(), { lampX: 10, lampY: 0, objX: 50, wallX: 90 });
  d = by.shadow.solve(s);
  ok = near(d.k, 2, 1e-9, "lamp 40 from object, wall 80 from lamp: shadow 2x") && ok;
  s.lampY = 9;
  d = by.shadow.solve(s);
  ok = near(d.k, 2, 1e-9, "and raising the lamp does not change its size") && ok;

  console.log(ok ? "physics OK" : "physics PROBLEMS");
  return ok;
}

function solvability(stations) {
  let ok = true;
  console.log("\ntasks, swept over the controls:");
  for (const station of stations) {
    const grid = GRID[station.id];
    const tasks = station.tasks;
    const hits = tasks.map(() => 0);
    const example = tasks.map(() => null);
    const seen = sweep(station, grid, (s, d) => {
      tasks.forEach((task, i) => {
        if (!task.ok(s, d)) return;
        hits[i] += 1;
        if (!example[i]) example[i] = s;
      });
    });
    console.log(`  ${station.id} (${seen.toLocaleString("en-US")} states)`);
    tasks.forEach((task, i) => {
      const share = hits[i] / seen;
      const note = hits[i] === 0 ? "  <-- UNREACHABLE"
        : (task.kind === "find" && share > 0.5 ? "  <-- too easy" : "");
      if (hits[i] === 0 || (task.kind === "find" && share > 0.5)) ok = false;
      const where = example[i]
        ? JSON.stringify(example[i]).replace(/"/g, "")
        : "-";
      console.log(`    ${task.id} ${task.kind.padEnd(5)} `
        + `${(share * 100).toFixed(3).padStart(8)} %  ${where}${note}`);
    });
  }
  console.log(ok ? "\ntasks OK" : "\ntasks PROBLEMS");
  return ok;
}

function languages(hook) {
  console.log("\ntext, every station and task in every language:");
  let ok = true;
  for (const lang of hook.langs) {
    const t = hook.text[lang];
    if (!t) { console.log(`  FAIL no text for ${lang}`); ok = false; continue; }
    ["name", "station", "tasks", "solved", "reset", "resetAsk", "hit",
     "allDone", "find", "look", "help"].forEach((key) => {
      if (!t[key]) { console.log(`  FAIL ${lang}.${key} missing`); ok = false; }
    });
    for (const station of hook.stations) {
      const st = t.st[station.id];
      if (!st) { console.log(`  FAIL ${lang}.st.${station.id} missing`); ok = false; continue; }
      ["name", "head", "lead"].forEach((key) => {
        if (!st[key]) { console.log(`  FAIL ${lang}.${station.id}.${key}`); ok = false; }
      });
      station.tasks.forEach((task) => {
        if (!st.tasks[task.id]) {
          console.log(`  FAIL ${lang}.${station.id}.tasks.${task.id}`); ok = false;
        }
      });
      // every control and every readout the station asks for must have a label
      station.ctls(station.start()).forEach((spec) => {
        if (spec.kind !== "switch" && !st.ctl[spec.key]) {
          console.log(`  FAIL ${lang}.${station.id}.ctl.${spec.key}`); ok = false;
        }
        if (spec.kind === "toggle") {
          spec.opts.forEach((pair) => {
            if (!t.w[pair[1]]) {
              console.log(`  FAIL ${lang}.w.${pair[1]}`); ok = false;
            }
          });
        }
      });
      const s = station.start();
      station.clamp(s);
      station.out(s, station.solve(s), t, st).forEach((row) => {
        if (row[1] === undefined || row[1] === null || row[1] === "") {
          console.log(`  FAIL ${lang}.${station.id} readout empty`); ok = false;
        }
      });
    }
  }
  const words = hook.langs.map((l) => Object.keys(hook.text[l].w).length);
  if (new Set(words).size !== 1) {
    console.log(`  FAIL the word lists differ in length: ${words.join(", ")}`);
    ok = false;
  }
  console.log(ok ? "text OK" : "text PROBLEMS");
  return ok;
}

const hook = loadStations();
const good = [physics(hook.stations), solvability(hook.stations), languages(hook)]
  .every(Boolean);
console.log(good ? "\n=== ALL GOOD ===" : "\n=== PROBLEMS ABOVE ===");
process.exit(good ? 0 : 1);
