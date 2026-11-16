import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Comments stripped so a comment can neither satisfy nor break a check.
const css = readFileSync(new URL("../src/styles/global.css", import.meta.url), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "");

/** Returns the body of the first block whose header matches `header`, or null. */
function blockBody(header) {
  const match = header.exec(css);
  if (!match) return null;
  const start = match.index + match[0].length;
  let depth = 1;
  for (let i = start; i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}" && --depth === 0) return css.slice(start, i);
  }
  return null;
}

test(":root defines the design tokens", () => {
  const root = blockBody(/:root\s*\{/);
  assert.ok(root, "no :root block");
  const colors = {
    "--bg": "#0e0e13",
    "--surface": "#17171f",
    "--text-heading": "#f2f0f5",
    "--text": "#d9d6de",
    "--text-muted": "#a9a5b3",
    "--accent": "#7844b8",
  };
  for (const [name, value] of Object.entries(colors)) {
    assert.match(root, new RegExp(`${name}\\s*:\\s*${value}\\s*;`, "i"), name);
  }
  assert.match(root, /--font-pixel\s*:[^;]*Pixelify Sans/);
  assert.match(root, /--font-body\s*:[^;]*Inter/);
  assert.match(root, /--font-mono\s*:[^;]*JetBrains Mono/);
  assert.match(root, /--measure\s*:\s*[^;\s]+/);
});

test("every contract class is used as a selector", () => {
  const classes = [
    "skip-link", "site-nav", "container", "section", "hero", "hero-name",
    "cursor", "button-row", "button", "card-list", "card", "tags", "tag",
    "timeline", "timeline-item", "timeline-meta", "muted", "mono", "prose",
    "back-link",
  ];
  for (const name of classes) {
    // Not followed by a name character (so .tag isn't satisfied by .tags),
    // and reaches "{" without crossing a declaration or block end.
    assert.match(css, new RegExp(`\\.${name}(?![\\w-])[^{};]*\\{`), `.${name}`);
  }
});

test("no color declaration uses the accent", () => {
  const values = [...css.matchAll(/(?<![\w-])color\s*:\s*([^;}]+)/g)].map((m) => m[1]);
  assert.ok(values.length > 0, "no color declarations found");
  for (const value of values) {
    assert.doesNotMatch(value, /var\(\s*--accent\s*\)|#7844b8/i, `color: ${value}`);
  }
});

test("forbidden constructs are absent", () => {
  assert.match(css, /\{[^}]*:[^}]*\}/, "stylesheet has no rules");
  for (const [, value] of css.matchAll(/border(?:-[a-z]+)*-radius\s*:\s*([^;}]+)/gi)) {
    const numbers = value.match(/\d*\.?\d+/g) ?? [];
    assert.ok(numbers.every((n) => Number(n) === 0), `border-radius: ${value}`);
  }
  assert.doesNotMatch(css, /gradient\(/i);
  assert.doesNotMatch(css, /url\(/i);
  assert.doesNotMatch(css, /@import/i);
  assert.doesNotMatch(css, /@font-face/i);
});

test("reduced-motion media query turns animation off", () => {
  const body = blockBody(/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{/);
  assert.ok(body, "no prefers-reduced-motion: reduce block");
  assert.match(body, /animation(?:-name)?\s*:\s*none\b/);
});

test(":focus-visible rule sets a visible outline", () => {
  assert.match(css, /:focus-visible[^{}]*\{[^}]*(?<![\w-])outline\s*:(?!\s*(?:none\b|0\s*[;}]))[^;}]+/);
});
