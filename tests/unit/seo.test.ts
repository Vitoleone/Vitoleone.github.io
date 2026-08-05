import { describe, expect, it } from 'vitest';

import { createPersonJsonLd, createProjectJsonLd, getSitemapUrl } from '../../src/lib/seo/structured-data';

describe('structured portfolio metadata', () => {
  const profile = {
    name: 'Noyan Berkay Aşkın',
    headline: { en: 'Game Developer', tr: 'Oyun Geliştiricisi' },
    bio: { en: 'Builds games.', tr: 'Oyunlar geliştirir.' },
    email: 'developer@example.com',
  };
  const settings = {
    siteUrl: 'https://example.com',
    socials: [
      { label: 'GitHub', url: 'https://github.com/example' },
      { label: 'LinkedIn', url: 'https://linkedin.com/in/example' },
    ],
  };

  it('describes the portfolio owner without publishing an email address', () => {
    expect(createPersonJsonLd(profile, settings, 'tr')).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Noyan Berkay Aşkın',
      url: 'https://example.com',
      jobTitle: 'Oyun Geliştiricisi',
      description: 'Oyunlar geliştirir.',
      sameAs: ['https://github.com/example', 'https://linkedin.com/in/example'],
    });
  });

  it('describes a localized project and attributes it to the portfolio owner', () => {
    const project = {
      slug: 'match-squares',
      title: { en: 'Match Squares', tr: 'Match Squares' },
      description: { en: 'A puzzle demo.', tr: 'Bir bulmaca demosu.' },
      role: { en: 'Unity Developer', tr: 'Unity Geliştiricisi' },
      releaseYear: 2024,
      technologies: ['Unity', 'C#'],
      links: { source: 'https://github.com/example/match-squares' },
    };

    expect(
      createProjectJsonLd(
        project,
        profile,
        'en',
        'https://example.com/projects/match-squares/',
        'https://example.com/assets/cover.gif',
      ),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: 'Match Squares',
      description: 'A puzzle demo.',
      url: 'https://example.com/projects/match-squares/',
      image: 'https://example.com/assets/cover.gif',
      datePublished: '2024',
      keywords: ['Unity', 'C#'],
      creator: { '@type': 'Person', name: 'Noyan Berkay Aşkın' },
      contributor: {
        '@type': 'Person',
        name: 'Noyan Berkay Aşkın',
        jobTitle: 'Unity Developer',
      },
      sameAs: 'https://github.com/example/match-squares',
    });
  });

  it.each([
    ['https://example.com', '/', 'https://example.com/sitemap-index.xml'],
    ['https://example.com', '/portfolio/', 'https://example.com/portfolio/sitemap-index.xml'],
    ['https://example.com/', 'portfolio', 'https://example.com/portfolio/sitemap-index.xml'],
  ])('builds a normalized sitemap URL for robots.txt', (site, base, expected) => {
    expect(getSitemapUrl(site, base)).toBe(expected);
  });
});
