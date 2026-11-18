import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-500.css';
import '@fontsource/jetbrains-mono/latin-600.css';
import '@fontsource/jetbrains-mono/latin-700.css';
import '@fontsource/jetbrains-mono/latin-800.css';
import '@fontsource/nanum-gothic-coding/korean-400.css';
import '@fontsource/nanum-gothic-coding/korean-700.css';
import './styles/app.css';
import './styles/scene.css';
import './styles/views.css';

import { CHAPTERS, LESSON_META, ORDER, getLesson, hasLesson } from './content/index.js';
import { store } from './store.js';
import { icon } from './engine/icons.js';
import { mountLearn } from './ui/learn.js';
import { mountPractice } from './ui/practice.js';
import { mountLab } from './ui/lab.js';
import { mountCheats } from './ui/cheats.js';
import { mountRoadmap } from './ui/roadmap.js';
import { openSearch } from './ui/search.js';

const app = document.getElementById('app');
const TABS = [
  { id: 'learn', label: '학습', icon: 'book' },
  { id: 'practice', label: '연습', icon: 'target' },
  { id: 'lab', label: '설계 랩', icon: 'component' },
  { id: 'cheats', label: '치트시트', icon: 'grid' },
];

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
let route = { view: 'learn', lesson: ORDER[0], step: 1 };
let lastLesson = ORDER[0];
let unmount = null;

// ---- routing: #/<lesson>/<step> or #/practice, #/lab, #/cheats, #/roadmap ----
function parse() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [a, b, c] = parts;
  if (['practice', 'lab', 'cheats', 'roadmap'].includes(a)) return { view: a, arg: b, arg2: c, lesson: lastLesson, step: 1 };
  if (a && LESSON_META[a]) return { view: 'learn', lesson: a, step: Math.max(1, parseInt(b, 10) || 1) };
  return { view: 'learn', lesson: lastLesson, step: 1 };
}

/**
 * Move to another view or step without a browser navigation: the address is updated with
 * history.pushState and the app re-routes itself. Changing location.hash (or following an
 * <a href="#/…">) is a navigation, and some in-app browsers on iPhone/iPad answer it by
 * loading the page again, which throws away every animation.
 */
export function go(hash, replace = false) {
  if (hash === location.hash) return;
  if (replace) history.replaceState(null, '', hash);
  else history.pushState(null, '', hash);
  onRoute();
}

function applyTheme() {
  document.documentElement.dataset.theme = store.theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', store.theme === 'dark' ? '#1b1916' : '#f3ecdf');
}

// ---- shell ----
function shell() {
  app.innerHTML = `
<div class="app">
  <header class="topbar">
    <button class="icon-btn menu-btn" id="menu-btn" type="button" aria-label="코스 메뉴 열기">${icon('menu', 18)}</button>
    <a class="brand" href="#/${ORDER[0]}/1" aria-label="Multi Cloud 홈">
      <svg class="logo" width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <path class="lg-a" d="M16 3l11 6.2v2.6L16 18 5 11.8V9.200z"/><path class="lg-b" d="M5 14.800L16 21l11-6.2v3.400L16 24.400 5 18.200z"/><path class="lg-c" d="M5 21.200l11 6.200 11-6.200v2.600L16 30 5 23.800z"/>
      </svg>
      <span class="brand-name">Multi <mark>Cloud</mark></span>
    </a>
    <nav class="tabs" aria-label="보기">
      ${TABS.map((t) => `<a class="tab" data-tab="${t.id}" href="#/${t.id === 'learn' ? '' : t.id}">${icon(t.icon, 15)}<span>${t.label}</span></a>`).join('')}
    </nav>
    <div class="top-right">
      <button class="search-btn" id="search-btn" type="button">${icon('search', 15)}<span>레슨과 개념 검색…</span><kbd>Ctrl K</kbd></button>
      <button class="icon-btn" id="theme-btn" type="button" aria-label="테마 바꾸기"></button>
      <a class="credit" href="https://x.com/DilumSanjaya" target="_blank" rel="noopener" title="designed-to-scale에서 영감을 받았습니다">
        <span class="credit-x">${icon('sparkles', 14)}</span>
        <span class="credit-tx"><small>inspired by</small><b>@DilumSanjaya</b></span>
      </a>
    </div>
  </header>
  <div class="body">
    <aside class="sidebar" id="sidebar" aria-label="코스"></aside>
    <div class="scrim" id="scrim"></div>
    <main class="main" id="main"></main>
  </div>
</div>`;

  app.querySelector('#theme-btn').addEventListener('click', () => {
    store.setTheme(store.theme === 'dark' ? 'light' : 'dark');
    applyTheme();
    paintThemeBtn();
  });
  app.querySelector('#search-btn').addEventListener('click', () => openSearch(go));
  app.querySelector('#menu-btn').addEventListener('click', () => app.querySelector('.app').classList.toggle('menu-open'));
  app.querySelector('#scrim').addEventListener('click', () => app.querySelector('.app').classList.remove('menu-open'));
  paintThemeBtn();
}

function paintThemeBtn() {
  app.querySelector('#theme-btn').innerHTML = icon(store.theme === 'dark' ? 'sun' : 'moon', 16);
}

// ---- sidebar: the course tree and the progress card ----
export function paintSidebar() {
  const side = app.querySelector('#sidebar');
  const scroll = side.querySelector('.tree')?.scrollTop || 0;
  const total = ORDER.length;
  const done = ORDER.filter((id) => store.done.has(id)).length;
  side.innerHTML = `
<div class="side-head">${icon('folder', 16)}<b>코스</b><span>레슨 ${total}개</span></div>
<div class="tree">
${CHAPTERS.map((ch) => {
    const open = store.open.has(ch.id);
    const n = ch.lessons.filter((l) => store.done.has(l.id)).length;
    return `
  <div class="chapter ${open ? 'open' : ''} fc-${ch.color}">
    <button class="ch-row" type="button" data-ch="${ch.id}" aria-expanded="${open}">
      ${icon(open ? 'chevron-down' : 'chevron-right', 14, 'chev')}
      <svg class="folder" width="18" height="16" viewBox="0 0 20 17" aria-hidden="true"><path d="M1.500 3.500a2 2 0 0 1 2-2h4l2 2.500h7a2 2 0 0 1 2 2v7.500a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/></svg>
      <span class="ch-name">${ch.no}. ${esc(ch.title)}</span>
      <span class="ch-count">${n}/${ch.lessons.length}</span>
    </button>
    <div class="ch-lessons">
      ${ch.lessons.map((l) => `
      <a class="les ${route.view === 'learn' && route.lesson === l.id ? 'active' : ''} ${store.done.has(l.id) ? 'done' : ''} ${hasLesson(l.id) ? '' : 'soon'}" href="#/${l.id}/1" data-lesson="${l.id}">
        ${icon(store.done.has(l.id) ? 'circle-check' : 'file', 13)}<span>${esc(l.title)}</span>
      </a>`).join('')}
    </div>
  </div>`;
  }).join('')}
</div>
<a class="progress-card ${route.view === 'roadmap' ? 'active' : ''}" href="#/roadmap">
  <span class="pc-top"><b>진행 · 로드맵</b><span>${done} / ${total}</span>${icon('chevron-right', 14)}</span>
  <span class="bar"><i style="width:${(done / total) * 100}%"></i></span>
</a>`;
  side.querySelector('.tree').scrollTop = scroll;
  side.querySelectorAll('.ch-row').forEach((b) => b.addEventListener('click', () => {
    store.toggleOpen(b.dataset.ch);
    paintSidebar();
  }));
  side.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => app.querySelector('.app').classList.remove('menu-open')));
}

function paintTabs() {
  app.querySelectorAll('.tab').forEach((t) => {
    const on = t.dataset.tab === route.view;
    t.classList.toggle('active', on);
    if (on) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
    if (t.dataset.tab === 'learn') t.setAttribute('href', `#/${lastLesson}/${store.seen[lastLesson] && route.view !== 'learn' ? Math.min(store.seen[lastLesson], getLesson(lastLesson).steps.length || 1) : 1}`);
  });
}

let routeKey = '';
function onRoute() {
  const prev = route;
  const next = parse();
  const key = JSON.stringify(next);
  if (key === routeKey && unmount) return; // back/forward fires both popstate and hashchange
  routeKey = key;
  route = next;
  if (route.view === 'learn') {
    lastLesson = route.lesson;
    store.toggleOpen(LESSON_META[route.lesson].chapter.id, true);
  }
  // moving between steps of the lesson on screen is handled inside the lesson view
  if (unmount && unmount.update && prev.view === 'learn' && route.view === 'learn' && prev.lesson === route.lesson && unmount.lesson === route.lesson) {
    unmount.update(route.step);
    return;
  }
  if (unmount) { (unmount.destroy || unmount)(); unmount = null; }
  const main = app.querySelector('#main');
  main.className = 'main v-' + route.view;
  main.scrollTop = 0;
  const ctx = { go, route, paintSidebar, lastLesson };
  if (route.view === 'learn') unmount = mountLearn(main, route.lesson, route.step, ctx);
  else if (route.view === 'practice') unmount = mountPractice(main, ctx);
  else if (route.view === 'lab') unmount = mountLab(main, ctx);
  else if (route.view === 'cheats') unmount = mountCheats(main, ctx);
  else if (route.view === 'roadmap') unmount = mountRoadmap(main, ctx);
  paintTabs();
  paintSidebar();
  const m = route.view === 'learn' ? LESSON_META[route.lesson].title : { practice: '연습', lab: '설계 랩', cheats: '치트시트', roadmap: '로드맵' }[route.view];
  document.title = `${m} · Multi Cloud`;
}

// ---- boot ----
applyTheme();
if (!store.open.size) store.toggleOpen(CHAPTERS[0].id, true);
shell();
window.addEventListener('hashchange', onRoute);
window.addEventListener('popstate', onRoute);
// in-app links ("#/…") are handled here instead of by the browser (see go())
document.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest?.('a[href^="#/"]');
  if (!a || a.target) return;
  e.preventDefault();
  go(a.getAttribute('href'));
});
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(go); }
});
onRoute();
