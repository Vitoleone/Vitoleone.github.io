import { getLocalizedPath, type Language, type PageKey } from './presentation';

export const languagePreferenceStorageKey = 'portfolio-language';

export type LanguagePreferenceContext = {
  storedLanguage?: string | null;
  language: Language;
  page: PageKey;
  isRootEntry: boolean;
  base: string;
};

type LanguagePreferenceRuntime = {
  storage: {
    getItem(key: string): string | null;
  };
  location: {
    pathname: string;
    search: string;
    hash: string;
    replace(url: string): void;
  };
};

export function getLanguagePreferenceRedirect({
  storedLanguage,
  language,
  page,
  isRootEntry,
  base,
}: LanguagePreferenceContext): string | undefined {
  if (!isRootEntry || language !== 'en' || page !== 'home' || storedLanguage !== 'tr') {
    return undefined;
  }

  return getLocalizedPath('home', 'tr', base);
}

export function restoreLanguagePreference(
  context: Omit<LanguagePreferenceContext, 'storedLanguage'>,
  providedRuntime?: LanguagePreferenceRuntime,
): string | undefined {
  const runtime = providedRuntime ?? {
    storage: window.localStorage,
    location: {
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      replace: (url: string) => window.location.replace(url),
    },
  };

  let storedLanguage: string | null;
  try {
    storedLanguage = runtime.storage.getItem(languagePreferenceStorageKey);
  } catch {
    return undefined;
  }

  const redirect = getLanguagePreferenceRedirect({ ...context, storedLanguage });
  if (!redirect || runtime.location.pathname === redirect) return undefined;

  const destination = `${redirect}${runtime.location.search}${runtime.location.hash}`;
  runtime.location.replace(destination);
  return destination;
}
