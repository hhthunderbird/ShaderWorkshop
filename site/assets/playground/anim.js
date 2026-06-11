// Lógica de tempo da animação — pura e testável (o resto do _loop é DOM/WebGL).
// Acumulador: pausar congela o tempo; retomar continua de onde parou.
export function advanceTime(t, dtSeconds, playing) {
  return playing ? t + dtSeconds : t;
}
// Default da reprodução: tocando, exceto se o SO pede reduced-motion.
export function defaultPlaying(prefersReduced) {
  return !prefersReduced;
}
