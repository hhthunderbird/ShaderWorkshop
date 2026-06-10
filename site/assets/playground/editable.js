function bounds(src, name) {
  const startMark = `// >>> EDIT: ${name}`;
  const endMark = '// <<< EDIT';
  const startLine = src.indexOf(startMark);
  if (startLine === -1) throw new Error(`editable: regiao "${name}" não encontrada`);
  const innerStart = src.indexOf('\n', startLine) + 1;
  const endLine = src.indexOf(endMark, innerStart);
  if (endLine === -1) throw new Error(`editable: fim da regiao "${name}" não encontrado`);
  return { innerStart, innerEnd: endLine };
}

export function extractRegion(src, name) {
  const { innerStart, innerEnd } = bounds(src, name);
  return src.slice(innerStart, innerEnd).replace(/\n$/, '');
}

export function reassemble(src, name, newInner) {
  const { innerStart, innerEnd } = bounds(src, name);
  const ensured = newInner.endsWith('\n') ? newInner : newInner + '\n';
  return src.slice(0, innerStart) + ensured + src.slice(innerEnd);
}
