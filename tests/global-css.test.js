import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Comments stripped so a comment can neither satisfy nor break a check.
const css = readFileSync(new URL("../src/styles/global.css", import.meta.url), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "");

const reducedMotionHeader = /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{/;

/** Returns the body of the first block whose header matches `header`, or null. */
function blockBody(header, source = css) {
  const match = header.exec(source);
  if (!match) return null;
  const start = match.index + match[0].length;
  let depth = 1;
  for (let i = start; i < source.length; i++) {
    if (source[i] === "{") depth++;
    if (source[i] === "}" && --depth === 0) return source.slice(start, i);
  }
  return null;
}

/** Returns every innermost rule in `source` as { selectors: string[], body }. */
function leafRules(source = css) {
  return [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({
    selectors: selector.split(",").map((s) => s.trim().replace(/\s+/g, " ")),
    body,
  }));
}

const reducedMotion = blockBody(reducedMotionHeader);
const cssOutsideReducedMotion = reducedMotion === null ? css : css.replace(reducedMotion, "");

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
  assert.match(root, /--font-heading\s*:[^;]*Roboto Serif/);
  assert.match(root, /--font-body\s*:[^;]*Montserrat/);
  assert.match(root, /--font-mono\s*:[^;]*JetBrains Mono/);
  const newTokens = [
    "--line", "--accent-light", "--accent-dark", "--paper", "--paper-fold", "--ink",
    "--ink-muted", "--page", "--measure", "--narrow", "--gutter", "--space-6",
    "--underline-hover", "--fold-speed", "--ease-out", "--sticky-top", "--radius",
  ];
  for (const name of newTokens) {
    assert.match(root, new RegExp(`(?<![\\w-])${name}\\s*:\\s*[^;\\s]+`), name);
  }
});

test("removed tokens are neither defined nor used", () => {
  for (const name of ["--font-pixel", "--pixel-border", "--pixel-shadow", "--shadow"]) {
    assert.doesNotMatch(css, new RegExp(`(?<![\\w-])${name}(?![\\w-])`), name);
  }
});

test("every contract class is used as a selector", () => {
  const classes = [
    "skip-link", "container", "site-nav", "site-nav-inner", "brand", "site-footer",
    "site-footer-inner", "page", "page-main", "sidebar", "sidebar-links", "hero",
    "hero-bg", "hero-inner", "hero-name", "hero-tagline", "eyebrow", "label", "section",
    "section-head", "section-index", "section-body", "lead", "split", "muted", "mono",
    "plain-list", "button-row", "button", "folders", "folder", "folder-icon",
    "folder-sheet", "folder-front", "folder-label", "paper", "paper-list", "paper-links",
    "page-header", "page-body", "page-links", "tags", "tag", "contact-list", "timeline",
    "timeline-item", "timeline-body", "timeline-meta", "prose", "back-link",
  ];
  for (const name of classes) {
    // Not followed by a name character (so .tag isn't satisfied by .tags),
    // and reaches "{" without crossing a declaration or block end.
    assert.match(css, new RegExp(`\\.${name}(?![\\w-])[^{};]*\\{`), `.${name}`);
  }
});

test("removed classes are gone", () => {
  for (const name of ["card", "card-list", "cursor"]) {
    assert.doesNotMatch(css, new RegExp(`\\.${name}(?![\\w-])`), `.${name}`);
  }
});

test("no color declaration uses the accent", () => {
  const values = [...css.matchAll(/(?<![\w-])color\s*:\s*([^;}]+)/g)].map((m) => m[1]);
  assert.ok(values.length > 0, "no color declarations found");
  for (const value of values) {
    assert.doesNotMatch(value, /var\(\s*--accent\s*\)|#7844b8/i, `color: ${value}`);
  }
});

test("border radii come only from var(--radius)", () => {
  const values = [...css.matchAll(/border(?:-[a-z]+)*-radius\s*:\s*([^;}]+)/gi)].map((m) => m[1]);
  assert.ok(values.length > 0, "no border-radius declarations found");
  for (const value of values) {
    const rest = value
      .replace(/calc\(\s*var\(\s*--radius\s*\)\s*[*/]\s*\d*\.?\d+\s*\)/g, "")
      .replace(/var\(\s*--radius\s*\)/g, "")
      .replace(/(?<![\w.-])0(?![\w.%])/g, "")
      .trim();
    assert.equal(rest, "", `border-radius: ${value}`);
  }
});

test("forbidden constructs are absent", () => {
  assert.match(css, /\{[^}]*:[^}]*\}/, "stylesheet has no rules");
  assert.doesNotMatch(css, /gradient\(/i);
  assert.doesNotMatch(css, /url\(/i);
  assert.doesNotMatch(css, /@import/i);
  assert.doesNotMatch(css, /@font-face/i);
});

test("only home page papers take the view-transition name", () => {
  const named = leafRules().filter((rule) => /view-transition-name\s*:/.test(rule.body));
  const paperSelectors = named
    .flatMap((rule) => rule.selectors)
    .filter((selector) => /\.paper(?![\w-])/.test(selector));
  assert.deepEqual(paperSelectors, [".folders ~ .paper:not([hidden])"]);
});

test("reduced-motion media query turns transitions off", () => {
  assert.ok(reducedMotion, "no prefers-reduced-motion: reduce block");
  const stilled = new Set(
    leafRules(reducedMotion)
      .filter((rule) => /(?<![\w-])transition\s*:\s*none\b/.test(rule.body))
      .flatMap((rule) => rule.selectors),
  );
  const animated = leafRules(cssOutsideReducedMotion)
    .filter((rule) => /(?<![\w-])transition\s*:(?!\s*none\b)/.test(rule.body))
    .flatMap((rule) => rule.selectors);
  assert.ok(animated.length > 0, "no transitions found");
  for (const selector of animated) {
    assert.ok(stilled.has(selector), `${selector} keeps its transition under reduced motion`);
  }
});

test("reduced-motion media query turns view-transition animations off", () => {
  assert.ok(reducedMotion, "no prefers-reduced-motion: reduce block");
  const stilled = leafRules(reducedMotion)
    .filter((rule) => /animation\s*:\s*none\b/.test(rule.body))
    .flatMap((rule) => rule.selectors);
  for (const pseudo of ["group", "old", "new"]) {
    assert.ok(stilled.includes(`::view-transition-${pseudo}(*)`), `::view-transition-${pseudo}(*)`);
  }
});

test(":focus-visible rule sets a visible outline", () => {
  assert.match(css, /:focus-visible[^{}]*\{[^}]*(?<![\w-])outline\s*:(?!\s*(?:none\b|0\s*[;}]))[^;}]+/);
  assert.doesNotMatch(css, /(?<![\w-])outline\s*:\s*(?:none\b|0\s*[;}])/);
});
