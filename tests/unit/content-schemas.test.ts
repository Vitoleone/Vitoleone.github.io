import { describe, expect, it } from 'vitest';

import {
  experienceSchema,
  localizedTextSchema,
  profileSchema,
  projectSchema,
  siteSettingsSchema,
  skillSchema,
} from '../../src/lib/content/schemas';

const localized = (en: string, tr: string) => ({ en, tr });

const validProject = {
  slug: 'sample-game',
  published: true,
  featured: false,
  order: 2,
  title: localized('Sample Game', 'Örnek Oyun'),
  summary: localized('A concise summary.', 'Kısa bir özet.'),
  description: localized('A longer description.', 'Daha uzun bir açıklama.'),
  role: localized('Gameplay Programmer', 'Oynanış Programcısı'),
  technologies: ['Unity', 'C#'],
  gallery: [],
  links: {},
};

describe('localized content schemas', () => {
  it('rejects content when either supported language is missing', () => {
    expect(() => localizedTextSchema.parse({ en: 'English only' })).toThrow(/tr/i);
  });

  it('trims and accepts non-empty English and Turkish values', () => {
    expect(localizedTextSchema.parse({ en: ' Hello ', tr: ' Merhaba ' })).toEqual({
      en: 'Hello',
      tr: 'Merhaba',
    });
  });
});

describe('portfolio collection schemas', () => {
  it('accepts a complete bilingual project with valid publication ordering', () => {
    expect(projectSchema.parse(validProject)).toMatchObject({
      slug: 'sample-game',
      published: true,
      order: 2,
    });
  });

  it('accepts one optional project-work block with a legacy local video', () => {
    const project = projectSchema.parse({
      ...validProject,
      projectWork: {
        title: localized('Gameplay', 'Oynanış'),
        description: localized('A focused gameplay explanation.', 'Odaklı bir oynanış açıklaması.'),
        media: {
          type: 'video',
          src: '/images/FishMasters.mp4',
          caption: localized('Gameplay video', 'Oynanış videosu'),
        },
      },
    });

    expect(project.projectWork?.media).toMatchObject({
      type: 'video',
      src: '/images/FishMasters.mp4',
    });
  });

  it.each([0, -1, 1.5])('rejects invalid project order %s', (order) => {
    expect(() => projectSchema.parse({ ...validProject, order })).toThrow(/order/i);
  });

  it('normalizes whitespace-only optional project CTAs to absent values', () => {
    const result = projectSchema.parse({
      ...validProject,
      links: { source: '   ', store: '' },
    });

    expect(result.links).toEqual({});
  });

  it.each(['javascript:alert(1)', 'data:text/html,<h1>unsafe</h1>', 'mailto:hello@example.com'])(
    'rejects non-HTTP project CTA protocol in %s',
    (source) => {
      expect(() =>
        projectSchema.parse({
          ...validProject,
          links: { source },
        }),
      ).toThrow(/http/i);
    },
  );

  it('accepts HTTP and HTTPS website links', () => {
    const result = projectSchema.parse({
      ...validProject,
      links: {
        play: 'http://example.com/play',
        info: 'https://example.com/information',
        store: 'https://example.com/store',
      },
    });

    expect(result.links).toEqual({
      play: 'http://example.com/play',
      info: 'https://example.com/information',
      store: 'https://example.com/store',
    });
  });

  it('reports a validation error for a malformed website link', () => {
    expect(() =>
      projectSchema.parse({
        ...validProject,
        links: { play: 'not a URL' },
      }),
    ).toThrow(/URL/i);
  });

  it('rejects a non-HTTP profile CV link', () => {
    expect(() =>
      profileSchema.parse({
        name: 'Vito Leone',
        headline: localized('Game Developer', 'Oyun Geliştirici'),
        bio: localized('English biography.', 'Türkçe biyografi.'),
        email: 'hello@example.com',
        cvUrl: 'javascript:alert(1)',
      }),
    ).toThrow(/http/i);
  });

  it('rejects a non-HTTP canonical site link', () => {
    expect(() =>
      siteSettingsSchema.parse({
        siteTitle: localized('Portfolio', 'Portfolyo'),
        siteDescription: localized('Game development portfolio.', 'Oyun geliştirme portfolyosu.'),
        siteUrl: 'data:text/html,unsafe',
        socials: [],
      }),
    ).toThrow(/http/i);
  });

  it('rejects a non-HTTP social link without changing profile email handling', () => {
    expect(() =>
      siteSettingsSchema.parse({
        siteTitle: localized('Portfolio', 'Portfolyo'),
        siteDescription: localized('Game development portfolio.', 'Oyun geliştirme portfolyosu.'),
        siteUrl: 'https://vitoleone.github.io',
        socials: [{ label: 'Email', url: 'mailto:hello@example.com' }],
      }),
    ).toThrow(/http/i);

    const profile = profileSchema.parse({
      name: 'Vito Leone',
      headline: localized('Game Developer', 'Oyun Geliştirici'),
      bio: localized('English biography.', 'Türkçe biyografi.'),
      email: 'hello@example.com',
    });

    expect(profile.email).toBe('hello@example.com');
  });

  it('validates profile, experience, skill and site settings entries', () => {
    expect(
      profileSchema.parse({
        name: 'Vito Leone',
        headline: localized('Game Developer', 'Oyun Geliştirici'),
        bio: localized('English biography.', 'Türkçe biyografi.'),
        email: 'hello@example.com',
      }),
    ).toBeTruthy();

    expect(
      experienceSchema.parse({
        company: 'Example Studio',
        role: localized('Programmer', 'Programcı'),
        summary: localized('Built game systems.', 'Oyun sistemleri geliştirdi.'),
        startDate: '2024-01',
        endDate: 'present',
        order: 1,
      }),
    ).toBeTruthy();

    expect(
      skillSchema.parse({
        name: localized('Gameplay programming', 'Oynanış programlama'),
        category: localized('Engineering', 'Mühendislik'),
        order: 1,
      }),
    ).toBeTruthy();

    expect(
      siteSettingsSchema.parse({
        siteTitle: localized('Portfolio', 'Portfolyo'),
        siteDescription: localized('Game development portfolio.', 'Oyun geliştirme portfolyosu.'),
        siteUrl: 'https://vitoleone.github.io',
        socials: [],
      }),
    ).toBeTruthy();
  });
});
