// Renders a lesson's isometric scene into an SVG and moves it from step to step.
import { proj, drawNode, drawZone, rayToPoly, pill, roundPoly, tagCentre, frameOf, AX, AY, esc } from './iso.js';
import { foldSteps } from './fold.js';

const f = (n) => (Math.round(n * 10) / 10).toString();
const PROVIDER = { aws: 'orange', azure: 'blue', gcp: 'red', ncp: 'green' };
export const colorOf = (c) => PROVIDER[c] || c || 'sand';

const pointOf = (scene, ref) => {
  if (Array.isArray(ref)) return proj(ref[0], ref[1]);
  const n = scene.nodes[ref];
  return n ? proj(n.at[0], n.at[1]) : null;
};

export function createScene(host, lesson, { still = false } = {}) {
  const def = { nodes: {}, zones: {}, edges: {}, ...(lesson.scene || {}) };
  const ids = {
    nodes: Object.keys(def.nodes).sort((a, b) => depth(def.nodes[a]) - depth(def.nodes[b])),
    zones: Object.keys(def.zones).sort((a, b) => area(def.zones[b]) - area(def.zones[a])),
    edges: Object.keys(def.edges),
  };
  function depth(n) { return n.at[0] + n.at[1] + (n.z || 0) * 0.001; }
  function area(z) { return z.size[0] * z.size[1]; }

  // ---- camera: one fixed frame that holds everything the lesson ever shows ----
  let vb = frameOf(lesson, new Set(), null);

  const uid = 'g' + Math.random().toString(36).slice(2, 7);
  host.innerHTML = `
<svg class="scene" viewBox="${vb.map(f).join(' ')}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(lesson.title || '')}">
  <defs>
    <pattern id="${uid}-grid" width="${AX * 2}" height="${AY * 2}" patternUnits="userSpaceOnUse">
      <path class="grid-line" d="M0 ${AY}L${AX} 0L${AX * 2} ${AY}L${AX} ${AY * 2}Z"/>
    </pattern>
    ${['', 'mute', 'bad', 'ok', 'accent'].map((t) => `<marker id="${uid}-arr${t}" class="arr ${t}" viewBox="0 0 10 10" refX="8.2" refY="5" markerWidth="8.5" markerHeight="8.5" orient="auto-start-reverse"><path d="M0.8 1L9 5L0.8 9Z"/></marker>`).join('')}
  </defs>
  <rect x="-6000" y="-6000" width="12000" height="12000" fill="url(#${uid}-grid)"/>
  <g class="L-zones"></g><g class="L-edges"></g><g class="L-flows"></g><g class="L-nodes"></g><g class="L-tags"></g>
</svg>`;
  const svg = host.querySelector('svg');
  const layer = (c) => svg.querySelector('.L-' + c);
  const el = { nodes: {}, zones: {}, edges: {} };
  const sig = {};
  const geo = {}; // per node: silhouette, top, bottom after the last draw

  for (const id of ids.zones) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'zone off');
    g.dataset.id = id;
    layer('zones').appendChild(g);
    el.zones[id] = g;
  }
  for (const id of ids.edges) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'edge off');
    g.dataset.id = id;
    layer('edges').appendChild(g);
    el.edges[id] = g;
  }
  for (const id of ids.nodes) {
    const n = def.nodes[id];
    const [x, y] = proj(n.at[0], n.at[1], n.z || 0);
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'node off');
    g.setAttribute('transform', `translate(${f(x)} ${f(y)})`);
    g.dataset.id = id;
    g.innerHTML = '<g class="node-in"></g>';
    layer('nodes').appendChild(g);
    el.nodes[id] = g;
  }

  function paintNode(id, n) {
    const s = JSON.stringify(n);
    if (sig[id] === s) return;
    sig[id] = s;
    const d = drawNode(n);
    geo[id] = d;
    const inner = el.nodes[id].firstElementChild;
    inner.setAttribute('class', `node-in c-${colorOf(n.color)} k-${n.kind || 'box'} ${n.state ? 'is-' + n.state : ''}`);
    const rx = d.right + 12;
    inner.innerHTML = `<ellipse class="n-ring" cx="0" cy="0" rx="${f(rx)}" ry="${f(rx * 0.58)}"/>` + d.svg;
  }

  function paintZone(id, z) {
    const s = JSON.stringify(z);
    if (sig['z:' + id] === s) return;
    sig['z:' + id] = s;
    el.zones[id].innerHTML = `<g class="c-${colorOf(z.color || 'gray')}">${drawZone(z).svg}</g>`;
  }

  function edgePoints(e) {
    const pts = [e.from, ...(e.via || []), e.to].map((r) => pointOf(def, r));
    if (pts.some((p) => !p)) return null;
    // pull both ends back to the outline of the shapes they touch
    const trim = (ref, p, toward, extra) => {
      if (Array.isArray(ref) || !geo[ref]) return p;
      const dx = toward[0] - p[0], dy = toward[1] - p[1];
      const len = Math.hypot(dx, dy) || 1;
      const n = def.nodes[ref];
      const zoff = n.z || 0;
      const t = rayToPoly(geo[ref].sil.map(([x, y]) => [x, y - zoff]), dx / len, dy / len) + extra;
      return [p[0] + (dx / len) * Math.min(t, len * 0.45), p[1] + (dy / len) * Math.min(t, len * 0.45)];
    };
    const a = trim(e.from, pts[0], pts[1], 5);
    const b = trim(e.to, pts[pts.length - 1], pts[pts.length - 2], 8);
    return [a, ...pts.slice(1, -1), b];
  }

  function paintEdge(id, e) {
    const pts = edgePoints(e);
    const s = JSON.stringify([e, pts]);
    if (sig['e:' + id] === s) return;
    sig['e:' + id] = s;
    if (!pts) { el.edges[id].innerHTML = ''; return; }
    const tone = e.tone || '';
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${f(p[0])} ${f(p[1])}`).join('');
    const arrow = e.arrow === false ? '' : `marker-end="url(#${uid}-arr${tone})"`;
    const arrow2 = e.bi ? `marker-start="url(#${uid}-arr${tone})"` : '';
    let html = `<path class="e-line ${e.style || ''} ${tone}" d="${d}" ${arrow} ${arrow2}/>`;
    if (e.label) {
      const mid = pts.length % 2 ? pts[(pts.length - 1) / 2] : [(pts[pts.length / 2 - 1][0] + pts[pts.length / 2][0]) / 2, (pts[pts.length / 2 - 1][1] + pts[pts.length / 2][1]) / 2];
      html += pill(e.label, { cx: mid[0], cy: mid[1], fs: 12.5, shadow: false, cls: 'e-label', tone }).svg;
    }
    el.edges[id].innerHTML = html;
  }

  // ---- packets ----
  let packets = [];
  let cycle = 1;
  let t0 = 0;
  let pausedAt = null;
  let raf = 0;

  function buildFlows(step) {
    layer('flows').innerHTML = '';
    packets = [];
    let end = 0;
    for (const fl of step.flows || []) {
      const pts = (fl.path || []).map((r) => pointOf(def, r)).filter(Boolean);
      if (pts.length < 2) continue;
      const seg = [];
      let total = 0;
      for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); total += l; }
      const dur = fl.dur || Math.max(0.9, total / 190);
      const n = fl.n || 1;
      const gap = fl.gap ?? 0.38;
      for (let i = 0; i < n; i++) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', `pkt k-${fl.kind || 'req'}`);
        g.innerHTML = fl.kind === 'build' ? '<rect x="-5.5" y="-5.5" width="11" height="11" rx="2.5"/>' : fl.kind === 'bad' ? '<circle r="6.2"/><path d="M-2.6 -2.6l5.2 5.2m0 -5.2l-5.2 5.2"/>' : '<circle r="5.6"/>';
        g.style.opacity = 0;
        layer('flows').appendChild(g);
        const start = (fl.delay || 0) + i * gap;
        packets.push({ g, pts, seg, total, start, dur, frac: (i + 1) / (n + 1) });
        end = Math.max(end, start + dur);
      }
    }
    cycle = end + 0.9;
  }

  function place(p, k) {
    let d = k * p.total;
    let i = 0;
    while (i < p.seg.length - 1 && d > p.seg[i]) { d -= p.seg[i]; i++; }
    const r = p.seg[i] ? d / p.seg[i] : 0;
    const x = p.pts[i][0] + (p.pts[i + 1][0] - p.pts[i][0]) * r;
    const y = p.pts[i][1] + (p.pts[i + 1][1] - p.pts[i][1]) * r;
    p.g.setAttribute('transform', `translate(${f(x)} ${f(y)})`);
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (pausedAt != null || !packets.length) return;
    const t = ((now - t0) / 1000) % cycle;
    for (const p of packets) {
      const k = (t - p.start) / p.dur;
      if (k < 0 || k > 1) { p.g.style.opacity = 0; continue; }
      p.g.style.opacity = k < 0.06 ? k / 0.06 : k > 0.94 ? (1 - k) / 0.06 : 1;
      place(p, k);
    }
  }

  // ---- step-local tags ----
  function buildTags(step, state) {
    let html = '';
    for (const t of step.tags || []) {
      const node = t.on ? def.nodes[t.on] : null;
      if (t.on && (!node || !geo[t.on] || !state.vis.has(t.on))) continue;
      if (!t.on && !t.at) continue;
      const [x, y] = tagCentre(t, node, geo[t.on]);
      html += `<g class="tag">${pill(t.text, { cx: x, cy: y, fs: 14, tone: t.tone || '', icon: t.icon || '' }).svg}</g>`;
    }
    layer('tags').innerHTML = html;
  }

  // ---- camera: each step frames what it shows, and glides there ----
  let camRaf = 0;
  function moveCamera(to, instant) {
    cancelAnimationFrame(camRaf);
    if (instant) { vb = to; svg.setAttribute('viewBox', vb.map(f).join(' ')); return; }
    const from = vb;
    const start = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - start) / 650);
      const e = 1 - Math.pow(1 - k, 3);
      vb = from.map((v, i) => v + (to[i] - v) * e);
      svg.setAttribute('viewBox', vb.map(f).join(' '));
      if (k < 1) camRaf = requestAnimationFrame(tick);
    };
    camRaf = requestAnimationFrame(tick);
  }

  let current = -1;
  function apply(index, { instant = false } = {}) {
    const step = lesson.steps[index];
    if (!step) return;
    const state = foldSteps(lesson, index);
    svg.classList.toggle('instant', instant || still);

    for (const id of ids.zones) {
      paintZone(id, { ...def.zones[id], ...(state.patch[id] || {}) });
      el.zones[id].classList.toggle('off', !state.vis.has(id));
    }
    for (const id of ids.nodes) {
      const n = { ...def.nodes[id], ...(state.patch[id] || {}) };
      paintNode(id, n);
      const g = el.nodes[id];
      g.classList.toggle('off', !state.vis.has(id));
      g.classList.toggle('focus', (step.focus || []).includes(id));
    }
    for (const id of ids.edges) {
      const e = { ...def.edges[id], ...(state.patch[id] || {}) };
      paintEdge(id, e);
      const endsOn = [e.from, e.to].every((r) => Array.isArray(r) || state.vis.has(r));
      el.edges[id].classList.toggle('off', !endsOn || state.edgeOff.has(id));
    }
    buildTags(step, state);
    buildFlows(step);
    moveCamera(frameOf(lesson, state.vis, step), instant || still || current < 0);
    current = index;
    if (still) {
      for (const p of packets) { p.g.style.opacity = 1; place(p, p.frac); }
    } else {
      t0 = performance.now();
      if (pausedAt != null) pausedAt = t0;
      if (!raf) raf = requestAnimationFrame(frame);
    }
    if (instant || still) requestAnimationFrame(() => svg.classList.remove('instant'));
    return state;
  }

  return {
    apply,
    replay() { t0 = performance.now(); if (pausedAt != null) pausedAt = t0; layer('tags').querySelectorAll('.tag').forEach((t) => { t.style.animation = 'none'; t.getBoundingClientRect(); t.style.animation = ''; }); },
    setPaused(p) {
      if (p && pausedAt == null) pausedAt = performance.now();
      else if (!p && pausedAt != null) { t0 += performance.now() - pausedAt; pausedAt = null; }
    },
    get paused() { return pausedAt != null; },
    get step() { return current; },
    destroy() { cancelAnimationFrame(raf); cancelAnimationFrame(camRaf); raf = 0; host.innerHTML = ''; },
  };
}

export { roundPoly };
