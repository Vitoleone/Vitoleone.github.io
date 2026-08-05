# Simplified Project Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace multi-item contribution carousels with one clear project-work block, retain local video compatibility, improve project copy, and add the BEF GAMES experience.

**Architecture:** Project content moves from `contributions[]` to an optional `projectWork` object. A focused `ProjectWork.astro` component renders the localized title, explanation, and optional media once; `ProjectMedia.astro` resolves both imported project media and legacy `/images/` video paths. Content migration updates all project records and experience while the existing page layout remains intact.

**Tech Stack:** Astro 7, TypeScript, Zod, Pages CMS, Vitest, Playwright.

## Global Constraints

- Project pages render at most one project-work block and no carousel controls, dots, slide semantics, or swipe behavior.
- Local MP4/WebM/MKV video paths may reference `src/assets/project-media` or legacy `/images/`; Drive remains optional.
- Native video uses `controls`, `playsinline`, and `preload="metadata"` with no autoplay.
- The Boss uses `Game Mechanics` / `Oyun Mekaniği`; do not add a video until the correct local source is identified.
- Experience record is `BEF GAMES`, `Gameplay Programmer`, `2025-11` to `present`.
- Keep the site bilingual and retain all existing build, link, accessibility, and route checks.

---

### Task 1: Replace the contribution schema with one project-work model

**Files:**
- Modify: `src/lib/content/schemas.ts`
- Modify: `src/content.config.ts`
- Modify: `.pages.yml`
- Modify: `tests/unit/content-schemas.test.ts`
- Modify: `tests/unit/content-collections.test.ts`

**Interfaces:**
- Produces `Project['projectWork']`, an optional object with `title`, `description`, and optional `media`.
- `media.type === 'video'` accepts either `../../assets/project-media/<file>` or `/images/<file>`.

- [ ] **Step 1: Write failing schema tests for one project-work object and legacy video sources.**

```ts
expect(projectSchema.parse({ ...baseProject, projectWork: workWithLegacyVideo }).projectWork?.media)
  .toMatchObject({ type: 'video', src: '/images/FishMasters.mp4' });
expect(() => projectSchema.parse({ ...baseProject, contributions: [] })).toThrow();
```

- [ ] **Step 2: Run `npm run test:unit -- content-schemas content-collections` and confirm failure because `projectWork` is absent.**

- [ ] **Step 3: Define `projectWorkSchema`, replace `contributions` in `projectSchema`, and update Pages CMS.**

```ts
const projectWorkSchema = z.object({
  title: localizedTextSchema,
  description: localizedTextSchema,
  media: contributionMediaSchema.optional(),
}).strict();

projectWork: projectWorkSchema.optional(),
```

Use a single Pages CMS `Project work` fieldset with localized title, description, and one media object. Include `mp4`, `webm`, and `mkv` in its local-media guidance.

- [ ] **Step 4: Run focused unit tests and confirm they pass.**

- [ ] **Step 5: Commit schema and CMS changes.**

```powershell
git add src/lib/content/schemas.ts src/content.config.ts .pages.yml tests/unit/content-schemas.test.ts tests/unit/content-collections.test.ts
git commit -m "feat: model one project work block"
```

### Task 2: Render one accessible project-work block with local-video fallback

**Files:**
- Create: `src/components/ProjectWork.astro`
- Modify: `src/components/ProjectMedia.astro`
- Modify: `src/views/ProjectPage.astro`
- Delete: `src/components/ProjectCarousel.astro`
- Modify: `tests/e2e/interactions.spec.ts`
- Modify: `tests/e2e/accessibility.spec.ts`

**Interfaces:**
- `ProjectWork.astro` accepts `{ project: CollectionEntry<'projects'>; language: Language }`.
- `ProjectMedia.astro` receives one local/Drive media value and resolves `/images/...` as a static URL without `import.meta.glob`.

- [ ] **Step 1: Write a failing Playwright assertion for one project-work section and a native local video.**

```ts
await expect(page.getByRole('heading', { name: /project work|projede yaptıklarım/i })).toHaveCount(1);
await expect(page.locator('video[controls][preload="metadata"]')).toHaveCount(1);
await expect(page.locator('[data-project-carousel]')).toHaveCount(0);
```

- [ ] **Step 2: Run the focused Playwright test and confirm failure while carousel markup exists.**

- [ ] **Step 3: Create `ProjectWork.astro`, replace the carousel call, and resolve legacy video paths.**

```astro
{project.data.projectWork && (
  <section class="project-work section" aria-labelledby="project-work-title">
    <h2 id="project-work-title">{localize(project.data.projectWork.title, language)}</h2>
    <p>{localize(project.data.projectWork.description, language)}</p>
    {project.data.projectWork.media && <ProjectMedia media={project.data.projectWork.media} language={language} />}
  </section>
)}
```

For video paths beginning with `/images/`, render `<source src={media.src} />`; otherwise keep the existing imported-project-media lookup.

- [ ] **Step 4: Run focused Playwright and accessibility tests and confirm they pass.**

- [ ] **Step 5: Commit rendering changes.**

```powershell
git add src/components/ProjectWork.astro src/components/ProjectMedia.astro src/views/ProjectPage.astro tests/e2e
git rm src/components/ProjectCarousel.astro
git commit -m "feat: simplify project work presentation"
```

### Task 3: Migrate bilingual content and add the BEF GAMES timeline entry

**Files:**
- Modify: `src/content/projects/*.yml`
- Create: `src/content/experience/bef-games-gameplay-programmer.yml`
- Modify: `tests/unit/content-collections.test.ts`

**Interfaces:**
- Every existing project stores one `projectWork` object or omits it when no verified work description exists.
- Existing local videos use their matching `/images/<legacy-file>` path when that best represents the project.

- [ ] **Step 1: Add failing collection tests for exact project-work rules and the BEF GAMES record.**

```ts
expect(befGames.data).toMatchObject({ company: 'BEF GAMES', startDate: '2025-11', endDate: 'present' });
expect(theBoss.data.projectWork?.title.en).toBe('Game Mechanics');
expect(projects.every((project) => project.data.projectWork === undefined || !('contributions' in project.data))).toBe(true);
```

- [ ] **Step 2: Run `npm run test:unit -- content-collections` and confirm failure before migration.**

- [ ] **Step 3: Rewrite summaries/descriptions from verified legacy text and migrate first representative local videos.**

Map existing media such as `FishMasters.mp4`, `citybuildervideo.mp4`, `geometrydashclonevideo.mp4`, `Harvest It - Gameplay.mp4`, `matchsquaresvideo.mp4`, and the top-down/ship-action videos through `/images/...`. Use exactly one video per project. Do not manufacture a The Boss media path; set its approved `Game Mechanics` copy with no media until a file is supplied.

- [ ] **Step 4: Add `bef-games-gameplay-programmer.yml` with bilingual text.**

```yaml
company: BEF GAMES
role:
  en: Gameplay Programmer
  tr: Oynanış Programcısı
summary:
  en: Gameplay Programmer working on The Boss Gangster: Criminal Empire.
  tr: The Boss Gangster: Criminal Empire projesinde çalışan Oynanış Programcısı.
startDate: 2025-11
endDate: present
order: 0
```

- [ ] **Step 5: Run collection tests, then `npm run verify`, and confirm success.**

- [ ] **Step 6: Commit content migration.**

```powershell
git add src/content tests/unit/content-collections.test.ts
git commit -m "feat: simplify portfolio project content"
```

### Task 4: Update end-to-end coverage and complete verification

**Files:**
- Modify: `tests/e2e/interactions.spec.ts`
- Modify: `tests/e2e/accessibility.spec.ts`
- Modify: `tests/e2e/visual.spec.ts`

- [ ] **Step 1: Replace carousel keyboard/swipe expectations with project-work checks.**

```ts
await expect(page.locator('[data-project-carousel]')).toHaveCount(0);
await expect(page.locator('.project-work video')).toHaveAttribute('preload', 'metadata');
```

- [ ] **Step 2: Run focused `npm run test:e2e -- interactions accessibility` and confirm it passes.**

- [ ] **Step 3: Refresh visual baselines with `npx playwright test tests/e2e/visual.spec.ts --update-snapshots`.**

- [ ] **Step 4: Run the full verification gate.**

```powershell
npm run verify
npm run test:e2e
```

Expected: Astro check has 0 diagnostics, unit tests and Playwright tests have 0 failures, the production build completes, and the internal-link check reports no broken links.

- [ ] **Step 5: Commit verification and snapshot updates.**

```powershell
git add tests/e2e
git commit -m "test: cover simplified project work"
```

## Self-review

- Spec coverage: Tasks 1–4 cover the single project-work block, local/legacy video support, optional Drive support, The Boss mechanics copy, content rewrite, BEF GAMES experience, CMS, and verification.
- Placeholder scan: The plan deliberately leaves The Boss media absent until the user supplies an exact file, matching the approved design and avoiding an invented claim.
- Type consistency: `projectWork` is produced by Task 1, consumed by Task 2, populated by Task 3, and verified by Task 4.
