import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

import {
  experienceSchema,
  profileSchema,
  projectSchema,
  siteSettingsSchema,
  skillSchema,
} from '../../src/lib/content/schemas';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const contentRoot = resolve(projectRoot, 'src/content');
const projectMediaRoot = resolve(projectRoot, 'src/assets/project-media');

function assertContainedProjectMedia(entryPath: string, source: string) {
  const resolvedSource = resolve(dirname(entryPath), source);
  const relativeSource = relative(projectMediaRoot, resolvedSource);
  const isContained =
    relativeSource !== '..' &&
    !relativeSource.startsWith(`..${sep}`) &&
    !isAbsolute(relativeSource);

  expect(isContained, `${source} should resolve within ${projectMediaRoot}`).toBe(true);
  expect(existsSync(resolvedSource), source).toBe(true);
}

function loadCollection(directory: string) {
  const collectionDirectory = resolve(contentRoot, directory);

  return readdirSync(collectionDirectory)
    .filter((file) => /\.ya?ml$/i.test(file))
    .sort()
    .map((file) => ({
      file,
      path: resolve(collectionDirectory, file),
      data: parse(readFileSync(resolve(collectionDirectory, file), 'utf8')),
    }));
}

describe('migrated portfolio content', () => {
  it('loads every collection entry through its production schema without mojibake', () => {
    const collections = [
      { entries: loadCollection('projects'), schema: projectSchema, expectedCount: 12 },
      { entries: loadCollection('profile'), schema: profileSchema, expectedCount: 1 },
      { entries: loadCollection('experience'), schema: experienceSchema, expectedCount: 6 },
      { entries: loadCollection('skills'), schema: skillSchema, expectedCount: 6 },
      { entries: loadCollection('site-settings'), schema: siteSettingsSchema, expectedCount: 1 },
    ];

    for (const { entries, schema, expectedCount } of collections) {
      expect(entries).toHaveLength(expectedCount);
      for (const entry of entries) {
        expect(() => schema.parse(entry.data), entry.file).not.toThrow();
        expect(JSON.stringify(entry.data), entry.file).not.toMatch(/[ÃÄÅâţý]/u);
      }
    }
  });

  it('contains the eleven legacy projects plus The Boss in unique display order', () => {
    const projects = loadCollection('projects').map((entry) => projectSchema.parse(entry.data));
    const expectedSlugs = [
      'cemerzone',
      'city-builder',
      'clash-royale-clone',
      'fish-masters',
      'geometry-dash-clone',
      'harvest-it',
      'match-squares',
      'multiplayer-top-down-shooter',
      'pop-melon',
      'procedural-jigsaw-puzzle',
      'ship-action-demo',
      'the-boss-gangster-criminal-empire',
    ];

    expect(projects).toHaveLength(12);
    expect(projects.map(({ slug }) => slug).toSorted()).toEqual(expectedSlugs);
    expect(new Set(projects.map(({ slug }) => slug)).size).toBe(12);
    expect(new Set(projects.map(({ order }) => order)).size).toBe(12);
    expect(projects.every(({ published }) => published)).toBe(true);
  });

  it('keeps The Boss metadata exact with a single verified mechanics placeholder', () => {
    const boss = projectSchema.parse(
      loadCollection('projects').find(({ data }) => data.slug === 'the-boss-gangster-criminal-empire')
        ?.data,
    );

    expect(boss).toMatchObject({
      order: 1,
      featured: true,
      title: {
        en: 'The Boss Gangster: Criminal Empire',
        tr: 'The Boss Gangster: Criminal Empire',
      },
      role: { en: 'Gameplay Programmer', tr: 'Oynanış Programcısı' },
      developer: 'BEF GAMES',
      publisher: 'Tripwire Presents',
      releaseYear: 2025,
      technologies: [],
      links: {
        store:
          'https://store.steampowered.com/app/2774040/The_Boss_Gangster_Criminal_Empire/',
      },
    });
    expect(boss.projectWork).toMatchObject({
      title: { en: 'Game Mechanics', tr: 'Oyun Mekaniği' },
    });
    expect(boss.projectWork?.media).toBeUndefined();
    expect(boss.contributions).toEqual([]);
    for (const contribution of boss.contributions) {
      expect(contribution.title.en).toMatch(/^Example\b/);
      expect(contribution.title.tr).toMatch(/^Örnek\b/u);
      expect(contribution.description.en).toMatch(
        /(?:not a production claim|no unverified production detail is asserted)/i,
      );
      expect(contribution.description.tr).toMatch(
        /(?:bir üretim iddiası değildir|doğrulanmamış bir üretim detayı öne sürülmez)/iu,
      );
      expect(contribution.media).toBeUndefined();
    }
  });

  it('preserves the verified CEMERZONE project information link', () => {
    const cemerzone = projectSchema.parse(
      loadCollection('projects').find(({ data }) => data.slug === 'cemerzone')?.data,
    );

    expect(cemerzone.links.info).toBe('https://www.youtube.com/watch?v=W05a9Q43IJY');
  });

  it('omits the erroneous Fish Masters source URL', () => {
    const fishMasters = projectSchema.parse(
      loadCollection('projects').find(({ data }) => data.slug === 'fish-masters')?.data,
    );

    expect(fishMasters.links.source).toBeUndefined();
  });

  it('keeps contact details while leaving the unverified CV URL absent', () => {
    const profile = profileSchema.parse(loadCollection('profile')[0]?.data);
    const settings = siteSettingsSchema.parse(loadCollection('site-settings')[0]?.data);

    expect(profile.email).toBe('berkay4.askin@gmail.com');
    expect(profile.cvUrl).toBeUndefined();
    expect(settings.socials).toEqual([
      { label: 'GitHub', url: 'https://github.com/Vitoleone' },
      {
        label: 'LinkedIn',
        url: 'https://www.linkedin.com/in/noyan-berkay-askin-616a75224/',
      },
    ]);
  });

  it('references only existing local project media', () => {
    const entries = loadCollection('projects');

    for (const entry of entries) {
      const project = projectSchema.parse(entry.data);
      const sources = [
        project.cover?.src,
        ...project.gallery.map(({ src }) => src),
        ...project.contributions.flatMap(({ media }) =>
          media && media.type !== 'drive' ? [media.src] : [],
        ),
      ].filter((source): source is string => Boolean(source));

      for (const source of sources) {
        expect(source, `${entry.file} should use repository media`).toMatch(
          /^\.\.\/\.\.\/assets\/project-media\//,
        );
        assertContainedProjectMedia(entry.path, source);
      }
    }
  });

  it('rejects traversal after the project-media text prefix', () => {
    const exampleEntry = resolve(contentRoot, 'projects/example.yml');

    expect(() =>
      assertContainedProjectMedia(
        exampleEntry,
        '../../assets/project-media/../../../content/profile/profile.yml',
      ),
    ).toThrow(/should resolve within/u);
  });

  it('includes the current BEF GAMES Gameplay Programmer role', () => {
    const befGames = experienceSchema.parse(
      loadCollection('experience').find(({ data }) => data.company === 'BEF GAMES')?.data,
    );

    expect(befGames).toMatchObject({
      company: 'BEF GAMES',
      role: { en: 'Gameplay Programmer', tr: 'Oynanış Programcısı' },
      startDate: '2025-11',
      endDate: 'present',
    });
  });
});
