/* Tests for theme/static/js/gate.js, the password gate on the gated pages.
 *
 *     node tools/test_gate_js.mjs
 *
 * The gate has no build step and no module system, so the tests load it the way a
 * browser does: evaluate the file against a stub DOM and drive its submit handler.
 * Payloads are built here with Node's own WebCrypto, so the test is self-contained.
 *
 * Two groups matter. The **classification** group holds down that only the
 * authentication tag may report a wrong password: a network failure, an
 * unreadable payload or a render error must each say what actually happened,
 * because telling a reader their correct password is wrong sends them looking in
 * the wrong place. The **document** group covers gated pages that carry prose and
 * encrypted media instead of a simulator.
 *
 * This file lives in tools/ rather than beside gate.js on purpose: build.py copies
 * theme/static/ to docs/assets/, so a test placed there would be published.
 */
import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
import path from "node:path";
import vm from "node:vm";

const ROOT = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const GATE = path.join(ROOT, "theme/static/js/gate.js");
const source = readFileSync(GATE, "utf8");
const crypto = webcrypto;

let failures = 0;
function check(name, condition, detail) {
  if (condition) console.log("  pass  " + name);
  else { failures++; console.log("  FAIL  " + name + (detail ? "   " + detail : "")); }
}

/* ------------------------------------------------------------- payload builder */

const ITERATIONS = 1000;               // the real packer uses 310000; speed over cost here
const enc = new TextEncoder();

async function keyFor(password, salt) {
  const material = await crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

const b64 = (buf) => Buffer.from(buf).toString("base64");

async function makePayload(document_, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await keyFor(password, salt);
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(document_)));
  return {
    payload: { v: 3, kdf: { name: "PBKDF2", hash: "SHA-256", iterations: ITERATIONS, salt: b64(salt) },
               cipher: "AES-GCM", iv: b64(iv), ct: b64(ct) },
    salt, key
  };
}

async function makeAsset(bytes, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes));
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv, 0); out.set(ct, iv.length);
  return out;
}

/* ------------------------------------------------------------------- stub DOM */

function makeElement(extra = {}) {
  const node = {
    dataset: {}, value: "", disabled: false, hidden: false, textContent: "",
    className: "", style: {}, innerHTML: "", src: "", tagName: "DIV", attrs: {},
    children: [],
    getAttribute(k) { return this.attrs[k] ?? null; },
    setAttribute(k, v) { this.attrs[k] = v; },
    removeAttribute(k) { delete this.attrs[k]; },
    querySelector: () => makeElement(),
    querySelectorAll: () => [],
    addEventListener() {}, replaceChildren() {}, select() {},
    insertAdjacentHTML() {}, load() {}, play() { return Promise.resolve(); },
    ...extra
  };
  return node;
}

async function run({ fetchImpl, password, document_, breakReveal, mediaNodes }) {
  let submitHandler = null;
  const message = makeElement();
  const gate = makeElement({ dataset: { payload: "/payload.json" } });
  const form = makeElement({
    addEventListener(type, fn) { if (type === "submit") submitHandler = fn; }
  });
  const intro = makeElement({ querySelectorAll: () => mediaNodes || [] });
  const nodes = {
    "[data-gate-form]": form,
    "[data-gate-input]": makeElement({ value: password }),
    "[data-gate-submit]": makeElement(),
    "[data-gate-message]": message,
    "[data-gate-stage]": makeElement({
      replaceChildren() { if (breakReveal) throw new Error("boom"); }
    }),
    "[data-gate-caption]": makeElement()
  };
  gate.querySelector = (sel) => nodes[sel] || makeElement();

  const sandbox = {
    document: {
      querySelector: (sel) => (sel === "[data-gate]" ? gate
                             : sel === "[data-gate-intro]" ? intro : makeElement()),
      createElement: () => makeElement({ addEventListener() {} }),
      documentElement: { dataset: {} }
    },
    window: { matchMedia: () => ({ matches: false }), addEventListener() {}, console, crypto },
    crypto, fetch: fetchImpl, TextEncoder, TextDecoder, Blob, URL,
    atob: (t) => Buffer.from(t, "base64").toString("binary"),
    console, Promise, Error, JSON, Math, String, Uint8Array, Array
  };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  await submitHandler({ preventDefault() {} });
  await new Promise((r) => setTimeout(r, 150));
  return { message: message.textContent, gate, intro };
}

const respond = (json) => () => Promise.resolve({ ok: true, json: () => Promise.resolve(json) });

/* --------------------------------------------------------------------- tests */

console.log("gate.js — failure classification");
const good = await makePayload({ intro: "<p>prose</p>", panel: "<h1>panel</h1>" }, "right-password");
const broken = await (async () => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await keyFor("right-password", salt);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode("not json"));
  return { v: 3, kdf: { name: "PBKDF2", hash: "SHA-256", iterations: ITERATIONS, salt: b64(salt) },
           cipher: "AES-GCM", iv: b64(iv), ct: b64(ct) };
})();

const CASES = [
  ["correct password", { fetchImpl: respond(good.payload), password: "right-password" }, ""],
  ["wrong password", { fetchImpl: respond(good.payload), password: "wrong-one" }, "does not open"],
  ["HTTP 404", { fetchImpl: () => Promise.resolve({ ok: false, status: 404 }), password: "x" }, "could not be fetched"],
  ["network down", { fetchImpl: () => Promise.reject(new TypeError("failed")), password: "x" }, "could not be fetched"],
  ["payload not JSON", { fetchImpl: () => Promise.resolve({ ok: true, json: () => Promise.reject(new SyntaxError("bad")) }), password: "x" }, "fault"],
  ["decrypts, content broken", { fetchImpl: respond(broken), password: "right-password" }, "could not be"],
  ["reveal throws", { fetchImpl: respond(good.payload), password: "right-password", breakReveal: true }, "could not be displayed"]
];
for (const [label, opts, expect] of CASES) {
  const { message } = await run(opts);
  const ok = expect === "" ? message === "" : message.includes(expect);
  check(label, ok, "got: " + (message || "(revealed)"));
}

console.log("\ngate.js — document-style gated pages");
const doc = await makePayload({ intro: "<p>the battery results</p>" }, "anabrid-password");
{
  const { message, gate, intro } = await run({
    fetchImpl: respond(doc.payload), password: "anabrid-password"
  });
  check("a payload with no panel still unlocks", message === "", "got: " + message);
  check("its prose is injected", intro.innerHTML.includes("the battery results"), intro.innerHTML);
  check("the gate reports itself open", gate.dataset.state === "open", gate.dataset.state);
}

console.log("\ngate.js — encrypted media");
{
  const clip = new Uint8Array([0, 0, 0, 24, 102, 116, 121, 112, 1, 2, 3, 4, 5]);
  const asset = await makeAsset(clip, doc.key);
  const video = makeElement({ tagName: "VIDEO", attrs: { "data-enc": "/media-enc/bms/clip.mp4.enc", "data-type": "video/mp4" } });
  let assetFetched = false;
  const fetchImpl = (url) => {
    if (String(url).endsWith(".enc")) {
      assetFetched = true;
      return Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(asset.buffer) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve(doc.payload) });
  };
  const { video: _ } = {};
  await run({ fetchImpl, password: "anabrid-password", mediaNodes: [video] });
  check("the encrypted asset is fetched only after unlock", assetFetched);
  check("it decrypts to a blob URL on the element", String(video.src).startsWith("blob:"), video.src);
  check("the data-enc marker is cleared once loaded", video.getAttribute("data-enc") === null);
}
{
  const video = makeElement({ tagName: "VIDEO", attrs: { "data-enc": "/media-enc/bms/clip.mp4.enc" } });
  let fetched = false;
  const fetchImpl = (url) => {
    if (String(url).endsWith(".enc")) { fetched = true; return Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new Uint8Array(40).buffer) }); }
    return Promise.resolve({ ok: true, json: () => Promise.resolve(doc.payload) });
  };
  await run({ fetchImpl, password: "wrong-password", mediaNodes: [video] });
  check("a wrong password fetches no media at all", !fetched);
}

console.log(failures === 0 ? "\nall tests passed" : `\n${failures} test(s) failed`);
process.exit(failures === 0 ? 0 : 1);
