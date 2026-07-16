#!/usr/bin/env bash
#
# Build script for the StartupStage website.
# Produces a deploy-ready build/ folder (served by Cloudflare via wrangler.jsonc).
#
# Prerequisites (install once):
#   npm install -g terser clean-css-cli html-minifier-terser
#
# Usage:
#   ./build.sh
#

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
BUILD="$ROOT/build"

echo "=== StartupStage Build ==="

# ── 1. Clean previous build ──────────────────────────────────────────────────
echo "[1/5] Cleaning build/ folder..."
rm -rf "$BUILD"

# ── 2. Create directory structure ────────────────────────────────────────────
echo "[2/5] Creating directory structure..."
mkdir -p "$BUILD/en-gb"
mkdir -p "$BUILD/ru-kz"

# ── 3. Copy static assets ────────────────────────────────────────────────────
# Vendor files (bootstrap, fontawesome, LineIcons, wow, ...) are already
# minified, so the whole assets/ tree is copied as-is; the project's own
# CSS/JS are re-minified over the copies below.
echo "[3/5] Copying assets..."
cp -R "$ROOT/assets" "$BUILD/assets"
find "$BUILD/assets" -name '.DS_Store' -delete 2>/dev/null || true

# ── 4. Minify the project's own CSS/JS ───────────────────────────────────────
echo "[4/5] Minifying project CSS/JS..."
cleancss -o "$BUILD/assets/css/main.css"    "$ROOT/assets/css/main.css"
cleancss -o "$BUILD/assets/css/custom.css"  "$ROOT/assets/css/custom.css"
cleancss -o "$BUILD/assets/css/animate.css" "$ROOT/assets/css/animate.css"
terser "$ROOT/assets/js/language.js" -o "$BUILD/assets/js/language.js" --compress --mangle

# ── 5. Minify HTML ───────────────────────────────────────────────────────────
echo "[5/5] Minifying HTML..."

HTML_FILES=(
    "index.html"
    "404.html"
    "en-gb/index.html"
    "en-gb/404.html"
    "ru-kz/index.html"
    "ru-kz/404.html"
)

for file in "${HTML_FILES[@]}"; do
    html-minifier-terser \
        --collapse-whitespace \
        --remove-comments \
        --remove-redundant-attributes \
        --remove-empty-attributes \
        --minify-css true \
        --minify-js true \
        -o "$BUILD/$file" \
        "$ROOT/$file"
done

# ── 6. Copy root files ───────────────────────────────────────────────────────
echo "Copying root files..."
cp "$ROOT/robots.txt"  "$BUILD/"
cp "$ROOT/sitemap.xml" "$BUILD/"
[ -f "$ROOT/CNAME" ] && cp "$ROOT/CNAME" "$BUILD/"

# ── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo "=== Build complete ==="
echo "Deploy the build/ folder (e.g. wrangler deploy)."
