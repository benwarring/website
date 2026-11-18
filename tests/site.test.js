// Renders src/components/Site.jsx (SiteShell, TagList, constants) to static
// HTML and checks the markup and link targets every page relies on. Loaded
// through a Vite dev server in middleware mode, as in tests/home.test.js, so
// JSX and import.meta.env.BASE_URL resolve. Menu navigation is checked by
// calling the onSelect handler SiteShell hands to BranchedMenu, with a stub
// window, since the menu entries are buttons, not links.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { loadReact, reactShim } from './helpers/react.js';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const BASE = '/website/';
const SECTION_IDS = ['projects', 'experience', 'skills', 'education', 'contact'];
const PROJECTS = [
  { id: 'alpha-editor', title: 'Alpha Editor' },
  { id: 'beta-pipeline', title: 'Beta Pipeline' },
];
let CHILD; // sample page content element, built in before() once React is loaded

let server;
// Set in before() from loadReact(server); see tests/helpers/react.js.
let Children, createElement, isValidElement, renderToStaticMarkup;
let site;
let BranchedMenu;
let html;

before(async () => {
  server = await createServer({
    configFile: false,
    root: projectRoot,
    base: BASE,
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    logLevel: 'silent',
    plugins: [reactShim],
  });
  ({ Children, createElement, isValidElement, renderToStaticMarkup } = await loadReact(server));
  CHILD = createElement('p', { id: 'page-content' }, 'Page body');
  site = await server.ssrLoadModule('/src/components/Site.jsx');
  BranchedMenu = (await server.ssrLoadModule('/src/components/reactbits/BranchedMenu.jsx')).default;
  html = renderShell();
});

after(() => server?.close());

function renderShell(props = {}) {
  return renderToStaticMarkup(createElement(site.SiteShell, { projects: PROJECTS, ...props }, CHILD));
}

function section(pattern) {
  return html.match(pattern)?.[0] ?? '';
}

function hrefs(markup) {
  return [...markup.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
}

function menuLabels(markup) {
  return [...markup.matchAll(/<span class="branched-menu__label">([^<]*)<\/span>/g)].map((m) => m[1]);
}

/** Depth-first search of a React element tree for the first element of `type`. */
function findElement(node, type) {
  if (!isValidElement(node)) return null;
  if (node.type === type) return node;
  for (const child of Children.toArray(node.props.children)) {
    const found = findElement(child, type);
    if (found) return found;
  }
  return null;
}

function menuProps() {
  // SiteShell uses no hooks, so it can be called directly to get its element tree.
  const tree = site.SiteShell({ projects: PROJECTS, children: CHILD });
  const menu = findElement(tree, BranchedMenu);
  assert.ok(menu, 'SiteShell renders no BranchedMenu');
  return menu.props;
}

test('site constants have the expected values', () => {
  assert.equal(site.BASE, BASE);
  assert.equal(site.NAME, 'Benjamin Warring');
  assert.equal(site.EMAIL, 'brw009@bucknell.edu');
  assert.equal(site.PERSONAL_EMAIL, 'brw@warring.us');
  assert.equal(site.GITHUB_URL, 'https://github.com/benwarring');
  assert.equal(site.RESUME_URL, '/website/resume.pdf');
});

test('NAV_LINKS lists the home sections in order with labels and icons, and no About', () => {
  assert.deepEqual(site.NAV_LINKS.map((link) => link.id), SECTION_IDS);
  for (const link of site.NAV_LINKS) {
    assert.equal(typeof link.label, 'string');
    assert.ok(link.label.length > 0, `${link.id} has no label`);
    assert.ok(link.icon, `${link.id} has no icon`);
  }
  assert.ok(!site.NAV_LINKS.some((link) => /about/i.test(link.id) || /about/i.test(link.label)));
});

test('top nav links the brand to the base and every section to /website/#<id>', () => {
  const nav = section(/<nav class="site-nav"[\s\S]*?<\/nav>/);
  assert.match(nav, /<a class="brand" href="\/website\/">Benjamin Warring<\/a>/);
  assert.deepEqual(hrefs(nav), [BASE, ...SECTION_IDS.map((id) => `${BASE}#${id}`)]);
  assert.doesNotMatch(nav, /About/);
});

test('sidebar has the brand, GitHub, mailto and a downloadable resume link', () => {
  const sidebar = section(/<aside class="sidebar">[\s\S]*?<\/aside>/);
  assert.match(sidebar, /<a class="brand" href="\/website\/">Benjamin Warring<\/a>/);
  assert.match(sidebar, /<a href="https:\/\/github\.com\/benwarring">GitHub<\/a>/);
  assert.match(sidebar, /<a href="mailto:brw009@bucknell\.edu">Email<\/a>/);
  assert.match(sidebar, /<a href="\/website\/resume\.pdf" download="">Resume \(PDF\)<\/a>/);
});

test('children render inside main#main', () => {
  assert.match(html, /<main id="main"><p id="page-content">Page body<\/p><\/main>/);
});

test('footer shows the name and a Back to top link to #main', () => {
  const footer = section(/<footer class="site-footer">[\s\S]*?<\/footer>/);
  assert.match(footer, /<span>Benjamin Warring<\/span>/);
  assert.match(footer, /<a href="#main">Back to top<\/a>/);
});

test('sidebar menu has a Home group of sections and a Projects group led by All projects', () => {
  const menu = section(/<nav class="branched-menu[\s\S]*?<\/nav>/);
  assert.match(menu, /<button[^>]*class="branched-menu__head"[^>]*>Home<\/button>/);
  assert.match(menu, /<button[^>]*class="branched-menu__head"[^>]*>Projects<\/button>/);
  const sectionLabels = site.NAV_LINKS.map((link) => link.label);
  assert.deepEqual(menuLabels(menu), [...sectionLabels, 'All projects', ...PROJECTS.map((p) => p.title)]);
});

test('menu highlights the first section when active is omitted', () => {
  const current = [...html.matchAll(/aria-current="true"[^>]*>[\s\S]*?branched-menu__label">([^<]*)</g)];
  assert.deepEqual(current.map((m) => m[1]), ['Projects']);
});

test('menu highlights the entry named by active', () => {
  const markup = renderShell({ active: 'project:beta-pipeline' });
  const current = [...markup.matchAll(/aria-current="true"[^>]*>[\s\S]*?branched-menu__label">([^<]*)</g)];
  assert.deepEqual(current.map((m) => m[1]), ['Beta Pipeline']);
});

test('menu entries carry the expected values and hrefs', () => {
  const [home, projects] = menuProps().items;
  assert.equal(home.label, 'Home');
  assert.deepEqual(
    home.children.map(({ value, href }) => [value, href]),
    SECTION_IDS.map((id) => [id, `${BASE}#${id}`]),
  );
  assert.equal(projects.label, 'Projects');
  assert.deepEqual(projects.children.map(({ value, href }) => [value, href]), [
    ['all-projects', '/website/projects/'],
    ['project:alpha-editor', '/website/projects/alpha-editor/'],
    ['project:beta-pipeline', '/website/projects/beta-pipeline/'],
  ]);
});

test('menu with no projects still has All projects', () => {
  const tree = site.SiteShell({ projects: [], children: CHILD });
  const [, projects] = findElement(tree, BranchedMenu).props.items;
  assert.deepEqual(projects.children.map((entry) => entry.value), ['all-projects']);
});

test('selecting a menu entry navigates to its href with window.location.assign', (t) => {
  const assigned = [];
  const hadWindow = 'window' in globalThis;
  const previous = globalThis.window;
  globalThis.window = { location: { assign: (url) => assigned.push(url) } };
  t.after(() => {
    if (hadWindow) globalThis.window = previous;
    else delete globalThis.window;
  });

  const { items, onSelect } = menuProps();
  for (const entry of items.flatMap((group) => group.children)) {
    onSelect(entry.value, entry);
  }
  assert.deepEqual(assigned, [
    ...SECTION_IDS.map((id) => `${BASE}#${id}`),
    '/website/projects/',
    '/website/projects/alpha-editor/',
    '/website/projects/beta-pipeline/',
  ]);
});

test('no internal link skips the base and no link opens a new tab', () => {
  assert.doesNotMatch(html, /href="\/(?!website\/)/);
  assert.doesNotMatch(html, /target="_blank"/);
});

test('TagList renders one li.tag per item and sets aria-label only when given', () => {
  const labelled = renderToStaticMarkup(createElement(site.TagList, { items: ['a', 'b'], label: 'Tech' }));
  assert.equal(labelled, '<ul class="tags" aria-label="Tech"><li class="tag">a</li><li class="tag">b</li></ul>');
  const unlabelled = renderToStaticMarkup(createElement(site.TagList, { items: ['a'] }));
  assert.equal(unlabelled, '<ul class="tags"><li class="tag">a</li></ul>');
});

test('TagList with no items renders an empty list', () => {
  assert.equal(renderToStaticMarkup(createElement(site.TagList, { items: [] })), '<ul class="tags"></ul>');
});
