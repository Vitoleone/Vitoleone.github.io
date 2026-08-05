import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  LEGACY_REDIRECTS,
  emitCompatibilityPages,
} from '../../scripts/emit-compatibility-pages';
import { checkInternalLinks } from '../../scripts/check-internal-links';

const temporaryDirectories: string[] = [];

async function makeTemporaryDirectory() {
  const directory = await mkdtemp(join(tmpdir(), 'portfolio-deployment-'));
  temporaryDirectories.push(directory);
  return directory;
}

async function writeFixture(root: string, relativePath: string, content: string | Uint8Array) {
  const destination = join(root, relativePath);
  await mkdir(join(destination, '..'), { recursive: true });
  await writeFile(destination, content);
}

afterEach(async () => {
  const { rm } = await import('node:fs/promises');
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, {
    force: true,
    recursive: true,
  })));
});

describe('legacy compatibility output', () => {
  it('emits base-aware redirects without changing legacy source files', async () => {
    const sourceRoot = await makeTemporaryDirectory();
    const outputRoot = join(await makeTemporaryDirectory(), 'dist');
    const archiveHtml = '<!doctype html><title>Original portfolio</title><a href="/top-down.html">Demo</a><img src="images/pic02.jpg">';

    await writeFixture(sourceRoot, 'oldindex.html', archiveHtml);
    await writeFixture(sourceRoot, 'assets/css/main.css', 'body { color: white; }');
    await writeFixture(sourceRoot, 'images/pic02.jpg', new Uint8Array([1, 2, 3]));

    await emitCompatibilityPages({
      archiveAssets: ['assets/css/main.css', 'images/pic02.jpg'],
      basePath: '/portfolio/',
      outputRoot,
      siteUrl: 'https://example.com',
      sourceRoot,
    });

    const landing = await readFile(join(outputRoot, 'landing.html'), 'utf8');
    const project = await readFile(join(outputRoot, 'gridPuzzle.html'), 'utf8');

    expect(landing).toContain('url=/portfolio/about/');
    expect(landing).toContain('href="https://example.com/portfolio/about/"');
    expect(project).toContain('url=/portfolio/projects/procedural-jigsaw-puzzle/');
    expect(await readFile(join(outputRoot, 'oldindex.html'), 'utf8')).toBe(
      archiveHtml.replace('/top-down.html', '/portfolio/top-down.html'),
    );
    expect(await readFile(join(sourceRoot, 'oldindex.html'), 'utf8')).toBe(archiveHtml);
    expect([...await readFile(join(outputRoot, 'images/pic02.jpg'))]).toEqual([1, 2, 3]);
  });

  it('covers every retained legacy page and the historical archive aliases', () => {
    expect(LEGACY_REDIRECTS).toEqual({
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
    });
  });
});

describe('generated-site internal links', () => {
  it('resolves the site root and same-document fragments', async () => {
    const root = await makeTemporaryDirectory();
    await writeFixture(root, 'index.html', '<main id="content"><a href="/portfolio/">Home</a></main>');
    await writeFixture(root, 'archive.html', '<header id="top"></header><a href="#top">Top</a>');

    await expect(checkInternalLinks({ basePath: '/portfolio', rootDirectory: root })).resolves.toEqual([]);
  });

  it('accepts valid base-aware pages, assets, fragments, and external URLs', async () => {
    const root = await makeTemporaryDirectory();
    await writeFixture(root, 'index.html', `
      <a href="/portfolio/about/#bio">About</a>
      <img src="/portfolio/media/cover.webp" alt="">
      <a href="https://example.org/reference">Reference</a>
    `);
    await writeFixture(root, 'about/index.html', '<h1 id="bio">Biography</h1>');
    await writeFixture(root, 'media/cover.webp', new Uint8Array([1]));

    await expect(checkInternalLinks({ basePath: '/portfolio', rootDirectory: root })).resolves.toEqual([]);
  });

  it('does not split commas inside data URLs in srcset', async () => {
    const root = await makeTemporaryDirectory();
    await writeFixture(root, 'index.html', `
      <img
        srcset="data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E 1x, /portfolio/media/cover.webp 2x"
        alt=""
      >
    `);
    await writeFixture(root, 'media/cover.webp', new Uint8Array([1]));

    await expect(checkInternalLinks({ basePath: '/portfolio', rootDirectory: root })).resolves.toEqual([]);
  });

  it('resolves relative references from the first base href', async () => {
    const root = await makeTemporaryDirectory();
    await writeFixture(root, 'index.html', `
      <base href="/portfolio/assets/">
      <base href="/portfolio/ignored/">
      <img src="cover.webp" alt="">
    `);
    await writeFixture(root, 'assets/cover.webp', new Uint8Array([1]));

    await expect(checkInternalLinks({ basePath: '/portfolio', rootDirectory: root })).resolves.toEqual([]);
  });

  it('reports missing files and missing target fragments with their source references', async () => {
    const root = await makeTemporaryDirectory();
    await writeFixture(root, 'index.html', `
      <a href="/portfolio/missing/">Missing page</a>
      <a href="/portfolio/about/#missing">Missing section</a>
    `);
    await writeFixture(root, 'about/index.html', '<h1 id="bio">Biography</h1>');

    await expect(checkInternalLinks({ basePath: '/portfolio/', rootDirectory: root })).resolves.toEqual([
      {
        reason: 'target does not exist',
        reference: '/portfolio/missing/',
        source: 'index.html',
      },
      {
        reason: 'fragment #missing does not exist in about/index.html',
        reference: '/portfolio/about/#missing',
        source: 'index.html',
      },
    ]);
  });

  it('checks every local srcset candidate and rejects root paths outside the configured base', async () => {
    const root = await makeTemporaryDirectory();
    await writeFixture(root, 'index.html', `
      <img srcset="/portfolio/media/cover.webp 1x, /portfolio/media/missing.webp 2x" alt="">
      <script src="/outside/app.js"></script>
    `);
    await writeFixture(root, 'media/cover.webp', new Uint8Array([1]));

    await expect(checkInternalLinks({ basePath: '/portfolio', rootDirectory: root })).resolves.toEqual([
      {
        reason: 'target does not exist',
        reference: '/portfolio/media/missing.webp',
        source: 'index.html',
      },
      {
        reason: 'absolute path is outside base /portfolio',
        reference: '/outside/app.js',
        source: 'index.html',
      },
    ]);
  });
});
