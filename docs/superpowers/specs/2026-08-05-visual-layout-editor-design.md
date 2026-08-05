# Visual layout editor and expanded CMS design

## Goal

Give the portfolio owner a local, visual way to arrange predefined home-page and project-page blocks, edit their content and presentation settings, and inspect a desktop or mobile preview before saving. Keep Pages CMS as the hosted editor for the same content model, but do not treat it as a drag-and-drop site builder.

## Scope and constraints

- The editor runs only on the developer's computer and is opened by a Windows command file.
- It targets `feature/portfolio-renewal`; it must refuse to save or commit when `main` is checked out.
- Preview changes stay in memory until the user chooses **Save**. Saving writes only the layout and content files managed by the editor.
- **Save and commit** is an explicit operation. It validates the changed files, stages only those files, and creates one commit on the current feature branch. It never stages unrelated working-tree changes.
- The public production site remains static and receives no editor route or write API.
- The editor supports predefined blocks and curated settings, not arbitrary pixel positioning or custom CSS entry.

## Editable page model

New content collections describe page layouts rather than hard-coding all page order in Astro templates.

### Home page

The home page stores an ordered list of blocks. Initial supported block types are:

1. Hero
2. About
3. Featured projects
4. Experience
5. Skills
6. Contact

Every block has an id, `enabled` flag, bilingual heading and optional supporting text where applicable, `variant`, and `spacing`. The initial variants are deliberately small: standard, muted, and accent. Spacing has compact, standard, and spacious choices. Collection-driven blocks retain their content sources; the layout record controls their placement and display settings rather than duplicating projects, experience, or skills.

### Project page

Every project record gains an ordered `pageBlocks` list. Initial block types are:

1. Overview
2. Gameplay mechanics
3. Media
4. Technologies
5. Details
6. Links
7. Gallery

Blocks can be enabled, disabled, and reordered. The gameplay-mechanics block supplies the localized title, explanation, and optional media formerly presented as the separate **Project work** section. It is rendered within the project-overview flow, so there is no standalone `ProjectWork` section or "Projede yaptıklarım" label. The Boss uses `Oyun Mekaniği` / `Game Mechanics`; another project may use its own localized mechanics title or disable that block.

## Local editor experience

`Portfolyo-Editorunu-Ac.cmd` starts the local editor and an Astro preview process, then opens the editor in the default browser.

The editor has three coordinated panes:

- **Navigator:** choose Home or a project, add an allowed block, drag/reorder blocks, toggle visibility, and select a block.
- **Inspector:** edit bilingual text, media, block variant, spacing, and block-specific fields. File selection accepts the existing local image/video formats and Drive links supported by the site.
- **Preview:** a same-machine desktop/mobile preview updates from the unsaved in-memory draft. Selecting a block in either navigator or preview highlights it in both places.

The editor shows a persistent unsaved-changes indicator, validation messages beside invalid fields, and an explicit discard action. A refresh or navigation warns before throwing away a draft.

## Architecture

A small local Node editor server owns the editable draft and file writes. Its browser UI is plain TypeScript and uses a local HTTP API; no cloud credentials, database, or public write endpoint is added. The server reads the current branch and the YAML content through the existing `yaml` dependency.

The Astro site receives stable `data-editor-block` markers and a development-only preview bridge. The bridge accepts draft state from the editor with `postMessage`, updates block order, visibility, text, and approved presentation classes in the preview DOM, and does not run in normal production pages. Saving sends the draft to the local server, which validates it against the shared Zod schemas, writes YAML atomically, and allows Astro's development server to refresh its generated content.

Pages CMS is extended to expose the same home-layout and project-block fields, media selectors, and localized text. It remains useful for remote GitHub-backed content edits; live drag-and-drop preview is intentionally only in the local editor.

## Safety and failure behavior

- Start-up checks Node, the worktree, the active branch, required dependencies, and the availability of the local preview service.
- A branch check blocks saving and committing from `main`.
- The save endpoint rejects unknown block types, unsafe media paths, invalid localized values, and invalid ordering before it writes any file.
- A failed validation leaves the existing source files untouched and reports field-level errors.
- Commit failure preserves the saved files and reports the Git error; it never reverts user data automatically.
- Save-and-commit stages an explicit allowlist of files returned by the editor, never `git add .`.

## Verification

- Unit tests cover layout-schema validation, default layouts, ordering, safe media values, branch guard behavior, and staged-file allowlists.
- Browser tests cover adding, hiding, reordering, editing, discarding, desktop/mobile preview, save, and blocked-main behavior using a temporary fixture worktree.
- Existing project-page tests change from a standalone project-work assertion to a gameplay-mechanics block inside project overview.
- `npm run verify` and `npm run test:e2e` must pass after implementation.
