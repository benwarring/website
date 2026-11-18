import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// No YAML parser installed, so these are text checks against the workflow file.
const workflow = readFileSync(
  new URL('../.github/workflows/deploy.yml', import.meta.url),
  'utf8',
);

// Indented lines that follow a top-level `<key>:` line, up to the next top-level key.
function topLevelBlock(key) {
  const match = workflow.match(new RegExp(`^${key}:\\s*\\n((?:[ \\t]+.*\\n|\\s*\\n)*)`, 'm'));
  assert.ok(match, `missing top-level "${key}:" block`);
  return match[1];
}

test('triggers on push to main and on workflow_dispatch', () => {
  const on = topLevelBlock('on');
  assert.match(on, /^\s+push:\s*\n\s+branches:\s*\[\s*main\s*\]/m);
  assert.match(on, /^\s+workflow_dispatch:/m);
});

test('permissions are exactly contents read, pages write, id-token write', () => {
  const grants = topLevelBlock('permissions')
    .split('\n')
    .map((line) => line.replace(/#.*/, '').trim())
    .filter(Boolean)
    .sort();
  assert.deepEqual(grants, ['contents: read', 'id-token: write', 'pages: write']);
  assert.doesNotMatch(workflow, /write-all|contents:\s*write/);
});

test('every uses: line is pinned to a 40-character commit SHA', () => {
  const uses = workflow.match(/^\s*(?:-\s+)?uses:.*$/gm) ?? [];
  assert.ok(uses.length > 0, 'no uses: lines found');
  for (const line of uses) {
    assert.match(line, /uses:\s*[\w.-]+\/[\w.\/-]+@[0-9a-f]{40}(\s|$)/, line.trim());
  }
});

test('uses checkout, withastro, and deploy-pages actions', () => {
  for (const action of ['actions/checkout', 'withastro/action', 'actions/deploy-pages']) {
    assert.match(workflow, new RegExp(`uses:\\s*${action}@`), action);
  }
});

test('deploy job needs build and targets the github-pages environment', () => {
  const deploy = workflow.match(/^ {2}deploy:\s*\n((?: {4,}.*\n|\s*\n)*)/m);
  assert.ok(deploy, 'missing deploy job');
  assert.match(deploy[1], /^\s+needs:\s*\[?\s*build\s*\]?\s*$/m);
  assert.match(deploy[1], /^\s+environment:\s*\n\s+name:\s*github-pages\s*$/m);
});
