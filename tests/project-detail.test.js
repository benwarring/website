// Renders src/components/ProjectDetail.jsx to static HTML and checks the
// project page markup inside the SiteShell frame. Loaded through a Vite dev
// server in middleware mode, as in tests/home.test.js, so JSX and
// import.meta.env.BASE_URL resolve.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const PROJECTS = [
  { id: 'alpha-editor', title: 'Alpha Editor' },
  { id: 'beta-pipeline', title: 'Beta Pipeline' },
];
const PROJECT = {
  id: 'beta-pipeline',
  title: 'Beta Pipeline',
  summary: 'A pipeline that builds things.',
  tags: ['Python', 'Docker'],
  repo: 'https://github.com/example/beta-pipeline',
};
const { repo: _repo, ...PROJECT_NO_REPO } = PROJECT;
const BODY = createElement('p', { id: 'body-content' }, 'Rendered markdown');

let server;
let ProjectDetail;

before(async () => {
  server = await createServer({
    configFile: false,
    root: projectRoot,
    base: '/website/',
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    logLevel: 'silent',
  });
  ProjectDetail = (await server.ssrLoadModule('/src/components/ProjectDetail.jsx')).default;
});

after(() => server?.close());

function render(project = PROJECT, children = BODY) {
  return renderToStaticMarkup(createElement(ProjectDetail, { project, projects: PROJECTS }, children));
}

function header(html) {
  return html.match(/<header class="page-header container">[\s\S]*?<\/header>/)?.[0] ?? '';
}

function pageBody(html) {
  return html.match(/<div class="page-body container">[\s\S]*?<\/main>/)?.[0] ?? '';
}

test('header has the eyebrow, title, summary and labelled tag list in order', () => {
  assert.match(
    header(render()),
    new RegExp(
      '^<header class="page-header container">' +
        '<p class="eyebrow">Project</p>' +
        '<h1>Beta Pipeline</h1>' +
        '<p class="lead">A pipeline that builds things\\.</p>' +
        '<ul class="tags" aria-label="Technologies"><li class="tag">Python</li><li class="tag">Docker</li></ul>' +
        '<p class="page-links">',
    ),
  );
});

test('page links show the GitHub link then All projects when repo is present', () => {
  assert.match(
    header(render()),
    /<p class="page-links"><a href="https:\/\/github\.com\/example\/beta-pipeline">View on GitHub<\/a><a href="\/website\/projects\/">All projects<\/a><\/p><\/header>$/,
  );
});

test('page links omit the GitHub link when repo is absent', () => {
  const html = render(PROJECT_NO_REPO);
  assert.match(header(html), /<p class="page-links"><a href="\/website\/projects\/">All projects<\/a><\/p>/);
  assert.doesNotMatch(html, /View on GitHub/);
  assert.doesNotMatch(html, /github\.com\/example/);
});

test('page links omit the GitHub link when repo is an empty string', () => {
  assert.doesNotMatch(render({ ...PROJECT, repo: '' }), /View on GitHub/);
});

test('children render inside .prose inside main#main, followed by the back link', () => {
  const html = render();
  assert.match(
    html,
    /<main id="main"><header class="page-header container">[\s\S]*?<\/header><div class="page-body container"><div class="prose"><p id="body-content">Rendered markdown<\/p><\/div><a class="back-link" href="\/website\/projects\/">Back to all projects<\/a><\/div><\/main>/,
  );
});

test('multiple children all land inside .prose', () => {
  const children = [createElement('h2', { key: 'h' }, 'Intro'), createElement('p', { key: 'p' }, 'Details')];
  assert.match(pageBody(render(PROJECT, children)), /<div class="prose"><h2>Intro<\/h2><p>Details<\/p><\/div>/);
});

test('no children renders an empty .prose', () => {
  assert.match(pageBody(render(PROJECT, null)), /<div class="prose"><\/div>/);
});

test('sidebar menu highlights this project', () => {
  const current = [...render().matchAll(/aria-current="true"[^>]*>[\s\S]*?branched-menu__label">([^<]*)</g)];
  assert.deepEqual(current.map((m) => m[1]), ['Beta Pipeline']);
});

test('sidebar menu highlights a different project when shown', () => {
  const html = render({ ...PROJECT, id: 'alpha-editor', title: 'Alpha Editor' });
  const current = [...html.matchAll(/aria-current="true"[^>]*>[\s\S]*?branched-menu__label">([^<]*)</g)];
  assert.deepEqual(current.map((m) => m[1]), ['Alpha Editor']);
});

test('title, summary and tags are HTML-escaped', () => {
  const head = header(
    render({ ...PROJECT, title: 'A <b>bold</b> & title', summary: '<script>x</script>', tags: ['C<T>', 'A&B'] }),
  );
  assert.match(head, /<h1>A &lt;b&gt;bold&lt;\/b&gt; &amp; title<\/h1>/);
  assert.match(head, /<p class="lead">&lt;script&gt;x&lt;\/script&gt;<\/p>/);
  assert.match(head, /<li class="tag">C&lt;T&gt;<\/li><li class="tag">A&amp;B<\/li>/);
  assert.doesNotMatch(head, /<b>|<script>/);
});

test('repo URL is attribute-escaped', () => {
  const html = render({ ...PROJECT, repo: 'https://example.com/?a=1&b="x"' });
  assert.match(html, /<a href="https:\/\/example\.com\/\?a=1&amp;b=&quot;x&quot;">View on GitHub<\/a>/);
});

test('project with no tags renders an empty labelled tag list', () => {
  assert.match(header(render({ ...PROJECT, tags: [] })), /<ul class="tags" aria-label="Technologies"><\/ul>/);
});

test('page renders exactly one main, h1 and header.page-header', () => {
  const html = render();
  assert.equal(html.match(/<main\b/g).length, 1);
  assert.equal(html.match(/<h1\b/g).length, 1);
  assert.equal(html.match(/class="page-header container"/g).length, 1);
});

test('no internal link skips the base and no link opens a new tab', () => {
  const html = render();
  assert.doesNotMatch(html, /href="\/(?!website\/)/);
  assert.doesNotMatch(html, /target="_blank"/);
});
