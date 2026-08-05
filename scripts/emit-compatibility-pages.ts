import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { normalizeBasePath } from '../src/lib/config/base-path.ts';

export const LEGACY_REDIRECTS = {
  'cemerzone.html': '/projects/cemerzone/',
  'city-builder.html': '/projects/city-builder/',
  'clash-royale.html': '/projects/clash-royale-clone/',
  'fish-masters.html': '/projects/fish-masters/',
  'generic.html': '/about/',
  'geometry-dash.html': '/projects/geometry-dash-clone/',
  'gridPuzzle.html': '/projects/procedural-jigsaw-puzzle/',
  'harvest-it.html': '/projects/harvest-it/',
  'landing.html': '/about/',
  'match-squares.html': '/projects/match-squares/',
  'popmelon.html': '/projects/pop-melon/',
  'ship-action.html': '/projects/ship-action-demo/',
  'top-down.html': '/projects/multiplayer-top-down-shooter/',
  'topdown-shooter.html': '/projects/multiplayer-top-down-shooter/',
} as const;

export const LEGACY_ARCHIVE_ASSETS = [
  'assets/css/fontawesome-all.min.css',
  'assets/css/main.css',
  'assets/css/noscript.css',
  'assets/js/breakpoints.min.js',
  'assets/js/browser.min.js',
  'assets/js/jquery.min.js',
  'assets/js/jquery.scrollex.min.js',
  'assets/js/jquery.scrolly.min.js',
  'assets/js/main.js',
  'assets/js/util.js',
  'assets/webfonts/fa-brands-400.eot',
  'assets/webfonts/fa-brands-400.svg',
  'assets/webfonts/fa-brands-400.ttf',
  'assets/webfonts/fa-brands-400.woff',
  'assets/webfonts/fa-brands-400.woff2',
  'assets/webfonts/fa-regular-400.eot',
  'assets/webfonts/fa-regular-400.svg',
  'assets/webfonts/fa-regular-400.ttf',
  'assets/webfonts/fa-regular-400.woff',
  'assets/webfonts/fa-regular-400.woff2',
  'assets/webfonts/fa-solid-900.eot',
  'assets/webfonts/fa-solid-900.svg',
  'assets/webfonts/fa-solid-900.ttf',
  'assets/webfonts/fa-solid-900.woff',
  'assets/webfonts/fa-solid-900.woff2',
  'images/banner.jpg',
  'images/clashroyale.gif',
  'images/pic02.jpg',
  'images/pic03.jpg',
  'images/pic04.jpg',
  'images/pic05.jpg',
  'images/shipGameplay2.gif',
  'images/topdowngif.gif',
] as const;

interface EmitCompatibilityOptions {
  archiveAssets?: readonly string[];
  basePath?: string;
  outputRoot: string;
  siteUrl?: string;
  sourceRoot: string;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function sitePath(route: string, basePath: string) {
  const base = normalizeBasePath(basePath);
  return `${base === '/' ? '' : base}${route}`;
}

function redirectDocument(target: string, siteUrl: string) {
  const canonical = new URL(target, new URL('/', siteUrl)).href;
  const escapedTarget = escapeHtml(target);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex,follow">
    <meta http-equiv="refresh" content="0;url=${escapedTarget}">
    <link rel="canonical" href="${escapeHtml(canonical)}">
    <title>Page moved</title>
  </head>
  <body>
    <p>This page has moved to <a href="${escapedTarget}">${escapedTarget}</a>.</p>
    <script>window.location.replace(${JSON.stringify(target)} + window.location.search + window.location.hash);</script>
  </body>
</html>
`;
}

function archiveDocument(html: string, basePath: string) {
  const base = normalizeBasePath(basePath);
  if (base === '/') return html;
  return html.replace(/((?:href|src)=["'])\/(?!\/)/gi, `$1${base}/`);
}

export async function emitCompatibilityPages({
  archiveAssets = LEGACY_ARCHIVE_ASSETS,
  basePath = '/',
  outputRoot,
  siteUrl = 'https://vitoleone.github.io',
  sourceRoot,
}: EmitCompatibilityOptions) {
  await mkdir(outputRoot, { recursive: true });

  await Promise.all(Object.entries(LEGACY_REDIRECTS).map(async ([legacyFile, route]) => {
    const destination = join(outputRoot, legacyFile);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, redirectDocument(sitePath(route, basePath), siteUrl), 'utf8');
  }));

  const archiveHtml = await readFile(join(sourceRoot, 'oldindex.html'), 'utf8');
  await writeFile(
    join(outputRoot, 'oldindex.html'),
    archiveDocument(archiveHtml, basePath),
    'utf8',
  );
  await Promise.all(archiveAssets.map(async (relativePath) => {
    const destination = join(outputRoot, relativePath);
    await mkdir(dirname(destination), { recursive: true });
    await cp(join(sourceRoot, relativePath), destination);
  }));
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (import.meta.url === invokedPath) {
  const sourceRoot = process.cwd();
  await emitCompatibilityPages({
    basePath: process.env.GITHUB_PAGES_BASE_PATH ?? '/',
    outputRoot: join(sourceRoot, 'dist'),
    siteUrl: process.env.SITE_URL ?? 'https://vitoleone.github.io',
    sourceRoot,
  });
  console.log(`Emitted ${Object.keys(LEGACY_REDIRECTS).length} compatibility redirects and oldindex.html archive.`);
}
