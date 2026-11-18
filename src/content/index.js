// Collects every lesson file and joins it with its entry in the course outline.
import { CHAPTERS, LESSON_META, ORDER } from './curriculum.js';

const files = import.meta.glob('./ch*/*.js', { eager: true });
const BODIES = {};
for (const [path, mod] of Object.entries(files)) {
  const body = mod.default;
  if (body && body.id) BODIES[body.id] = body;
  else console.warn('lesson file without a default export / id:', path);
}

/** The full lesson (outline entry + steps), or null when it has not been written yet. */
export function getLesson(id) {
  const meta = LESSON_META[id];
  if (!meta) return null;
  const body = BODIES[id];
  return body ? { ...meta, ...body, ready: true } : { ...meta, steps: [], ready: false };
}

export const hasLesson = (id) => Boolean(BODIES[id]);
export { CHAPTERS, LESSON_META, ORDER };
