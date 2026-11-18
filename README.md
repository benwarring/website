# website

Benjamin Warring's personal portfolio: a static [Astro](https://astro.build) site with React components, deployed with GitHub Pages to <https://benwarring.com>.

## Run locally

Built and tested with Node 24.

```sh
npm install
npm run dev       # dev server with live reload at http://localhost:4321/
npm run build     # static site into dist/
npm run preview   # serve the built dist/ at http://localhost:4321/
npm test          # build, then run the tests in tests/
```

## Edit content

- **Projects:** one Markdown file per project in `src/content/projects/`. The frontmatter has `title`, `summary`, `tags`, `repo` (an https URL, optional) and `order` (lower comes first). The file name becomes the URL: `bide.md` is served at `/projects/bide/`. The home page shows the first three projects by `order` as folders. The projects page lists all of them.
- **Home page text** (experience, skills, education, contact): the arrays near the top of `src/components/Home.jsx`.
- **Name, email, GitHub and resume links:** the constants at the top of `src/components/Site.jsx`.
- **Resume:** put the PDF at `public/resume.pdf`. The Resume buttons link there.
- **Styles:** all in `src/styles/global.css`, with colours, fonts and spacing as variables at the top.

## Deploy

Every push to `main` builds and deploys the site through `.github/workflows/deploy.yml`.

One-time setup on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

The site is served from the custom domain `benwarring.com`: it is set in **Settings → Pages → Custom domain**, and the domain's DNS points at GitHub Pages (four `A` records for `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`; a `CNAME` for `www` to `benwarring.github.io`). `astro.config.mjs` sets `site: 'https://benwarring.com'` and no `base`, because the site lives at the domain's root. Once the domain is verified, tick **Enforce HTTPS** in the same settings page.
