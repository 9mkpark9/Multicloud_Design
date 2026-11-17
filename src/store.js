// Everything the app remembers between visits lives in localStorage under "mcd:".
const read = (key, fallback) => {
  try {
    const v = JSON.parse(localStorage.getItem('mcd:' + key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem('mcd:' + key, JSON.stringify(value));
  } catch {
    /* private mode: carry on without saving */
  }
};

export const store = {
  theme: read('theme', 'light'),
  done: new Set(read('done', [])),
  seen: read('seen', {}), // lesson id → furthest step reached (1-based)
  quiz: read('quiz', {}), // lesson id → { question index: 1 | 0 } (the latest answer to each question)
  phase: read('phase', {}), // chapter id → 'done' | 'now' | 'next' (overrides the outline's guess)
  open: new Set(read('open', [])),

  setTheme(t) { this.theme = t; write('theme', t); },
  markSeen(id, step, total) {
    if ((this.seen[id] || 0) < step) { this.seen[id] = step; write('seen', this.seen); }
    if (step >= total && !this.done.has(id)) { this.done.add(id); write('done', [...this.done]); return true; }
    return false;
  },
  toggleDone(id) {
    if (this.done.has(id)) this.done.delete(id); else this.done.add(id);
    write('done', [...this.done]);
  },
  markQuiz(id, qi, correct) { this.quiz[id] = { ...(this.quiz[id] || {}), [qi]: correct ? 1 : 0 }; write('quiz', this.quiz); },
  /** How many of a lesson's `total` questions were last answered correctly. */
  quizHits(id) { return Object.values(this.quiz[id] || {}).filter(Boolean).length; },
  setPhase(id, p) { this.phase[id] = p; write('phase', this.phase); },
  toggleOpen(id, force) {
    const on = force ?? !this.open.has(id);
    if (on) this.open.add(id); else this.open.delete(id);
    write('open', [...this.open]);
  },
  reset() {
    this.done = new Set(); this.seen = {}; this.quiz = {}; this.phase = {};
    ['done', 'seen', 'quiz', 'phase'].forEach((k) => { try { localStorage.removeItem('mcd:' + k); } catch { /* ignore */ } });
  },
};
