// Ink fluid: a small WebGL2 stable-fluids simulation. The cursor stirs ink
// that swirls, settles and fades; while nobody moves, a slow ambient pen
// keeps it alive. Browser-only: construct it inside useEffect.

type Prog = { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null> };
type Fbo = { tex: WebGLTexture; fb: WebGLFramebuffer; w: number; h: number; tx: number; ty: number };
type DoubleFbo = { read: Fbo; write: Fbo; w: number; h: number; tx: number; ty: number; swap: () => void };

export type InkFluidOptions = {
  simRes: number;
  dyeRes: number;
  pressureIters: number;
  curl: number;
  velDiss: number;
  dyeDiss: number;
  radius: number;
  force: number;
};

const VERT = `#version 300 es
precision highp float;
in vec2 aPos;
uniform vec2 texel;
out vec2 vUv, vL, vR, vT, vB;
void main () {
  vUv = aPos * 0.5 + 0.5;
  vL = vUv - vec2(texel.x, 0.0); vR = vUv + vec2(texel.x, 0.0);
  vT = vUv + vec2(0.0, texel.y); vB = vUv - vec2(0.0, texel.y);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const HEAD = `#version 300 es
precision highp float; precision highp sampler2D;
in vec2 vUv, vL, vR, vT, vB; out vec4 o;
`;

const FRAG = {
  splat: `uniform sampler2D uTarget; uniform float aspect, radius; uniform vec3 color; uniform vec2 point;
    void main () { vec2 p = vUv - point; p.x *= aspect;
      o = vec4(texture(uTarget, vUv).xyz + exp(-dot(p, p) / radius) * color, 1.0); }`,
  advect: `uniform sampler2D uVelocity, uSource; uniform vec2 simTexel; uniform float dt, dissipation;
    void main () { vec2 c = vUv - dt * texture(uVelocity, vUv).xy * simTexel;
      o = vec4(texture(uSource, c).xyz / (1.0 + dissipation * dt), 1.0); }`,
  divergence: `uniform sampler2D uVelocity;
    void main () { float L = texture(uVelocity, vL).x, R = texture(uVelocity, vR).x, T = texture(uVelocity, vT).y, B = texture(uVelocity, vB).y;
      vec2 C = texture(uVelocity, vUv).xy;
      if (vL.x < 0.0) L = -C.x; if (vR.x > 1.0) R = -C.x; if (vT.y > 1.0) T = -C.y; if (vB.y < 0.0) B = -C.y;
      o = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0); }`,
  curl: `uniform sampler2D uVelocity;
    void main () { float L = texture(uVelocity, vL).y, R = texture(uVelocity, vR).y, T = texture(uVelocity, vT).x, B = texture(uVelocity, vB).x;
      o = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0); }`,
  vorticity: `uniform sampler2D uVelocity, uCurl; uniform float curl, dt;
    void main () { float L = texture(uCurl, vL).x, R = texture(uCurl, vR).x, T = texture(uCurl, vT).x, B = texture(uCurl, vB).x, C = texture(uCurl, vUv).x;
      vec2 f = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L)); f /= length(f) + 0.0001; f *= curl * C; f.y *= -1.0;
      o = vec4(clamp(texture(uVelocity, vUv).xy + f * dt, -1000.0, 1000.0), 0.0, 1.0); }`,
  pressure: `uniform sampler2D uPressure, uDivergence;
    void main () { float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x, T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
      o = vec4((L + R + B + T - texture(uDivergence, vUv).x) * 0.25, 0.0, 0.0, 1.0); }`,
  gradient: `uniform sampler2D uPressure, uVelocity;
    void main () { float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x, T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
      o = vec4(texture(uVelocity, vUv).xy - vec2(R - L, T - B), 0.0, 1.0); }`,
  clear: `uniform sampler2D uTexture; uniform float value;
    void main () { o = value * texture(uTexture, vUv); }`,
  recolor: `uniform sampler2D uTexture; uniform vec3 color;
    void main () { vec3 dye = texture(uTexture, vUv).rgb;
      float strength = max(dye.r, max(dye.g, dye.b));
      float peak = max(color.r, max(color.g, color.b));
      o = vec4(color / max(peak, 1e-4) * strength, 1.0); }`,
  display: `uniform sampler2D uTexture; uniform vec3 bg; uniform float time, uLight;
    float h (vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main () { vec3 c = texture(uTexture, vUv).rgb;
      float a = clamp(max(c.r, max(c.g, c.b)), 0.0, 1.0);
      float grain = h(gl_FragCoord.xy + time);
      vec3 col;
      if (uLight > 0.5) {
        vec3 hue = c / max(a, 1e-4);
        float k = smoothstep(0.0, 0.85, a) * 0.78;
        vec3 stained = bg * mix(vec3(1.0), hue, k);
        stained = mix(stained, stained * 0.92, k * k);
        col = stained + (grain - 0.5) * 0.018;
      } else {
        vec3 ink = 1.0 - exp(-c * 1.6);
        float strength = smoothstep(0.0, 0.9, a);
        col = mix(bg, ink, strength) + ink * 0.12;
        col += (grain - 0.5) * 0.035;
      }
      o = vec4(col, 1.0); }`,
} as const;

type ProgName = keyof typeof FRAG;

const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

export class InkFluid {
  readonly ok: boolean;
  private gl!: WebGL2RenderingContext;
  private o: InkFluidOptions;
  private progs = {} as Record<ProgName, Prog>;
  private vel!: DoubleFbo;
  private dye!: DoubleFbo;
  private pres!: DoubleFbo;
  private div!: Fbo;
  private curlT!: Fbo;
  private color: [number, number, number] = [1, 1, 1];
  private target: [number, number, number] = [1, 1, 1];
  private bg: [number, number, number] = [0.09, 0.09, 0.09];
  private mode: "light" | "dark" = "dark";
  private pointer = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, moved: false, last: 0 };
  private pen = { t: Math.random() * 100, acc: 0 };
  private visible = true;
  private destroyed = false;
  private running = false;
  private raf = 0;
  private lastTs = 0;
  private time = 0;
  private ro?: ResizeObserver;
  private io?: IntersectionObserver;
  private quadBuffer: WebGLBuffer | null = null;

  constructor(private canvas: HTMLCanvasElement, private host: HTMLElement = canvas, opts: Partial<InkFluidOptions> = {}) {
    this.o = { simRes: 128, dyeRes: 640, pressureIters: 20, curl: 22, velDiss: 0.35, dyeDiss: 0.55, radius: 0.22, force: 5200, ...opts };
    this.mode = document.documentElement.classList.contains("dark") ? "dark" : "light";
    const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false });
    if (!gl || !gl.getExtension("EXT_color_buffer_float")) {
      this.ok = false;
      return;
    }
    this.ok = true;
    this.gl = gl;
    try {
      (Object.keys(FRAG) as ProgName[]).forEach((k) => (this.progs[k] = this.program(FRAG[k])));

      this.quadBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(0);

      this.ro = new ResizeObserver(this.resize);
      this.ro.observe(canvas);
      this.io = new IntersectionObserver((es) => {
        this.visible = es[0].isIntersecting;
        if (this.visible) this.start();
        else this.stop();
      });
      this.io.observe(canvas);
      host.addEventListener("pointermove", this.onMove, { passive: true });
      host.addEventListener("pointerdown", this.onMove, { passive: true });
      document.addEventListener("visibilitychange", this.onVisibilityChange);
      this.resize();
      // a few opening strokes so the first frame is not empty
      if (this.vel) {
        for (let i = 0; i < 6; i++) {
          this.splat(0.2 + Math.random() * 0.6, 0.25 + Math.random() * 0.5, (Math.random() - 0.5) * 900, (Math.random() - 0.5) * 900, 0.5);
        }
      }
    } catch (error) {
      this.destroy();
      throw error;
    }
  }

  private program(src: string): Prog {
    const gl = this.gl;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const message = gl.getShaderInfoLog(shader) ?? "shader error";
        gl.deleteShader(shader);
        throw new Error(message);
      }
      return shader;
    };
    const program = gl.createProgram()!;
    let vertex: WebGLShader | null = null;
    let fragment: WebGLShader | null = null;
    let complete = false;
    try {
      vertex = compile(gl.VERTEX_SHADER, VERT);
      gl.attachShader(program, vertex);
      fragment = compile(gl.FRAGMENT_SHADER, HEAD + src);
      gl.attachShader(program, fragment);
      gl.bindAttribLocation(program, 0, "aPos");
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "link error");
      const uniforms: Prog["u"] = {};
      const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
      for (let index = 0; index < count; index++) {
        const name = gl.getActiveUniform(program, index)!.name;
        uniforms[name] = gl.getUniformLocation(program, name);
      }
      complete = true;
      return { p: program, u: uniforms };
    } finally {
      if (vertex) {
        gl.detachShader(program, vertex);
        gl.deleteShader(vertex);
      }
      if (fragment) {
        gl.detachShader(program, fragment);
        gl.deleteShader(fragment);
      }
      if (!complete) gl.deleteProgram(program);
    }
  }

  private fbo(w: number, h: number): Fbo {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fb, w, h, tx: 1 / w, ty: 1 / h };
  }

  private double(w: number, h: number): DoubleFbo {
    let r = this.fbo(w, h);
    let wr = this.fbo(w, h);
    return {
      get read() { return r; },
      get write() { return wr; },
      w, h, tx: 1 / w, ty: 1 / h,
      swap() { const t = r; r = wr; wr = t; },
    };
  }

  private dims(res: number): [number, number] {
    const gl = this.gl;
    const ar = gl.drawingBufferWidth / gl.drawingBufferHeight;
    const min = Math.round(res);
    const max = Math.round(res * (ar < 1 ? 1 / ar : ar));
    return ar > 1 ? [max, min] : [min, max];
  }

  private resize = () => {
    if (this.destroyed) return;
    const r = this.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const w = Math.round(r.width * dpr);
    const h = Math.round(r.height * dpr);
    if (this.canvas.width === w && this.canvas.height === h && this.vel) return;
    this.canvas.width = w;
    this.canvas.height = h;
    const [sw, sh] = this.dims(this.o.simRes);
    const [dw, dh] = this.dims(this.o.dyeRes);
    this.releaseTargets();
    this.vel = this.double(sw, sh);
    this.dye = this.double(dw, dh);
    this.pres = this.double(sw, sh);
    this.div = this.fbo(sw, sh);
    this.curlT = this.fbo(sw, sh);
  };

  private releaseTargets() {
    const targets = [this.vel?.read, this.vel?.write, this.dye?.read, this.dye?.write, this.pres?.read, this.pres?.write, this.div, this.curlT];
    targets.forEach((target) => {
      if (!target) return;
      this.gl.deleteFramebuffer(target.fb);
      this.gl.deleteTexture(target.tex);
    });
  }

  private use(name: ProgName, tx: number, ty: number) {
    const pr = this.progs[name];
    this.gl.useProgram(pr.p);
    this.gl.uniform2f(pr.u.texel, tx, ty);
    return pr;
  }

  private bind(pr: Prog, name: string, tex: WebGLTexture, unit: number) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(pr.u[name], unit);
  }

  private draw(target: Fbo | null) {
    const gl = this.gl;
    if (target) {
      gl.viewport(0, 0, target.w, target.h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb);
    } else {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  private splat(x: number, y: number, dx: number, dy: number, amount = 0.18, rad = this.o.radius) {
    const gl = this.gl;
    const ar = this.canvas.width / this.canvas.height;
    const R = (rad / 100) * (ar > 1 ? ar : 1);
    let pr = this.use("splat", this.vel.tx, this.vel.ty);
    this.bind(pr, "uTarget", this.vel.read.tex, 0);
    gl.uniform1f(pr.u.aspect, ar);
    gl.uniform2f(pr.u.point, x, y);
    gl.uniform3f(pr.u.color, dx, dy, 0);
    gl.uniform1f(pr.u.radius, R);
    this.draw(this.vel.write);
    this.vel.swap();

    pr = this.use("splat", this.dye.tx, this.dye.ty);
    this.bind(pr, "uTarget", this.dye.read.tex, 0);
    gl.uniform1f(pr.u.aspect, ar);
    gl.uniform2f(pr.u.point, x, y);
    const dyeAmount = amount * (this.mode === "light" ? 0.75 : 1);
    gl.uniform3f(pr.u.color, this.color[0] * dyeAmount, this.color[1] * dyeAmount, this.color[2] * dyeAmount);
    gl.uniform1f(pr.u.radius, R);
    this.draw(this.dye.write);
    this.dye.swap();
  }

  private onMove = (e: PointerEvent) => {
    const r = this.canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = 1 - (e.clientY - r.top) / r.height;
    const p = this.pointer;
    if (e.type === "pointerdown" || !p.last || performance.now() - p.last > 200) {
      p.px = x;
      p.py = y;
    }
    p.x = x;
    p.y = y;
    p.moved = true;
    p.last = performance.now();
    this.start();
  };

  private step(dt: number) {
    const gl = this.gl;
    const V = this.vel;
    let pr = this.use("curl", V.tx, V.ty);
    this.bind(pr, "uVelocity", V.read.tex, 0);
    this.draw(this.curlT);

    pr = this.use("vorticity", V.tx, V.ty);
    this.bind(pr, "uVelocity", V.read.tex, 0);
    this.bind(pr, "uCurl", this.curlT.tex, 1);
    gl.uniform1f(pr.u.curl, this.o.curl);
    gl.uniform1f(pr.u.dt, dt);
    this.draw(V.write);
    V.swap();

    pr = this.use("divergence", V.tx, V.ty);
    this.bind(pr, "uVelocity", V.read.tex, 0);
    this.draw(this.div);

    pr = this.use("clear", V.tx, V.ty);
    this.bind(pr, "uTexture", this.pres.read.tex, 0);
    gl.uniform1f(pr.u.value, 0.8);
    this.draw(this.pres.write);
    this.pres.swap();

    pr = this.use("pressure", V.tx, V.ty);
    this.bind(pr, "uDivergence", this.div.tex, 1);
    for (let i = 0; i < this.o.pressureIters; i++) {
      this.bind(pr, "uPressure", this.pres.read.tex, 0);
      this.draw(this.pres.write);
      this.pres.swap();
    }

    pr = this.use("gradient", V.tx, V.ty);
    this.bind(pr, "uPressure", this.pres.read.tex, 0);
    this.bind(pr, "uVelocity", V.read.tex, 1);
    this.draw(V.write);
    V.swap();

    pr = this.use("advect", V.tx, V.ty);
    this.bind(pr, "uVelocity", V.read.tex, 0);
    this.bind(pr, "uSource", V.read.tex, 0);
    gl.uniform2f(pr.u.simTexel, V.tx, V.ty);
    gl.uniform1f(pr.u.dt, dt);
    gl.uniform1f(pr.u.dissipation, this.o.velDiss);
    this.draw(V.write);
    V.swap();

    pr = this.use("advect", this.dye.tx, this.dye.ty);
    this.bind(pr, "uVelocity", V.read.tex, 0);
    this.bind(pr, "uSource", this.dye.read.tex, 1);
    gl.uniform2f(pr.u.simTexel, V.tx, V.ty);
    gl.uniform1f(pr.u.dt, dt);
    gl.uniform1f(pr.u.dissipation, this.o.dyeDiss);
    this.draw(this.dye.write);
    this.dye.swap();
  }

  private render() {
    const gl = this.gl;
    const pr = this.use("display", 1 / gl.drawingBufferWidth, 1 / gl.drawingBufferHeight);
    this.bind(pr, "uTexture", this.dye.read.tex, 0);
    gl.uniform3f(pr.u.bg, this.bg[0], this.bg[1], this.bg[2]);
    gl.uniform1f(pr.u.time, this.time % 100);
    gl.uniform1f(pr.u.uLight, this.mode === "light" ? 1 : 0);
    this.draw(null);
  }

  // A slow pen on a Lissajous path; it only draws while the cursor is idle.
  private ambient(dt: number) {
    if (performance.now() - this.pointer.last < 1800) return;
    const P = this.pen;
    P.acc += dt;
    if (P.acc < 0.05) return;
    const t0 = P.t;
    P.t += P.acc * 0.35;
    P.acc = 0;
    const f = (t: number) => [0.5 + 0.36 * Math.sin(t * 1.3) * Math.cos(t * 0.31), 0.5 + 0.3 * Math.sin(t * 0.9 + 1.2)];
    const a = f(t0);
    const b = f(P.t);
    this.splat(b[0], b[1], (b[0] - a[0]) * this.o.force * 1.6, (b[1] - a[1]) * this.o.force * 1.6, 0.09, this.o.radius * 3.2);
  }

  private loop = (ts: number) => {
    if (!this.visible || document.hidden || this.destroyed) {
      this.running = false;
      return;
    }
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.016667, (ts - (this.lastTs || ts)) / 1000);
    this.lastTs = ts;
    this.time += dt;
    for (let i = 0; i < 3; i++) this.color[i] += (this.target[i] - this.color[i]) * Math.min(1, dt * 3);
    const p = this.pointer;
    if (p.moved) {
      p.moved = false;
      const dx = (p.x - p.px) * this.o.force;
      const dy = (p.y - p.py) * this.o.force;
      if (Math.abs(dx) + Math.abs(dy) > 0.5) this.splat(p.x, p.y, dx, dy);
      p.px = p.x;
      p.py = p.y;
    }
    this.ambient(dt);
    this.step(dt);
    this.render();
  };

  start() {
    if (!this.ok || this.destroyed || this.running || !this.visible || document.hidden || !this.vel) return;
    this.running = true;
    this.lastTs = 0;
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
    this.running = false;
  }

  private onVisibilityChange = () => {
    if (document.hidden) this.stop();
    else this.start();
  };

  /** Ink colour fades towards this over about a second. */
  setColor(hex: string, immediate = false) {
    this.target = hexToRgb(hex);
    if (immediate) {
      this.color = [...this.target];
      if (!this.ok || this.destroyed || !this.dye) return;
      const pr = this.use("recolor", this.dye.tx, this.dye.ty);
      this.bind(pr, "uTexture", this.dye.read.tex, 0);
      this.gl.uniform3f(pr.u.color, this.color[0], this.color[1], this.color[2]);
      this.draw(this.dye.write);
      this.dye.swap();
    }
  }

  setMode(mode: "light" | "dark") {
    this.mode = mode;
  }

  setBackground(hex: string) {
    this.bg = hexToRgb(hex);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.stop();
    this.ro?.disconnect();
    this.io?.disconnect();
    this.host.removeEventListener("pointermove", this.onMove);
    this.host.removeEventListener("pointerdown", this.onMove);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    if (!this.gl) return;
    this.gl.useProgram(null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    this.releaseTargets();
    Object.values(this.progs).forEach((program) => this.gl.deleteProgram(program.p));
    if (this.quadBuffer) this.gl.deleteBuffer(this.quadBuffer);
  }
}
