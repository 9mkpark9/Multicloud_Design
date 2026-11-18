// Roadmap: the whole course as a path — what is behind you, what you are on, what is ahead.
import { CHAPTERS, ORDER, getLesson, hasLesson } from '../content/index.js';
import { icon } from '../engine/icons.js';
import { store } from '../store.js';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const PHASES = { done: { label: '배웠어요', tone: 'ok', icon: 'circle-check' }, now: { label: '학습 중', tone: 'warn', icon: 'activity' }, next: { label: '앞으로', tone: 'mute', icon: 'circle' } };
const CYCLE = { done: 'now', now: 'next', next: 'done' };

export function mountRoadmap(main, ctx) {
  const phaseOf = (ch) => (ch.lessons.every((l) => store.done.has(l.id)) ? 'done' : store.phase[ch.id] || ch.phase || 'next');

  function paint() {
    const total = ORDER.length;
    const done = ORDER.filter((id) => store.done.has(id)).length;
    const mins = ORDER.filter((id) => !store.done.has(id)).reduce((n, id) => n + getLesson(id).minutes, 0);
    const count = { done: 0, now: 0, next: 0 };
    CHAPTERS.forEach((c) => count[phaseOf(c)]++);
    const nowCh = CHAPTERS.find((c) => phaseOf(c) === 'now') || CHAPTERS.find((c) => phaseOf(c) !== 'done') || CHAPTERS[0];
    const nextLesson = nowCh.lessons.find((l) => !store.done.has(l.id)) || CHAPTERS.flatMap((c) => c.lessons).find((l) => !store.done.has(l.id));

    main.innerHTML = `
<section class="view card">
  <header class="view-head">
    <div><h1>로드맵</h1><p>지금까지 배운 것과 앞으로 배울 것을 한눈에. 챕터 상태는 눌러서 내 진도에 맞게 바꿀 수 있습니다.</p></div>
    <button class="btn sm" id="reset" type="button">${icon('undo', 13)}진도 초기화</button>
  </header>
  <div class="rm-stats">
    <div class="rm-stat"><span>완료한 레슨</span><b>${done} / ${total}</b><span class="bar"><i style="width:${(done / total) * 100}%"></i></span></div>
    <div class="rm-stat t-ok"><span>${icon('circle-check', 12)}배운 챕터</span><b>${count.done}</b></div>
    <div class="rm-stat t-warn"><span>${icon('activity', 12)}학습 중</span><b>${count.now}</b></div>
    <div class="rm-stat t-mute"><span>${icon('circle', 12)}앞으로</span><b>${count.next}</b></div>
    <div class="rm-stat"><span>${icon('clock', 12)}남은 분량</span><b>약 ${Math.round(mins / 6) / 10}시간</b></div>
  </div>
  ${nextLesson ? `<a class="rm-next" href="#/${nextLesson.id}/${Math.min(store.seen[nextLesson.id] || 1, Math.max(1, getLesson(nextLesson.id).steps.length))}"><span>${icon('rocket', 18)}</span><div><small>이어서 하기</small><b>${esc(nextLesson.title)}</b></div>${icon('arrow-right', 16)}</a>` : `<div class="rm-next">${icon('trophy', 18)}<div><small>축하합니다</small><b>모든 레슨을 마쳤습니다</b></div></div>`}
  <ol class="rm-path">
    ${CHAPTERS.map((ch) => {
      const ph = phaseOf(ch);
      const P = PHASES[ph];
      const n = ch.lessons.filter((l) => store.done.has(l.id)).length;
      const qTotal = ch.lessons.reduce((k, l) => k + (getLesson(l.id).quiz?.length || 0), 0);
      const qHit = ch.lessons.reduce((k, l) => k + store.quizHits(l.id), 0);
      return `
    <li class="rm-ch ph-${ph} fc-${ch.color}">
      <div class="rm-dot">${icon(P.icon, 14)}</div>
      <div class="rm-card">
        <div class="rm-top">
          <svg class="folder" width="20" height="17" viewBox="0 0 20 17"><path d="M1.5 3.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/></svg>
          <h2>${ch.no}. ${esc(ch.title)}</h2>
          <button class="chip t-${P.tone} ph-btn" type="button" data-ch="${ch.id}" title="눌러서 상태 바꾸기">${P.label}</button>
          <span class="rm-n">${n} / ${ch.lessons.length}</span>
        </div>
        <span class="bar"><i style="width:${(n / ch.lessons.length) * 100}%"></i></span>
        <div class="rm-lessons">
          ${ch.lessons.map((l) => `<a class="rm-les ${store.done.has(l.id) ? 'done' : ''} ${hasLesson(l.id) ? '' : 'soon'}" href="#/${l.id}/1">${icon(store.done.has(l.id) ? 'circle-check' : 'circle', 12)}<span>${esc(l.title)}</span><em>${l.minutes}분</em></a>`).join('')}
        </div>
        ${qTotal ? `<a class="rm-quiz" href="#/practice/chapter/${ch.id}">${icon('target', 12)}퀴즈 ${qHit} / ${qTotal}</a>` : ''}
      </div>
    </li>`;
    }).join('')}
  </ol>
</section>`;
    main.querySelectorAll('.ph-btn').forEach((b) => b.addEventListener('click', () => {
      const ch = CHAPTERS.find((c) => c.id === b.dataset.ch);
      store.setPhase(ch.id, CYCLE[store.phase[ch.id] || ch.phase || 'next']);
      paint();
    }));
    main.querySelector('#reset').addEventListener('click', () => {
      if (!confirm('완료 표시, 퀴즈 기록, 챕터 상태를 모두 처음으로 되돌릴까요?')) return;
      store.reset();
      paint();
      ctx.paintSidebar();
    });
  }
  paint();
  return { destroy() {} };
}
