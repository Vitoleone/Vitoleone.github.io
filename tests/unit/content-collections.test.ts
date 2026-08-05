import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
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
      { entries: loadCollection('experience'), schema: experienceSchema, expectedCount: 5 },
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

    expect(projects).toHaveLength(12);
    expect(new Set(projects.map(({ slug }) => slug)).size).toBe(12);
    expect(new Set(projects.map(({ order }) => order)).size).toBe(12);
    expect(projects.every(({ published }) => published)).toBe(true);
  });

  it('keeps The Boss metadata exact and its initial carousel content explicitly exemplary', () => {
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
    expect(boss.contributions.length).toBeGreaterThanOrEqual(2);
    expect(boss.contributions[0]?.title.en).toMatch(/^Example\b/);
    expect(boss.contributions[0]?.title.tr).toMatch(/^Örnek\b/u);
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
        expect(existsSync(resolve(dirname(entry.path), source)), source).toBe(true);
      }
    }
  });
});
