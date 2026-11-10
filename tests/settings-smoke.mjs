// Verify the built settings entry can load even when the optional album API is absent.
// This is a mocked host check, not a substitute for an in-client React test.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const updates = [];
const react = {
  useState: value => [value, next => updates.push(next)],
  useRef: value => ({ current: value }),
  useEffect: () => {},
  createElement: (type, props, ...children) => ({ type, props, children }),
};
const core = {
  Tracer: () => ({ trace: { msg: { log() {} } } }),
  LunaPlugin: { getByName: () => undefined },
};
globalThis.luna = { core: { ...core, modules: {
  react, "@luna/core": core, "@luna/ui": { LunaSettings: "settings" },
  // @luna/lib deliberately omitted.
} } };
const code = await readFile(new URL("../dist/album-version-browser.mjs", import.meta.url), "utf8");
assert.ok(!code.includes('getByName("@luna/example")'), "Bundle must use the new plugin identity");
const plugin = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
assert.equal(typeof plugin.Settings, "function");
const tree = plugin.Settings();
function findButton(node) {
  if (node?.type === "button") return node;
  return node?.children?.flat(Infinity).map(findButton).find(Boolean);
}
const button = findButton(tree);
assert.ok(button, "Settings must include the read button");
assert.ok(button.children.includes("Read two test albums"));
await button.props.onClick();
const results = updates.find(value => Array.isArray(value) && value.length === 2);
assert.deepEqual(results.map(result => result.id), ["77699617", "47696788"]);
assert.ok(results.every(result => result.error));
console.log("PASS: settings and button load without album API; both failures become visible results.");
