// A small code pane: light syntax colouring and highlighted lines, no dependencies.
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const KEYWORDS = {
  hcl: /\b(resource|provider|variable|output|module|data|locals|terraform|backend|required_providers|for_each|count|depends_on|source|version|true|false|null)\b/g,
  yaml: /^(\s*-?\s*)([A-Za-z0-9_.\/-]+)(:)/gm,
  dockerfile: /^(FROM|RUN|COPY|ADD|CMD|ENTRYPOINT|WORKDIR|EXPOSE|ENV|ARG|USER|VOLUME|HEALTHCHECK|LABEL|AS)\b/gm,
  sh: /^(\$ )?(sudo |)(docker|kubectl|terraform|git|aws|az|gcloud|ncloud|helm|ssh|curl|systemctl|chmod|chown|ls|cd|cat|grep|ps|top|df|ip|ping|dig|nslookup|apt|yum|dnf|npm|argocd|trivy|vault|journalctl|scp|tar|echo|export|kubeadm|ansible|make)\b/gm,
  json: /("[^"]+")(\s*:)/g,
};

function paintLine(line, lang) {
  // split off a trailing comment first so nothing inside it gets coloured
  let comment = '';
  const m = lang === 'json' ? null : line.match(/(^|\s)(#|\/\/)(?![{!]).*$/);
  let body = line;
  if (m && !/["'][^"']*#[^"']*["']/.test(line)) {
    body = line.slice(0, m.index + m[1].length);
    comment = line.slice(m.index + m[1].length);
  }
  let out = esc(body);
  const hold = [];
  const keep = (html) => { hold.push(html); return `\uE000${String.fromCharCode(0xe100 + hold.length - 1)}\uE001`; };
  if (lang === 'json') out = out.replace(KEYWORDS.json, (_, a, b) => `${keep(`<i class="c-key">${a}</i>`)}${b}`);
  out = out.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, (s) => keep(`<i class="c-str">${s}</i>`));
  const kw = KEYWORDS[lang];
  if (kw) {
    kw.lastIndex = 0;
    if (lang === 'yaml') out = out.replace(kw, (_, a, b, c) => `${a}${keep(`<i class="c-key">${b}</i>`)}${c}`);
    else if (lang === 'sh') out = out.replace(kw, (_, a = '', b = '', c) => `${a ? keep('<i class="c-dim">$ </i>') : ''}${b}${keep(`<i class="c-kw">${c}</i>`)}`);
    else if (lang === 'json') { /* keys were coloured above, before strings */ }
    else out = out.replace(kw, (s) => keep(`<i class="c-kw">${s}</i>`));
  }
  out = out.replace(/\b\d+(\.\d+)*(\/\d+)?\b/g, (s) => keep(`<i class="c-num">${s}</i>`));
  for (let pass = 0; pass < 3; pass++) out = out.replace(/\uE000(.)\uE001/g, (_, c) => hold[c.charCodeAt(0) - 0xe100]);
  if (comment) out += `<i class="c-com">${esc(comment)}</i>`;
  return out || ' ';
}

/** HTML for a code pane. `code` is { title, lang, text, hl: [line numbers, 1-based] }. */
export function codePane(code) {
  const hl = new Set(code.hl || []);
  const rows = code.text.replace(/\n$/, '').split('\n');
  const dim = hl.size > 0;
  return `<div class="code-head"><span class="dots"><i></i><i></i><i></i></span><span class="code-title">${esc(code.title || '')}</span><span class="code-lang">${esc(code.lang || '')}</span></div>
<pre class="code-body ${dim ? 'has-hl' : ''}">${rows.map((r, i) => `<span class="ln ${hl.has(i + 1) ? 'hl' : ''}"><b>${i + 1}</b><span>${paintLine(r, code.lang)}</span></span>`).join('')}</pre>`;
}
