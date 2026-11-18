// Cheatsheets: mapping tables and command lists to keep open while practising.
import { icon, ICONS } from '../engine/icons.js';

const mods = import.meta.glob('../content/cheats.js', { eager: true });
export const CHEATS = Object.values(mods)[0]?.CHEATS || [];

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CLOUD_COL = { AWS: 'aws', Azure: 'azure', GCP: 'gcp', NCP: 'ncp' };

export function mountCheats(main, ctx) {
  let current = CHEATS.find((c) => c.id === ctx.route.arg) || CHEATS[0];
  let filter = '';

  if (!current) {
    main.innerHTML = `<section class="view card"><header class="view-head"><div><h1>치트시트</h1></div></header><div class="soon-box">${icon('hourglass', 26)}<b>치트시트를 준비 중입니다</b></div></section>`;
    return { destroy() {} };
  }

  function body() {
    const f = filter.trim().toLowerCase();
    const hit = (row) => !f || row.join(' ').toLowerCase().includes(f);
    if (current.kind === 'table') {
      const rows = current.rows.filter(hit);
      return `<div class="tbl-wrap"><table class="tbl"><thead><tr>${current.columns.map((c) => `<th class="${CLOUD_COL[c] ? 'cl-' + CLOUD_COL[c] : ''}">${esc(c)}</th>`).join('')}</tr></thead>
<tbody>${rows.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th>${esc(c)}</th>` : `<td class="${c === '—' ? 'none' : ''}">${esc(c)}</td>`)).join('')}</tr>`).join('') || `<tr><td colspan="${current.columns.length}" class="none">일치하는 항목이 없습니다</td></tr>`}</tbody></table></div>`;
    }
    const groups = current.groups.map((g) => ({ ...g, rows: g.rows.filter(hit) })).filter((g) => g.rows.length);
    return groups.map((g) => `<div class="cmd-group"><h3>${esc(g.title)}</h3>${g.rows.map((r) => `<div class="cmd"><button class="copy" type="button" data-copy="${esc(r[0]).replace(/"/g, '&quot;')}" title="복사">${icon('copy', 12)}</button><code>${esc(r[0])}</code><span>${esc(r[1])}</span></div>`).join('')}</div>`).join('') || '<p class="none pad">일치하는 항목이 없습니다</p>';
  }

  function paint() {
    main.innerHTML = `
<section class="view card cheats">
  <header class="view-head">
    <div><h1>치트시트</h1><p>실습할 때 옆에 띄워 두는 번역표와 명령어 모음입니다.</p></div>
    <label class="filter">${icon('search', 14)}<input id="cf" type="search" placeholder="이 시트에서 찾기…" value="${esc(filter)}" autocomplete="off"/></label>
  </header>
  <nav class="sheet-tabs">${CHEATS.map((c) => `<a class="seg-btn ${c.id === current.id ? 'on' : ''}" href="#/cheats/${c.id}">${icon(ICONS[c.icon] ? c.icon : 'table', 13)}${esc(c.title)}</a>`).join('')}</nav>
  ${current.note ? `<p class="sheet-note">${icon('info', 13)}${esc(current.note)}</p>` : ''}
  <div class="sheet-body" id="sheet-body">${body()}</div>
</section>`;
    const input = main.querySelector('#cf');
    input.addEventListener('input', () => { filter = input.value; main.querySelector('#sheet-body').innerHTML = body(); wire(); });
    wire();
  }
  function wire() {
    main.querySelectorAll('.copy').forEach((b) => b.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(b.dataset.copy); b.classList.add('ok'); b.innerHTML = icon('check', 12); setTimeout(() => { b.classList.remove('ok'); b.innerHTML = icon('copy', 12); }, 1200); } catch { /* clipboard blocked */ }
    }));
  }
  paint();
  return { destroy() {} };
}
