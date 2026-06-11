import { normalizeConfig } from './config.js';
import { toControlSpecs } from './uniforms.js';
import { compare } from './pixeldiff.js';
import { extractRegion, reassemble } from './editable.js';
import { translateToHLSL } from './translate.js';
import { createContext, buildProgram, setupQuad, setupMesh, MESH_VERTEX, renderFrame, readPixels, loadTexture } from './gl.js';
import { withHeader, withHeaderMesh } from './header.js';
import { friendlyError } from './glslerrors.js';
import { advanceTime, defaultPlaying } from './anim.js';
import { cube, sphere } from './geometry.js';
import { multiply, perspective, translation, rotateX, rotateY, mat3FromMat4 } from './mat4.js';

class ShaderPlayground extends HTMLElement {
  connectedCallback() {
    cancelAnimationFrame(this._raf); // evita loop duplicado se reinicializado
    let raw;
    try {
      raw = this._config || JSON.parse(this.getAttribute('data-config') || '{}');
      this.cfg = normalizeConfig(raw);
    } catch (e) {
      this.innerHTML = `<p class="pg-erro">Config inválida: ${e.message}</p>`;
      return;
    }
    this.controlSpecs = toControlSpecs(this.cfg.uniforms);
    this.controlValues = {};
    for (const s of this.controlSpecs) this.controlValues[s.name] = s.value;
    this.fullSource = this.cfg.fragment;
    this._t = 0;
    this._last = performance.now();
    this.playing = defaultPlaying(this._prefersReduced());
    this._render();
    this._compile();
    this._loop();
  }

  set config(obj) {
    this._config = obj;
    // Se o elemento já foi conectado (módulo ES roda após o upgrade do custom
    // element), re-inicializa agora que a config existe.
    if (this.isConnected) this.connectedCallback();
  }

  _prefersReduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  _render() {
    const animated = this.cfg.mode === 'mesh' || this.fullSource.includes('u_time');
    this.innerHTML = `
      <div class="pg">
        <canvas class="pg-canvas" width="320" height="320" role="img" aria-label="resultado do shader (imagem)"></canvas>
        <div class="pg-controls"></div>
        ${this.cfg.editableRegions.length ? '<textarea class="pg-editor" spellcheck="false" aria-label="editor de código do shader"></textarea>' : ''}
        <div class="pg-buttons">
          <button class="pg-run">▶ Test Drive</button>
          <button class="pg-reset">↺ Reset</button>
          ${animated ? `<button class="pg-anim">${this.playing ? '⏸ Pausar' : '▶ Animar'}</button>` : ''}
          ${this.cfg.reference ? '<button class="pg-check">✓ Conferir</button>' : ''}
          ${this.cfg.solution ? '<button class="pg-solution">💡 Mostrar solução</button>' : ''}
          <button class="pg-lang" title="Ver o equivalente em HLSL (Unity)">🔁 Ver em HLSL</button>
          ${this.cfg.exportable ? '<button class="pg-export">📷 Baixar imagem</button><button class="pg-copy">📋 Copiar shader</button>' : ''}
        </div>
        <div class="pg-hlsl" hidden>
          <p class="pg-hlsl-nota">Como ficaria no <strong>Unity (HLSL)</strong> — ilustrativo, não roda aqui:</p>
          <pre class="pg-hlsl-code"></pre>
        </div>
        <p class="pg-status" aria-live="polite"></p>
      </div>`;
    this.canvas = this.querySelector('.pg-canvas');
    this.statusEl = this.querySelector('.pg-status');

    // Sliders / color pickers
    const ctr = this.querySelector('.pg-controls');
    for (const s of this.controlSpecs) {
      const wrap = document.createElement('label');
      wrap.className = 'pg-control';
      if (s.kind === 'slider') {
        wrap.innerHTML = `<span>${s.label}</span>
          <input type="range" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.value}">`;
        wrap.querySelector('input').addEventListener('input', (e) => {
          this.controlValues[s.name] = parseFloat(e.target.value);
        });
      } else {
        const hex = rgbToHex(s.value);
        wrap.innerHTML = `<span>${s.label}</span><input type="color" value="${hex}">`;
        wrap.querySelector('input').addEventListener('input', (e) => {
          this.controlValues[s.name] = hexToRgb(e.target.value);
        });
      }
      ctr.appendChild(wrap);
    }

    // Editor
    this.editor = this.querySelector('.pg-editor');
    if (this.editor) {
      this.editor.value = extractRegion(this.cfg.fragment, this.cfg.editableRegions[0]);
    }

    this.querySelector('.pg-run')?.addEventListener('click', () => this._applyEditorAndCompile());
    this.querySelector('.pg-reset')?.addEventListener('click', () => this._reset());
    this.querySelector('.pg-anim')?.addEventListener('click', (e) => {
      this.playing = !this.playing;
      e.target.textContent = this.playing ? '⏸ Pausar' : '▶ Animar';
    });
    this.querySelector('.pg-check')?.addEventListener('click', () => this._check());
    this.querySelector('.pg-solution')?.addEventListener('click', () => this._showSolution());
    this.querySelector('.pg-lang')?.addEventListener('click', () => this._toggleLang());
    this.querySelector('.pg-export')?.addEventListener('click', () => this._exportPng());
    this.querySelector('.pg-copy')?.addEventListener('click', () => this._copyShader());
  }

  _exportPng() {
    // canvas usa preserveDrawingBuffer -> toDataURL pega o frame atual.
    try {
      const url = this.canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'meu-shader.png';
      a.click();
      this.statusEl.textContent = '✓ Imagem baixada (meu-shader.png).';
      this.statusEl.className = 'pg-status pg-ok';
    } catch (e) {
      this.statusEl.textContent = '⚠ Não consegui exportar: ' + e.message;
      this.statusEl.className = 'pg-status pg-erro';
    }
  }

  async _copyShader() {
    const code = this.fullSource;
    try {
      await navigator.clipboard.writeText(code);
      this.statusEl.textContent = '✓ Shader copiado! Cole pra compartilhar.';
      this.statusEl.className = 'pg-status pg-ok';
    } catch (e) {
      // Fallback (file:// ou sem permissão de clipboard): seleciona o texto do editor.
      if (this.editor) {
        this.editor.focus();
        this.editor.select();
        this.statusEl.textContent = 'Copie com Ctrl+C (texto já selecionado).';
      } else {
        this.statusEl.textContent = '⚠ Copie o shader manualmente do editor.';
      }
      this.statusEl.className = 'pg-status pg-quase';
    }
  }

  _toggleLang() {
    const panel = this.querySelector('.pg-hlsl');
    const btn = this.querySelector('.pg-lang');
    if (!panel) return;
    const showing = !panel.hidden;
    if (showing) {
      panel.hidden = true;
      btn.textContent = '🔁 Ver em HLSL';
    } else {
      // HLSL curado (config.hlsl) ou tradução automática do shader que está rodando.
      const hlsl = this.cfg.hlsl ?? translateToHLSL(this.fullSource);
      this.querySelector('.pg-hlsl-code').textContent = hlsl;
      panel.hidden = false;
      btn.textContent = '🔁 Voltar pro GLSL';
    }
  }

  _applyEditorAndCompile() {
    if (this.editor) {
      this.fullSource = reassemble(this.cfg.fragment, this.cfg.editableRegions[0], this.editor.value);
    }
    this._compile();
  }

  _compile() {
    try {
      this.gl = this.gl || createContext(this.canvas);
      const gl = this.gl;
      if (this.cfg.texture && !this.texObj) {
        this.texObj = loadTexture(gl, this.cfg.texture);
      }
      if (this.cfg.mode === 'mesh') {
        this.geo = this.geo || (this.cfg.mesh === 'sphere' ? sphere(28) : cube());
        this.program = buildProgram(gl, withHeaderMesh(this.fullSource), MESH_VERTEX);
        this.indexCount = setupMesh(gl, this.program, this.geo);
      } else {
        this.program = buildProgram(gl, withHeader(this.fullSource));
        this.indexCount = setupQuad(gl, this.program);
      }
      this.statusEl.textContent = '';
      this.statusEl.className = 'pg-status';
    } catch (e) {
      const dica = friendlyError(e.message);
      const extra = this.cfg.solution ? ' (↺ Reset desfaz · 💡 Mostrar solução mostra a resposta)' : '';
      this.statusEl.innerHTML = '⚠ ' + escapeHtml(dica + extra) +
        ' <details class="pg-erro-tec"><summary>🔧 erro técnico (avançado)</summary><pre>' +
        escapeHtml(e.message) + '</pre></details>';
      this.statusEl.className = 'pg-status pg-erro';
      this.program = null;
    }
  }

  _loop() {
    const frame = () => {
      const now = performance.now();
      this._t = advanceTime(this._t, (now - this._last) / 1000, this.playing);
      this._last = now;
      if (this.program && this.gl) {
        const t = this._t;
        const base = {
          u_time: t,
          u_resolution: [this.canvas.width, this.canvas.height],
          controls: this.controlValues,
          texture: this.texObj || null,
        };
        if (this.cfg.mode === 'mesh') {
          const vel = this.controlValues.u_vel ?? 0.6;
          const model = multiply(rotateY(t * vel), rotateX(0.5));
          const view = translation(0, 0, -3);
          const proj = perspective(Math.PI / 4, 1, 0.1, 100);
          base.u_mvp = multiply(proj, multiply(view, model));
          base.u_model = model;
          base.u_normalMatrix = mat3FromMat4(model);
          base.u_lightDir = this.cfg.light;
          // Câmera fixa em mundo (0,0,3): é o NEGATIVO da translação da view
          // (translation(0,0,-3)). Se a view mudar, atualizar os dois juntos.
          base.u_cameraPos = [0, 0, 3];
        }
        renderFrame(this.gl, this.program, this.indexCount, base);
      }
      this._raf = requestAnimationFrame(frame);
    };
    frame();
  }

  _reset() {
    // NÃO reconstrói o DOM (isso detacharia o canvas do contexto WebGL ativo).
    // Restaura valores no lugar e recompila no mesmo canvas/contexto.
    this.fullSource = this.cfg.fragment;
    if (this.editor) this.editor.value = extractRegion(this.cfg.fragment, this.cfg.editableRegions[0]);
    for (const s of this.controlSpecs) this.controlValues[s.name] = s.value;
    this.querySelectorAll('.pg-control').forEach((wrap, i) => {
      const input = wrap.querySelector('input');
      const s = this.controlSpecs[i];
      if (!input || !s) return;
      input.value = s.kind === 'slider' ? s.value : rgbToHex(s.value);
    });
    this._t = 0;
    this.playing = defaultPlaying(this._prefersReduced());
    const animBtn = this.querySelector('.pg-anim');
    if (animBtn) animBtn.textContent = this.playing ? '⏸ Pausar' : '▶ Animar';
    this._compile();
  }

  async _check() {
    if (!this.cfg.reference) return;
    try {
      const actual = readPixels(this.gl);
      const ref = await loadReferencePixels(this.cfg.reference, this.canvas.width, this.canvas.height);
      const { score, pass } = compare(actual, ref, this.cfg.tolerance);
      const pct = Math.round(score * 100);
      this.statusEl.textContent = pass
        ? `✓ Mandou bem! (${pct}% igual ao alvo)`
        : `Quase! ${pct}% igual. Ajuste e tente de novo.`;
      this.statusEl.className = 'pg-status ' + (pass ? 'pg-ok' : 'pg-quase');
    } catch (e) {
      this.statusEl.textContent = '⚠ Não consegui carregar a referência: ' + e.message;
      this.statusEl.className = 'pg-status pg-erro';
    }
  }

  _showSolution() {
    if (this.cfg.solution && this.editor) {
      this.editor.value = this.cfg.solution;
      this._applyEditorAndCompile();
    }
  }

  disconnectedCallback() {
    cancelAnimationFrame(this._raf);
  }
}

function rgbToHex([r, g, b]) {
  const h = (n) => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function loadReferencePixels(url, w, h) {
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = url;
  });
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  // referência é desenhada com origem invertida p/ casar com readPixels (bottom-up)
  ctx.translate(0, h);
  ctx.scale(1, -1);
  ctx.drawImage(img, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h).data;
}

customElements.define('shader-playground', ShaderPlayground);
export { ShaderPlayground };
