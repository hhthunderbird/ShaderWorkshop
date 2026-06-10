// Compara dois buffers RGBA (Uint8ClampedArray). Ignora canal alpha.
export function compare(actual, reference, tolerance = 0.06) {
  if (actual.length !== reference.length) {
    throw new Error('pixeldiff: buffers de tamanho diferente');
  }
  let sum = 0;
  let count = 0;
  for (let i = 0; i < actual.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      sum += Math.abs(actual[i + c] - reference[i + c]) / 255;
      count++;
    }
  }
  const meanError = count === 0 ? 0 : sum / count;
  const score = 1 - meanError;
  return { score, pass: score >= 1 - tolerance };
}
