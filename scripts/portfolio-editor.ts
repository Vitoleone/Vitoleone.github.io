import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, rename, writeFile } from 'node:fs/promises';
import { extname, join, normalize, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse, stringify } from 'yaml';

import { layoutDocumentSchema, type LayoutDocument } from '../src/lib/content/layout-schemas';
import { assertFeatureBranch, commitEditorFiles, getCurrentBranch } from '../src/lib/editor/git';

const root = fileURLToPath(new URL('../', import.meta.url));
const editorRoot = join(root, 'editor');
const layoutPaths = {
  home: 'src/content/layouts/home.yml',
  project: 'src/content/layouts/project.yml',
} as const;
type Draft = { home: LayoutDocument; project: LayoutDocument };

let draft: Draft;
let previewStarted = false;
let previewProcess: import('node:child_process').ChildProcess | undefined;

async function loadDraft(): Promise<Draft> {
  const [home, project] = await Promise.all([
    readFile(join(root, layoutPaths.home), 'utf8'),
    readFile(join(root, layoutPaths.project), 'utf8'),
  ]);
  return {
    home: layoutDocumentSchema.parse(parse(home)),
    project: layoutDocumentSchema.parse(parse(project)),
  } as Draft;
}

function sendJson(response: import('node:http').ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

async function readJson(request: import('node:http').IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function writeDraft(nextDraft: Draft) {
  const normalized = {
    home: layoutDocumentSchema.parse(nextDraft.home),
    project: layoutDocumentSchema.parse(nextDraft.project),
  } as Draft;
  const branch = await getCurrentBranch(root);
  assertFeatureBranch(branch);
  const writes = await Promise.all(Object.entries(layoutPaths).map(async ([kind, path]) => {
    const temporary = `${join(root, path)}.portfolio-editor.tmp`;
    await writeFile(temporary, stringify(normalized[kind as keyof Draft]), 'utf8');
    return { path, temporary };
  }));
  await Promise.all(writes.map(({ path, temporary }) => rename(temporary, join(root, path))));
  draft = normalized;
  return Object.values(layoutPaths);
}

function contentType(path: string) {
  return extname(path) === '.js' ? 'text/javascript; charset=utf-8'
    : extname(path) === '.css' ? 'text/css; charset=utf-8'
      : 'text/html; charset=utf-8';
}

async function serveStatic(pathname: string, response: import('node:http').ServerResponse) {
  const relativePath = pathname === '/' ? 'index.html' : pathname.slice(1);
  const requested = normalize(join(editorRoot, relativePath));
  if (relative(editorRoot, requested).startsWith('..')) {
    sendJson(response, 403, { message: 'Forbidden.' });
    return;
  }
  try {
    response.writeHead(200, { 'content-type': contentType(requested) });
    response.end(await readFile(requested));
  } catch {
    sendJson(response, 404, { message: 'Not found.' });
  }
}

async function startPreview() {
  if (previewStarted) return;
  try {
    await fetch('http://127.0.0.1:4321/', { signal: AbortSignal.timeout(500) });
    previewStarted = true;
  } catch {
    previewProcess = spawn('cmd.exe', ['/d', '/s', '/c', 'npm run dev -- --host 127.0.0.1 --port 4321'], {
      cwd: root,
      stdio: 'ignore',
      windowsHide: true,
    });
    previewStarted = true;
  }
}

draft = await loadDraft();
await startPreview();

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1:4322');
  try {
    if (request.method === 'GET' && url.pathname === '/api/draft') {
      sendJson(response, 200, { draft, branch: await getCurrentBranch(root) });
      return;
    }
    if (request.method === 'PUT' && url.pathname === '/api/draft') {
      const body = await readJson(request) as Draft;
      draft = { home: layoutDocumentSchema.parse(body.home), project: layoutDocumentSchema.parse(body.project) } as Draft;
      sendJson(response, 200, { draft });
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/save') {
      sendJson(response, 200, { changedFiles: await writeDraft(draft) });
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/commit') {
      const body = await readJson(request) as { message?: string };
      const files = await writeDraft(draft);
      await commitEditorFiles(root, files, body.message ?? '');
      sendJson(response, 200, { message: 'Committed.' });
      return;
    }
    await serveStatic(url.pathname, response);
  } catch (error) {
    sendJson(response, 400, { message: error instanceof Error ? error.message : 'Editor request failed.' });
  }
});

server.listen(4322, '127.0.0.1', () => {
  console.log('Portfolio editor ready at http://127.0.0.1:4322/');
  spawn('cmd.exe', ['/d', '/s', '/c', 'start "" "http://127.0.0.1:4322/"'], {
    stdio: 'ignore',
    windowsHide: true,
  });
});

process.on('SIGINT', () => {
  previewProcess?.kill();
  server.close(() => process.exit(0));
});
