const VALID_MODES = ['fragment', 'mesh'];

export function normalizeConfig(raw) {
  if (!raw || typeof raw.fragment !== 'string' || raw.fragment.length === 0) {
    throw new Error('config: campo "fragment" (GLSL) é obrigatório');
  }
  const mode = raw.mode ?? 'fragment';
  if (!VALID_MODES.includes(mode)) {
    throw new Error(`config: "mode" inválido: ${mode}`);
  }
  if (mode === 'mesh' && (typeof raw.vertex !== 'string' || raw.vertex.length === 0)) {
    throw new Error('config: mode "mesh" exige campo "vertex" (GLSL)');
  }
  const clamp01 = (n) => Math.max(0, Math.min(1, n));
  return {
    mode,
    fragment: raw.fragment,
    vertex: raw.vertex ?? null,
    mesh: raw.mesh ?? 'quad',
    uniforms: Array.isArray(raw.uniforms) ? raw.uniforms : [],
    editableRegions: Array.isArray(raw.editableRegions) ? raw.editableRegions : [],
    reference: raw.reference ?? null,
    solution: raw.solution ?? null,
    tolerance: typeof raw.tolerance === 'number' ? clamp01(raw.tolerance) : 0.06,
  };
}
