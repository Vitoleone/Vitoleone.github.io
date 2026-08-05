export type TechnologySource = {
  technologies: readonly string[];
};

export type TechnologyFilter = {
  key: string;
  label: string;
  count: number;
};

export function normalizeFilterKey(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getTechnologyFilters(projects: readonly TechnologySource[]): TechnologyFilter[] {
  const filters = new Map<string, TechnologyFilter>();

  for (const project of projects) {
    const uniqueTechnologies = new Map(
      project.technologies.map((label) => [normalizeFilterKey(label), label] as const),
    );

    for (const [key, label] of uniqueTechnologies) {
      const filter = filters.get(key);
      filters.set(key, filter ? { ...filter, count: filter.count + 1 } : { key, label, count: 1 });
    }
  }

  return [...filters.values()].sort(
    (left, right) => right.count - left.count || left.label.localeCompare(right.label),
  );
}

export function projectMatchesFilter(technologies: readonly string[], filterKey: string): boolean {
  return filterKey === 'all'
    || technologies.some((technology) => normalizeFilterKey(technology) === filterKey);
}
