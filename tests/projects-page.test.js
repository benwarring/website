// Checks the built all-projects page (dist/projects/index.html) against the
// projects collection: metadata, one paper per entry in `order`, hydration,
// the highlighted menu entry and the /website/ base path.
// It reads the build output and never builds; `npm test` builds first.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const page = new URL('../dist/projects/index.html', import.meta.url);
assert.ok(existsSync(page), 'dist/projects/index.html not found: run `astro build` (or `npm test`) first');
const html = readFileSync(page, 'utf8');

const contentDir = new URL('../src/content/projects/', import.meta.url);

/** Minimal frontmatter parse: `key: value` lines, `[a, b]` lists, optional quotes. */
function parseFrontmatter(source) {
  const block = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(block, 'no frontmatter block');
  const unquote = (s) => s.trim().replace(/^(['"])(.*)\1$/, '$2');
  const data = {};
  for (const line of block[1].split(/\r?\n/)) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (!m) continue;
    const [, key, raw] = m;
    data[key] = raw.startsWith('[')
      ? raw.slice(1, -1).split(',').map(unquote).filter(Boolean)
      : unquote(raw);
  }
  return data;
}

const expected = readdirSync(contentDir)
  .filter((name) => name.endsWith('.md'))
  .map((name) => ({
    id: name.replace(/\.md$/, ''),
    ...parseFrontmatter(readFileSync(new URL(name, contentDir), 'utf8')),
  }))
  .sort((a, b) => Number(a.order) - Number(b.order));

/** Decodes the entities React emits and drops its `<!-- -->` text separators. */
function text(markup) {
  return markup
    .replaceAll('<!-- -->', '')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replaceAll('&amp;', '&');
}

const papers = [...html.matchAll(/<article class="paper">([\s\S]*?)<\/article>/g)].map(([, body]) => ({
  title: text(body.match(/<h3>([\s\S]*?)<\/h3>/)?.[1] ?? ''),
  summary: text(body.match(/<\/h3><p>([\s\S]*?)<\/p>/)?.[1] ?? ''),
  tags: [...body.matchAll(/<li class="tag">([\s\S]*?)<\/li>/g)].map(([, t]) => text(t)),
  links: [...body.matchAll(/<a href="([^"]*)">([\s\S]*?)<\/a>/g)].map(([, href, label]) => [text(href), text(label)]),
}));

test('the collection has entries to compare against', () => {
  assert.ok(expected.length > 0, 'no Markdown files in src/content/projects');
});

test('title and meta description', () => {
  assert.match(html, /<title>Projects · Benjamin Warring<\/title>/);
  assert.match(
    html,
    /<meta name="description" content="Projects by Benjamin Warring, a Computer Science student at Bucknell University\.">/,
  );
});

test('page header and section heading', () => {
  assert.match(html, /<p class="eyebrow">Portfolio<\/p><h1>Projects<\/h1><p class="lead">[^<]+<\/p>/);
  assert.match(html, /<h2 class="label">All projects<\/h2><ul class="paper-list"/);
});

test('one paper per collection entry, sorted by order', () => {
  assert.deepEqual(papers.map((p) => p.title), expected.map((e) => e.title));
});

test('each paper shows its frontmatter title, summary and tags', () => {
  papers.forEach((paper, i) => {
    const entry = expected[i];
    assert.equal(paper.title, entry.title);
    assert.equal(paper.summary, entry.summary);
    assert.deepEqual(paper.tags, entry.tags);
  });
});

test('each paper links to its detail page and, when it has one, its repo', () => {
  papers.forEach((paper, i) => {
    const entry = expected[i];
    const links = [[`/website/projects/${entry.id}/`, `Read more about ${entry.title}`]];
    if (entry.repo) links.push([entry.repo, `View ${entry.title} on GitHub`]);
    assert.deepEqual(paper.links, links);
  });
});

test('the ProjectsIndex component is hydrated on load', () => {
  const island = html.match(/<astro-island\b[^>]*>/)?.[0];
  assert.ok(island, 'no astro-island');
  assert.match(island, /\sclient="load"/);
  assert.match(island, /\scomponent-url="\/website\/_astro\/ProjectsIndex\.[^"]+\.js"/);
});

test('only plain project fields are serialized', () => {
  assert.ok(!html.includes('## Overview') && !html.includes('What I built'), 'Markdown body leaked into the page');
  assert.ok(!html.includes('src/content/projects'), 'file path leaked into the page');
});

test('the sidebar highlights "All projects" and nothing else', () => {
  const current = [...html.matchAll(/<button[^>]*aria-current="true"[^>]*>([\s\S]*?)<\/button>/g)];
  assert.equal(current.length, 1, 'expected exactly one highlighted menu entry');
  assert.match(current[0][1], /<span class="branched-menu__label">All projects<\/span>/);
});

test('every root-relative URL starts with the /website/ base', () => {
  const urls = [...html.matchAll(/\s(?:href|src|component-url|renderer-url)="(\/[^"]*)"/g)].map((m) => m[1]);
  assert.ok(urls.length > 0, 'no root-relative URLs found');
  assert.deepEqual(urls.filter((url) => !url.startsWith('/website/')), []);
});
