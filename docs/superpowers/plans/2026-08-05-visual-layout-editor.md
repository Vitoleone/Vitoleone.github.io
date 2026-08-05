# Visual Layout Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local visual editor that configures constrained home/project blocks, offers a live desktop/mobile preview, and writes or commits only the current feature branch.

**Architecture:** Astro continues rendering the static public portfolio from YAML. A layout collection controls ordered predefined blocks. A local Node 24 TypeScript server owns in-memory drafts and serves a no-build browser UI; a development-only preview bridge applies those drafts to marked Astro elements. There is no public editor route or production write endpoint.

**Tech Stack:** Astro 7, TypeScript 6, Zod 4, YAML 2, Node 24, `tsx`, plain browser JavaScript, Vitest 4, Playwright.

## Global Constraints

- Only `feature/portfolio-renewal` can save or commit; `main` and non-feature branches fail before content changes.
- Bind editor services to `127.0.0.1`; do not add an editor API under `src/pages`.
- Supported variants are `standard`, `muted`, `accent`; spacing is `compact`, `standard`, `spacious`. No raw CSS, arbitrary classes, or pixel positioning.
- Drafts stay in memory until **Save** or **Save and commit**.
- Save validates the complete draft and writes YAML atomically. Commit stages only a checked allowlist, never `git add .`.
- Preserve bilingual English/Turkish content. Remove the standalone ProjectWork section and show mechanics inside project overview.
- Complete with `npm run verify` and `npm run test:e2e`.

## File Map

| Path | Role |
| --- | --- |
| `src/lib/content/layout-schemas.ts` | Layout Zod schemas, known ids, defaults, ordering helper and TypeScript contracts. |
| `src/content/layouts/home.yml` | Home block settings and bilingual block copy. |
| `src/content/layouts/project.yml` | Default project block settings. |
| `src/lib/editor/git.ts` | Branch guard, allowed paths and scoped commit. |
| `scripts/portfolio-editor.ts` | Local draft API and static UI host. |
| `editor/index.html`, `editor/app.js`, `editor/styles.css` | Three-pane editor interface. |
| `src/scripts/editor-preview.ts` | Development-only iframe message bridge. |
| `Portfolyo-Editorunu-Ac.cmd` | Windows editor launcher. |

### Task 1: Layout schemas and default documents

**Files:**
- Create: `src/lib/content/layout-schemas.ts`, `src/content/layouts/home.yml`, `src/content/layouts/project.yml`, `tests/unit/layout-schemas.test.ts`
- Modify: `src/content.config.ts`, `src/lib/content/schemas.ts`, `tests/unit/content-schemas.test.ts`

**Interfaces:** `normalizeBlocks(blocks, kind)` returns exactly one valid entry for each known home or project id, sorted by `order`; missing entries are disabled defaults. Export `homeLayoutSchema`, `projectLayoutSchema`, `projectBlockSchema`, `HOME_BLOCK_IDS`, and `PROJECT_BLOCK_IDS`.

- [ ] **Step 1: Write failing schema tests.**

```ts
it('rejects duplicate ids and unknown variants', () => {
  expect(() => homeLayoutSchema.parse({ kind: 'home', blocks: [
    { id: 'hero', enabled: true, order: 1, variant: 'neon', spacing: 'standard' },
    { id: 'hero', enabled: true, order: 2, variant: 'standard', spacing: 'standard' },
  ] })).toThrow();
});

it('fills missing home blocks as disabled defaults', () => {
  expect(normalizeBlocks([{ id: 'hero', enabled: true, order: 1, variant: 'accent', spacing: 'spacious' }], 'home'))
    .toEqual(expect.arrayContaining([expect.objectContaining({ id: 'contact', enabled: false })]));
});
```

- [ ] **Step 2: Run the test.**

Run: `npm run test:unit -- tests/unit/layout-schemas.test.ts`

Expected: FAIL because the module is missing.

- [ ] **Step 3: Implement schemas and defaults.**

```ts
export const blockVariantSchema = z.enum(['standard', 'muted', 'accent']);
export const blockSpacingSchema = z.enum(['compact', 'standard', 'spacious']);
export const homeBlockIdSchema = z.enum(['hero', 'featured-projects', 'projects', 'skills', 'experience', 'about', 'contact']);
export const projectBlockIdSchema = z.enum(['overview', 'mechanics', 'media', 'technologies', 'details', 'links', 'gallery']);
```

Create documents discriminated with `kind: home` and `kind: project`. Preserve the present home order. Add optional `pageBlocks` to each project record; keep `projectWork` only as the mechanics content source.

- [ ] **Step 4: Register and validate the collection.**

```ts
const layouts = defineCollection({
  loader: glob({ base: './src/content/layouts', pattern: yamlPattern }),
  schema: layoutDocumentSchema,
});
export const collections = { projects, profile, experience, skills, siteSettings, layouts };
```

Run: `npm run test:unit -- tests/unit/layout-schemas.test.ts tests/unit/content-schemas.test.ts && npm run validate:content`

Expected: PASS. Commit with message `feat: add editable page layout model`.

### Task 2: Render ordered blocks and inline mechanics

**Files:**
- Create: `src/components/ProjectMechanics.astro`
- Delete: `src/components/ProjectWork.astro`
- Modify: `src/views/HomePage.astro`, `src/views/ProjectPage.astro`, `src/styles/global.css`, `tests/e2e/interactions.spec.ts`, `tests/e2e/accessibility.spec.ts`

**Interfaces:** Every output section has `data-editor-block`, `data-editor-variant`, and `data-editor-spacing`. `ProjectMechanics.astro` accepts `{ mechanics: Project['projectWork']; language: Language; visible: boolean }`.

- [ ] **Step 1: Write failing browser assertions.**

```ts
test('renders mechanics inside overview with no standalone work section', async ({ page }) => {
  await page.goto('/projects/ship-action-demo/');
  await expect(page.locator('.project-overview [data-editor-block="mechanics"]')).toContainText('Missions and Resources');
  await expect(page.locator('.project-overview video[controls][preload="metadata"]')).toHaveCount(1);
  await expect(page.locator('.project-work')).toHaveCount(0);
});
```

- [ ] **Step 2: Run the test.**

Run: `npm run test:e2e -- tests/e2e/interactions.spec.ts`

Expected: FAIL because `ProjectWork` remains separate.

- [ ] **Step 3: Implement constrained block rendering.**

```astro
{mechanicsBlock.enabled && data.projectWork && (
  <ProjectMechanics mechanics={data.projectWork} language={language} visible={mechanicsBlock.enabled} />
)}
```

Resolve layouts with `normalizeBlocks`. Use static Astro conditionals for known ids, retain `id="projects"`, and do not emit empty enabled blocks. Delete ProjectWork and replace only its needed styles with overview mechanics styles. Add CSS solely for the six schema values.

- [ ] **Step 4: Verify and commit.**

Run: `npm run check && npm run test:e2e -- tests/e2e/interactions.spec.ts tests/e2e/accessibility.spec.ts`

Expected: PASS. Commit with message `feat: render editable portfolio blocks`.

### Task 3: Mirror block controls in Pages CMS

**Files:**
- Modify: `.pages.yml`, `tests/unit/deployment-tooling.test.ts`

**Interfaces:** The CMS exposes layout documents and project `pageBlocks` using exactly the ids and enum values accepted by Task 1.

- [ ] **Step 1: Write failing Pages CMS configuration test.**

```ts
it('exposes layout documents and constrained page blocks', async () => {
  const config = parse(await readFile('.pages.yml', 'utf8'));
  expect(config.content).toEqual(expect.arrayContaining([
    expect.objectContaining({ name: 'layouts', path: 'src/content/layouts' }),
  ]));
});
```

- [ ] **Step 2: Run the test.**

Run: `npm run test:unit -- tests/unit/deployment-tooling.test.ts`

Expected: FAIL because layouts are absent.

- [ ] **Step 3: Configure CMS fields.**

Add a layouts collection and project block controls for enabled/order/variant/spacing, bilingual text, and the existing local-or-Drive mechanics media. Use select/block fields; omit raw CSS and free-form block names.

- [ ] **Step 4: Verify and commit.**

Run: `npm run test:unit -- tests/unit/deployment-tooling.test.ts && npm run validate:content`

Expected: PASS. Commit with message `feat: expose layout blocks in Pages CMS`.

### Task 4: Safe local editor server

**Files:**
- Create: `scripts/portfolio-editor.ts`, `src/lib/editor/contracts.ts`, `src/lib/editor/git.ts`, `tests/unit/editor-server.test.ts`, `tests/unit/editor-git.test.ts`
- Modify: `package.json`, `package-lock.json`

**Interfaces:** `createEditorServer({ root, port, branchProvider, gitRunner })` exposes `start()` and `stop()`. `validateAndWriteDraft(root, draft)` resolves with `{ changedFiles }`. `commitEditorFiles({ root, branch, files, message })` accepts only project/layout YAML paths on a `feature/` branch.

- [ ] **Step 1: Write failing safety tests.**

```ts
it('leaves files intact after invalid draft validation', async () => {
  await expect(validateAndWriteDraft(root, { home: { blocks: [{ id: 'unknown' }] } })).rejects.toThrow(/unknown/i);
  await expect(readFile(homeLayoutPath, 'utf8')).resolves.toBe(originalHomeLayout);
});

it('never stages main or non-editor paths', async () => {
  await expect(commitEditorFiles({ root, branch: 'main', files: [homeLayoutPath], message: 'save' })).rejects.toThrow(/feature branch/i);
  await expect(commitEditorFiles({ root, branch: 'feature/x', files: ['package.json'], message: 'save' })).rejects.toThrow(/allowlist/i);
});
```

- [ ] **Step 2: Run the tests.**

Run: `npm run test:unit -- tests/unit/editor-server.test.ts tests/unit/editor-git.test.ts`

Expected: FAIL because the editor modules do not exist.

- [ ] **Step 3: Add runtime and implement safeguards.**

```json
{
  "scripts": { "editor": "tsx scripts/portfolio-editor.ts" },
  "devDependencies": { "tsx": "^4.0.0" }
}
```

Install with `npm install --save-dev tsx`. Validate every changed document before creating sibling temporary YAML files, then rename after all validation succeeds. Stage explicit allowlisted paths and reject `git diff --cached --name-only` entries not in the request.

- [ ] **Step 4: Implement localhost API.**

Serve `GET /api/draft`, `PUT /api/draft`, `POST /api/save`, `POST /api/commit`, and static editor files on `127.0.0.1`. Return `{ message, fieldErrors }`; exclude shell output and absolute paths from responses.

- [ ] **Step 5: Verify and commit.**

Run: `npm run test:unit -- tests/unit/editor-server.test.ts tests/unit/editor-git.test.ts && npm run check`

Expected: PASS. Commit with message `feat: add safe local editor server`.

### Task 5: Editor UI and in-memory preview

**Files:**
- Create: `editor/index.html`, `editor/app.js`, `editor/styles.css`, `src/scripts/editor-preview.ts`, `tests/e2e/editor.spec.ts`
- Modify: `src/layouts/BaseLayout.astro`, `src/views/HomePage.astro`, `src/views/ProjectPage.astro`

**Interfaces:** UI sends `{ type: 'portfolio-editor:draft', draft, selectedBlockId }`. The preview bridge accepts this message solely from `http://127.0.0.1:4322` and modifies only marked block nodes.

- [ ] **Step 1: Write failing editor tests.**

```ts
test('reorders an unsaved block in the live preview', async ({ page }) => {
  await page.goto('http://127.0.0.1:4322/');
  await page.getByRole('button', { name: 'Experience' }).dragTo(page.getByRole('button', { name: 'Projects' }));
  await expect(page.getByText('Unsaved changes')).toBeVisible();
  await expect(page.frameLocator('[title="Portfolio preview"]').locator('main [data-editor-block="experience"]')).toBeVisible();
});
```

- [ ] **Step 2: Run test and implement UI.**

Run: `npx playwright test tests/e2e/editor.spec.ts`

Expected: FAIL because no editor exists.

Build labelled page selection, keyboard-operable navigator with Add/Move up/Move down/visibility controls, bilingual inspector, desktop/mobile control, iframe titled `Portfolio preview`, dirty indicator, Save, Save and commit, and Discard. Pointer dragging is optional enhancement; move buttons are mandatory.

- [ ] **Step 3: Implement the development-only preview bridge.**

```ts
window.addEventListener('message', (event) => {
  if (event.origin !== 'http://127.0.0.1:4322' || event.data?.type !== 'portfolio-editor:draft') return;
  applyDraftToMarkedBlocks(event.data.draft);
});
```

Load it only when `import.meta.env.DEV` and `editorPreview=1`. It may reorder marked siblings, hide disabled blocks, replace explicit `data-editor-text` fields, and set validated variant/spacing attributes. Save failures retain the draft. Save-and-commit requires a nonempty message and shows the returned SHA.

- [ ] **Step 4: Verify and commit.**

Run: `npm run test:e2e && npm run check`

Expected: PASS for preview, discard, branch guard, existing routing, interactions and accessibility. Commit with message `feat: add live visual portfolio editor`.

### Task 6: Launcher, guide and final verification

**Files:**
- Create: `Portfolyo-Editorunu-Ac.cmd`, `docs/editor-kullanimi.md`
- Modify: `.gitignore`, `tests/unit/deployment-tooling.test.ts`
- Modify only reviewed files in `tests/e2e/visual.spec.ts-snapshots/`.

- [ ] **Step 1: Write the launcher test.**

```ts
it('ships the editor launcher and feature-branch guide', async () => {
  await expect(readFile('Portfolyo-Editorunu-Ac.cmd', 'utf8')).resolves.toContain('npm run editor');
  await expect(readFile('docs/editor-kullanimi.md', 'utf8')).resolves.toContain('feature/portfolio-renewal');
});
```

- [ ] **Step 2: Implement launcher and Turkish guide.**

```bat
@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1 || (echo Node.js 24 gerekli.& pause & exit /b 1)
if not exist "node_modules" call npm ci || exit /b 1
call npm run editor
```

The guide explains opening the launcher, choosing a page, mobile/desktop preview, Save versus Save and commit, Pages CMS remote content editing, branch protection, and stopping the editor.

- [ ] **Step 3: Review snapshots and execute full verification.**

Run: `npx playwright test tests/e2e/visual.spec.ts --update-snapshots`

Expected: only approved layout changes. Inspect before staging.

Run: `npm run verify && npm run test:e2e && git diff --check && git status --short`

Expected: all validation, tests, build, links, browser checks and whitespace checks pass. Commit reviewed launcher, guide and snapshots with message `docs: add visual editor launcher guide`.

## Plan Self-Review

- Tasks 1–3 implement shared layout data, public rendering, inline mechanics and Pages CMS fields.
- Tasks 4–5 implement localhost-only drafts, validation, atomic saving, safe branch commits and live preview.
- Task 6 makes the workflow usable on Windows and verifies all regressions.
- The common contracts are `normalizeBlocks`, `data-editor-block`, and `portfolio-editor:draft`.
