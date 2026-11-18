// Renders src/components/Home.jsx to static HTML and checks the markup the
// page and its CSS depend on. Plain Node can't import JSX or resolve
// import.meta.env.BASE_URL, so the module is loaded through a Vite dev server
// in middleware mode, using the same base as astro.config.mjs.
//
// The folder click logic is checked without a browser: a small test-only Vite
// plugin gives Home.jsx (and only Home.jsx) a `react` whose useState/useRef/useEffect
// keep their state in globalThis.__homeHooks while a click test sets it, and
// fall through to real React otherwise. Calling Home() then returns its
// element tree, whose folder onClick handlers can be invoked directly.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { Children, createElement, isValidElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const BASE = '/website/';
const SECTIONS = [
  ['projects', '01', 'Projects'],
  ['experience', '02', 'Experience &amp; Teaching'],
  ['skills', '03', 'Skills'],
  ['education', '04', 'Education &amp; Coursework'],
  ['contact', '05', 'Contact'],
];
const PROJECTS = [
  { id: 'alpha-editor', title: 'Alpha Editor', summary: 'A terminal editor.', tags: ['C', 'LSP'] },
  { id: 'beta-pipeline', title: 'Beta Pipeline', summary: 'Extracts data.', tags: ['Python'] },
  { id: 'gamma-docs', title: 'Gamma Docs', summary: 'Writes docs.', tags: ['Python', 'AI'] },
  { id: 'delta-shell', title: 'Delta Shell', summary: 'A shell.', tags: ['Rust'] },
];
const FEATURED = PROJECTS.slice(0, 3);
const HOOKS_URL = '/@home-test-hooks';
const HOOKS_ID = '\0home-test-hooks';
const HOOKS_SOURCE = `
import * as React from 'react';
export * from 'react';
const hooks = () => globalThis.__homeHooks;
function slot(init) {
  const h = hooks();
  const index = h.cursor++;
  if (!(index in h.slots)) h.slots[index] = init();
  return [h.slots, index];
}
export function useState(initial) {
  if (!hooks()) return React.useState(initial);
  const [slots, index] = slot(() => initial);
  return [slots[index], (value) => {
    slots[index] = typeof value === 'function' ? value(slots[index]) : value;
  }];
}
export function useRef(initial) {
  if (!hooks()) return React.useRef(initial);
  const [slots, index] = slot(() => ({ current: initial }));
  return slots[index];
}
export function useEffect(effect, deps) {
  if (!hooks()) return React.useEffect(effect, deps);
  slot(() => null);
}
`;

let server;
let Home;
let html;

before(async () => {
  server = await createServer({
    configFile: false,
    root: projectRoot,
    base: BASE,
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    logLevel: 'silent',
    plugins: [
      {
        name: 'home-test-hooks',
        enforce: 'pre',
        // Vite externalizes bare `react` before resolveId runs, so Home.jsx's
        // import is rewritten to an id the plugin can resolve.
        transform(code, id) {
          if (!/[\\/]src[\\/]components[\\/]Home\.jsx$/.test(id)) return null;
          return code.replace(/from 'react';/, `from '${HOOKS_URL}';`);
        },
        resolveId(id) {
          return id === HOOKS_URL ? HOOKS_ID : null;
        },
        load(id) {
          return id === HOOKS_ID ? HOOKS_SOURCE : null;
        },
      },
    ],
  });
  const mod = await server.ssrLoadModule('/src/components/Home.jsx');
  Home = mod.default;
  html = renderToStaticMarkup(createElement(Home, { projects: PROJECTS }));
});

after(() => server?.close());

function between(start, end) {
  const from = html.indexOf(start);
  assert.ok(from >= 0, `${start} not found`);
  return html.slice(from, html.indexOf(end, from) + end.length);
}

function sectionHtml(id) {
  return between(`<section id="${id}"`, '</section>');
}

function folders() {
  return [...between('<ul class="folders">', '</ul>').matchAll(/<(button|a)\b[^>]*>/g)].map((m) => m[0]);
}

function papers() {
  return [...html.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)].map((m) => m[0]);
}

// ---- static render ----

test('renders inside SiteShell: nav, sidebar, main#main and footer', () => {
  assert.match(html, /<nav class="site-nav"/);
  assert.match(html, /<aside class="sidebar">/);
  assert.match(html, /<main id="main">/);
  assert.match(html, /<footer class="site-footer">/);
  assert.equal(html.match(/<main\b/g).length, 1);
});

test('hero has #top, an aria-hidden background and the name in h1.hero-name', () => {
  assert.match(html, /<div class="hero" id="top"><div class="hero-bg" aria-hidden="true">/);
  assert.match(html, /<h1 class="hero-name">Benjamin Warring<\/h1>/);
  assert.equal(html.match(/<h1\b/g).length, 1);
});

test('hero has downloadable resume, GitHub and mailto buttons', () => {
  const hero = between('<div class="button-row">', '</div>');
  assert.match(hero, /<a class="button" href="\/website\/resume\.pdf" download="">Resume \(PDF\)<\/a>/);
  assert.match(hero, /<a class="button" href="https:\/\/github\.com\/benwarring">GitHub<\/a>/);
  assert.match(hero, /<a class="button" href="mailto:brw009@bucknell\.edu">Email<\/a>/);
});

test('sections follow NAV_LINKS order with two-digit numbers and labelled headings', () => {
  const ids = [...html.matchAll(/<section id="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids, SECTIONS.map(([id]) => id));
  for (const [id, number, title] of SECTIONS) {
    assert.ok(
      sectionHtml(id).startsWith(
        `<section id="${id}" class="section container" aria-labelledby="${id}-heading">` +
          `<div class="section-head"><span class="section-index" aria-hidden="true">${number}</span>` +
          `<h2 id="${id}-heading">${title}</h2></div><div class="section-body">`,
      ),
      `section ${id} head markup differs`,
    );
  }
});

test('has no About section', () => {
  assert.doesNotMatch(html, /id="about"/);
  assert.doesNotMatch(html, />About</);
});

test('one closed folder button per featured project (first three only), then a More link', () => {
  const tags = folders();
  assert.equal(tags.length, FEATURED.length + 1);
  FEATURED.forEach((project, index) => {
    assert.equal(
      tags[index],
      `<button type="button" class="folder" aria-expanded="false" aria-controls="paper-${project.id}">`,
    );
  });
  assert.equal(tags.at(-1), `<a class="folder" href="${BASE}projects/">`);
  const labels = [...between('<ul class="folders">', '</ul>').matchAll(/<span class="folder-label">([^<]*)<\/span>/g)]
    .map((m) => m[1]);
  assert.deepEqual(labels, [...FEATURED.map((p) => p.title), 'More']);
  assert.ok(!sectionHtml('projects').includes('Delta Shell'), 'fourth project shown on the home page');
});

test('folder icons are aria-hidden and no sheet is flying or out at first', () => {
  const icons = between('<ul class="folders">', '</ul>').match(/<span class="folder-icon" aria-hidden="true">/g);
  assert.equal(icons.length, FEATURED.length + 1);
  assert.doesNotMatch(html, /data-flying|data-out/);
});

test('one hidden paper per featured project with title, summary, tags and read-more link', () => {
  const list = papers();
  assert.equal(list.length, FEATURED.length);
  FEATURED.forEach((project, index) => {
    const paper = list[index];
    assert.ok(paper.startsWith(`<article id="paper-${project.id}" class="paper" hidden="">`), paper);
    assert.match(paper, new RegExp(`<p class="label">${index === 0 ? 'Featured project' : 'Project'}</p>`));
    assert.ok(paper.includes(`<h3>${project.title}</h3>`));
    assert.ok(paper.includes(`<p>${project.summary}</p>`));
    const tags = [...paper.matchAll(/<li class="tag">([^<]*)<\/li>/g)].map((m) => m[1]);
    assert.deepEqual(tags, project.tags);
    assert.match(paper, /<ul class="tags" aria-label="Technologies">/);
    assert.ok(paper.includes(`<a href="${BASE}projects/${project.id}/">Read more about ${project.title}</a>`));
  });
});

test('every aria-controls points at a paper on the page', () => {
  for (const [, id] of html.matchAll(/aria-controls="([^"]+)"/g)) {
    assert.match(html, new RegExp(`<article id="${id}"`));
  }
});

test('fewer than three projects gives that many folders; none gives just More', () => {
  const one = renderToStaticMarkup(createElement(Home, { projects: PROJECTS.slice(0, 1) }));
  assert.equal(one.match(/<button type="button" class="folder"/g).length, 1);
  assert.equal(one.match(/<article\b/g).length, 1);
  const none = renderToStaticMarkup(createElement(Home, { projects: [] }));
  assert.doesNotMatch(none, /<button type="button" class="folder"|<article\b/);
  assert.match(none, /<a class="folder" href="\/website\/projects\/">/);
});

test('experience, skills and education sections have their content', () => {
  const experience = sectionHtml('experience');
  assert.equal(experience.match(/<li class="timeline-item">/g).length, 3);
  assert.match(experience, /<h3>Teaching Assistant \(Lab TA \/ Grader\)<\/h3>/);
  const skills = sectionHtml('skills');
  assert.match(skills, /<h3 class="label">Languages<\/h3>/);
  assert.match(skills, /<h3 class="label">Tools and practices<\/h3>/);
  assert.equal(skills.match(/<ul class="tags">/g).length, 2);
  const education = sectionHtml('education');
  assert.match(education, /<p class="lead">Bucknell University<\/p>/);
  assert.match(education, /<ul class="plain-list">/);
});

test('contact has the lead line, both mailto links and the Bucknell email note', () => {
  const contact = sectionHtml('contact');
  assert.match(contact, /<p class="lead">Email is the best way to get in touch\.<\/p>/);
  const list = contact.match(/<ul class="contact-list">[\s\S]*?<\/ul>/)?.[0] ?? '';
  assert.deepEqual(
    [...list.matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g)].map((m) => [m[1], m[2]]),
    [
      ['mailto:brw009@bucknell.edu', 'brw009@bucknell.edu'],
      ['mailto:brw@warring.us', 'brw@warring.us'],
    ],
  );
  assert.match(contact, /I check my Bucknell email more often, but less during the summer\./);
});

test('sections have no inline styles; no target="_blank" or internal link that skips the base', () => {
  for (const [id] of SECTIONS) {
    assert.doesNotMatch(sectionHtml(id), /\sstyle=/, `inline style in #${id}`);
  }
  assert.doesNotMatch(html, /target="_blank"/);
  assert.doesNotMatch(html, /href="\/(?!website\/)/);
});

test('Home no longer exports TagList', async () => {
  const mod = await server.ssrLoadModule('/src/components/Home.jsx');
  assert.equal(mod.TagList, undefined);
});

// ---- folder click logic (no browser) ----

/** Depth-first collection of every element in a React element tree matching `predicate`. */
function findAll(node, predicate, found = []) {
  if (Array.isArray(node)) {
    node.forEach((child) => findAll(child, predicate, found));
  } else if (isValidElement(node)) {
    if (predicate(node)) found.push(node);
    Children.forEach(node.props.children, (child) => findAll(child, predicate, found));
  }
  return found;
}

/**
 * Sets up fake hook state plus stub document/window, restored after the test.
 * Returns `render()`, which calls Home again and reports folder and paper state.
 */
function mountHome(t, { viewTransitions = false, reducedMotion = false } = {}) {
  const saved = { document: globalThis.document, window: globalThis.window };
  const transitions = [];
  globalThis.__homeHooks = { slots: [], cursor: 0 };
  globalThis.document = viewTransitions
    ? {
        startViewTransition(update) {
          transitions.push(update);
          update();
          return { finished: Promise.resolve() };
        },
      }
    : {};
  globalThis.window = { matchMedia: (query) => ({ matches: reducedMotion && /reduce/.test(query) }) };
  t.after(() => {
    delete globalThis.__homeHooks;
    for (const key of ['document', 'window']) {
      if (saved[key] === undefined) delete globalThis[key];
      else globalThis[key] = saved[key];
    }
  });

  function render() {
    globalThis.__homeHooks.cursor = 0;
    const tree = Home({ projects: PROJECTS });
    const buttons = findAll(tree, (el) => el.type === 'button' && el.props.className === 'folder');
    const articles = findAll(tree, (el) => el.type === 'article');
    return {
      click: (index) => buttons[index].props.onClick(),
      expanded: buttons.map((el) => el.props['aria-expanded']),
      shown: articles.map((el) => !el.props.hidden),
    };
  }
  return { render, transitions };
}

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

test('without view transitions a click opens the folder and shows its paper at once', (t) => {
  const { render } = mountHome(t);
  let view = render();
  assert.equal(view.expanded.length, 3);
  assert.deepEqual(view.expanded, [false, false, false]);
  assert.deepEqual(view.shown, [false, false, false]);

  view.click(1);
  view = render();
  assert.deepEqual(view.expanded, [false, true, false]);
  assert.deepEqual(view.shown, [false, true, false]);

  view.click(2);
  view = render();
  assert.deepEqual(view.expanded, [false, false, true], 'only one folder open at a time');
  assert.deepEqual(view.shown, [false, false, true]);

  view.click(2);
  view = render();
  assert.deepEqual(view.expanded, [false, false, false], 'clicking the open folder closes it');
  assert.deepEqual(view.shown, [false, false, false]);
});

test('with reduced motion a click switches state at once even with view transitions', (t) => {
  const { render, transitions } = mountHome(t, { viewTransitions: true, reducedMotion: true });
  render().click(0);
  const view = render();
  assert.deepEqual(view.expanded, [true, false, false]);
  assert.deepEqual(view.shown, [true, false, false]);
  assert.equal(transitions.length, 0);
});

test('with view transitions the folder opens first and the paper follows after ~180 ms', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { render, transitions } = mountHome(t, { viewTransitions: true });
  render().click(0);
  let view = render();
  assert.deepEqual(view.expanded, [true, false, false]);
  assert.deepEqual(view.shown, [false, false, false], 'paper shown before the delay');

  t.mock.timers.tick(179);
  assert.deepEqual(render().shown, [false, false, false]);
  t.mock.timers.tick(1);
  await flushPromises();
  view = render();
  assert.equal(transitions.length, 1);
  assert.deepEqual(view.expanded, [true, false, false]);
  assert.deepEqual(view.shown, [true, false, false]);

  view.click(0);
  await flushPromises();
  view = render();
  assert.equal(transitions.length, 2);
  assert.deepEqual(view.expanded, [false, false, false], 'closing morph did not shut the folder');
  assert.deepEqual(view.shown, [false, false, false]);
});

test('with view transitions a second click while opening cancels the paper', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { render, transitions } = mountHome(t, { viewTransitions: true });
  render().click(0);
  render().click(0);
  t.mock.timers.tick(1000);
  const view = render();
  assert.equal(transitions.length, 0);
  assert.deepEqual(view.expanded, [false, false, false]);
  assert.deepEqual(view.shown, [false, false, false]);
});

test('with view transitions clicking another folder while a paper is shown switches to it', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { render, transitions } = mountHome(t, { viewTransitions: true });
  render().click(0);
  t.mock.timers.tick(180);
  await flushPromises();
  render().click(2);
  await flushPromises();
  const view = render();
  assert.equal(transitions.length, 2);
  assert.deepEqual(view.expanded, [false, false, true]);
  assert.deepEqual(view.shown, [false, false, true]);
});
