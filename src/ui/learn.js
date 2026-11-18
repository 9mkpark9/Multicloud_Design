// The lesson view: the animated stage, the step card, the timeline and the checklist.
import { getLesson, ORDER, LESSON_META } from '../content/index.js';
import { createScene } from '../engine/scene.js';
import { codePane } from '../engine/code.js';
import { learned, foldSteps } from '../engine/fold.js';
import { icon } from '../engine/icons.js';
import { store } from '../store.js';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const KINDS = {
  problem: { label: '문제', tone: 'bad' },
  solution: { label: '해결', tone: 'ok' },
  concept: { label: '개념', tone: 'info' },
  case: { label: '사례', tone: 'warn' },
  compare: { label: '비교', tone: 'accent' },
  recap: { label: '정리', tone: 'mute' },
};
const CALLOUT = {
  key: { label: '핵심', icon: 'sparkles' },
  warn: { label: '주의', icon: 'warn' },
  tip: { label: '팁', icon: 'bulb' },
  cloud: { label: '클라우드별로', icon: 'cloud' },
};
export const FLOW_KINDS = ['req', 'res', 'data', 'ctrl', 'sync', 'build', 'bad'];

export function mountLearn(main, lessonId, startStep, ctx) {
  const lesson = getLesson(lessonId);
  const ch = lesson.chapter;
  const idx = ORDER.indexOf(lessonId);
  const prevId = ORDER[idx - 1];
  const nextId = ORDER[idx + 1];

  if (!lesson.ready) {
    main.innerHTML = `
<section class="lesson card">
  ${head(lesson, ch)}
  <div class="soon-box">${icon('hourglass', 26)}<b>이 레슨은 준비 중입니다</b><p>코스 개요에는 있지만 아직 내용이 작성되지 않았어요.</p>
  ${nextId ? `<a class="btn primary" href="#/${nextId}/1">다음 레슨으로 ${icon('arrow-right', 14)}</a>` : ''}</div>
</section>`;
    return { destroy() {}, lesson: lessonId };
  }

  const total = lesson.steps.length;
  let step = Math.min(Math.max(1, startStep), total);

  main.innerHTML = `
<section class="lesson card">
  ${head(lesson, ch)}
  <div class="stage">
    <div class="stage-top">
      <div class="metrics" id="metrics"></div>
      <div class="stage-btns">
        <button class="btn sm" id="replay" type="button">${icon('replay', 13)}<span>다시 보기</span></button>
        <button class="btn sm" id="pause" type="button"></button>
      </div>
    </div>
    <div class="stage-body">
      <div class="code-pane" id="code" hidden></div>
      <div class="scene-wrap">
        <div class="scene-host" id="scene"></div>
        <div class="panel" id="panel" hidden></div>
      </div>
    </div>
    <div class="legend" id="legend"></div>
  </div>
  <div class="timeline">
    <div class="tl-head"><b>이 레슨에서</b><span id="tl-count"></span></div>
    <ol class="tl-steps" id="tl"></ol>
  </div>
</section>
<aside class="side">
  <section class="step card" id="stepcard"></section>
  <section class="learn card">
    <h3>배울 내용</h3>
    <ul id="learn"></ul>
  </section>
</aside>`;

  const $ = (s) => main.querySelector(s);
  const scene = createScene($('#scene'), lesson);
  const LEG = { req: '요청', res: '응답', data: '데이터', ctrl: '제어 · 헬스 체크', sync: '복제 · 동기화', build: '빌드 · 아티팩트', bad: '실패 · 차단' };
  const legend = lesson.legend || [['req', LEG.req], ['res', LEG.res]];
  $('#legend').innerHTML = legend.map(([k, t]) => `<span class="lg k-${k}"><i></i>${esc(t || LEG[k] || k)}</span>`).join('');

  $('#tl').innerHTML = lesson.steps.map((s, i) => `<li><a href="#/${lesson.id}/${i + 1}" data-i="${i + 1}"><i>${i + 1}</i><span>${esc(s.key || s.title)}</span></a></li>`).join('');

  let lastMetrics = {};
  function paint(instant) {
    const st = lesson.steps[step - 1];
    const state = scene.apply(step - 1, { instant });

    // metric tiles
    const mdefs = lesson.metrics || [];
    $('#metrics').innerHTML = mdefs.map((m) => {
      const raw = state.metrics[m.id];
      const [val, tone] = Array.isArray(raw) ? raw : [raw, ''];
      const changed = !instant && lastMetrics[m.id] !== undefined && JSON.stringify(lastMetrics[m.id]) !== JSON.stringify(raw);
      return `<div class="metric ${tone ? 't-' + tone : ''} ${changed ? 'flash' : ''}"><span>${m.icon ? icon(m.icon, 11) : ''}${esc(m.label)}</span><b>${val == null ? '—' : esc(val)}</b></div>`;
    }).join('');
    lastMetrics = { ...state.metrics };
    $('.stage-top').classList.toggle('no-metrics', !mdefs.length);

    // code pane and panel
    const code = st.code ? (st.code.ref ? { ...lesson.codes[st.code.ref], ...st.code } : st.code) : null;
    const cp = $('#code');
    cp.hidden = !code;
    $('.stage-body').classList.toggle('with-code', Boolean(code));
    if (code) {
      cp.innerHTML = codePane(code);
      cp.querySelector('.ln.hl')?.scrollIntoView({ block: 'nearest' });
    }
    const pn = $('#panel');
    pn.hidden = !st.panel;
    if (st.panel) {
      pn.innerHTML = `<div class="panel-head">${st.panel.icon ? icon(st.panel.icon, 13) : ''}<b>${esc(st.panel.title || '')}</b></div>` +
        st.panel.rows.map((r) => {
          const [a, b, tone] = r;
          return `<div class="panel-row ${tone ? 't-' + tone : ''}"><span>${esc(a)}</span>${b != null && b !== '' ? `<em>${esc(b)}</em>` : ''}</div>`;
        }).join('');
    }

    // step card
    const kind = KINDS[st.kind] || KINDS.concept;
    const co = st.callout ? CALLOUT[st.callout.type] || CALLOUT.key : null;
    const nextStep = lesson.steps[step];
    $('#stepcard').innerHTML = `
<div class="step-top"><span class="step-no">${step} / ${total}단계</span><span class="chip t-${kind.tone}">${kind.label}</span></div>
<h2>${esc(st.title)}</h2>
<div class="step-body">
  ${(st.body || []).map((p) => `<p>${p}</p>`).join('')}
  ${co ? `<div class="callout co-${st.callout.type}"><span class="co-ico">${icon(co.icon, 15)}</span><div><small>${co.label}</small>${st.callout.text}</div></div>` : ''}
  ${st.changes?.length ? `<div class="changes"><small>달라진 점</small>${st.changes.map(([sign, text]) => `<div class="chg"><i class="s${sign === '+' ? 'p' : sign === '-' || sign === '−' ? 'm' : 't'}">${sign === '-' ? '−' : esc(sign)}</i><span>${text}</span></div>`).join('')}</div>` : ''}
</div>
<div class="step-nav">
  ${step > 1 ? `<a class="btn" href="#/${lesson.id}/${step - 1}">${icon('arrow-left', 14)}<span>뒤로</span></a>` : prevId ? `<a class="btn" href="#/${prevId}/1" title="${esc(LESSON_META[prevId].title)}">${icon('arrow-left', 14)}<span>이전 레슨</span></a>` : `<span class="btn disabled">${icon('arrow-left', 14)}<span>뒤로</span></span>`}
  ${nextStep ? `<a class="btn primary grow" href="#/${lesson.id}/${step + 1}"><span>다음: ${esc(nextStep.key || nextStep.title)}</span>${icon('arrow-right', 14)}</a>`
    : nextId ? `<a class="btn primary grow" href="#/${nextId}/1"><span>다음 레슨: ${esc(LESSON_META[nextId].title)}</span>${icon('arrow-right', 14)}</a>`
    : `<a class="btn primary grow" href="#/roadmap"><span>코스 완주! 로드맵 보기</span>${icon('trophy', 14)}</a>`}
</div>
<div class="keys"><kbd>←</kbd><kbd>→</kbd> 단계 · <kbd>R</kbd> 다시 보기 · <kbd>Space</kbd> 일시정지${lesson.quiz?.length && !nextStep ? ` · <a href="#/practice/lesson/${lesson.id}">퀴즈 풀기</a>` : ''}</div>`;

    // checklist and timeline
    $('#learn').innerHTML = learned(lesson, step - 1).map((l) => `<li class="${l.done ? 'on' : ''}"><i>${l.done ? icon('check', 11) : ''}</i><span>${esc(l.text)}</span></li>`).join('');
    $('#tl-count').textContent = `${total}단계 중 ${step}단계`;
    main.querySelectorAll('#tl a').forEach((a) => {
      const i = +a.dataset.i;
      a.parentElement.className = i < step ? 'past' : i === step ? 'now' : '';
    });
    main.querySelector('#tl .now')?.scrollIntoView({ block: 'nearest', inline: 'center' });
    paintPause();

    if (store.markSeen(lesson.id, step, total)) ctx.paintSidebar();
  }

  function paintPause() {
    $('#pause').innerHTML = scene.paused ? `${icon('play', 13)}<span>재생</span>` : `${icon('pause', 13)}<span>일시정지</span>`;
  }

  $('#replay').addEventListener('click', () => scene.replay());
  $('#pause').addEventListener('click', () => { scene.setPaused(!scene.paused); paintPause(); });

  const onKey = (e) => {
    if (e.target.closest('input, textarea, [contenteditable]') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.querySelector('.modal')) return;
    if (e.key === 'ArrowRight') {
      if (step < total) ctx.go(`#/${lesson.id}/${step + 1}`);
      else if (nextId) ctx.go(`#/${nextId}/1`);
    } else if (e.key === 'ArrowLeft') {
      if (step > 1) ctx.go(`#/${lesson.id}/${step - 1}`);
    } else if (e.key.toLowerCase() === 'r') scene.replay();
    else if (e.key === ' ') { e.preventDefault(); scene.setPaused(!scene.paused); paintPause(); }
  };
  window.addEventListener('keydown', onKey);

  paint(true);

  return {
    lesson: lessonId,
    update(n) {
      const next = Math.min(Math.max(1, n), total);
      const jump = Math.abs(next - step) > 1;
      step = next;
      paint(jump);
      if (matchMedia('(max-width: 859px)').matches) main.querySelector('.stage')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    },
    destroy() {
      window.removeEventListener('keydown', onKey);
      scene.destroy();
    },
  };
}

function head(lesson, ch) {
  return `
<header class="les-head">
  <div class="crumbs"><span>${ch.no}. ${esc(ch.title)}</span><i>/</i><span>레슨 ${lesson.index + 1} / ${ch.lessons.length}</span></div>
  <div class="les-title">
    <h1>${esc(lesson.title)}</h1>
    <div class="chips">
      <span class="chip t-warn">${icon('clock', 12)}${lesson.minutes}분</span>
      <span class="chip t-ok">${icon('signal', 12)}${esc(lesson.level)}</span>
      ${lesson.ready ? `<span class="chip t-accent">${icon('steps', 12)}${lesson.steps.length}단계</span>` : ''}
    </div>
  </div>
  <p class="blurb">${esc(lesson.blurb)}</p>
</header>`;
}

export { foldSteps };
