// Checks the built home page (dist/index.html) for what only the real build
// can show: the shell, styles, collection content, hydration and base path.
// It reads the build output and never builds; `npm test` builds first.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const page = new URL('../dist/index.html', import.meta.url);
assert.ok(existsSync(page), 'dist/index.html not found: run `astro build` (or `npm test`) first');
const html = readFileSync(page, 'utf8');

test('the Base shell wraps the page', () => {
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<title>Benjamin Warring<\/title>/);
  assert.match(html, /<meta name="description" content="[^"]+">/);
  const skip = html.search(/<a class="skip-link" href="#main">/);
  const main = html.search(/id="main"/);
  assert.ok(skip >= 0, 'no skip link');
  assert.ok(main >= 0, 'no id="main"');
  assert.ok(skip < main, 'skip link comes after id="main"');
});

test('the global stylesheet reaches the page', () => {
  const linked = /<link rel="stylesheet" href="\/website\/[^"]+\.css"/.test(html);
  const inlined = /<style>[^<]*--accent:/.test(html);
  assert.ok(linked || inlined, 'no /website/ stylesheet link and no inlined global CSS');
});

test('project cards come from the collection, sorted by order', () => {
  const links = [...html.matchAll(/<li class="card"><h3><a href="([^"]+)">([^<]+)<\/a>/g)]
    .map(([, href, title]) => [title, href]);
  assert.deepEqual(links, [
    ['bIDE', '/website/projects/bide/'],
    ['ReGen', '/website/projects/regen/'],
    ['DocuGen', '/website/projects/docugen/'],
  ]);
});

test('the Home component is hydrated on load', () => {
  assert.match(html, /<astro-island\b[^>]*\sclient="load"/);
});

test('only plain project fields are serialized', () => {
  assert.ok(!html.includes('What I built'), 'Markdown body leaked into the page');
  assert.ok(!html.includes('src/content/projects'), 'file path leaked into the page');
});

test('every root-relative URL starts with the /website/ base', () => {
  const urls = [...html.matchAll(/\s(?:href|src|component-url|renderer-url)="(\/[^"]*)"/g)].map((m) => m[1]);
  assert.ok(urls.length > 0, 'no root-relative URLs found');
  assert.deepEqual(urls.filter((url) => !url.startsWith('/website/')), []);
});
