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
  const linked = /<link rel="stylesheet" href="\/[^"]+\.css"/.test(html);
  const inlined = /<style>[^<]*--accent:/.test(html);
  assert.ok(linked || inlined, 'no stylesheet link and no inlined global CSS');
});

test('folders show exactly the first three projects by order, then More', () => {
  const folders = html.match(/<ul class="folders">[\s\S]*?<\/ul>/)?.[0] ?? '';
  const labels = [...folders.matchAll(/<span class="folder-label">([^<]+)<\/span>/g)].map((m) => m[1]);
  assert.deepEqual(labels, ['bIDE', 'ReGen', 'DocuGen', 'More']);
  const controls = [...folders.matchAll(/<button[^>]*aria-controls="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(controls, ['paper-bide', 'paper-regen', 'paper-docugen']);
  assert.match(folders, /<a class="folder" href="\/projects\/">/);
});

test('each featured paper links to its project page; no other project is featured', () => {
  const papers = [...html.matchAll(/<article id="paper-([^"]+)"[\s\S]*?<\/article>/g)];
  assert.deepEqual(papers.map((m) => m[1]), ['bide', 'regen', 'docugen']);
  for (const [paper, id] of papers) {
    // Hydratable output separates adjacent text nodes with <!-- -->.
    assert.match(paper, new RegExp(`<a href="/projects/${id}/">Read more about (?:<!-- -->)?[^<]+</a>`));
  }
});

test('the About section is gone', () => {
  assert.doesNotMatch(html, /id="about"/);
  assert.doesNotMatch(html, /href="[^"]*#about"/);
});

test('the Home component is hydrated on load', () => {
  assert.match(html, /<astro-island\b[^>]*\sclient="load"/);
});

test('only plain project fields are serialized', () => {
  assert.ok(!html.includes('What I built'), 'Markdown body leaked into the page');
  assert.ok(!html.includes('src/content/projects'), 'file path leaked into the page');
});

test('root-relative URLs are site-root paths, with no leftover /website/ prefix', () => {
  const urls = [...html.matchAll(/\s(?:href|src|component-url|renderer-url)="(\/[^"]*)"/g)].map((m) => m[1]);
  assert.ok(urls.length > 0, 'no root-relative URLs found');
  assert.deepEqual(urls.filter((url) => url.startsWith('/website/')), []);
});
