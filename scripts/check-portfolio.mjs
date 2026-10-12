import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { Script } from 'node:vm';
import assert from 'node:assert/strict';
const root = resolve('public');
const home = readFileSync(join(root, 'index.html'), 'utf8');
assert(home.includes('id="globe-canvas"'), 'Root homepage must include the travel globe');
assert(!/CampNou|Back to the pitch|_next\//.test(home), 'Stadium must not remain on the homepage');
assert(home.includes('soccer.css'));
assert.equal(home, readFileSync(join(root, 'portfolio/index.html'), 'utf8'));
for (const path of ['experience.html', 'portfolio/experience.html']) {
  assert(readFileSync(join(root, path), 'utf8').includes('Research Assistant — Morgan State University'));
}
const pages = [];
function walk(dir) { for (const e of readdirSync(dir, {withFileTypes:true})) { const p=join(dir,e.name); if(e.isDirectory()) walk(p); else if(p.endsWith('.html')) pages.push(p); } }
walk(root);
for (const path of pages) {
  const html = readFileSync(path, 'utf8');
  for (const [, ref] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(?:[a-z]+:|#|\/\/)/i.test(ref)) continue;
    const url = ref.split(/[?#]/)[0];
    if (!url) continue;
    // Existing image content is left intact; verify all navigation and code assets.
    if (!/\.html$|\.(?:css|js)$|^\/$/.test(url)) continue;
    assert(existsSync(url.startsWith('/') ? join(root,url) : resolve(dirname(path),url)), `${path}: missing ${url}`);
  }
  for (const [, js] of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) new Script(js, {filename:path});
}
console.log(`Checked ${pages.length} pages: root homepage, legacy routes, scripts, styles, and research role.`);
