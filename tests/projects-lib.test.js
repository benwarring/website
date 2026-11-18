// Tests src/lib/projects.ts. `astro:content` is an Astro virtual module, so the
// file is loaded through a Vite dev server in middleware mode (as in
// tests/home.test.js) with an inline plugin that resolves `astro:content` to a
// stub. The stub's getCollection delegates to globalThis.__getCollectionStub,
// so each test controls what the collection returns.
import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const STUB_ID = '\0astro-content-stub';

const astroContentStub = {
  name: 'astro-content-stub',
  resolveId: (id) => (id === 'astro:content' ? STUB_ID : undefined),
  load: (id) =>
    id === STUB_ID
      ? 'export async function getCollection(name) { return globalThis.__getCollectionStub(name); }'
      : undefined,
};

function entry(id, order, { repo } = {}) {
  const data = { title: `Title ${id}`, summary: `Summary ${id}`, tags: [`tag-${id}`], order };
  if (repo !== undefined) data.repo = repo;
  return { id, collection: 'projects', body: `# ${id}`, data };
}

// Out of order on purpose; 'delta' has no repo.
function sampleEntries() {
  return [
    entry('gamma', 3, { repo: 'https://github.com/example/gamma' }),
    entry('alpha', 1, { repo: 'https://github.com/example/alpha' }),
    entry('delta', 10),
    entry('beta', 2, { repo: 'https://github.com/example/beta' }),
  ];
}

let server;
let lib;
let calls;

before(async () => {
  server = await createServer({
    configFile: false,
    root: projectRoot,
    plugins: [astroContentStub],
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    logLevel: 'silent',
  });
  lib = await server.ssrLoadModule('/src/lib/projects.ts');
});

after(() => {
  delete globalThis.__getCollectionStub;
  return server?.close();
});

function stubCollection(produce) {
  calls = [];
  globalThis.__getCollectionStub = async (name) => {
    calls.push(name);
    return produce();
  };
}

beforeEach(() => stubCollection(sampleEntries));

test('getSortedProjects loads the projects collection', async () => {
  await lib.getSortedProjects();
  assert.deepEqual(calls, ['projects']);
});

test('getSortedProjects sorts by data.order ascending', async () => {
  const sorted = await lib.getSortedProjects();
  assert.deepEqual(
    sorted.map((e) => e.data.order),
    [1, 2, 3, 10],
  );
  assert.deepEqual(
    sorted.map((e) => e.id),
    ['alpha', 'beta', 'gamma', 'delta'],
  );
});

test('getSortedProjects sorts numerically, not lexically', async () => {
  stubCollection(() => [entry('ten', 10), entry('nine', 9), entry('hundred', 100)]);
  const sorted = await lib.getSortedProjects();
  assert.deepEqual(
    sorted.map((e) => e.id),
    ['nine', 'ten', 'hundred'],
  );
});

test('getSortedProjects returns every entry, unchanged', async () => {
  const sorted = await lib.getSortedProjects();
  const expected = sampleEntries();
  assert.equal(sorted.length, expected.length);
  for (const original of expected) {
    assert.deepEqual(
      sorted.find((e) => e.id === original.id),
      original,
    );
  }
});

test('getSortedProjects returns an empty array for an empty collection', async () => {
  stubCollection(() => []);
  assert.deepEqual(await lib.getSortedProjects(), []);
});

test('getSortedProjects handles a single entry', async () => {
  stubCollection(() => [entry('only', 5)]);
  const sorted = await lib.getSortedProjects();
  assert.deepEqual(
    sorted.map((e) => e.id),
    ['only'],
  );
});

test('getSortedProjects handles negative and very large order values', async () => {
  stubCollection(() => [
    entry('max', Number.MAX_SAFE_INTEGER),
    entry('neg', -5),
    entry('zero', 0),
  ]);
  const sorted = await lib.getSortedProjects();
  assert.deepEqual(
    sorted.map((e) => e.id),
    ['neg', 'zero', 'max'],
  );
});

test('getSortedProjects propagates getCollection errors', async () => {
  const failure = new Error('collection failed to load');
  stubCollection(() => {
    throw failure;
  });
  await assert.rejects(lib.getSortedProjects(), (err) => err === failure);
});

test('toProjectProps returns exactly id, title, summary, tags and repo', () => {
  const props = lib.toProjectProps(entry('alpha', 1, { repo: 'https://github.com/example/alpha' }));
  assert.deepEqual(Object.keys(props).sort(), ['id', 'repo', 'summary', 'tags', 'title']);
  assert.deepEqual(props, {
    id: 'alpha',
    title: 'Title alpha',
    summary: 'Summary alpha',
    tags: ['tag-alpha'],
    repo: 'https://github.com/example/alpha',
  });
});

test('toProjectProps leaves out order, body and collection', () => {
  const props = lib.toProjectProps(entry('alpha', 1));
  assert.equal('order' in props, false);
  assert.equal('body' in props, false);
  assert.equal('collection' in props, false);
  assert.equal('data' in props, false);
});

test('toProjectProps sets repo undefined when the entry has none', () => {
  const props = lib.toProjectProps(entry('delta', 10));
  assert.equal(props.repo, undefined);
  assert.equal(props.id, 'delta');
  assert.deepEqual(props.tags, ['tag-delta']);
});

test('toProjectProps keeps an empty tag list', () => {
  const e = entry('bare', 1);
  e.data.tags = [];
  assert.deepEqual(lib.toProjectProps(e).tags, []);
});

test('toProjectProps output is JSON-serializable and round-trips', async () => {
  const props = (await lib.getSortedProjects()).map(lib.toProjectProps);
  const roundTripped = JSON.parse(JSON.stringify(props));
  // JSON drops undefined keys, so compare against props without undefined repo.
  const expected = props.map(({ repo, ...rest }) => (repo === undefined ? rest : { ...rest, repo }));
  assert.deepEqual(roundTripped, expected);
  assert.deepEqual(
    roundTripped.map((p) => p.id),
    ['alpha', 'beta', 'gamma', 'delta'],
  );
});
