import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
let callback;
let disposals = 0;
let registrations = 0;
const state = [];
const react = {
  useState: value => { const resolved = typeof value === "function" ? value() : value; state.push(resolved); return [resolved, () => {}]; },
  useRef: value => ({ current: value }), useEffect() {},
  createElement: (type, props, ...children) => ({ type, props, children }),
};
const core = { Tracer: () => ({ trace: { msg: { log() {} } } }), LunaPlugin: { getByName: () => undefined } };
globalThis.luna = { core: { ...core, modules: {
  react, "@luna/core": core, "@luna/ui": { LunaSettings: "settings" },
  "@luna/lib": { redux: { intercept(type, unloads, cb) {
    assert.equal(type, "search/SEARCH_RESULT_SUCCESS"); registrations++; callback = cb;
    unloads.add(() => { disposals++; });
  } } },
} } };
const code = await readFile(new URL("../dist/album-version-browser.mjs", import.meta.url), "utf8");
const plugin = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
function find(node, test) { if (test(node)) return node; return node?.children?.flat(Infinity).map(child => find(child, test)).find(Boolean); }
const probe = find(plugin.Settings(), node => typeof node?.type === "function").type;
const start = find(probe(), node => node?.type === "button" && node.children.includes("Start / reset observation"));
start.props.onClick();
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(registrations, 1);
assert.notEqual(callback({ albums: { items: [{ id: 77699617, title: "Currents", artist: { name: "Tame Impala" } }] } }), true);
probe(); let snapshot = state.at(-1);
assert.equal(snapshot.albums.length, 1);
assert.equal(snapshot.albums[0].id, "77699617");
assert.ok(!snapshot.albums.some(album => album.id === "47696788"), "Known IDs must not be injected");
callback({ albums: { items: [{ id: 77699617 }, { id: 47696788 }] } });
probe(); assert.equal(state.at(-1).albums.length, 2);
callback({}); probe(); assert.equal(state.at(-1).events, 3);
start.props.onClick(); await new Promise(resolve => setTimeout(resolve, 0));
probe(); assert.equal(state.at(-1).albums.length, 0); assert.equal(disposals, 1);
callback({ albums: { items: Array.from({ length: 120 }, (_, id) => ({ id })) } });
probe(); assert.equal(state.at(-1).albums.length, 100);
plugin.onUnload(); assert.equal(disposals, 2); assert.equal(plugin.unloads.size, 0);
console.log("PASS: observer lifecycle, reset, deduplication, bound, missing payload, and no injected known IDs.");
