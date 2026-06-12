// Persistência do editor em localStorage. Funções puras: recebem o `storage`
// por parâmetro (injetável p/ teste). Tudo em try/catch -> degrada em silêncio
// se localStorage faltar, estiver bloqueado (modo privado) ou com quota cheia.
// Modelo não-destrutivo: só `save` escreve. Não há `clear` (sem chamador).

const PREFIX = 'shaderworkshop:';

// Chave estável por playground: caminho da página + id do elemento.
export function keyFor(pathname, id) {
  return PREFIX + pathname + '#' + (id || '');
}

// Grava texto. Retorna true se gravou, false se falhou.
export function save(storage, key, text) {
  try { storage.setItem(key, text); return true; } catch { return false; }
}

// Lê texto. Retorna a string salva, ou null se não há / falhou.
export function load(storage, key) {
  try { const v = storage.getItem(key); return (v === undefined ? null : v); } catch { return null; }
}
