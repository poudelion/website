# Aditya’s Home Ground

The stadium homepage and original portfolio live together in this repository.

- `app/` and `components/camp-nou/`: editable stadium source.
- `public/portfolio/`: existing portfolio; Learn more opens `/portfolio/index.html`.
- `public/`: legacy assets and pages, preserving existing project URLs.
- `docs/`: deployment output for GitHub Pages and `adityapoudel.live`.

## Local development

Run `npm install`, then `npm run dev`.

## Deploy

Run `npm run build` to regenerate `docs/`. Commit and push the source and generated `docs/` to this repository. GitHub Pages should publish the `main` branch, `/docs` folder, with the custom domain `adityapoudel.live`. `.nojekyll` ensures Next.js assets are served.

Run `npm test` and `npm run typecheck` to verify changes. Edit original portfolio content in `public/portfolio/`, not generated `docs/portfolio/`.
