// Validates every lesson file against the outline and the scene rules.
//   npm run check                 all lessons
//   npm run check -- vpc-subnet   only these
import { readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const { CHAPTERS, LESSON_META, ORDER } = await import(pathToFileURL(resolve(root, 'src/content/curriculum.js')));

const { drawNode, proj, textW, frameOf, tagCentre, SIZES } = await import(pathToFileURL(resolve(root, 'src/engine/iso.js')));
const { ICON_NAMES } = await import(pathToFileURL(resolve(root, 'src/engine/icons.js')));
const ICONS = new Set(ICON_NAMES);

const COLORS = new Set(['sand', 'green', 'blue', 'purple', 'yellow', 'orange', 'red', 'teal', 'gray', 'olive', 'slate', 'navy', 'aws', 'azure', 'gcp', 'ncp']);
const NODE_KINDS = new Set(['box', 'cyl', 'client', 'users', 'tile']);
const STEP_KINDS = new Set(['problem', 'solution', 'concept', 'case', 'compare', 'recap']);
const FLOW_KINDS = new Set(['req', 'res', 'data', 'ctrl', 'sync', 'build', 'bad']);
const TONES = new Set(['', 'ok', 'warn', 'bad', 'info', 'accent', 'mute', 'aws', 'azure', 'gcp', 'ncp']);
const EDGE_TONES = new Set(['', 'mute', 'bad', 'ok', 'accent']);
const STATES = new Set([undefined, null, '', 'down', 'hot', 'dim', 'ok']);
const POS = new Set([undefined, 'top', 'bottom', 'left', 'right']);
const CALLOUTS = new Set(['key', 'warn', 'tip', 'cloud']);
const LANGS = new Set(['hcl', 'yaml', 'dockerfile', 'sh', 'json', 'text']);

const tw = (s) => textW(s ?? '', 1);
const inPoly = (poly, px, py) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const hit = (a, b) => Math.abs(a[0] - b[0]) * 2 < a[2] + b[2] && Math.abs(a[1] - b[1]) * 2 < a[3] + b[3];
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));

let errors = 0;
let warnings = 0;
const found = new Set();

for (const ch of CHAPTERS) {
  let files = [];
  try { files = readdirSync(resolve(root, 'src/content', ch.id)).filter((f) => f.endsWith('.js')); } catch { /* chapter not started */ }
  for (const file of files) {
    const id = file.replace(/\.js$/, '');
    if (only.length && !only.includes(id)) { found.add(id); continue; }
    const E = [];
    const W = [];
    let L;
    try {
      L = (await import(pathToFileURL(resolve(root, 'src/content', ch.id, file)))).default;
    } catch (e) {
      E.push(`does not load: ${e.message}`);
    }
    if (L) {
      found.add(L.id);
      const meta = LESSON_META[L.id];
      if (L.id !== id) E.push(`file name "${file}" does not match id "${L.id}"`);
      if (!meta) E.push(`id "${L.id}" is not in curriculum.js`);
      else if (meta.chapter.id !== ch.id) E.push(`belongs in ${meta.chapter.id}/, found in ${ch.id}/`);
      checkLesson(L, E, W);
    }
    errors += E.length;
    warnings += W.length;
    if (E.length || W.length) {
      console.log(`\n${E.length ? '✗' : '!'} ${ch.id}/${file}`);
      E.forEach((m) => console.log(`    error  ${m}`));
      W.forEach((m) => console.log(`    warn   ${m}`));
    } else console.log(`✓ ${ch.id}/${file}  (${L.steps.length} steps, ${L.quiz.length} quiz)`);
  }
}

if (!only.length) {
  const missing = ORDER.filter((id) => !found.has(id));
  if (missing.length) console.log(`\n… not written yet (${missing.length}): ${missing.join(', ')}`);
}
console.log(`\n${errors} error(s), ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);

function checkLesson(L, E, W) {
  const sc = L.scene || {};
  const nodes = sc.nodes || {};
  const zones = sc.zones || {};
  const edges = sc.edges || {};
  const all = new Set([...Object.keys(nodes), ...Object.keys(zones), ...Object.keys(edges)]);
  if (all.size !== Object.keys(nodes).length + Object.keys(zones).length + Object.keys(edges).length) E.push('a node, zone and edge share the same id');

  if (!Array.isArray(L.learn) || L.learn.length < 4 || L.learn.length > 6) E.push('learn: needs 4–6 items');
  for (const [k] of L.legend || []) if (!FLOW_KINDS.has(k)) E.push(`legend: unknown packet kind "${k}"`);
  const metricIds = new Set((L.metrics || []).map((m) => m.id));
  if ((L.metrics || []).length > 5) E.push('metrics: at most 5 tiles');
  for (const m of L.metrics || []) {
    if (m.icon && !ICONS.has(m.icon)) E.push(`metrics.${m.id}: unknown icon "${m.icon}"`);
    if (tw(m.label) > 9) W.push(`metrics.${m.id}: label "${m.label}" is long (keep it under ~9 Hangul)`);
  }

  for (const [id, n] of Object.entries(nodes)) {
    const kind = n.kind || 'box';
    if (!NODE_KINDS.has(kind)) E.push(`node ${id}: unknown kind "${kind}"`);
    if (!Array.isArray(n.at) || n.at.length !== 2 || n.at.some((v) => typeof v !== 'number')) E.push(`node ${id}: at must be [x, y]`);
    if (n.icon && !ICONS.has(n.icon)) E.push(`node ${id}: unknown icon "${n.icon}"`);
    if (n.color && !COLORS.has(n.color)) E.push(`node ${id}: unknown color "${n.color}"`);
    if (n.size && !['s', 'm', 'l'].includes(n.size)) E.push(`node ${id}: size must be s, m or l`);
    checkLabel(`node ${id}`, n, kind, n.size || 'm', E, W);
  }
  for (const [id, z] of Object.entries(zones)) {
    if (!Array.isArray(z.at) || !Array.isArray(z.size)) E.push(`zone ${id}: needs at [x, y] and size [w, h]`);
    else if (z.size[0] < 2 || z.size[1] < 2) W.push(`zone ${id}: smaller than 2×2, its label will collide with what stands in it`);
    if (z.color && !COLORS.has(z.color)) E.push(`zone ${id}: unknown color "${z.color}"`);
  }
  const isRef = (r) => (Array.isArray(r) ? r.length === 2 : r in nodes);
  for (const [id, e] of Object.entries(edges)) {
    if (!isRef(e.from) || !isRef(e.to)) E.push(`edge ${id}: from/to must be node ids or [x, y]`);
    if (e.from === e.to) E.push(`edge ${id}: from and to are the same`);
    if (e.tone && !EDGE_TONES.has(e.tone)) E.push(`edge ${id}: unknown tone "${e.tone}"`);
    if (e.style && !['dashed', 'solid'].includes(e.style)) E.push(`edge ${id}: style must be "dashed" or omitted`);
  }
  for (const [name, c] of Object.entries(L.codes || {})) checkCode(`codes.${name}`, c, E, W);

  if (!Array.isArray(L.steps) || L.steps.length < 6 || L.steps.length > 12) E.push(`steps: needs 6–12, has ${L.steps?.length ?? 0}`);
  const vis = new Set();
  const edgeOff = new Set(Object.entries(edges).filter(([, e]) => e.off).map(([id]) => id));
  const patch = {};
  (L.steps || []).forEach((st, i) => {
    const at = `step ${i + 1}`;
    if (!st.key) E.push(`${at}: key (timeline label) is missing`);
    else if (tw(st.key) > 8.5) W.push(`${at}: key "${st.key}" is long for the timeline (≤ 8 Hangul)`);
    if (!st.title) E.push(`${at}: title is missing`);
    else if (tw(st.title) > 30) W.push(`${at}: title is long (${Math.round(tw(st.title))} wide; aim ≤ 26)`);
    if (!STEP_KINDS.has(st.kind)) E.push(`${at}: kind "${st.kind}" is not one of ${[...STEP_KINDS].join(', ')}`);
    if (!Array.isArray(st.body) || !st.body.length) E.push(`${at}: body must be an array of 1–3 paragraphs`);
    else {
      const plain = st.body.map((p) => String(p).replace(/<[^>]+>/g, ''));
      const total = plain.join('').length + (st.callout ? String(st.callout.text).replace(/<[^>]+>/g, '').length : 0);
      if (st.body.length > 3) W.push(`${at}: ${st.body.length} paragraphs (keep to 2–3)`);
      if (total > 520) W.push(`${at}: ${total} characters of text; the step card fits about 450`);
      if (total < 90) W.push(`${at}: only ${total} characters of text`);
    }
    if (st.callout && !CALLOUTS.has(st.callout.type)) E.push(`${at}: callout.type "${st.callout.type}" is not key, warn, tip or cloud`);
    for (const c of st.changes || []) if (!Array.isArray(c) || !['+', '-', '−', '~'].includes(c[0])) E.push(`${at}: changes entries are ['+' | '-' | '~', text]`);
    if ((st.changes || []).length > 4) W.push(`${at}: more than 4 "changes" rows`);

    for (const id of st.show || []) { if (!all.has(id)) E.push(`${at}: show "${id}" does not exist`); if (id in edges) edgeOff.delete(id); else vis.add(id); }
    for (const id of st.hide || []) { if (!all.has(id)) E.push(`${at}: hide "${id}" does not exist`); if (id in edges) edgeOff.add(id); else vis.delete(id); }
    for (const [id, p] of Object.entries(st.set || {})) {
      if (!all.has(id)) { E.push(`${at}: set "${id}" does not exist`); continue; }
      patch[id] = { ...(patch[id] || {}), ...p };
      if (id in nodes) {
        if (!STATES.has(p.state)) E.push(`${at}: set ${id}.state "${p.state}" is not down, hot, dim, ok or null`);
        if (p.icon && !ICONS.has(p.icon)) E.push(`${at}: set ${id}.icon "${p.icon}" unknown`);
        if (p.color && !COLORS.has(p.color)) E.push(`${at}: set ${id}.color "${p.color}" unknown`);
        if (p.tone && !TONES.has(p.tone)) E.push(`${at}: set ${id}.tone "${p.tone}" unknown`);
        if (p.badge && tw(p.badge) > 9) W.push(`${at}: set ${id}.badge "${p.badge}" is long`);
        if ('at' in p || 'kind' in p || 'size' in p) E.push(`${at}: set ${id}: at / kind / size cannot change between steps`);
        checkLabel(`${at}: set ${id}`, { ...nodes[id], ...patch[id] }, nodes[id].kind || 'box', nodes[id].size || 'm', E, W);
      }
    }
    for (const id of st.focus || []) { if (!(id in nodes)) E.push(`${at}: focus "${id}" is not a node`); else if (!vis.has(id)) E.push(`${at}: focus "${id}" is hidden at this step`); }
    for (const k of Object.keys(st.metrics || {})) if (!metricIds.has(k)) E.push(`${at}: metric "${k}" is not declared in lesson.metrics`);

    (st.tags || []).forEach((t, j) => {
      if (!t.text) E.push(`${at}: tag ${j + 1} has no text`);
      else if (tw(t.text) > 13) W.push(`${at}: tag "${t.text}" is long (≤ 12 Hangul; Latin counts 0.6)`);
      if (t.on) { if (!(t.on in nodes)) E.push(`${at}: tag on "${t.on}" is not a node`); else if (!vis.has(t.on)) E.push(`${at}: tag sits on "${t.on}", which is hidden here`); }
      else if (!Array.isArray(t.at)) E.push(`${at}: tag needs on: 'node' or at: [x, y]`);
      if (!POS.has(t.pos)) E.push(`${at}: tag pos "${t.pos}"`);
      if (t.tone && !TONES.has(t.tone)) E.push(`${at}: tag tone "${t.tone}"`);
      if (t.icon && !ICONS.has(t.icon)) E.push(`${at}: tag icon "${t.icon}" unknown`);
    });
    if ((st.tags || []).length > 5) W.push(`${at}: ${st.tags.length} tags; more than 4 gets crowded`);

    (st.flows || []).forEach((fl, j) => {
      if (!Array.isArray(fl.path) || fl.path.length < 2) { E.push(`${at}: flow ${j + 1} needs a path of 2+ points`); return; }
      if (fl.kind && !FLOW_KINDS.has(fl.kind)) E.push(`${at}: flow kind "${fl.kind}"`);
      for (const r of fl.path) {
        if (Array.isArray(r)) continue;
        if (!(r in nodes)) E.push(`${at}: flow passes "${r}", which is not a node`);
        else if (!vis.has(r)) E.push(`${at}: flow passes "${r}", which is hidden at this step`);
      }
      for (let k = 1; k < fl.path.length; k++) {
        const a = fl.path[k - 1], b = fl.path[k];
        if (Array.isArray(a) || Array.isArray(b)) continue;
        const has = Object.entries(edges).some(([eid, e]) => !edgeOff.has(eid) && ((e.from === a && e.to === b) || (e.from === b && e.to === a)));
        if (!has) W.push(`${at}: flow ${a} → ${b} has no visible edge under it`);
      }
    });

    if (st.code) checkCode(`${at}: code`, st.code.ref ? { ...(L.codes || {})[st.code.ref], ...st.code } : st.code, E, W, st.code.ref && !(L.codes || {})[st.code.ref] ? `ref "${st.code.ref}" not in lesson.codes` : '');
    if (st.panel) {
      if (!Array.isArray(st.panel.rows) || !st.panel.rows.length) E.push(`${at}: panel.rows missing`);
      else {
        if (st.panel.rows.length > 6) W.push(`${at}: panel has ${st.panel.rows.length} rows (≤ 6)`);
        for (const r of st.panel.rows) {
          if (!Array.isArray(r)) E.push(`${at}: panel rows are [left, right, tone]`);
          else { if (r[2] && !TONES.has(r[2])) E.push(`${at}: panel tone "${r[2]}"`); if (tw(r[0]) + tw(r[1] || '') > 30) W.push(`${at}: panel row "${r[0]} / ${r[1] || ''}" is wide`); }
        }
      }
      if (st.panel.icon && !ICONS.has(st.panel.icon)) E.push(`${at}: panel icon unknown`);
    }

    // nothing may stand on, or hide, something else
    const shown = [...vis].filter((id) => id in nodes && Array.isArray(nodes[id].at));
    if (i === 0 && !shown.length) E.push('step 1: show at least one node');
    const G = shown.map((id) => {
      const n = { ...nodes[id], ...(patch[id] || {}) };
      const g = drawNode(n);
      const [x, y] = proj(n.at[0], n.at[1], n.z || 0);
      const foot = (n.kind || 'box') === 'box' ? SIZES[n.size || 'm'].s : { cyl: 0.5, client: 0.74, users: 0.9, tile: SIZES[n.size || 'm'].s * 0.92 }[n.kind];
      return { id, n, g, x, y, foot, depth: n.at[0] + n.at[1] + (n.z || 0) * 0.001 };
    });
    for (const a of G) for (const b of G) {
      if (a === b) continue;
      if (a.id < b.id && (a.n.z || 0) === (b.n.z || 0) && Math.abs(a.n.at[0] - b.n.at[0]) < a.foot + b.foot + 0.08 && Math.abs(a.n.at[1] - b.n.at[1]) < a.foot + b.foot + 0.08)
        E.push(`${at}: "${a.id}" and "${b.id}" stand on the same ground (footprints overlap)`);
      if (b.depth <= a.depth) continue; // b is drawn in front of a
      const sil = b.g.sil.map(([px, py]) => [px + b.x, py + b.y]);
      for (const [cx, cy, w, h, what] of a.g.marks) {
        const pts = [[0, 0], [-0.42, -0.3], [0.42, -0.3], [-0.42, 0.3], [0.42, 0.3]].map(([kx, ky]) => [a.x + cx + kx * w, a.y + cy + ky * h]);
        if (pts.some(([px, py]) => inPoly(sil, px, py)))
          E.push(`${at}: "${b.id}" stands in front of "${a.id}" and hides its ${what}. Put them ≥ 2.4 apart along x or y, or side by side on a diagonal (x + d, y − d)`);
      }
    }
    const T = (st.tags || []).filter((t) => t.text && (t.on ? vis.has(t.on) && t.on in nodes : Array.isArray(t.at))).map((t) => {
      const owner = t.on ? G.find((g) => g.id === t.on) : null;
      const [cx, cy] = tagCentre(t, owner?.n, owner?.g);
      return { t, r: [cx, cy, textW(t.text, 14) + (t.icon ? 19 : 0) + 18, 25] };
    });
    T.forEach((a, k) => {
      for (const b of T.slice(k + 1)) if (hit(a.r, b.r)) W.push(`${at}: tags "${a.t.text}" and "${b.t.text}" overlap; change pos or add dx / dy`);
      for (const g of G) {
        for (const [cx, cy, w, h, what] of g.g.marks) if (hit(a.r, [g.x + cx, g.y + cy, w, h])) W.push(`${at}: tag "${a.t.text}" covers the ${what} of "${g.id}"; change pos or add dx / dy`);
        if (g.id !== a.t.on && inPoly(g.g.sil.map(([px, py]) => [px + g.x, py + g.y]), a.r[0], a.r[1])) W.push(`${at}: tag "${a.t.text}" lies on top of "${g.id}"`);
      }
    });
    // the stage is about 800 × 560: a bigger frame is scaled down, and its labels with it
    if (Object.values(nodes).every((n) => Array.isArray(n.at)) && Object.values(zones).every((z) => Array.isArray(z.at) && Array.isArray(z.size))) {
      const [, , fw, fh] = frameOf(L, vis, st);
      const limW = st.code ? 640 : 960, limH = 680;
      if (fw > limW) W.push(`${at}: this step's frame is ${Math.round(fw)} px wide (limit ${limW}${st.code ? ' with a code pane' : ''}); hide what the step does not need or pull things closer`);
      if (fh > limH) W.push(`${at}: this step's frame is ${Math.round(fh)} px tall (limit ${limH}); hide what the step does not need or pull things closer`);
    }
    // a zone's name is written on the ground along its front edge: keep that strip clear
    for (const zid of [...vis].filter((id) => id in zones)) {
      const z = { ...zones[zid], ...(patch[zid] || {}) };
      if (!z.label || !Array.isArray(z.at) || !Array.isArray(z.size)) continue;
      const len = textW(z.label, 15.5) / 67;
      if (len + 0.5 > z.size[0]) W.push(`${at}: zone "${zid}" label "${z.label}" is longer than its front edge (${(len + 0.5).toFixed(1)} > ${z.size[0]})`);
      const back = z.labelPos === 'back';
      const y0 = back ? z.at[1] : z.at[1] + z.size[1] - 0.5, y1 = y0 + 0.5, x0 = z.at[0] + 0.3, x1 = x0 + len;
      for (const g of G) {
        const [nx, ny] = g.n.at;
        if (nx + g.foot > x0 && nx - g.foot < x1 && ny + g.foot > y0 && ny - g.foot < y1) W.push(`${at}: "${g.id}" stands on the label of zone "${zid}"; keep the ${back ? 'back' : 'front'} 0.5 strip (y ${y0.toFixed(1)}–${y1.toFixed(1)}) clear`);
      }
    }
  });

  if (!Array.isArray(L.quiz) || L.quiz.length < 3) E.push('quiz: needs at least 3 questions');
  (L.quiz || []).forEach((q, i) => {
    if (!q.q || !Array.isArray(q.options) || q.options.length !== 4) E.push(`quiz ${i + 1}: needs q and exactly 4 options`);
    if (!(q.answer >= 0 && q.answer < 4)) E.push(`quiz ${i + 1}: answer must be 0–3`);
    if (!q.why) E.push(`quiz ${i + 1}: why (the explanation) is missing`);
  });
}

function checkLabel(where, n, kind, size, E, W) {
  if (n.label == null) return;
  const lines = String(n.label).split('\n');
  if (kind === 'box') {
    if (lines.length > 2) E.push(`${where}: label has ${lines.length} lines (max 2)`);
    const max = { s: 5.6, m: 6.3, l: 7.2 }[size];
    for (const l of lines) if (tw(l) > max) W.push(`${where}: label line "${l}" is wider than a size-${size} box (${tw(l).toFixed(1)} > ${max}; Hangul = 1, Latin = 0.6)`);
    if (n.sub && tw(n.sub) > max + 2) W.push(`${where}: sub "${n.sub}" is too wide`);
    if (size === 's' && lines.length > 1 && n.sub) W.push(`${where}: a small box cannot hold 2 lines plus a sub`);
  } else if (tw(lines.join(' ')) > 11) W.push(`${where}: label "${lines.join(' ')}" is long for a pill`);
}

function checkCode(where, c, E, W, refErr) {
  if (refErr) { E.push(`${where}: ${refErr}`); return; }
  if (!c || typeof c.text !== 'string') { E.push(`${where}: text is missing`); return; }
  if (c.lang && !LANGS.has(c.lang)) E.push(`${where}: lang "${c.lang}" is not one of ${[...LANGS].join(', ')}`);
  const rows = c.text.replace(/\n$/, '').split('\n');
  if (rows.length > 24) W.push(`${where}: ${rows.length} lines (the pane shows about 22)`);
  const wide = rows.filter((r) => tw(r) > 46);
  if (wide.length) W.push(`${where}: ${wide.length} line(s) wider than 46 columns`);
  for (const n of c.hl || []) if (n < 1 || n > rows.length) E.push(`${where}: hl line ${n} is outside 1–${rows.length}`);
}
