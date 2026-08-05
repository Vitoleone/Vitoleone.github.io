import { readFile, readdir, stat } from 'node:fs/promises';
import { join, posix, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

import { parse } from 'parse5';
import { parseSrcset } from 'srcset';

import { normalizeBasePath } from '../src/lib/config/base-path.ts';

interface HtmlNode {
  attrs?: Array<{ name: string; value: string }>;
  childNodes?: HtmlNode[];
  tagName?: string;
}

export interface InternalLinkIssue {
  reason: string;
  reference: string;
  source: string;
}

interface CheckInternalLinksOptions {
  basePath?: string;
  rootDirectory: string;
}

const URL_ATTRIBUTES: Record<string, readonly string[]> = {
  a: ['href'],
  area: ['href'],
  audio: ['src'],
  form: ['action'],
  iframe: ['src'],
  img: ['src'],
  input: ['src'],
  link: ['href'],
  object: ['data'],
  script: ['src'],
  source: ['src'],
  track: ['src'],
  video: ['poster', 'src'],
};

const EXTERNAL_SCHEMES = /^(?:blob|data|javascript|mailto|sms|tel):/i;
const URI_SCHEME = /^[a-z][a-z\d+.-]*:/i;

async function listFiles(rootDirectory: string, directory = rootDirectory): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) return listFiles(rootDirectory, absolutePath);
    if (!entry.isFile()) return [];
    return [relative(rootDirectory, absolutePath).split(sep).join('/')];
  }));
  return nested.flat();
}

function walk(node: HtmlNode, visit: (element: HtmlNode) => void) {
  if (node.tagName) visit(node);
  node.childNodes?.forEach((child) => walk(child, visit));
}

function attribute(element: HtmlNode, name: string) {
  return element.attrs?.find((candidate) => candidate.name === name)?.value;
}

function srcsetReferences(value: string) {
  return parseSrcset(value).map((candidate) => candidate.url);
}

function documentReferences(html: string) {
  const references: string[] = [];
  const anchors = new Set<string>();
  let baseHref: string | undefined;
  const document = parse(html) as unknown as HtmlNode;

  walk(document, (element) => {
    const elementBaseHref = element.tagName === 'base' ? attribute(element, 'href') : undefined;
    if (baseHref === undefined && elementBaseHref !== undefined) baseHref = elementBaseHref;

    const id = attribute(element, 'id');
    const name = element.tagName === 'a' ? attribute(element, 'name') : undefined;
    if (id) anchors.add(id);
    if (name) anchors.add(name);

    for (const attributeName of URL_ATTRIBUTES[element.tagName ?? ''] ?? []) {
      const value = attribute(element, attributeName);
      if (value) references.push(value.trim());
    }

    for (const attributeName of ['srcset', 'imagesrcset']) {
      const value = attribute(element, attributeName);
      if (value) references.push(...srcsetReferences(value));
    }
  });

  return { anchors, baseHref, references };
}

function resolveFileTarget(pathname: string, files: Set<string>) {
  const normalized = posix.normalize(pathname).replace(/^\.\//, '').replace(/^\//, '');
  if (!normalized || normalized === '.') return files.has('index.html') ? 'index.html' : undefined;
  const candidates = pathname.endsWith('/')
    ? [`${normalized.replace(/\/$/, '')}/index.html`]
    : [normalized, `${normalized}.html`, `${normalized}/index.html`];
  return candidates.find((candidate) => files.has(candidate));
}

function parseReference(
  reference: string,
  documentBaseUrl: URL,
  basePath: string,
): { fragment: string; pathname: string } | { reason: string } | undefined {
  if (!reference || reference === '#' || EXTERNAL_SCHEMES.test(reference) || reference.startsWith('//')) {
    return undefined;
  }
  if (URI_SCHEME.test(reference)) return undefined;

  let parsed: URL;
  try {
    parsed = new URL(reference, documentBaseUrl);
  } catch {
    return { reason: 'reference is not a valid URL' };
  }

  if (parsed.origin !== 'https://internal.invalid') return undefined;
  const configuredBase = basePath === '/' ? '' : basePath;
  if (configuredBase && parsed.pathname !== configuredBase && !parsed.pathname.startsWith(`${configuredBase}/`)) {
    return { reason: `absolute path is outside base ${basePath}` };
  }

  let pathname: string;
  let fragment: string;
  try {
    pathname = decodeURIComponent(parsed.pathname.slice(configuredBase.length));
    fragment = decodeURIComponent(parsed.hash.slice(1));
  } catch {
    return { reason: 'reference contains invalid percent-encoding' };
  }
  return { fragment, pathname: pathname || '/' };
}

function getDocumentBaseUrl(source: string, basePath: string, baseHref?: string) {
  const fallback = new URL(
    `https://internal.invalid${basePath === '/' ? '' : basePath}/${source}`,
  );
  if (baseHref === undefined) return fallback;

  try {
    const resolved = new URL(baseHref, fallback);
    return /^(?:data|javascript):$/i.test(resolved.protocol) ? fallback : resolved;
  } catch {
    return fallback;
  }
}

export async function checkInternalLinks({
  basePath = '/',
  rootDirectory,
}: CheckInternalLinksOptions): Promise<InternalLinkIssue[]> {
  if (!(await stat(rootDirectory)).isDirectory()) {
    throw new Error(`Link-check root is not a directory: ${rootDirectory}`);
  }

  const normalizedBase = normalizeBasePath(basePath);
  const fileList = await listFiles(rootDirectory);
  const files = new Set(fileList);
  const htmlFiles = fileList.filter((file) => file.endsWith('.html')).sort();
  const documents = new Map<string, ReturnType<typeof documentReferences>>();

  await Promise.all(htmlFiles.map(async (file) => {
    documents.set(file, documentReferences(await readFile(join(rootDirectory, file), 'utf8')));
  }));

  const issues: InternalLinkIssue[] = [];
  for (const source of htmlFiles) {
    const document = documents.get(source);
    const documentBaseUrl = getDocumentBaseUrl(source, normalizedBase, document?.baseHref);
    for (const reference of document?.references ?? []) {
      const parsed = parseReference(reference, documentBaseUrl, normalizedBase);
      if (!parsed) continue;
      if ('reason' in parsed) {
        issues.push({ reason: parsed.reason, reference, source });
        continue;
      }

      const target = resolveFileTarget(parsed.pathname, files);
      if (!target) {
        issues.push({ reason: 'target does not exist', reference, source });
        continue;
      }

      if (parsed.fragment && target.endsWith('.html')) {
        const targetDocument = documents.get(target);
        if (!targetDocument?.anchors.has(parsed.fragment)) {
          issues.push({
            reason: `fragment #${parsed.fragment} does not exist in ${target}`,
            reference,
            source,
          });
        }
      }
    }
  }

  return issues;
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (import.meta.url === invokedPath) {
  const rootDirectory = process.argv[2] ?? 'dist';
  const issues = await checkInternalLinks({
    basePath: process.env.GITHUB_PAGES_BASE_PATH ?? '/',
    rootDirectory,
  });

  if (issues.length > 0) {
    for (const issue of issues) {
      console.error(`${issue.source}: ${issue.reference} (${issue.reason})`);
    }
    console.error(`Found ${issues.length} broken internal link${issues.length === 1 ? '' : 's'}.`);
    process.exitCode = 1;
  } else {
    console.log(`Checked internal links in ${rootDirectory}: no broken links found.`);
  }
}
