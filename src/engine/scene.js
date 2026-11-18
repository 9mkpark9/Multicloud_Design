// Renders a lesson's isometric scene into an SVG and animates it from step to step.
//
// A step change is choreographed rather than swapped:
//   0.00s  what leaves fades and sinks; the camera starts gliding to the new frame
//   0.00s  nodes that moved slide to their new place (arrows follow them)
//   0.05s  new zones fade in
//   0.15s  new nodes drop in one after another
//   +0.3s  arrows draw themselves from one end to the other once both ends are there
//   +0.4s  the step's tags pop up next to their node
//   then   packets start flowing
// Nodes whose look changed (colour, state, label, badge) cross-fade from old to new.
import { proj, drawNode, drawZone, rayToPoly, pill, roundPoly, tagCentre, frameOf, AX, AY, esc } from './iso.js';
import { foldSteps } from './fold.js';

const f = (n) => (Math.round(n * 10) / 10).toString();
const NS = 'http://www.w3.org/2000/svg';
const PROVIDER = { aws: 'orange', azure: 'blue', gcp: 'red', ncp: 'green' };
export const colorOf = (c) => PROVIDER[c] || c || 'sand';
const ease = (k) => 1 - Math.pow(1 - k, 3);
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const restart = (node, cls) => { node.classList.remove(cls); node.getBoundingClientRect(); node.classList.add(cls); };

export function createScene(host, lesson, { still = false } = {}) {
  const def = { nodes: {}, zones: {}, edges: {}, ...(lesson.scene || {}) };
  const ids = {
    nodes: Object.keys(def.nodes),
    zones: Object.keys(def.zones).sort((a, b) => area(def.zones[b]) - area(def.zones[a])),
    edges: Object.keys(def.edges),
  };
  function area(z) { return z.size[0] * z.size[1]; }

  let vb = frameOf(lesson, new Set(), null);
  const uid = 'g' + Math.random().toString(36).slice(2, 7);
  host.innerHTML = `
<svg class="scene ${still ? 'instant' : ''}" viewBox="${vb.map(f).join(' ')}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(lesson.title || '')}">
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
  const geo = {}; // node id → drawNode() result for its current look
  const gpos = {}; // node id → ground point on screen, where it is drawn right now
  const tpos = {}; // node id → ground point it is heading to
  const nodeZ = {}; // node id → height
  const shown = new Set(); // what is visible after the last apply()

  const mk = (tag, cls, parent) => { const g = document.createElementNS(NS, tag); if (cls) g.setAttribute('class', cls); parent.appendChild(g); return g; };
  for (const id of ids.zones) el.zones[id] = mk('g', 'zone off', layer('zones'));
  for (const id of ids.edges) el.edges[id] = mk('g', 'edge off', layer('edges'));
  for (const id of ids.nodes) {
    const n = def.nodes[id];
    const g = mk('g', 'node off', layer('nodes'));
    g.dataset.id = id;
    g.innerHTML = '<g class="node-in"></g>';
    // once landed, drop the entrance class: re-ordering nodes in the DOM would otherwise replay it
    g.addEventListener('animationend', (e) => { if (e.animationName === 'node-drop' || e.animationName === 'fade-in') g.classList.remove('enter'); });
    el.nodes[id] = g;
    gpos[id] = tpos[id] = proj(n.at[0], n.at[1]);
    nodeZ[id] = n.z || 0;
    placeNode(id);
  }
  sortNodes();

  function placeNode(id) {
    const [x, y] = gpos[id];
    el.nodes[id].setAttribute('transform', `translate(${f(x)} ${f(y - nodeZ[id])})`);
  }
  // nearer nodes are drawn later; positions can change, so the order is kept up to date
  function sortNodes() {
    const order = [...ids.nodes].sort((a, b) => depthOf(a) - depthOf(b));
    const L = layer('nodes');
    let i = 0;
    for (const id of order) {
      if (L.children[i] !== el.nodes[id]) L.insertBefore(el.nodes[id], L.children[i] || null);
      i++;
    }
  }
  function depthOf(id) { const [x, y] = tpos[id]; return y + nodeZ[id] * 0.001 + x * 1e-6; }

  // ---- nodes: draw, or cross-fade to a new look ----
  function paintNode(id, n, animate) {
    const s = JSON.stringify({ ...n, at: 0 });
    if (sig[id] === s) return;
    const first = sig[id] === undefined;
    sig[id] = s;
    const d = drawNode(n);
    geo[id] = d;
    const g = el.nodes[id];
    const inner = g.querySelector('.node-in');
    if (animate && !first && !g.classList.contains('off')) {
      g.classList.remove('enter');
      const ghost = inner.cloneNode(true);
      ghost.setAttribute('class', inner.getAttribute('class').replace(/\b(swap|node-in)\b/g, '') + ' ghost');
      g.insertBefore(ghost, inner);
      const drop = () => ghost.remove();
      ghost.addEventListener('animationend', drop, { once: true });
      setTimeout(drop, 900);
      restart(inner, 'swap');
    }
    inner.setAttribute('class', `node-in c-${colorOf(n.color)} k-${n.kind || 'box'} ${n.state ? 'is-' + n.state : ''} ${inner.classList.contains('swap') ? 'swap' : ''}`);
    const rx = d.right + 12;
    inner.innerHTML = `<ellipse class="n-ring" cx="0" cy="0" rx="${f(rx)}" ry="${f(rx * 0.58)}"/>` + d.svg;
  }

  function paintZone(id, z) {
    const s = JSON.stringify(z);
    if (sig['z:' + id] === s) return;
    sig['z:' + id] = s;
    el.zones[id].innerHTML = `<g class="z-in c-${colorOf(z.color || 'gray')}">${drawZone(z).svg}</g>`;
  }

  // ---- edges: built once per look, their path follows the nodes ----
  const pointOf = (ref, map = gpos) => (Array.isArray(ref) ? proj(ref[0], ref[1]) : map[ref] || null);

  function edgePoints(e, map = gpos) {
    const pts = [e.from, ...(e.via || []), e.to].map((r) => pointOf(r, map));
    if (pts.some((p) => !p)) return null;
    // pull both ends back to the outline of the shapes they touch
    const trim = (ref, p, toward, extra) => {
      if (Array.isArray(ref) || !geo[ref]) return p;
      const dx = toward[0] - p[0], dy = toward[1] - p[1];
      const len = Math.hypot(dx, dy) || 1;
      const zoff = nodeZ[ref];
      const t = rayToPoly(geo[ref].sil.map(([x, y]) => [x, y - zoff]), dx / len, dy / len) + extra;
      return [p[0] + (dx / len) * Math.min(t, len * 0.45), p[1] + (dy / len) * Math.min(t, len * 0.45)];
    };
    const a = trim(e.from, pts[0], pts[1], 5);
    const b = trim(e.to, pts[pts.length - 1], pts[pts.length - 2], 8);
    return [a, ...pts.slice(1, -1), b];
  }

  function paintEdge(id, e) {
    const g = el.edges[id];
    const look = JSON.stringify({ ...e, from: 0, to: 0, via: 0 });
    if (sig['e:' + id] !== look) {
      sig['e:' + id] = look;
      const tone = e.tone || '';
      const arrow = e.arrow === false ? '' : `marker-end="url(#${uid}-arr${tone})"`;
      const arrow2 = e.bi ? `marker-start="url(#${uid}-arr${tone})"` : '';
      g.innerHTML = `<mask id="${uid}-m-${id}" maskUnits="userSpaceOnUse" x="-6000" y="-6000" width="12000" height="12000"><path class="m-draw" pathLength="1"/></mask>
<g mask="url(#${uid}-m-${id})"><path class="e-line ${e.style || ''} ${tone}" ${arrow} ${arrow2}/>${e.label ? `<g class="e-lab">${pill(e.label, { fs: 12.5, shadow: false, cls: 'e-label', tone }).svg}</g>` : ''}</g>`;
      g.dataset.path = '';
    }
    const pts = edgePoints(e);
    const d = pts ? pts.map((p, i) => `${i ? 'L' : 'M'}${f(p[0])} ${f(p[1])}`).join('') : '';
    if (g.dataset.path === d) return;
    g.dataset.path = d;
    g.querySelector('.e-line').setAttribute('d', d);
    g.querySelector('.m-draw').setAttribute('d', d);
    const lab = g.querySelector('.e-lab');
    if (lab && pts) {
      const mid = pts.length % 2 ? pts[(pts.length - 1) / 2] : [(pts[pts.length / 2 - 1][0] + pts[pts.length / 2][0]) / 2, (pts[pts.length / 2 - 1][1] + pts[pts.length / 2][1]) / 2];
      lab.setAttribute('transform', `translate(${f(mid[0])} ${f(mid[1])})`);
    }
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
      const pts = (fl.path || []).map((r) => pointOf(r, tpos)).filter(Boolean);
      if (pts.length < 2) continue;
      const seg = [];
      let total = 0;
      for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); total += l; }
      const dur = fl.dur || Math.max(0.9, total / 190);
      const n = fl.n || 1;
      const gap = fl.gap ?? 0.38;
      for (let i = 0; i < n; i++) {
        const g = mk('g', `pkt k-${fl.kind || 'req'}`, layer('flows'));
        g.innerHTML = fl.kind === 'build' ? '<rect x="-5.5" y="-5.5" width="11" height="11" rx="2.5"/>' : fl.kind === 'bad' ? '<circle r="6.2"/><path d="M-2.6 -2.6l5.2 5.2m0 -5.2l-5.2 5.2"/>' : '<circle r="5.6"/>';
        g.style.opacity = 0;
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
    if (now < t0) { for (const p of packets) p.g.style.opacity = 0; return; }
    const t = ((now - t0) / 1000) % cycle;
    for (const p of packets) {
      const k = (t - p.start) / p.dur;
      if (k < 0 || k > 1) { p.g.style.opacity = 0; continue; }
      p.g.style.opacity = k < 0.06 ? k / 0.06 : k > 0.94 ? (1 - k) / 0.06 : 1;
      place(p, k);
    }
  }

  // ---- step-local tags ----
  function buildTags(step, state, nodes, delayOf) {
    layer('tags').innerHTML = '';
    for (const t of step.tags || []) {
      if (t.on && (!nodes[t.on] || !geo[t.on] || !state.vis.has(t.on))) continue;
      if (!t.on && !t.at) continue;
      const [x, y] = tagCentre(t, t.on ? nodes[t.on] : null, geo[t.on]);
      const g = mk('g', 'tag', layer('tags'));
      g.style.setProperty('--d', `${delayOf(t).toFixed(2)}s`);
      g.innerHTML = pill(t.text, { cx: x, cy: y, fs: 14, tone: t.tone || '', icon: t.icon || '' }).svg;
    }
  }

  // ---- camera and node moves share one animation loop ----
  let moveRaf = 0;
  function animate({ camTo, moves, camInstant }) {
    cancelAnimationFrame(moveRaf);
    const camFrom = vb;
    const from = {};
    for (const id of moves) from[id] = gpos[id];
    const touched = ids.edges.filter((id) => moves.some((m) => def.edges[id].from === m || def.edges[id].to === m));
    if (camInstant) { vb = camTo; svg.setAttribute('viewBox', vb.map(f).join(' ')); }
    if (!moves.length && camInstant) return;
    const start = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - start) / 680);
      const e = ease(k);
      if (!camInstant) {
        vb = camFrom.map((v, i) => v + (camTo[i] - v) * e);
        svg.setAttribute('viewBox', vb.map(f).join(' '));
      }
      for (const id of moves) {
        gpos[id] = [from[id][0] + (tpos[id][0] - from[id][0]) * e, from[id][1] + (tpos[id][1] - from[id][1]) * e];
        placeNode(id);
      }
      for (const id of touched) paintEdge(id, liveEdge(id));
      if (k < 1) moveRaf = requestAnimationFrame(tick);
    };
    moveRaf = requestAnimationFrame(tick);
  }

  let lastPatch = {};
  const liveEdge = (id) => ({ ...def.edges[id], ...(lastPatch[id] || {}) });

  let current = -1;
  /**
   * Show step `index` (0-based; -1 shows an empty stage).
   * instant: no animation at all. camera: 'instant' keeps the camera from gliding.
   */
  function apply(index, { instant = false, camera = '' } = {}) {
    const step = lesson.steps[index] || {};
    const state = foldSteps(lesson, index);
    lastPatch = state.patch;
    const calm = instant || still;
    const soft = reduced();
    svg.classList.toggle('instant', calm);

    // where everything is headed
    const nodes = {};
    for (const id of ids.nodes) {
      const n = { ...def.nodes[id], ...(state.patch[id] || {}) };
      nodes[id] = n;
      tpos[id] = proj(n.at[0], n.at[1]);
    }
    const moves = ids.nodes.filter((id) => state.vis.has(id) && shown.has(id) && (Math.abs(tpos[id][0] - gpos[id][0]) > 0.5 || Math.abs(tpos[id][1] - gpos[id][1]) > 0.5));
    for (const id of ids.nodes) {
      if (calm || soft || !moves.includes(id)) { gpos[id] = tpos[id]; placeNode(id); }
      if (shown.has(id)) el.nodes[id].classList.remove('enter');
    }
    sortNodes();

    // when each new thing arrives
    const order = [...(step.show || []), ...ids.nodes];
    const entering = [...new Set(order)].filter((id) => id in def.nodes && state.vis.has(id) && !shown.has(id));
    const moving = moves.length && !calm && !soft;
    const base = moving ? 0.45 : 0.12;
    const nodeDelay = {};
    entering.forEach((id, i) => { nodeDelay[id] = base + Math.min(i, 8) * 0.08; });
    const ready = (ref) => (Array.isArray(ref) ? base : nodeDelay[ref] ?? (moving && moves.includes(ref) ? 0.5 : 0));
    let settle = entering.length ? Math.max(...entering.map((id) => nodeDelay[id])) + 0.45 : moving ? 0.6 : 0.15;

    // zones
    for (const id of ids.zones) {
      paintZone(id, { ...def.zones[id], ...(state.patch[id] || {}) });
      const on = state.vis.has(id);
      const g = el.zones[id];
      if (on && !shown.has(id) && !calm) restart(g, 'enter'); else if (!on) g.classList.remove('enter');
      g.classList.toggle('off', !on);
    }

    // nodes
    for (const id of ids.nodes) {
      const g = el.nodes[id];
      const on = state.vis.has(id);
      paintNode(id, nodes[id], !calm && on && shown.has(id));
      if (on && !shown.has(id) && !calm) {
        g.style.setProperty('--d', `${nodeDelay[id].toFixed(2)}s`);
        g.classList.remove('off');
        restart(g, 'enter');
      } else if (!on) g.classList.remove('enter');
      g.classList.toggle('off', !on);
      g.classList.toggle('focus', (step.focus || []).includes(id));
    }

    // edges draw in once both of their ends have arrived
    for (const id of ids.edges) {
      const e = { ...def.edges[id], ...(state.patch[id] || {}) };
      paintEdge(id, e);
      const g = el.edges[id];
      const on = [e.from, e.to].every((r) => Array.isArray(r) || state.vis.has(r)) && !state.edgeOff.has(id);
      if (on && !shown.has('e:' + id) && !calm) {
        const d = Math.max(ready(e.from), ready(e.to)) + 0.3;
        settle = Math.max(settle, d + 0.45);
        g.style.setProperty('--d', `${d.toFixed(2)}s`);
        g.classList.remove('off');
        restart(g, 'enter');
      } else if (!on) g.classList.remove('enter');
      g.classList.toggle('off', !on);
    }

    // tags pop up beside their node after it has landed
    buildTags(step, state, nodes, (t) => {
      const d = (t.on ? ready(t.on) : base) + 0.4;
      settle = Math.max(settle, d);
      return calm ? 0 : d;
    });

    // the camera frames what this step shows, using where nodes are headed
    const live = { ...lesson, scene: { ...def, nodes } };
    animate({ camTo: frameOf(live, state.vis, step), moves: calm || soft ? [] : moves, camInstant: calm || soft || camera === 'instant' || current < 0 });

    buildFlows(step);
    if (still) {
      for (const p of packets) { p.g.style.opacity = 1; place(p, p.frac); }
    } else {
      t0 = performance.now() + (calm ? 0 : settle * 1000);
      if (pausedAt != null) pausedAt = performance.now();
      if (!raf) raf = requestAnimationFrame(frame);
    }

    shown.clear();
    for (const id of state.vis) shown.add(id);
    for (const id of ids.edges) if (!el.edges[id].classList.contains('off')) shown.add('e:' + id);
    current = index;
    if (calm && !still) requestAnimationFrame(() => svg.classList.remove('instant'));
    return state;
  }

  return {
    apply,
    /** Play the current step's arrival again: back to the step before, then forward. */
    replay() {
      const i = current;
      apply(i - 1, { instant: true });
      apply(i, { camera: 'instant' });
    },
    setPaused(p) {
      if (p && pausedAt == null) pausedAt = performance.now();
      else if (!p && pausedAt != null) { t0 += performance.now() - pausedAt; pausedAt = null; }
    },
    get paused() { return pausedAt != null; },
    get step() { return current; },
    destroy() { cancelAnimationFrame(raf); cancelAnimationFrame(moveRaf); raf = 0; host.innerHTML = ''; },
  };
}

export { roundPoly };
