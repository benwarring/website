import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Comments stripped so a comment can neither satisfy nor break a check.
const source = readFileSync(new URL('../src/layouts/Base.astro', import.meta.url), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/<!--[\s\S]*?-->/g, '');

// Astro splits a component into a `---` fenced script and the template after it.
const [, frontmatter = '', template = ''] =
  source.match(/^\s*---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/) ?? [];

test('document basics use the title and description props', () => {
  assert.match(template, /<html\s+lang="en"\s*>/);
  assert.match(template, /<meta\s+charset="utf-8"\s*\/?>/i);
  assert.match(template, /<meta\s+name="viewport"\s+content="[^"]*width=device-width[^"]*"/);
  assert.match(template, /<title>\s*\{\s*title\s*\}\s*<\/title>/);
  assert.match(template, /<meta\s+name="description"\s+content=\{\s*description\s*\}/);
  assert.match(frontmatter, /\{\s*title\s*,\s*description\s*\}\s*=\s*Astro\.props/);
});

test('imports the global stylesheet', () => {
  assert.match(frontmatter, /^\s*import\s+['"]\.\.\/styles\/global\.css['"]\s*;?/m);
});

test('loads all three Google Fonts families with display=swap', () => {
  const href = template.match(/<link\s+rel="stylesheet"\s+href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)"/);
  assert.ok(href, 'no fonts.googleapis.com/css2 stylesheet link');
  for (const family of ['Pixelify+Sans', 'Inter', 'JetBrains+Mono']) {
    assert.match(href[1], new RegExp(`[?&]family=${family.replace('+', '\\+')}(?=[:&]|$)`), family);
  }
  assert.match(href[1], /[?&]display=swap(&|$)/);
  assert.match(template, /<link\s+rel="preconnect"\s+href="https:\/\/fonts\.googleapis\.com"\s*\/?>/);
  assert.match(template, /<link\s+rel="preconnect"\s+href="https:\/\/fonts\.gstatic\.com"\s+crossorigin\b/);
});

test('skip link to #main comes before the slot in the body', () => {
  const body = template.match(/<body>([\s\S]*)<\/body>/);
  assert.ok(body, 'no <body> element');
  const skip = body[1].search(/<a\s+class="skip-link"\s+href="#main"\s*>[^<]+<\/a>/);
  const slot = body[1].search(/<slot\s*\/>/);
  assert.ok(skip >= 0, 'no skip link');
  assert.ok(slot >= 0, 'no <slot />');
  assert.ok(skip < slot, 'skip link is after <slot />');
});

test('forbidden constructs are absent', () => {
  assert.match(template, /<html/, 'template is empty');
  assert.doesNotMatch(source, /<script/i);
  assert.doesNotMatch(source, /set:html/);
  assert.doesNotMatch(source, /http:\/\//);
});
