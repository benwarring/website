// React for component tests, loaded through the same Vite server as the
// components. Importing 'react' directly in a test can load a second copy:
// on Windows, a cwd of c:\ vs C:\ gives the test and Vite different module
// paths, and hooks then fail with "Cannot read properties of null (reading
// 'useState')". Loading it through Vite keeps one copy whatever the casing.
// (This file is in tests/helpers/, so `node --test` doesn't run it as a test.)

const ID = 'virtual:test-react';

/** Vite plugin serving a module that re-exports react and react-dom/server. */
export const reactShim = {
  name: 'test-react',
  resolveId: (id) => (id === ID ? `\0${ID}` : undefined),
  load: (id) =>
    id === `\0${ID}`
      ? "export * from 'react'; export { renderToStaticMarkup } from 'react-dom/server';"
      : undefined,
};

/**
 * Loads React and `renderToStaticMarkup` through `server`, which must have
 * `reactShim` in its plugins.
 *
 * @param {import('vite').ViteDevServer} server
 * @returns {Promise<typeof import('react') & { renderToStaticMarkup: typeof import('react-dom/server').renderToStaticMarkup }>}
 */
export const loadReact = (server) => server.ssrLoadModule(ID);
