// Checks the `projects` content collection schema in src/content.config.ts.
// The config imports the virtual module `astro:content`, so it is exercised
// through `astro sync`, which validates every entry against the schema and
// exits non-zero with an InvalidContentEntryDataError when one doesn't match.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const astroBin = join(
  dirname(createRequire(import.meta.url).resolve('astro/package.json')),
  'bin/astro.mjs',
);

function runAstroSync() {
  const result = spawnSync(process.execPath, [astroBin, 'sync'], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  });
  return { status: result.status, output: result.stdout + result.stderr };
}

test('astro sync accepts the real project entries', () => {
  const { status, output } = runAstroSync();
  assert.equal(status, 0, output);
});

test('astro sync rejects a project whose repo is not https', () => {
  const entryId = 'zz-test-invalid-repo';
  const entryPath = join(projectRoot, 'src/content/projects', `${entryId}.md`);
  writeFileSync(
    entryPath,
    '---\ntitle: X\nsummary: X\ntags: []\nrepo: "http://example.com"\norder: 9\n---\n',
  );
  try {
    const { status, output } = runAstroSync();
    assert.notEqual(status, 0, output);
    assert.match(output, /InvalidContentEntryDataError/);
    assert.match(output, new RegExp(`projects → ${entryId}`));
    assert.match(output, /repo/);
  } finally {
    rmSync(entryPath, { force: true });
  }
});
