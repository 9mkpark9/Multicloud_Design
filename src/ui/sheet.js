// A contact sheet of every step of one lesson (sheet.html?id=<lesson id>), used to proof-read scenes.
// It loads only the engine and the content, so work in progress on the app shell cannot break it.
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-600.css';
import '@fontsource/jetbrains-mono/latin-700.css';
import '@fontsource/jetbrains-mono/latin-800.css';
import '@fontsource/nanum-gothic-coding/korean-400.css';
import '@fontsource/nanum-gothic-coding/korean-700.css';
import '../styles/app.css';
import '../styles/scene.css';
import '../styles/sheet.css';
import { getLesson } from '../content/index.js';
import { createScene } from '../engine/scene.js';
import { codePane } from '../engine/code.js';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');

function mountSheet(app, id) {
  const lesson = getLesson(id);
  if (!lesson || !lesson.ready) { app.innerHTML = `<p style="padding:30px">no lesson "${esc(id)}"</p>`; document.body.dataset.sheet = 'missing'; return; }
  app.innerHTML = `<div class="sheet"><h1>${esc(lesson.title)} <small>${esc(lesson.id)} · ${lesson.steps.length} steps</small></h1><div class="sheet-grid">${lesson.steps.map((s, i) => `
    <figure class="sheet-cell"><figcaption><b>${i + 1}. ${esc(s.key || '')}</b> ${esc(s.title)}</figcaption>
    <div class="sheet-stage ${s.code ? 'with-code' : ''}">${s.code ? `<div class="code-pane">${codePane(s.code.ref ? { ...lesson.codes[s.code.ref], ...s.code } : s.code)}</div>` : ''}<div class="scene-wrap"><div class="scene-host" data-i="${i}"></div>
    ${s.panel ? `<div class="panel"><div class="panel-head"><b>${esc(s.panel.title || '')}</b></div>${s.panel.rows.map((r) => `<div class="panel-row ${r[2] ? 't-' + r[2] : ''}"><span>${esc(r[0])}</span>${r[1] ? `<em>${esc(r[1])}</em>` : ''}</div>`).join('')}</div>` : ''}</div></div></figure>`).join('')}</div></div>`;
  app.querySelectorAll('.scene-host').forEach((host) => {
    const sc = createScene(host, lesson, { still: true });
    sc.apply(+host.dataset.i, { instant: true });
  });
  document.body.dataset.sheet = 'ready';
}

mountSheet(document.getElementById('app'), new URLSearchParams(location.search).get('id'));
