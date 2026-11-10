import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
let callback;
const cache = { content: { albumLists: {}, albums: {} } };
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
  "@luna/lib": { redux: { store: { getState: () => cache }, intercept(type, unloads, cb) {
    assert.equal(type, "search/SEARCH_RESULT_SUCCESS"); registrations++; callback = cb;
    unloads.add(() => { disposals++; });
  } } },
} } };
const code = await readFile(new URL("../dist/album-version-browser.mjs", import.meta.url), "utf8");
const plugin = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
// Model Luna registering onUnload in the plugin cleanup set before any user action.
assert.ok(plugin.unloads instanceof Set, "Luna must be able to drain exported cleanup");
const hostUnloads = plugin.unloads;
if (plugin.onUnload) hostUnloads.add(plugin.onUnload);
function find(node, test) { if (test(node)) return node; return node?.children?.flat(Infinity).map(child => find(child, test)).find(Boolean); }
const probe = find(plugin.Settings(), node => typeof node?.type === "function").type;
const start = find(probe(), node => node?.type === "button" && node.children.includes("Start / reset observation"));
await start.props.onClick();
assert.equal(registrations, 1);
const query = "Currents Tame Impala";
const key = `search/albums/${encodeURIComponent(query)}`;
cache.content.albums = {
  77699617: { id: 77699617, title: "Currents", artist: { name: "Tame Impala" } },
  47696788: { id: 47696788, title: "Currents", artist: { name: "Tame Impala" } },
};
assert.notEqual(callback({ query }), true);
// Simulate the reducer updating the list after the interceptor returns.
cache.content.albumLists[key] = { sorted: { defaultSort: { items: [77699617] } } };
await Promise.resolve(); probe();
assert.deepEqual(state.at(-1).albums.map(a => a.id), ["77699617"]);
assert.ok(!state.at(-1).albums.some(a => a.id === "47696788"), "Global cache must not leak into query results");
cache.content.albumLists[key].sorted.defaultSort.items = [77699617, 47696788, 77699617];
callback({ query }); await Promise.resolve(); probe();
assert.equal(state.at(-1).albums.length, 2);
assert.equal(state.at(-1).events, 2);
await start.props.onClick(); assert.equal(disposals, 1);
callback({ query: "Uncached query" }); await Promise.resolve(); probe();
assert.equal(state.at(-1).albums.length, 0);
assert.match(state.at(-1).status, /without an album list/);
// Stop before queued state read: it must not repopulate results.
callback({ query });
for (const dispose of hostUnloads) dispose();
await Promise.resolve(); probe();
assert.equal(state.at(-1).albums.length, 0);
assert.equal(disposals, 2);
for (const dispose of hostUnloads) dispose();
assert.equal(disposals, 2);
hostUnloads.clear();
console.log("PASS: query-specific cached IDs, post-reducer timing, no global-cache injection, reset and queued-read cleanup.");
