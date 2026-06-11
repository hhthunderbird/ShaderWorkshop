// Traduz o log cru de compilação GLSL numa dica PT-BR pro iniciante.
// PURO: string -> string. Lidera por causa + token; SEM número de linha
// (o motor injeta o header antes do código do aluno, então a linha do GLSL
// não corresponde ao que o aluno vê no editor). O log cru, com as linhas
// reais, continua disponível no <details> técnico do playground.
export function friendlyError(rawLog) {
  const line = String(rawLog || '').split('\n').find((l) => l.includes('ERROR:')) || '';
  // formato típico: ERROR: <a>:<linha>: '<token>' : <mensagem>
  const m = line.match(/ERROR:\s*\d+:\d+:\s*'([^']*)'\s*:\s*(.*)$/);
  const token = m ? m[1] : '';
  const msg = (m ? m[2] : '').toLowerCase();
  const has = (s) => msg.includes(s);

  if (has('undeclared identifier') && token) {
    return `🔤 '${token}' não foi declarado ou está escrito errado — confira a digitação (maiúsculas e minúsculas contam).`;
  }
  if (has('redefinition') && token) {
    return `🔁 '${token}' foi declarado duas vezes. Remova a declaração repetida.`;
  }
  if (has('no matching') || has('undeclared function')) {
    return token
      ? `🛠️ A função '${token}' não existe ou os argumentos estão errados.`
      : '🛠️ Uma função usada não existe ou os argumentos estão errados.';
  }
  if (token === 'constructor' || has('cannot convert') || has('wrong operand') || has('construction') || has('not enough data')) {
    return '🔢 Os tipos não batem — ex.: misturar número (float) com cor (vec3) numa conta. Confira os tipos.';
  }
  if (has('syntax error')) {
    return '✏️ Erro de digitação — provavelmente faltou um ponto-e-vírgula (;) no fim de uma linha, ou um parêntese/chave.';
  }
  return '⚠️ O shader não compilou — confira a digitação na parte que você editou.';
}
