// A lesson's steps are cumulative: what a step shows is every earlier step's
// show / hide / set / metrics applied in order, plus the step's own tags, flows, panel and code.

/** The scene state after step `index` (0-based). */
export function foldSteps(lesson, index) {
  const vis = new Set();
  const edgeOff = new Set();
  const patch = {};
  const metrics = {};
  const edges = lesson.scene?.edges || {};
  for (const [id, e] of Object.entries(edges)) if (e.off) edgeOff.add(id);

  for (let i = 0; i <= index && i < lesson.steps.length; i++) {
    const st = lesson.steps[i];
    for (const id of st.show || []) {
      if (id in edges) edgeOff.delete(id);
      else vis.add(id);
    }
    for (const id of st.hide || []) {
      if (id in edges) edgeOff.add(id);
      else vis.delete(id);
    }
    for (const [id, p] of Object.entries(st.set || {})) patch[id] = { ...(patch[id] || {}), ...p };
    Object.assign(metrics, st.metrics || {});
  }
  return { vis, edgeOff, patch, metrics };
}

/** Which "you'll learn" items are ticked once the reader reaches step `index`. */
export function learned(lesson, index) {
  const total = lesson.steps.length;
  const items = lesson.learn || [];
  return items.map((item, i) => {
    const at = typeof item === 'object' && item.at ? item.at : Math.ceil(((i + 1) / items.length) * (total - 1)) + 1;
    return { text: typeof item === 'object' ? item.t : item, done: index + 1 >= at };
  });
}
