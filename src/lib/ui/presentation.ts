import { normalizeBasePath } from '../config/base-path';

export type Language = 'en' | 'tr';
export type PageKey = 'home' | 'about';
export type LocalizedText = Record<Language, string>;

const pageSegments: Record<PageKey, string> = {
  home: '',
  about: 'about',
};

const monthNames: Record<Language, readonly string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  tr: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
};

export function localize(value: LocalizedText, language: Language): string {
  return value[language];
}

export function getAlternateLanguage(language: Language): Language {
  return language === 'en' ? 'tr' : 'en';
}

export function getLocalizedPath(page: PageKey, language: Language, base = '/'): string {
  const normalizedBase = normalizeBasePath(base);
  const prefix = normalizedBase === '/' ? '/' : `${normalizedBase}/`;
  const languageSegment = language === 'tr' ? 'tr/' : '';
  const pageSegment = pageSegments[page] ? `${pageSegments[page]}/` : '';

  return `${prefix}${languageSegment}${pageSegment}`;
}

function formatMonth(value: string, language: Language): string {
  const [year, month] = value.split('-');
  const monthIndex = Number(month) - 1;
  return `${monthNames[language][monthIndex]} ${year}`;
}

export function formatExperienceRange(
  startDate: string,
  endDate: string,
  language: Language,
): string {
  const start = formatMonth(startDate, language);

  if (endDate === startDate) return start;

  const end = endDate === 'present'
    ? language === 'tr' ? 'Günümüz' : 'Present'
    : formatMonth(endDate, language);

  return `${start} — ${end}`;
}
