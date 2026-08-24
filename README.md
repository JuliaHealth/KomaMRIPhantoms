# KomaMRI Phantom Library

A searchable catalog of community-contributed digital phantoms for [KomaMRI](https://github.com/JuliaHealth/KomaMRI.jl). Large `.phantom` files and preview images remain archived on Zenodo; this repository contains only one small Markdown metadata file per entry.

The public catalog is published at <https://juliahealth.github.io/KomaMRIPhantoms/>.

## Submit a phantom

Use the guided form on the website. It validates and previews the card, then opens GitHub with the same fields prefilled. After confirmation, an automated one-file pull request is created and attributed to the submitter's GitHub account.

Each `phantoms/*.md` entry follows [`phantoms/_template.md`](phantoms/_template.md):

```yaml
---
title: Cardiac Motion Phantom
image: https://zenodo.org/records/123456/files/preview.webp
zenodo: https://zenodo.org/records/123456
paper: https://doi.org/10.0000/example
tested_on:
  KomaMRI: 0.9.4
  KomaMRIBase: 0.9.4
  KomaMRICore: 0.9.4
  KomaMRIFiles: 0.9.4
  KomaMRIPlots: 0.9.4
tags:
  - cardiac
  - motion
submitted_by: github-username
---

Description of at most 100 words.
```

Only list KomaMRI subpackages actually used, always with exact tested versions. Tags are lowercase and automatically become catalog filters.

## Maintenance

- Remove an entry by deleting its single file from `phantoms/`.
- Edit an entry by changing that file through GitHub's web editor.
- Pull requests check the schema, description length, external links, preview image, and production build.
- Merges to `main` publish the updated catalog automatically through GitHub Pages.

## Local development

```sh
npm ci
npm run dev
```

Validate metadata without external link checks using `npm run validate:local`. Build the GitHub Pages output using `PAGES_BASE_PATH=/KomaMRIPhantoms npm run pages:build`.

## License

MIT
