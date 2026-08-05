# Simplified project pages and local video support

## Goal

Reduce project-page visual complexity while keeping the portfolio informative. Replace the multi-card contribution carousel with one focused project-work block and one optional video. Preserve legacy local-video workflows and allow future local video uploads.

## Project page structure

Every published project page will render these sections in order:

1. Project header: title, summary, cover, role, technologies, and external links.
2. Project overview: a more descriptive bilingual project description based on verified details from the legacy page.
3. Project work: one bilingual title, one bilingual explanation, and one optional media item.

The project-work block replaces the contribution carousel. It has no slide controls, dots, live region, or repeated cards. If a project has no video, its explanation remains visible without an empty media frame.

The Boss is the only project whose project-work heading is `Game Mechanics` / `Oyun Mekaniği`. Its text will describe only supplied or approved mechanics; it will not make unverified production claims.

## Content model

Replace `contributions[]` with one optional `projectWork` object:

```yaml
projectWork:
  title:
    en: Gameplay
    tr: Oynanış
  description:
    en: ...
    tr: ...
  media:
    type: video
    src: ../../assets/project-media/example.mp4
    caption:
      en: ...
      tr: ...
```

`projectWork.media` supports the existing `image`, `video`, and `drive` media shapes. Local `video` accepts a project-media source and a legacy static `images/...` source. The renderer treats both as local, safe site media and emits a native HTML video element with controls and metadata preloading. Drive remains supported but is optional, never required.

Pages CMS will expose one Project work fieldset and allow local MP4/WebM selection or upload alongside images. Existing local videos remain valid without manual migration.

## Content updates

- Rewrite each project summary and description using verified legacy project details, preserving clear gameplay, tooling, and role information.
- Associate each existing project with its most representative existing local gameplay video where available.
- Set The Boss project work to `Game Mechanics` / `Oyun Mekaniği`, using the approved local video once its exact source is identified. Until then, its explanatory text remains and no fake media is rendered.
- Add a BEF GAMES experience entry: `Gameplay Programmer`, start `2025-11`, end `present`, with a bilingual summary for work on The Boss Gangster: Criminal Empire.

## Rendering and accessibility

Replace `ProjectCarousel` with a single `ProjectWork` component. Reuse the existing media rendering path for local video, image, and Drive. Native videos use controls, `playsinline`, and `preload="metadata"`; no autoplay is introduced. Captions remain visible through figure captions. The page keeps semantic section headings and responsive layout without carousel-specific keyboard or swipe behavior.

## Verification

- Update schema and collection tests for `projectWork`, local legacy-media references, and the BEF GAMES experience entry.
- Update Playwright coverage to validate one project-work block and native local video instead of carousel navigation.
- Retain route, theme/language, redirect, accessibility, build, and internal-link checks.
- Run `npm run verify` and `npm run test:e2e` before handoff.
