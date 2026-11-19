# website

Benjamin Warring's personal portfolio: a static [Astro](https://astro.build) site with React components, deployed to GitHub Pages at <https://benwarring.github.io/website/>.

## Run locally

Built and tested with Node 24.

```sh
npm install
npm run dev       # dev server with live reload at http://localhost:4321/website/
npm run build     # static site into dist/
npm run preview   # serve the built dist/ at http://localhost:4321/website/
npm test          # build, then run the tests in tests/
```

## Edit content

- **Projects:** one Markdown file per project in `src/content/projects/`. The frontmatter has `title`, `summary`, `tags`, `repo` (an https URL, optional) and `order` (lower comes first). The file name becomes the URL: `bide.md` is served at `/website/projects/bide/`. The home page shows the first three projects by `order` as folders. The projects page lists all of them.
- **Home page text** (experience, skills, education, contact): the arrays near the top of `src/components/Home.jsx`.
- **Name, email, GitHub and resume links:** the constants at the top of `src/components/Site.jsx`.
- **Resume:** put the PDF at `public/resume.pdf`. The Resume buttons link there.
- **Styles:** all in `src/styles/global.css`, with colours, fonts and spacing as variables at the top.

## Deploy

Every push to `main` builds and deploys the site through `.github/workflows/deploy.yml`.

One-time setup on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

The site is served from the `/website/` path, so `astro.config.mjs` sets `base: '/website/'`. For a custom domain or a `benwarring.github.io` repository, set `site` to that address and remove `base`.
