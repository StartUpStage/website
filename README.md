# StartupStage website

A small static site (StartupStage — *bring ideas to life*) deployed to Cloudflare.

## Structure

```
index.html          English (US)  — served at /
en-gb/index.html    English (UK)  — served at /en-gb/
ru-kz/index.html    Русский (KZ)  — served at /ru-kz/
404.html            + en-gb/404.html, ru-kz/404.html
assets/             CSS, JS, fonts, icons
robots.txt, sitemap.xml, wrangler.jsonc, build.sh
```

Each home page carries a **language switcher** (a dropdown in the top-right and
a `<select>` in the footer) offering English (US), English (UK) and Русский (KZ).
Asset references are root-absolute (`/assets/...`) so every page — root or
language subfolder — resolves them the same way.

## Build

Minifies HTML/CSS/JS into a deploy-ready `build/` folder.

Prerequisites (install once):

```
npm install -g terser clean-css-cli html-minifier-terser
```

Then:

```
./build.sh
```

## Deploy (Cloudflare)

`wrangler.jsonc` serves the `build/` directory and uses `404.html` for
not-found handling.

```
./build.sh
wrangler deploy
```
