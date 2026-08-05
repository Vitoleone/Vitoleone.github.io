export function normalizeBasePath(value: string): string {
  const segment = value.replace(/^\/+|\/+$/g, '');
  return segment ? `/${segment}` : '/';
}
