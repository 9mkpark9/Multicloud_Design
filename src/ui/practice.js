// Practice: multiple-choice questions drawn from the lessons, one at a time, with the reason after each answer.
import { CHAPTERS, LESSON_META, ORDER, getLesson } from '../content/index.js';
import { icon } from '../engine/icons.js';
import { store } from '../store.js';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

function pool(ids) {
  const out = [];
  for (const id of ids) {
    const l = getLesson(id);
    (l.quiz || []).forEach((q, qi) => out.push({ ...q, lesson: id, qi }));
  }
  return out;
}

export function mountPractice(main, ctx) {
  const { arg, arg2 } = ctx.route;
  let scope = arg === 'chapter' && CHAPTERS.find((c) => c.id === arg2) ? { kind: 'chapter', id: arg2 }
    : arg === 'mix' ? { kind: 'mix' }
    : { kind: 'lesson', id: arg === 'lesson' && LESSON_META[arg2] ? arg2 : ctx.lastLesson };

  let questions = [];
  let at = 0;
  let picked = null;
  let results = [];

  function start() {
    if (scope.kind === 'lesson') questions = pool([scope.id]);
    else if (scope.kind === 'chapter') questions = shuffle(pool(CHAPTERS.find((c) => c.id === scope.id).lessons.map((l) => l.id)));
    else questions = shuffle(pool(ORDER)).slice(0, 10);
    at = 0; picked = null; results = [];
    paint();
  }

  function scopeName() {
    if (scope.kind === 'lesson') return LESSON_META[scope.id].title;
    if (scope.kind === 'chapter') { const c = CHAPTERS.find((x) => x.id === scope.id); return `${c.no}. ${c.title}`; }
    return '전체에서 10문제';
  }

  function paint() {
    const les = LESSON_META[scope.kind === 'lesson' ? scope.id : ctx.lastLesson];
    const ch = scope.kind === 'chapter' ? CHAPTERS.find((c) => c.id === scope.id) : les.chapter;
    const q = questions[at];
    const done = at >= questions.length;
    const right = results.filter((r) => r.ok).length;

    main.innerHTML = `
<section class="view card">
  <header class="view-head">
    <div><h1>연습</h1><p>읽은 것을 꺼내 보는 시간입니다. 답을 고르면 바로 이유를 보여 줍니다.</p></div>
    <div class="seg" role="tablist">
      <a class="seg-btn ${scope.kind === 'lesson' ? 'on' : ''}" href="#/practice/lesson/${les.id}">${icon('file', 13)}이 레슨</a>
      <a class="seg-btn ${scope.kind === 'chapter' ? 'on' : ''}" href="#/practice/chapter/${ch.id}">${icon('folder', 13)}이 챕터</a>
      <a class="seg-btn ${scope.kind === 'mix' ? 'on' : ''}" href="#/practice/mix">${icon('shuffle', 13)}전체 섞기</a>
    </div>
  </header>
  <div class="quiz-wrap">
  ${!questions.length ? `
    <div class="soon-box">${icon('hourglass', 26)}<b>아직 문제가 없습니다</b><p>"${esc(scopeName())}"의 내용이 준비되면 문제가 나타납니다.</p></div>`
    : done ? `
    <div class="result">
      <div class="score ${right === questions.length ? 'perfect' : ''}">${icon(right === questions.length ? 'trophy' : 'target', 30)}<b>${right} / ${questions.length}</b><span>${right === questions.length ? '전부 맞혔습니다!' : right / questions.length >= 0.7 ? '좋아요. 틀린 문제만 다시 볼까요?' : '레슨을 한 번 더 보고 다시 도전해 보세요.'}</span></div>
      ${results.some((r) => !r.ok) ? `<h3>다시 볼 문제</h3><ul class="miss">${results.filter((r) => !r.ok).map((r) => `<li><span>${esc(r.q.q)}</span><a class="btn sm" href="#/${r.q.lesson}/1">${icon('book', 12)}${esc(LESSON_META[r.q.lesson].title)}</a></li>`).join('')}</ul>` : ''}
      <div class="result-btns"><button class="btn primary" id="again" type="button">${icon('replay', 14)}다시 풀기</button><a class="btn" href="#/${les.id}/1">${icon('book', 14)}레슨으로</a></div>
    </div>`
    : `
    <div class="q-top"><span class="chip t-mute">${esc(scopeName())}</span><span class="q-count">${at + 1} / ${questions.length}</span></div>
    <div class="bar"><i style="width:${(at / questions.length) * 100}%"></i></div>
    <article class="q-card">
      ${scope.kind !== 'lesson' ? `<a class="q-src" href="#/${q.lesson}/1">${icon('file', 12)}${esc(LESSON_META[q.lesson].title)}</a>` : ''}
      <h2>${esc(q.q)}</h2>
      <div class="opts">
        ${q.options.map((o, i) => `<button type="button" class="opt ${picked == null ? '' : i === q.answer ? 'right' : i === picked ? 'wrong' : 'rest'}" data-i="${i}" ${picked != null ? 'disabled' : ''}><kbd>${i + 1}</kbd><span>${esc(o)}</span>${picked != null && i === q.answer ? icon('check', 16) : picked === i ? icon('x', 16) : ''}</button>`).join('')}
      </div>
      ${picked != null ? `<div class="why ${picked === q.answer ? 'ok' : 'no'}"><b>${picked === q.answer ? '맞았습니다' : '아쉽네요'}</b><p>${esc(q.why)}</p></div>
      <div class="q-next"><button class="btn primary" id="next" type="button">${at + 1 < questions.length ? '다음 문제' : '결과 보기'}${icon('arrow-right', 14)}</button><kbd>Enter</kbd></div>` : ''}
    </article>`}
  </div>
</section>
<aside class="side">
  <section class="card pad mastery">
    <h3>챕터별 퀴즈</h3>
    ${CHAPTERS.map((c) => {
      const total = c.lessons.reduce((n, l) => n + (getLesson(l.id).quiz?.length || 0), 0);
      const hit = c.lessons.reduce((n, l) => n + store.quizHits(l.id), 0);
      return `<a class="m-row fc-${c.color} ${scope.kind === 'chapter' && scope.id === c.id ? 'on' : ''}" href="#/practice/chapter/${c.id}"><svg class="folder" width="16" height="14" viewBox="0 0 20 17"><path d="M1.5 3.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/></svg><span>${esc(c.title)}</span><em>${hit}/${total}</em></a>`;
    }).join('')}
  </section>
</aside>`;

    main.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => answer(+b.dataset.i)));
    main.querySelector('#next')?.addEventListener('click', next);
    main.querySelector('#again')?.addEventListener('click', start);
    main.querySelector('#next')?.focus();
  }

  function answer(i) {
    if (picked != null || at >= questions.length) return;
    const q = questions[at];
    picked = i;
    results.push({ q, ok: i === q.answer });
    store.markQuiz(q.lesson, q.qi, i === q.answer);
    paint();
  }
  function next() { at++; picked = null; paint(); }

  const onKey = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.modal')) return;
    if (at >= questions.length) return;
    if (picked == null && ['1', '2', '3', '4'].includes(e.key)) answer(+e.key - 1);
    else if (picked != null && (e.key === 'Enter' || e.key === 'ArrowRight')) { e.preventDefault(); next(); }
  };
  window.addEventListener('keydown', onKey);
  start();
  return { destroy() { window.removeEventListener('keydown', onKey); } };
}
