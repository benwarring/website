// Renders src/components/Home.jsx to static HTML and checks the markup the
// page and its CSS depend on. Plain Node can't import JSX or resolve
// import.meta.env.BASE_URL, so the module is loaded through a Vite dev server
// in middleware mode, using the same base as astro.config.mjs.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const BASE = '/website/';
const SECTION_IDS = ['about', 'projects', 'experience', 'skills', 'education', 'contact'];
const PROJECTS = [
  { id: 'alpha-editor', title: 'Alpha Editor', summary: 'A terminal editor.', tags: ['C', 'LSP'] },
  { id: 'beta-pipeline', title: 'Beta Pipeline', summary: 'Extracts data.', tags: ['Python'] },
  { id: 'gamma-docs', title: 'Gamma Docs', summary: 'Writes docs.', tags: ['Python', 'AI'] },
];

let server;
let TagList;
let html;

before(async () => {
  server = await createServer({
    configFile: false,
    root: projectRoot,
    base: BASE,
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    logLevel: 'silent',
  });
  const mod = await server.ssrLoadModule('/src/components/Home.jsx');
  TagList = mod.TagList;
  html = renderToStaticMarkup(createElement(mod.default, { projects: PROJECTS }));
});

after(() => server?.close());

test('renders the name in an h1 and a main landmark', () => {
  assert.match(html, /<h1[^>]*>Benjamin Warring/);
  assert.match(html, /<main id="main">/);
});

test('every nav link targets a section id on the page', () => {
  const nav = html.match(/<nav class="site-nav"[\s\S]*?<\/nav>/)?.[0] ?? '';
  const targets = [...nav.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(targets, SECTION_IDS);
  for (const id of targets) {
    assert.match(html, new RegExp(`<section id="${id}"`), `no section with id="${id}"`);
  }
});

test('renders one project card per entry, in order, with title, summary, tags and link', () => {
  const cards = [...html.matchAll(/<li class="card">([\s\S]*?)<\/ul><\/li>/g)].map((m) => m[1]);
  assert.equal(cards.length, PROJECTS.length);
  PROJECTS.forEach((project, index) => {
    const card = cards[index];
    assert.match(card, new RegExp(`<a href="${BASE}projects/${project.id}/">${project.title}</a>`));
    assert.ok(card.includes(`<p>${project.summary}</p>`), `summary missing in ${project.id}`);
    const tags = [...card.matchAll(/<li class="tag">([^<]*)<\/li>/g)].map((m) => m[1]);
    assert.deepEqual(tags, project.tags);
  });
});

test('hero has GitHub, mailto and downloadable resume links', () => {
  assert.match(html, /<a class="button" href="https:\/\/github\.com\/benwarring">/);
  assert.match(html, /<a class="button" href="mailto:[^"]+@[^"]+">/);
  assert.match(html, /<a class="button" href="\/website\/resume\.pdf" download="">/);
});

test('has no inline styles, no target="_blank" and no internal link that skips the base', () => {
  assert.doesNotMatch(html, /\sstyle=/);
  assert.doesNotMatch(html, /target="_blank"/);
  assert.doesNotMatch(html, /href="\/(?!website\/)/);
});

test('TagList renders one li.tag per item and sets aria-label only when given', () => {
  const labelled = renderToStaticMarkup(createElement(TagList, { items: ['a', 'b'], label: 'Tech' }));
  assert.equal(labelled, '<ul class="tags" aria-label="Tech"><li class="tag">a</li><li class="tag">b</li></ul>');
  const unlabelled = renderToStaticMarkup(createElement(TagList, { items: ['a'] }));
  assert.equal(unlabelled, '<ul class="tags"><li class="tag">a</li></ul>');
});
