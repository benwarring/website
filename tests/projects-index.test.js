// Renders src/components/ProjectsIndex.jsx to static HTML and checks the
// all-projects page markup: header, one paper per project in order, links,
// heading levels, the highlighted sidebar entry and text escaping. Loaded
// through a Vite dev server in middleware mode, as in tests/home.test.js, so
// JSX and import.meta.env.BASE_URL resolve.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { loadReact, reactShim } from './helpers/react.js';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const BASE = '/website/';
const PROJECTS = [
  {
    id: 'alpha-editor',
    title: 'Alpha Editor',
    summary: 'A small text editor.',
    tags: ['C', 'Lua'],
    repo: 'https://github.com/example/alpha-editor',
  },
  {
    id: 'beta-pipeline',
    title: 'Beta Pipeline',
    summary: 'A build pipeline with no public repo.',
    tags: ['Python'],
  },
  {
    id: 'gamma-tool',
    title: 'Gamma Tool',
    summary: 'A command-line tool.',
    tags: ['Rust', 'Shell'],
    repo: 'https://github.com/example/gamma-tool',
  },
];

let server;
// Set in before() from loadReact(server); see tests/helpers/react.js.
let createElement, renderToStaticMarkup;
let ProjectsIndex;
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
  ({ createElement, renderToStaticMarkup } = await loadReact(server));
  ProjectsIndex = (await server.ssrLoadModule('/src/components/ProjectsIndex.jsx')).default;
  html = render(PROJECTS);
});

after(() => server?.close());

function render(projects) {
  return renderToStaticMarkup(createElement(ProjectsIndex, { projects }));
}

function mainContent(markup) {
  return markup.match(/<main id="main">([\s\S]*?)<\/main>/)?.[1] ?? '';
}

function papers(markup) {
  return [...markup.matchAll(/<li><article class="paper">([\s\S]*?)<\/article><\/li>/g)].map((m) => m[1]);
}

function links(markup) {
  return [...markup.matchAll(/<a href="([^"]*)">([^<]*)<\/a>/g)].map((m) => [m[1], m[2]]);
}

test('page header has the eyebrow, h1 and lead inside main#main', () => {
  assert.match(
    mainContent(html),
    /^<header class="page-header container"><p class="eyebrow">Portfolio<\/p><h1>Projects<\/h1><p class="lead">Projects I have built or contributed to\.<\/p><\/header>/,
  );
});

test('page body has the All projects h2 and the labelled paper list inside main#main', () => {
  assert.match(
    mainContent(html),
    /<\/header><div class="page-body container"><h2 class="label">All projects<\/h2><ul class="paper-list" aria-label="Projects">[\s\S]*<\/ul><\/div>$/,
  );
});

test('renders one paper per project in the given order', () => {
  const found = papers(mainContent(html));
  assert.equal(found.length, PROJECTS.length);
  assert.deepEqual(
    found.map((paper) => paper.match(/<h3>([^<]*)<\/h3>/)?.[1]),
    PROJECTS.map((p) => p.title),
  );
});

test('each paper has the label, title, summary and labelled tag list in order', () => {
  papers(mainContent(html)).forEach((paper, i) => {
    const { title, summary, tags } = PROJECTS[i];
    const tagItems = tags.map((tag) => `<li class="tag">${tag}</li>`).join('');
    assert.ok(
      paper.startsWith(
        `<p class="label">Project</p><h3>${title}</h3><p>${summary}</p>` +
          `<ul class="tags" aria-label="Technologies">${tagItems}</ul><p class="paper-links">`,
      ),
      `paper ${i} markup: ${paper}`,
    );
  });
});

test('each paper links to its detail page and to its repo only when it has one', () => {
  papers(mainContent(html)).forEach((paper, i) => {
    const { id, title, repo } = PROJECTS[i];
    const expected = [[`${BASE}projects/${id}/`, `Read more about ${title}`]];
    if (repo) expected.push([repo, `View ${title} on GitHub`]);
    const paperLinks = paper.match(/<p class="paper-links">([\s\S]*?)<\/p>$/)?.[1] ?? '';
    assert.deepEqual(links(paperLinks), expected);
  });
});

test('a project without repo has no GitHub link', () => {
  const beta = papers(mainContent(html))[1];
  assert.doesNotMatch(beta, /GitHub/);
  assert.equal((beta.match(/<a /g) ?? []).length, 1);
});

test('headings in main go h1, then h2, then one h3 per project', () => {
  const levels = [...mainContent(html).matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
  assert.deepEqual(levels, [1, 2, ...PROJECTS.map(() => 3)]);
});

test('sidebar menu highlights All projects', () => {
  const current = [...html.matchAll(/aria-current="true"[^>]*>[\s\S]*?branched-menu__label">([^<]*)</g)];
  assert.deepEqual(current.map((m) => m[1]), ['All projects']);
});

test('sidebar menu lists every project', () => {
  for (const { title } of PROJECTS) {
    assert.match(html, new RegExp(`branched-menu__label">${title}<`));
  }
});

test('no internal link skips the base', () => {
  assert.doesNotMatch(html, /href="\/(?!website\/)/);
});

test('empty project list renders the header and an empty paper list', () => {
  const main = mainContent(render([]));
  assert.match(main, /<h1>Projects<\/h1>/);
  assert.match(main, /<ul class="paper-list" aria-label="Projects"><\/ul>/);
  assert.equal(papers(main).length, 0);
});

test('project text and repo URL are escaped', () => {
  const main = mainContent(
    render([
      {
        id: 'odd',
        title: 'Fish & <Chips>',
        summary: '<script>alert("x")</script>',
        tags: ['C++ & <T>'],
        repo: 'https://github.com/example/odd?a=1&b="2"',
      },
    ]),
  );
  assert.match(main, /<h3>Fish &amp; &lt;Chips&gt;<\/h3>/);
  assert.match(main, /<p>&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;<\/p>/);
  assert.match(main, /<li class="tag">C\+\+ &amp; &lt;T&gt;<\/li>/);
  assert.match(main, /Read more about Fish &amp; &lt;Chips&gt;<\/a>/);
  assert.match(
    main,
    /<a href="https:\/\/github\.com\/example\/odd\?a=1&amp;b=&quot;2&quot;">View Fish &amp; &lt;Chips&gt; on GitHub<\/a>/,
  );
  assert.doesNotMatch(main, /<script>|<Chips>/);
});
