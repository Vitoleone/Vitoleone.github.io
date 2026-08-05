import type { Profile, Project, SiteSettings } from '../content/schemas';
import { normalizeBasePath } from '../config/base-path';
import type { Language } from '../ui/presentation';

type PersonProfile = Pick<Profile, 'name' | 'headline' | 'bio'>;
type PersonSettings = Pick<SiteSettings, 'siteUrl' | 'socials'>;
type StructuredProject = Pick<
  Project,
  'title' | 'description' | 'role' | 'releaseYear' | 'technologies' | 'links'
>;

export function createPersonJsonLd(
  profile: PersonProfile,
  settings: PersonSettings,
  language: Language,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    url: settings.siteUrl,
    jobTitle: profile.headline[language],
    description: profile.bio[language],
    sameAs: settings.socials.map(({ url }) => url),
  };
}

export function createProjectJsonLd(
  project: StructuredProject,
  profile: Pick<Profile, 'name'>,
  language: Language,
  canonicalUrl: string,
  imageUrl?: string,
) {
  const externalUrl = project.links.play
    ?? project.links.store
    ?? project.links.source
    ?? project.links.info;

  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title[language],
    description: project.description[language],
    url: canonicalUrl,
    ...(imageUrl ? { image: imageUrl } : {}),
    ...(project.releaseYear ? { datePublished: String(project.releaseYear) } : {}),
    ...(project.technologies.length > 0 ? { keywords: project.technologies } : {}),
    creator: { '@type': 'Person', name: profile.name },
    contributor: {
      '@type': 'Person',
      name: profile.name,
      jobTitle: project.role[language],
    },
    ...(externalUrl ? { sameAs: externalUrl } : {}),
  };
}

export function getSitemapUrl(siteUrl: string, base: string): string {
  const normalizedBase = normalizeBasePath(base);
  const path = `${normalizedBase === '/' ? '/' : `${normalizedBase}/`}sitemap-index.xml`;
  return new URL(path, siteUrl).toString();
}
