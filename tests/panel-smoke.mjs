import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
class Element {
  children=[];style={};attributes={};
  constructor(tag){this.tag=tag;}
  append(...nodes){this.children.push(...nodes);for(const n of nodes)n.parent=this;}
  attachShadow(){this.shadow=new Element('shadow');return this.shadow;}
  setAttribute(k,v){this.attributes[k]=v;}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);}
  focus(){}
  replaceChildren(...nodes){this.children=[];this.append(...nodes);}
}
let timers=new Set(),listeners=new Set();
globalThis.document={body:new Element('body'),createElement:t=>new Element(t),addEventListener:(t,h)=>listeners.add(h),removeEventListener:(t,h)=>listeners.delete(h)};
globalThis.setInterval=fn=>{timers.add(fn);return fn;};
globalThis.clearInterval=fn=>timers.delete(fn);
globalThis.luna={core:{LunaPlugin:{getByName:()=>undefined},modules:{react:{createElement:(type,props,...children)=>({type,props,children})},'@luna/lib':{redux:{store:{getState:()=>({router:{currentParams:{albumId:'1'}}})}}}}}};
const code=await readFile(new URL('../dist/album-version-browser.mjs',import.meta.url),'utf8');
const plugin=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(typeof plugin.Settings,'function');
assert.equal(plugin.onUnload,undefined,'Only the unload set owns cleanup');
assert.equal(document.body.children.length,1);
const shadow=document.body.children[0].shadow;
assert.ok(shadow.children.some(n=>n.tag==='button'&&n.style.display==='block'));
assert.ok(shadow.children.some(n=>n.tag==='button'&&n.textContent==='Versions'));
assert.equal(timers.size,1);
for(const cleanup of plugin.unloads)await cleanup();
assert.equal(document.body.children.length,0);
assert.equal(timers.size,0);
assert.equal(listeners.size,0);
console.log('PASS: built plugin initializes isolated panel and unloads without recursion or leaked timers.');
