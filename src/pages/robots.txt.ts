import type { APIRoute } from 'astro';

import { getSitemapUrl } from '../lib/seo/structured-data';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL;
  const sitemapUrl = getSitemapUrl(
    (site ?? new URL('https://vitoleone.github.io')).toString(),
    base,
  );

  return new Response(`User-agent: *\nAllow: /\nSitemap: ${sitemapUrl}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
