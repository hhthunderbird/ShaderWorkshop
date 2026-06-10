export const AUTO_UNIFORMS = ['u_time', 'u_resolution', 'u_mouse'];

export function toControlSpecs(decls) {
  const out = [];
  for (const d of decls) {
    if (AUTO_UNIFORMS.includes(d.name)) continue;
    if (d.type === 'color') {
      out.push({
        name: d.name,
        label: d.label ?? d.name,
        kind: 'color',
        value: Array.isArray(d.value) ? d.value : [1, 1, 1],
      });
    } else {
      // float (default)
      const min = typeof d.min === 'number' ? d.min : 0;
      const max = typeof d.max === 'number' ? d.max : 1;
      const value = typeof d.value === 'number' ? d.value : (min + max) / 2;
      out.push({
        name: d.name,
        label: d.label ?? d.name,
        kind: 'slider',
        min, max, step: 0.01, value,
      });
    }
  }
  return out;
}
