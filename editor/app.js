const state = { persisted: null, draft: null, page: 'home', selected: null };
const $ = (selector) => document.querySelector(selector);
const blocks = $('#blocks');
const fields = $('#fields');
const preview = document.querySelector('iframe');

function current() { return state.draft[state.page]; }
function dirty() { return JSON.stringify(state.persisted) !== JSON.stringify(state.draft); }
function updateState() { $('#state').textContent = dirty() ? 'Kaydedilmemiş değişiklikler var' : 'Tüm değişiklikler kaydedildi'; }
function sendPreview() { preview.contentWindow?.postMessage({ type: 'portfolio-editor:draft', draft: state.draft, selectedBlockId: state.selected?.id }, 'http://127.0.0.1:4321'); }
async function syncDraft() { await fetch('/api/draft', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(state.draft) }); sendPreview(); updateState(); }

function renderBlocks() {
  blocks.replaceChildren();
  [...current().blocks].sort((a, b) => a.order - b.order).forEach((block, index) => {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = `${block.enabled ? '●' : '○'} ${block.id}`;
    button.className = state.selected?.id === block.id ? 'selected' : ''; button.onclick = () => { state.selected = block; render(); };
    const up = document.createElement('button'); up.type = 'button'; up.textContent = '↑'; up.disabled = index === 0; up.onclick = async () => { [current().blocks[index - 1].order, block.order] = [block.order, current().blocks[index - 1].order]; await syncDraft(); render(); };
    const down = document.createElement('button'); down.type = 'button'; down.textContent = '↓'; down.disabled = index === current().blocks.length - 1; down.onclick = async () => { [current().blocks[index + 1].order, block.order] = [block.order, current().blocks[index + 1].order]; await syncDraft(); render(); };
    const row = document.createElement('div'); row.className = 'block'; row.append(button, up, down); blocks.append(row);
  });
}

function renderFields() {
  fields.replaceChildren(); if (!state.selected) return;
  for (const [label, key, type] of [['Görünür', 'enabled', 'checkbox'], ['Görünüm', 'variant', 'text'], ['Boşluk', 'spacing', 'text']]) {
    const control = document.createElement('input'); control.type = type; control.checked = type === 'checkbox' && state.selected[key]; control.value = type === 'checkbox' ? '' : state.selected[key]; control.onchange = async () => { state.selected[key] = type === 'checkbox' ? control.checked : control.value; await syncDraft(); render(); };
    const wrapper = document.createElement('label'); wrapper.textContent = label; wrapper.append(control); fields.append(wrapper);
  }
}
function render() { renderBlocks(); renderFields(); sendPreview(); updateState(); }

$('#page').onchange = (event) => { state.page = event.target.value; state.selected = null; preview.src = state.page === 'home' ? 'http://127.0.0.1:4321/?editorPreview=1' : 'http://127.0.0.1:4321/projects/ship-action-demo/?editorPreview=1'; render(); };
$('#discard').onclick = async () => { state.draft = structuredClone(state.persisted); state.selected = null; await syncDraft(); render(); };
$('#save').onclick = async () => { const response = await fetch('/api/save', { method: 'POST' }); const body = await response.json(); $('#message').textContent = body.message ?? 'Kaydedildi.'; if (response.ok) state.persisted = structuredClone(state.draft); updateState(); };
$('#commit').onclick = async () => { const message = window.prompt('Commit mesajı'); if (!message) return; const response = await fetch('/api/commit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message }) }); const body = await response.json(); $('#message').textContent = body.message; if (response.ok) state.persisted = structuredClone(state.draft); updateState(); };
$('#mobile').onclick = () => { const mobile = preview.classList.toggle('mobile'); $('#mobile').setAttribute('aria-pressed', String(mobile)); $('#mobile').textContent = mobile ? 'Masaüstü görünüm' : 'Mobil görünüm'; };
preview.onload = sendPreview;

fetch('/api/draft').then((response) => response.json()).then((body) => { state.persisted = structuredClone(body.draft); state.draft = body.draft; $('#message').textContent = `Aktif dal: ${body.branch}`; render(); });
