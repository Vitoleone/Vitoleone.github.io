export type ProjectSlugSource = {
  slug: string;
  source: string;
};

export function assertUniqueProjectSlugs(projects: readonly ProjectSlugSource[]): void {
  const sourcesBySlug = new Map<string, string[]>();

  for (const project of projects) {
    const sources = sourcesBySlug.get(project.slug) ?? [];
    sources.push(project.source);
    sourcesBySlug.set(project.slug, sources);
  }

  const duplicates = [...sourcesBySlug]
    .filter(([, sources]) => sources.length > 1)
    .map(([slug, sources]) => `"${slug}" in ${sources.join(', ')}`);

  if (duplicates.length > 0) {
    throw new Error(`Duplicate project slug${duplicates.length > 1 ? 's' : ''}: ${duplicates.join('; ')}`);
  }
}

type SlugIdInput = {
  data: Record<string, unknown>;
  entry: string;
  base: URL;
};

export function createUniqueSlugIdGenerator(): (input: SlugIdInput) => string {
  const slugBySource = new Map<string, string>();
  const sourceBySlug = new Map<string, string>();

  return ({ data, entry }) => {
    const slug = typeof data.slug === 'string' ? data.slug : entry.replace(/\.(?:yml|yaml)$/, '');
    const previousSlug = slugBySource.get(entry);

    if (previousSlug && previousSlug !== slug && sourceBySlug.get(previousSlug) === entry) {
      sourceBySlug.delete(previousSlug);
    }

    const existingSource = sourceBySlug.get(slug);
    if (existingSource && existingSource !== entry) {
      assertUniqueProjectSlugs([
        { slug, source: existingSource },
        { slug, source: entry },
      ]);
    }

    slugBySource.set(entry, slug);
    sourceBySlug.set(slug, entry);
    return slug;
  };
}

type OrderedProjectEntry = {
  data: {
    published: boolean;
    order: number;
  };
};

export function getPublishedProjects<T extends OrderedProjectEntry>(projects: readonly T[]): T[] {
  return projects
    .filter(({ data }) => data.published)
    .toSorted((left, right) => left.data.order - right.data.order);
}

export type ProjectCtaKind = 'play' | 'store' | 'source';
export type ProjectLinks = Partial<Record<ProjectCtaKind, string | undefined>>;

export function getVisibleCtas(links: ProjectLinks | undefined): Array<{
  kind: ProjectCtaKind;
  href: string;
}> {
  if (!links) return [];

  return (['play', 'store', 'source'] as const).flatMap((kind) => {
    const href = links[kind]?.trim();
    return href ? [{ kind, href }] : [];
  });
}
