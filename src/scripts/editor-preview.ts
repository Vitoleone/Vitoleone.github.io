type Block = { id: string; enabled: boolean; order: number; variant: string; spacing: string };
type Draft = { home?: { blocks?: Block[] }; project?: { blocks?: Block[] } };

function applyBlocks(blocks: Block[]) {
  const main = document.querySelector('main');
  if (!main) return;
  const sorted = [...blocks].sort((left, right) => left.order - right.order);
  for (const block of sorted) {
    const element = main.querySelector<HTMLElement>(`[data-editor-block="${block.id}"]`);
    if (!element) continue;
    element.hidden = !block.enabled;
    element.dataset.editorVariant = block.variant;
    element.dataset.editorSpacing = block.spacing;
    main.append(element);
  }
}

export function installEditorPreviewBridge() {
  window.addEventListener('message', (event) => {
    if (event.origin !== 'http://127.0.0.1:4322' || event.data?.type !== 'portfolio-editor:draft') return;
    const draft = event.data.draft as Draft;
    const page = document.documentElement.dataset.page;
    applyBlocks(page === 'project' ? draft.project?.blocks ?? [] : draft.home?.blocks ?? []);
  });
}
