import { normalizeConfig } from './config.js';
import { toControlSpecs } from './uniforms.js';
import { compare } from './pixeldiff.js';
import { extractRegion, reassemble } from './editable.js';
import { createContext, buildProgram, setupQuad, renderFrame, readPixels } from './gl.js';

class ShaderPlayground extends HTMLElement {
  connectedCallback() {
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
    this.start = performance.now();
    this._render();
    this._compile();
    this._loop();
  }

  set config(obj) { this._config = obj; }

  _render() {
    this.innerHTML = `
      <div class="pg">
        <canvas class="pg-canvas" width="320" height="320"></canvas>
        <div class="pg-controls"></div>
        ${this.cfg.editableRegions.length ? '<textarea class="pg-editor" spellcheck="false"></textarea>' : ''}
        <div class="pg-buttons">
          <button class="pg-run">▶ Test Drive</button>
          <button class="pg-reset">↺ Reset</button>
          ${this.cfg.reference ? '<button class="pg-check">✓ Conferir</button>' : ''}
          ${this.cfg.editableRegions.length ? '<button class="pg-solution">💡 Mostrar solução</button>' : ''}
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
    this.querySelector('.pg-check')?.addEventListener('click', () => this._check());
    this.querySelector('.pg-solution')?.addEventListener('click', () => this._showSolution());
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
      this.program = buildProgram(this.gl, withHeader(this.fullSource));
      this.indexCount = setupQuad(this.gl, this.program);
      this.statusEl.textContent = '';
      this.statusEl.className = 'pg-status';
    } catch (e) {
      this.statusEl.textContent = '⚠ ' + e.message;
      this.statusEl.className = 'pg-status pg-erro';
      this.program = null;
    }
  }

  _loop() {
    const frame = () => {
      if (this.program && this.gl) {
        renderFrame(this.gl, this.program, this.indexCount, {
          u_time: (performance.now() - this.start) / 1000,
          u_resolution: [this.canvas.width, this.canvas.height],
          controls: this.controlValues,
        });
      }
      this._raf = requestAnimationFrame(frame);
    };
    frame();
  }

  _reset() {
    this.fullSource = this.cfg.fragment;
    if (this.editor) this.editor.value = extractRegion(this.cfg.fragment, this.cfg.editableRegions[0]);
    for (const s of this.controlSpecs) this.controlValues[s.name] = s.value;
    this._render();
    this._compile();
  }

  async _check() {
    if (!this.cfg.reference) return;
    const actual = readPixels(this.gl);
    const ref = await loadReferencePixels(this.cfg.reference, this.canvas.width, this.canvas.height);
    const { score, pass } = compare(actual, ref, this.cfg.tolerance);
    const pct = Math.round(score * 100);
    this.statusEl.textContent = pass
      ? `✓ Mandou bem! (${pct}% igual ao alvo)`
      : `Quase! ${pct}% igual. Ajuste e tente de novo.`;
    this.statusEl.className = 'pg-status ' + (pass ? 'pg-ok' : 'pg-quase');
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

function withHeader(src) {
  // Cabeçalho GLSL ES padrão para todos os fragment shaders do curso.
  const header = `precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;
varying vec2 v_uv;
`;
  return src.includes('precision ') ? src : header + src;
}

function rgbToHex([r, g, b]) {
  const h = (n) => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
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
