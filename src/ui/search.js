// Ctrl K: find a lesson, a step inside a lesson, or a cheatsheet row.
import { CHAPTERS, getLesson } from '../content/index.js';
import { CHEATS } from './cheats.js';
import { icon } from '../engine/icons.js';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const strip = (s) => String(s ?? '').replace(/<[^>]+>/g, '');
let index = null;

function build() {
  const out = [];
  for (const ch of CHAPTERS) for (const meta of ch.lessons) {
    const l = getLesson(meta.id);
    out.push({ type: 'lesson', title: l.title, sub: `${ch.no}. ${ch.title}`, text: `${l.title} ${l.blurb}`.toLowerCase(), href: `#/${l.id}/1`, w: 3 });
    (l.steps || []).forEach((s, i) => out.push({ type: 'step', title: s.title, sub: `${l.title} · ${i + 1}단계`, text: `${s.title} ${s.key} ${strip((s.body || []).join(' '))} ${strip(s.callout?.text)}`.toLowerCase(), head: `${s.title} ${s.key}`.toLowerCase(), href: `#/${l.id}/${i + 1}`, w: 2 }));
  }
  for (const c of CHEATS) {
    const rows = c.kind === 'table' ? c.rows : c.groups.flatMap((g) => g.rows);
    for (const r of rows) out.push({ type: 'cheat', title: r[0], sub: `${c.title} · ${r.slice(1).filter((x) => x && x !== '—').join(' · ')}`, text: r.join(' ').toLowerCase(), href: `#/cheats/${c.id}`, w: 1 });
  }
  return out;
}

export function openSearch(go) {
  if (document.querySelector('.modal')) return;
  index = index || build();
  const el = document.createElement('div');
  el.className = 'modal';
  el.innerHTML = `<div class="modal-box" role="dialog" aria-label="검색"><label class="modal-in">${icon('search', 16)}<input type="search" placeholder="레슨, 개념, 명령어 검색…  예: NAT, readiness, terraform plan" autocomplete="off"/><kbd>Esc</kbd></label><div class="results"></div></div>`;
  document.body.appendChild(el);
  const input = el.querySelector('input');
  const box = el.querySelector('.results');
  let list = [];
  let sel = 0;
  const ICON = { lesson: 'book', step: 'steps', cheat: 'table' };

  function run() {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      list = index.filter((x) => x.type === 'lesson').slice(0, 8);
    } else {
      const words = q.split(/\s+/);
      list = index
        .filter((x) => words.every((w) => x.text.includes(w)))
        .map((x) => ({ x, score: x.w * 10 + (x.title.toLowerCase().includes(q) ? 25 : 0) + ((x.head || '').includes(q) ? 8 : 0) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 40)
        .map((r) => r.x);
    }
    sel = 0;
    draw();
  }
  function draw() {
    box.innerHTML = list.length
      ? list.map((r, i) => `<a class="res ${i === sel ? 'sel' : ''}" href="${r.href}" data-i="${i}"><span class="res-ico">${icon(ICON[r.type], 14)}</span><span class="res-tx"><b>${esc(r.title)}</b><small>${esc(r.sub)}</small></span></a>`).join('')
      : `<p class="none pad">"${esc(input.value)}"에 대한 결과가 없습니다</p>`;
    box.querySelector('.sel')?.scrollIntoView({ block: 'nearest' });
  }
  const close = () => { el.remove(); window.removeEventListener('keydown', onKey, true); };
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(list.length - 1, sel + 1); draw(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); draw(); }
    else if (e.key === 'Enter' && list[sel]) { e.preventDefault(); const href = list[sel].href; close(); go(href); }
  };
  window.addEventListener('keydown', onKey, true);
  input.addEventListener('input', run);
  el.addEventListener('click', (e) => { if (e.target === el || e.target.closest('.res')) close(); });
  run();
  input.focus();
}
