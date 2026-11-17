// Isometric projection and the shapes the scenes are built from.
// Grid coordinates (x, y) lie on the ground plane; z is height in screen pixels.
import { iconAt } from './icons.js';

export const AX = 58; // screen px per grid unit along the horizontal
export const AY = 33.5; // screen px per grid unit along the vertical

export const proj = (x, y, z = 0) => [(x - y) * AX, (x + y) * AY - z];

const f = (n) => (Math.round(n * 10) / 10).toString();
export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** A closed path through `pts` with every corner rounded by radius r. */
export function roundPoly(pts, r) {
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const l1 = Math.hypot(p0[0] - p1[0], p0[1] - p1[1]);
    const l2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const r1 = Math.min(r, l1 / 2);
    const r2 = Math.min(r, l2 / 2);
    const a = [p1[0] + ((p0[0] - p1[0]) / l1) * r1, p1[1] + ((p0[1] - p1[1]) / l1) * r1];
    const b = [p1[0] + ((p2[0] - p1[0]) / l2) * r2, p1[1] + ((p2[1] - p1[1]) / l2) * r2];
    d += `${i ? 'L' : 'M'}${f(a[0])} ${f(a[1])}Q${f(p1[0])} ${f(p1[1])} ${f(b[0])} ${f(b[1])}`;
  }
  return d + 'Z';
}

/** Width of a string in the course's mono fonts: Hangul and CJK are 1em wide, Latin 0.6em. */
export function textW(str, fs) {
  let w = 0;
  for (const ch of String(str)) w += ch.codePointAt(0) > 0x2e80 ? fs : fs * 0.6;
  return w;
}

/** A label pill centred on (cx, cy). Returns { svg, w, h }. */
export function pill(text, { cx = 0, cy = 0, fs = 14, tone = '', icon = '', shadow = true, cls = '' } = {}) {
  const tw = textW(text, fs);
  const ic = icon ? fs + 5 : 0;
  const h = fs + 11;
  const w = tw + ic + 18;
  const x = cx - w / 2;
  const y = cy - h / 2;
  let svg = `<g class="pill ${tone ? 't-' + tone : ''} ${cls}">`;
  if (shadow) svg += `<rect class="pill-sh" x="${f(x)}" y="${f(y + 2.2)}" width="${f(w)}" height="${f(h)}" rx="${f(h / 2)}"/>`;
  svg += `<rect class="pill-bg" x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(h / 2)}"/>`;
  if (icon) svg += iconAt(icon, x + 9 + fs / 2, cy, fs + 1);
  svg += `<text class="pill-tx" x="${f(x + 9 + ic)}" y="${f(cy + fs * 0.36)}" font-size="${fs}">${esc(text)}</text></g>`;
  return { svg, w, h };
}

export const SIZES = {
  s: { s: 0.47, h: 40, fs: 13, ico: 18 },
  m: { s: 0.68, h: 60, fs: 17, ico: 25 },
  l: { s: 0.86, h: 72, fs: 19, ico: 28 },
};

const hex = (W, H, h) => [[0, -H - h], [W, -h], [W, 0], [0, H], [-W, 0], [-W, -h]];

function slab(s, h, r = 9) {
  const W = 2 * s * AX;
  const H = 2 * s * AY;
  const top = [[0, -H - h], [W, -h], [0, H - h], [-W, -h]];
  return {
    W, H,
    svg:
      `<path class="n-shadow" d="${roundPoly([[0, -H], [W, 0], [0, H], [-W, 0]], r)}" transform="translate(7 9)"/>` +
      `<path class="f-r" d="${roundPoly(hex(W, H, h), r)}"/>` +
      `<path class="f-l" d="${roundPoly([[-W, -h], [0, H - h], [0, H], [-W, 0]], Math.min(r, h / 2))}"/>` +
      `<path class="f-t" d="${roundPoly(top, r)}"/>` +
      `<path class="n-line" d="${roundPoly(hex(W, H, h), r)}"/>`,
  };
}

/** Lines of text centred on x = 0, starting at baseline y. */
function lines(list, y, fs, cls) {
  return list.map((t, i) => `<text class="${cls}" x="0" y="${f(y + i * fs * 1.22)}" font-size="${fs}" text-anchor="middle">${esc(t)}</text>`).join('');
}

const PEG = ['blue', 'orange', 'green', 'purple', 'yellow', 'red', 'teal', 'blue'];

/**
 * Markup for one node, drawn around its ground centre (0, 0).
 * Returns { svg, sil (silhouette polygon), top (y of the highest point), bottom }.
 */
export function drawNode(n) {
  const kind = n.kind || 'box';
  const size = SIZES[n.size || 'm'];
  const label = n.label ? String(n.label).split('\n') : [];
  let svg = '';
  let sil;
  let top;
  let bottom;
  let corner; // where a status mark (× or ✓) sits
  const marks = []; // [cx, cy, w, h, what]: where this node's own text sits

  if (kind === 'box') {
    const { s, h, fs, ico } = size;
    const W = 2 * s * AX;
    const H = 2 * s * AY;
    svg += slab(s, h, 11).svg;
    const subFs = Math.max(10.5, fs - 4.5);
    const block = (n.icon ? ico + 3 : 0) + label.length * fs * 1.22 + (n.sub ? subFs * 1.3 : 0);
    let y = -h / 2 - 3 - block / 2;
    if (n.icon) {
      svg += iconAt(n.icon, 0, y + ico / 2, ico);
      y += ico + 3;
    }
    svg += lines(label, y + fs * 0.86, fs, 'n-label');
    y += label.length * fs * 1.22;
    if (n.sub) svg += lines([n.sub], y + subFs * 0.9, subFs, 'n-sub');
    const lw = Math.max(n.icon ? ico : 0, ...label.map((t) => textW(t, fs)), n.sub ? textW(n.sub, subFs) : 0);
    marks.push([0, -h / 2 - 3, lw, block, 'label']);
    sil = hex(W, H, h);
    top = -H - h;
    bottom = H;
    corner = [W - 8, -h - 8];
  } else if (kind === 'cyl') {
    const { s, h, ico } = size;
    const rx = 2 * s * AX * 0.74;
    const ry = rx * 0.5;
    const hh = h + 6;
    svg +=
      `<ellipse class="n-shadow" cx="7" cy="9" rx="${f(rx)}" ry="${f(ry)}"/>` +
      `<path class="f-l" d="M${f(-rx)} ${f(-hh)}V0A${f(rx)} ${f(ry)} 0 0 0 ${f(rx)} 0V${f(-hh)}Z"/>` +
      `<path class="f-r" d="M0 ${f(-hh)}V${f(ry)}A${f(rx)} ${f(ry)} 0 0 0 ${f(rx)} 0V${f(-hh)}Z" opacity=".55"/>` +
      `<ellipse class="f-t" cx="0" cy="${f(-hh)}" rx="${f(rx)}" ry="${f(ry)}"/>` +
      `<path class="n-line" d="M${f(-rx)} ${f(-hh)}V0A${f(rx)} ${f(ry)} 0 0 0 ${f(rx)} 0V${f(-hh)}A${f(rx)} ${f(ry)} 0 0 0 ${f(-rx)} ${f(-hh)}A${f(rx)} ${f(ry)} 0 0 0 ${f(rx)} ${f(-hh)}"/>`;
    if (n.icon) svg += iconAt(n.icon, 0, -hh / 2 + ry * 0.75, ico);
    sil = [[-rx, -hh], [-rx * 0.7, -hh - ry * 0.72], [0, -hh - ry], [rx * 0.7, -hh - ry * 0.72], [rx, -hh], [rx, 0], [rx * 0.7, ry * 0.72], [0, ry], [-rx * 0.7, ry * 0.72], [-rx, 0]];
    top = -hh - ry;
    bottom = ry;
    corner = [rx - 6, -hh - 6];
  } else if (kind === 'client') {
    const sl = slab(0.74, 10);
    svg += sl.svg;
    const w = 2 * 0.4 * AX;
    const hh = 2 * 0.4 * AY;
    const z = 13;
    const base = [[0, -hh - z], [w, -z], [0, hh - z], [-w, -z]];
    svg += `<path class="lp-base" d="${roundPoly(base.map(([x, y]) => [x, y + 4]), 4)}"/><path class="lp-top" d="${roundPoly(base, 4)}"/>`;
    const L = [-w + 2, -z - 2];
    const T = [-2, -hh - z - 1];
    const scr = [L, T, [T[0] - 5, T[1] - 44], [L[0] - 5, L[1] - 44]];
    const cx = (scr[0][0] + scr[2][0]) / 2;
    const cy = (scr[0][1] + scr[2][1]) / 2;
    const inset = (k) => scr.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]);
    const band = inset(0.84).map(([x, y], i) => (i < 2 ? [x, y - 16] : [x, y + 12]));
    svg += `<path class="lp-frame" d="${roundPoly(scr, 4)}"/><path class="lp-screen" d="${roundPoly(inset(0.84), 2)}"/><path class="lp-band" d="${roundPoly(band, 1)}"/>`;
    sil = hex(sl.W, sl.H, 52);
    top = -hh - z - 46;
    bottom = sl.H;
    corner = [sl.W - 14, -30];
  } else if (kind === 'users') {
    const sl = slab(0.9, 10);
    svg += sl.svg;
    const spots = [[-0.5, -0.45], [0.05, -0.5], [0.5, -0.35], [-0.42, 0.05], [0.1, 0.02], [0.55, 0.15], [-0.3, 0.52], [0.22, 0.5]];
    spots
      .map((p, i) => ({ p, i }))
      .sort((a, b) => a.p[0] + a.p[1] - (b.p[0] + b.p[1]))
      .forEach(({ p, i }) => {
        const [x, y] = proj(p[0], p[1], 10);
        svg += `<g class="peg c-${PEG[i]}"><rect x="${f(x - 6.5)}" y="${f(y - 22)}" width="13" height="22" rx="6.5"/><circle cx="${f(x)}" cy="${f(y - 26)}" r="5.6"/></g>`;
      });
    sil = hex(sl.W, sl.H, 40);
    top = -sl.H - 44;
    bottom = sl.H;
    corner = [sl.W - 14, -30];
  } else {
    // tile: a thin flat plate with an icon standing on it
    const s = size.s * 0.92;
    const sl = slab(s, 12, 7);
    svg += sl.svg;
    if (n.icon) svg += iconAt(n.icon, 0, -14, size.ico);
    sil = hex(sl.W, sl.H, 14);
    top = -sl.H - 14;
    bottom = sl.H;
    corner = [sl.W - 6, -22];
  }

  // non-box nodes carry their name on a pill under the shape
  if (kind !== 'box' && label.length) {
    const p = pill(label.join(' '), { cy: bottom + 19, fs: 14, icon: kind === 'tile' ? '' : n.icon && kind !== 'cyl' ? n.icon : '' });
    svg += p.svg;
    marks.push([0, bottom + 19, p.w, p.h, 'name']);
    if (n.sub) svg += `<text class="n-under" x="0" y="${f(bottom + 48)}" font-size="12" text-anchor="middle">${esc(n.sub)}</text>`;
    bottom += n.sub ? 56 : 34;
  }

  // a badge rides above the node: a short value such as "97%" or "v2"
  if (n.badge) {
    const p = pill(String(n.badge), { cy: top - 18, fs: 13.5, tone: n.tone || '' });
    svg += p.svg;
    marks.push([0, top - 18, p.w, p.h, 'badge']);
    top -= 34;
  }
  if (n.state === 'down') {
    const [bx, by] = corner;
    svg += `<g class="n-x"><circle cx="${f(bx)}" cy="${f(by)}" r="10"/><path d="M${f(bx - 4)} ${f(by - 4)}l8 8m0 -8l-8 8"/></g>`;
  } else if (n.state === 'ok') {
    const [bx, by] = corner;
    svg += `<g class="n-ok"><circle cx="${f(bx)}" cy="${f(by)}" r="10"/><path d="M${f(bx - 4.5)} ${f(by)}l3.2 3.2l6 -6.4"/></g>`;
  }
  return { svg, sil, top, bottom, marks, right: Math.max(...sil.map((p) => p[0])) };
}

/** Distance from the origin to the edge of polygon `poly` along unit direction (dx, dy). */
export function rayToPoly(poly, dx, dy) {
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    const ex = x2 - x1;
    const ey = y2 - y1;
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = (x1 * ey - y1 * ex) / den;
    const u = (x1 * dy - y1 * dx) / den;
    if (t > 0 && u >= 0 && u <= 1 && t < best) best = t;
  }
  return Number.isFinite(best) ? best : 0;
}

/** The ground footprint of a zone as a rounded path, plus its flat-on-the-ground label. */
export function drawZone(z) {
  const [x0, y0] = z.at;
  const [w, h] = z.size;
  const pts = [proj(x0, y0), proj(x0 + w, y0), proj(x0 + w, y0 + h), proj(x0, y0 + h)];
  let svg = `<path class="z-fill" d="${roundPoly(pts, 14)}"/><path class="z-line ${z.style === 'solid' ? 'solid' : ''}" d="${roundPoly(pts, 14)}"/>`;
  if (z.label) {
    const n = Math.hypot(AX, AY);
    const back = z.labelPos === 'back';
    const [lx, ly] = back ? proj(x0 + 0.3, y0 + 0.52) : proj(x0 + 0.34, y0 + h - 0.17);
    svg += `<text class="z-label" font-size="15.5" transform="matrix(${f3(AX / n)} ${f3(AY / n)} ${f3(-AX / n)} ${f3(AY / n)} ${f(lx)} ${f(ly)})">${esc(z.label)}</text>`;
  }
  return { svg, pts };
}
const f3 = (n) => n.toFixed(4);

/** Where a step tag sits: the centre of its pill, in scene coordinates. */
export function tagCentre(t, node, geo) {
  let x, y;
  if (node) {
    [x, y] = proj(node.at[0], node.at[1], node.z || 0);
    const pos = t.pos || 'top';
    if (pos === 'top') y += geo.top - 18;
    else if (pos === 'bottom') y += geo.bottom + 18;
    else {
      const w = textW(t.text, 14) + (t.icon ? 19 : 0) + 18;
      x += (pos === 'right' ? 1 : -1) * (geo.right + 14 + w / 2);
      y += geo.top * 0.45;
    }
  } else [x, y] = proj(t.at[0], t.at[1]);
  return [x + (t.dx || 0), y + (t.dy || 0)];
}

/**
 * The camera frame [x, y, w, h] for a step: everything in `vis` (a Set of ids) plus the step's tags.
 * Without `vis` it frames everything the lesson ever shows.
 */
export function frameOf(lesson, vis, step) {
  const sc = lesson.scene || {};
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const grow = (x, y) => {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  };
  for (const [id, n] of Object.entries(sc.nodes || {})) {
    if (vis && !vis.has(id)) continue;
    const [x, y] = proj(n.at[0], n.at[1], n.z || 0);
    grow(x - 92, y - 138); grow(x + 92, y + 76);
  }
  for (const [id, z] of Object.entries(sc.zones || {})) {
    if (vis && !vis.has(id)) continue;
    for (const [dx, dy] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
      const [x, y] = proj(z.at[0] + dx * z.size[0], z.at[1] + dy * z.size[1]);
      grow(x - 16, y - 16); grow(x + 16, y + 16);
    }
  }
  for (const [, e] of Object.entries(sc.edges || {})) {
    if (vis && ![e.from, e.to].every((r) => Array.isArray(r) || vis.has(r))) continue;
    for (const r of [e.from, ...(e.via || []), e.to]) if (Array.isArray(r)) { const [x, y] = proj(r[0], r[1]); grow(x - 20, y - 20); grow(x + 20, y + 20); }
  }
  for (const t of step?.tags || []) {
    const w = textW(t.text || '', 14) + (t.icon ? 19 : 0) + 18;
    if (t.at) { const [x, y] = proj(t.at[0], t.at[1]); grow(x - w / 2 - 6 + (t.dx || 0), y - 22 + (t.dy || 0)); grow(x + w / 2 + 6 + (t.dx || 0), y + 22 + (t.dy || 0)); }
    else if (t.on && sc.nodes?.[t.on] && (!vis || vis.has(t.on)) && (t.pos === 'left' || t.pos === 'right')) {
      const n = sc.nodes[t.on];
      const [x] = proj(n.at[0], n.at[1]);
      grow(x + (t.pos === 'right' ? 1 : -1) * (104 + w) + (t.dx || 0), minY);
    }
  }
  for (const fl of step?.flows || []) for (const r of fl.path || []) if (Array.isArray(r)) { const [x, y] = proj(r[0], r[1]); grow(x - 14, y - 14); grow(x + 14, y + 14); }
  if (!Number.isFinite(minX)) { minX = -300; maxX = 300; minY = -200; maxY = 200; }
  const pad = 14;
  const w = Math.max(maxX - minX + pad * 2, 600);
  const h = Math.max(maxY - minY + pad * 2, 400);
  return [(minX + maxX) / 2 - w / 2, (minY + maxY) / 2 - h / 2, w, h];
}
