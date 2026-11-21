"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { PIPELINE, SYSTEM, LOGO_DODGE, BALL_TRACK, BALL_TRACK2, CATCH_FRAME, FEED2, RECEIVER_LABEL, RECEIVER_TRACK2, TD_FRAME, TOUCHDOWN, BOARD, BOARD_LABEL, CAPTIONS, UI, FEED, FREEZE_FRAME, FROZEN, LOS, OPTIONS, PART_LABELS, QB_TRACK, QUESTION, RELEASE_FRAME, SAFETY_DRIFT, SEAM, SPOKEN, STEPS, THROW_TAG } from "./feed";

const MODEL_URL = "/models/glasses.glb";
// shortcut: byte size of glasses.glb, used for the progress bar when the CDN sends it compressed without Content-Length; update if the model changes
const MODEL_BYTES = 49110860;
const NORMAL_URL = "/models/glasses-normal.png";

const labels = PART_LABELS;
const captions = CAPTIONS;
const steps = STEPS;
const SPOKEN_WORDS = `“${SPOKEN}”`.split(" ");

/* ---------- minimum-total-travel assignment (Hungarian, n starts ≤ m targets) ---------- */
// Plain Euclidean cost, so the optimum never has two paths crossing.
const assign = (cost: number[][]) => {
  const n = cost.length, m = cost[0]?.length ?? 0, INF = 1e18;
  const u = new Array(n + 1).fill(0), v = new Array(m + 1).fill(0), pp = new Array(m + 1).fill(0), way = new Array(m + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    pp[0] = i; let j0 = 0;
    const minv = new Array(m + 1).fill(INF), used = new Array(m + 1).fill(false);
    do {
      used[j0] = true; const i0 = pp[j0]; let delta = INF, j1 = 0;
      for (let j = 1; j <= m; j++) if (!used[j]) {
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
        if (minv[j] < delta) { delta = minv[j]; j1 = j; }
      }
      for (let j = 0; j <= m; j++) if (used[j]) { u[pp[j]] += delta; v[j] -= delta; } else minv[j] -= delta;
      j0 = j1;
    } while (pp[j0] !== 0);
    do { const j1 = way[j0]; pp[j0] = pp[j1]; j0 = j1; } while (j0);
  }
  const out = new Array(n).fill(-1); // start i → target index
  for (let j = 1; j <= m; j++) if (pp[j]) out[pp[j] - 1] = j - 1;
  return out;
};

/* ---------- timeline utils (verbatim from the prototype) ---------- */
type Vec3 = [number, number, number];
type Key = number[];
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const keyed = (keys: Key[], p: number) => {
  if (p <= keys[0][0]) return keys[0].slice(1);
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (p <= b[0]) {
      const t = ease((p - a[0]) / (b[0] - a[0]));
      return a.slice(1).map((v, j) => lerp(v, b[j + 1], t));
    }
  }
  return keys[keys.length - 1].slice(1);
};

// timeline: hero .00–.06 · analyze .06–.39 (exploded, labels .19–.255) · wear .40–.57 · see .57–.65 · understand .65–.73
// · predict .73–.81 · throw .81–.845 · score .845–.88 · fold + pull-out .88–.93 · speak .93–.975 · out .975–1
const DIST: Key[] = [[0, 40], [0.06, 40], [0.17, 54], [0.27, 54], [0.38, 40], [1, 40]];
// return to the glasses (FOLD_T → SPEAK_T): the footage moves onto the right lens and the camera pulls straight back along the
// lens normal (first PULL_SHARE), then turns to the right-temple view
const FOLD_T = 0.88, SPEAK_T = 0.93, CLOSE_T = 0.958, CLOSE_END = 0.99, PULL_SHARE = 0.62;
// See / Understand / Predict / Throw: beats are laid out on a per-scene timeline (in seconds of reference length) and driven
// purely by scroll — the scene's scroll progress maps onto that timeline, so scrolling plays, pauses and rewinds them
const CAP_S = 1.25;
const SCENES: [number, number][] = [[0.57, 0.65], [0.65, 0.73], [0.73, 0.81], [0.81, 0.845], [0.845, FOLD_T]];
const SEE = { snap: [CAP_S, 0.4], fade: [CAP_S + 0.9, 0.5] } as const;            // brackets snap on · hold · all but the QB let go
const UND = { dark: [CAP_S, 0.8], glide: [CAP_S + 0.8, 1.4], row: 0.08 } as const;  // video to black · dots glide (row stagger)
const PRED = { ask: [CAP_S, 0.4], drift: [CAP_S + 0.4, 0.8], opts: [CAP_S + 1.2, 0.8], pick: [CAP_S + 2.0, 0.8] } as const;
const THR = { back: [CAP_S, 0.9], play: [CAP_S + 0.9, 3.0], tag: [CAP_S + 3.9, 0.5] } as const; // board → field · play runs · tag
// second clip plays on from the throw: catch · run in · celebration; then a slow push-in on the celebration
const SCR = { play: [CAP_S, 4.4], push: [CAP_S + 4.4, 0.8] } as const;
const ROWS = BOARD.map((d) => Math.round(Math.abs(d.v - LOS) / 0.05));
const GLIDE_END = UND.glide[0] + Math.max(...ROWS) * UND.row + UND.glide[1];
const UND_LABEL: [number, number] = [GLIDE_END, 0.5];
const SCENE_LEN = [SEE.fade[0] + SEE.fade[1], UND_LABEL[0] + UND_LABEL[1], PRED.pick[0] + PRED.pick[1], THR.tag[0] + THR.tag[1], SCR.push[0] + SCR.push[1]];
// the play's footage frame for Throw progress: snap → dropback in the first half, the release window gets the second half
// (stops at 99: by 101 the ball is under the navigation bar)
const THROW_END = 99;
// Score progress → second-clip frame: the flight and catch get half, the run-in a third, the celebration the rest
const scoreFrame = (t: number) => (t < 0.5 ? lerp(0, CATCH_FRAME, t / 0.5) : t < 0.82 ? lerp(CATCH_FRAME, TD_FRAME + 4, (t - 0.5) / 0.32) : lerp(TD_FRAME + 4, FEED2.count - 1, (t - 0.82) / 0.18));
const throwFrame = (t: number) => (t < 0.5 ? lerp(FREEZE_FRAME, 86, t / 0.5) : lerp(86, THROW_END, (t - 0.5) / 0.5));
const trackAt = (keys: readonly (readonly number[])[], f: number) => {
  if (f < keys[0][0] - 0.01 || f > keys[keys.length - 1][0] + 0.01) return null;
  for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) { const a = keys[i - 1], b = keys[i], k = (f - a[0]) / (b[0] - a[0]); return [1, 2, 3, 4].map((j) => lerp(a[j], b[j], k)); }
  return keys[keys.length - 1].slice(1);
};
const beat = (e: number, [t0, d]: readonly [number, number]) => clamp01((e - t0) / d);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
// scroll-linked beats: never come to a dead stop at their edges, so one beat hands straight to the next
const soft = (t: number) => 0.6 * t + 0.4 * ease(t);
// scene palette is fixed (not the site theme): light scenes #f5f5f7, the point-of-view scenes #000
const LIGHT_BG = "#f5f5f7", DARK_BG = "#000000";
// three-quarter view onto the right temple, where the speaker sits
const SPEAK_YAW = -1.0;

const LOOK: Record<string, THREE.MeshPhysicalMaterialParameters> = {
  acetate: { color: 0x09090b, roughness: 0.2, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04 },
  lens: { color: 0x2a3b20, roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02 },
  metal: { color: 0xc6cad1, roughness: 0.24, metalness: 1 },
  dark: { color: 0x2a2c31, roughness: 0.35, metalness: 0.6 },
  pcb: { color: 0x1c5a35, roughness: 0.45, metalness: 0.15, clearcoat: 0.4 },
  gold: { color: 0xc89a4a, roughness: 0.3, metalness: 1 },
  glass: { color: 0x0c0f14, roughness: 0.02, metalness: 0, clearcoat: 1 },
  led: { color: 0xffffff, roughness: 0.1, metalness: 0, emissive: 0xffffff, emissiveIntensity: 0.6 },
};

interface Part {
  obj: THREE.Group;
  off: THREE.Vector3;
  delay: number;
  internal: boolean;
  mats: THREE.MeshPhysicalMaterial[];
  center: THREE.Vector3;
  box: THREE.Box3;
}

// caption line: rises out of a mask on entry (0.9s, staggered by `step` × 100ms), fades in 0.25s on exit.
// `scroll`: the same rise, but driven frame by frame from scroll position (scenes 03–06)
function Mask({ step, children, scroll }: { step: number; children: ReactNode; scroll?: boolean }) {
  if (scroll)
    return (
      <span className="-mb-[0.14em] block overflow-hidden pb-[0.22em]">
        <span data-mask={step} style={{ transform: "translateY(110%)", opacity: 0 }} className="block will-change-transform">{children}</span>
      </span>
    );
  return (
    <span className="block overflow-hidden pb-[0.12em]">
      <span
        style={{ "--d": `${step * 100}ms` } as CSSProperties}
        className="block translate-y-[110%] opacity-0 [transition:opacity_.25s_ease,transform_0s_linear_.25s] group-data-[on=true]/cap:translate-y-0 group-data-[on=true]/cap:opacity-100 group-data-[on=true]/cap:[transition:transform_.9s_cubic-bezier(.22,1,.36,1)_var(--d),opacity_.9s_cubic-bezier(.22,1,.36,1)_var(--d)]"
      >
        {children}
      </span>
    </span>
  );
}

export default function GlassIntro() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const focusReq = useRef<string | null | undefined>(undefined);
  const stageRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const dragHintRef = useRef<HTMLParagraphElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressTextRef = useRef<HTMLSpanElement>(null);
  const feedRef = useRef<HTMLCanvasElement>(null);
  const stepsRef = useRef<HTMLOListElement>(null);
  const pipeRef = useRef<HTMLDivElement>(null);
  const sysRef = useRef<HTMLDivElement>(null);
  const speakRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current!, canvas = canvasRef.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- renderer ---------- */
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch (err) {
      // no WebGL: drop the intro instead of crashing the page
      console.error(err);
      setStatus("error");
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const envTex = pmrem.fromScene(room, 0.04).texture;
    scene.environment = envTex;
    const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(6, 12, 10); scene.add(key);
    const rimL = new THREE.DirectionalLight(0xdfe8ff, 0.8); rimL.position.set(-10, 4, -8); scene.add(rimL);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xdfe6f2, 0.45));
    // overhead light: gives the black acetate and lenses their highlights
    const top = new THREE.DirectionalLight(0xffffff, 0.9); top.position.set(0, 20, 3); scene.add(top);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 400);
    const pivot = new THREE.Group(); scene.add(pivot);
    const model = new THREE.Group(); pivot.add(model);

    // original scan's normal map, glTF UV convention
    const normalTex = new THREE.TextureLoader().load(NORMAL_URL); normalTex.flipY = false;
    const mat = (k: string) => new THREE.MeshPhysicalMaterial({ ...LOOK[k], transparent: true, side: THREE.DoubleSide });

    /* ---------- state ---------- */
    const parts: Record<string, Part> = {};
    let ledMat: THREE.MeshPhysicalMaterial | null = null, ledGlow: THREE.Sprite | null = null;
    let ready = false;
    const lensCanvas = document.createElement("canvas"), lensSize = new THREE.Vector2(); let lensTex: THREE.CanvasTexture | null = null, lensScreen: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial> | null = null, lensAspect = 1.2;

    const part = (name: string, off: Vec3, delay: number, internal: boolean) => {
      const g = new THREE.Group(); g.name = name; model.add(g);
      parts[name] = { obj: g, off: new THREE.Vector3(...off), delay, internal, mats: [], center: new THREE.Vector3(), box: new THREE.Box3() };
    };
    const addShell = (name: string, geo: THREE.BufferGeometry, kind: string) => {
      const g = parts[name].obj;
      const gm = mat(kind); gm.normalMap = normalTex;
      g.add(new THREE.Mesh(geo, gm));
      parts[name].mats.push(gm);
    };
    const addPiece = (name: string, geo: THREE.BufferGeometry, kind: string, pos: number[], rot: Vec3 = [0, 0, 0]) => {
      const m = new THREE.Mesh(geo, mat(kind)); m.position.set(pos[0], pos[1], pos[2]); m.rotation.set(...rot);
      m.userData.part = name; parts[name].obj.add(m); parts[name].mats.push(m.material);
    };

    /* ---------- build ---------- */
    const build = (root: THREE.Object3D, X: Record<string, any>) => {
      const byName: Record<string, THREE.BufferGeometry> = {};
      root.traverse((o) => { if ((o as THREE.Mesh).isMesh) byName[o.name || o.parent!.name] = (o as THREE.Mesh).geometry; });
      const SHELL: Record<string, { off: Vec3; d: number; kind: string }> = {
        frame: { off: [0, 0, 1.6], d: 0.08, kind: "acetate" },
        lensL: { off: [-0.7, -1.5, 5.6], d: 0.18, kind: "lens" },
        lensR: { off: [0.5, -1.5, 5.6], d: 0.21, kind: "lens" },
        templeL: { off: [-1.7, 0.6, -4.6], d: 0, kind: "acetate" },
        templeR: { off: [1.7, 0.6, -4.6], d: 0.03, kind: "acetate" },
      };
      for (const [n, s] of Object.entries(SHELL)) {
        part(n, s.off, s.d, false);
        if (byName[n]) addShell(n, byName[n], s.kind);
      }
      // internals placed along each temple's centreline (anchors baked into the model)
      for (const [side, sg] of [["L", -1], ["R", 1]] as const) {
        const A = X["temple" + side] || {}, at = (f: number): number[] => A[String(f)] || [6.5 * sg, 1.35, 3.8 - f * 14];
        const inner = sg * -0.12;
        const sp = at(0.15), bd = at(0.3), bt = at(0.45);
        const front = A.front ?? 5.9;
        part("hinge" + side, [sg * 0.6, 0.3, 2.3], 0.12, true);
        addPiece("hinge" + side, new RoundedBoxGeometry(0.42, 0.72, 1.0, 2, 0.08), "metal", [sp[0] + inner, sp[1] + 0.05, front - 0.2]);
        addPiece("hinge" + side, new THREE.CylinderGeometry(0.16, 0.16, 0.86, 20), "metal", [sp[0] + inner, sp[1] + 0.05, front + 0.25]);
        part("speaker" + side, [sg * 1.0, 0.7, 3.1], 0.3, true);
        addPiece("speaker" + side, new THREE.CylinderGeometry(0.42, 0.42, 0.22, 40), "metal", [sp[0], sp[1], sp[2] - 0.6], [0, 0, Math.PI / 2]);
        addPiece("speaker" + side, new THREE.CylinderGeometry(0.33, 0.33, 0.24, 40), "dark", [sp[0] + sg * 0.01, sp[1], sp[2] - 0.6], [0, 0, Math.PI / 2]);
        part("board" + side, [sg * 1.25, 0.95, 2.5], 0.34, true);
        addPiece("board" + side, new RoundedBoxGeometry(0.1, 0.8, 3.0, 2, 0.03), "pcb", [bd[0] + inner, bd[1], bd[2]]);
        for (const [dz, l, h] of [[-0.8, 0.5, 0.36], [0, 0.7, 0.42], [0.7, 0.35, 0.3], [1.05, 0.2, 0.2]])
          addPiece("board" + side, new THREE.BoxGeometry(0.06, h, l), "dark", [bd[0] + inner + sg * 0.08, bd[1], bd[2] + dz]);
        part("battery" + side, [sg * 1.5, 1.2, 2.2], 0.38, true);
        addPiece("battery" + side, new RoundedBoxGeometry(0.34, 0.75, 2.4, 3, 0.12), "metal", [bt[0] + inner, bt[1], bt[2] - 0.2]);
        addPiece("battery" + side, new THREE.BoxGeometry(0.32, 0.5, 0.12), "gold", [bt[0] + inner, bt[1], bt[2] + 1.05]);
      }
      // camera stack, pulled out sideways like a lens teardown
      const cp: number[] = X.camera || [-6.32, 1.55, 7.07];
      const cam: [string, string, THREE.BufferGeometry, Vec3, number][] = [
        ["cam", "dark", new RoundedBoxGeometry(0.7, 0.7, 0.5, 2, 0.1), [-4.2, 0.4, 2.4], 0.24],
        ["ring1", "metal", new THREE.TorusGeometry(0.22, 0.045, 12, 40), [-3.4, 0.4, 2.4], 0.27],
        ["ring2", "metal", new THREE.TorusGeometry(0.22, 0.045, 12, 40), [-2.9, 0.4, 2.4], 0.29],
        ["ring3", "metal", new THREE.TorusGeometry(0.22, 0.045, 12, 40), [-2.4, 0.4, 2.4], 0.31],
        ["sensor", "pcb", new RoundedBoxGeometry(0.6, 0.6, 0.12, 2, 0.04), [-1.8, 0.4, 2.4], 0.33],
      ];
      for (const [n, k, g, off, d] of cam) {
        part(n, off, d, true);
        addPiece(n, g, k, [cp[0], cp[1], cp[2] - 0.3]);
        if (n === "cam") addPiece(n, new THREE.CylinderGeometry(0.22, 0.22, 0.3, 32), "glass", [cp[0], cp[1], cp[2] - 0.02], [Math.PI / 2, 0, 0]);
      }
      const ledPos: number[] = X.led || [6.31, 1.54, 7.18];
      addPiece("frame", new THREE.SphereGeometry(0.07, 16, 12), "led", ledPos);
      ledMat = parts.frame.mats[parts.frame.mats.length - 1];
      const gc = document.createElement("canvas"); gc.width = gc.height = 64;
      const gx = gc.getContext("2d")!, gg = gx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gg.addColorStop(0, "rgba(255,255,255,1)"); gg.addColorStop(0.25, "rgba(255,255,255,0.35)"); gg.addColorStop(1, "rgba(255,255,255,0)");
      gx.fillStyle = gg; gx.fillRect(0, 0, 64, 64);
      ledGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(gc), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, depthTest: false, toneMapped: false, opacity: 0 }));
      ledGlow.position.set(ledPos[0], ledPos[1], ledPos[2] + 0.05); ledGlow.scale.setScalar(1.1); ledGlow.renderOrder = 10;
      parts.frame.obj.add(ledGlow);

      for (const k in parts) { const box = parts[k].box.setFromObject(parts[k].obj); if (!box.isEmpty()) box.getCenter(parts[k].center); }
      // the right lens as a screen: its own geometry with planar UVs, textured with the point-of-view footage
      if (byName.lensR) {
        const lg = byName.lensR.clone(); lg.computeBoundingBox();
        const bb = lg.boundingBox!, pos = lg.attributes.position, uv = new Float32Array(pos.count * 2);
        for (let i = 0; i < pos.count; i++) { uv[i * 2] = 1 - (pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x); uv[i * 2 + 1] = (pos.getY(i) - bb.min.y) / (bb.max.y - bb.min.y); }
        lg.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
        lensAspect = (bb.max.x - bb.min.x) / (bb.max.y - bb.min.y);
        lensTex = new THREE.CanvasTexture(lensCanvas); lensTex.colorSpace = THREE.SRGBColorSpace;
        lensScreen = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ map: lensTex, transparent: true, opacity: 0, side: THREE.BackSide, toneMapped: false, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 })); // inner face only
        lensScreen.renderOrder = 6; lensScreen.visible = false; parts.lensR.obj.add(lensScreen);
        lensSize.set(bb.max.x - bb.min.x, bb.max.y - bb.min.y);
      }
      for (const k in parts) for (const m of parts[k].mats) m.envMapIntensity = 2;
      ready = true;
    };

    /* ---------- soft floor shadow ---------- */
    const shadowCanvas = document.createElement("canvas"); shadowCanvas.width = shadowCanvas.height = 128;
    const sctx = shadowCanvas.getContext("2d")!, gr = sctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(20,30,50,.45)"); gr.addColorStop(1, "rgba(20,30,50,0)");
    sctx.fillStyle = gr; sctx.fillRect(0, 0, 128, 128);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = -5.4; shadow.scale.set(22, 18, 1); scene.add(shadow);

    /* ---------- rotate gizmo (Unity-style, monochrome): equator ring = turn, meridian ring = tilt, a bead on each ---------- */
    const GZ_R = 7.8;
    const ringMat = new THREE.LineBasicMaterial({ color: 0x6e6e73, transparent: true, opacity: 0 });
    const ringGeo = (plane: "xz" | "yz") => new THREE.BufferGeometry().setFromPoints(
      new THREE.EllipseCurve(0, 0, GZ_R, GZ_R).getPoints(200).map((v) => (plane === "xz" ? new THREE.Vector3(v.x, 0, v.y) : new THREE.Vector3(0, v.x, v.y))),
    );
    const equator = new THREE.LineLoop(ringGeo("xz"), ringMat), meridian = new THREE.LineLoop(ringGeo("yz"), ringMat);
    const beadMat = new THREE.MeshBasicMaterial({ color: 0x1d1d1f, transparent: true, opacity: 0 });
    const beadGeo = new THREE.SphereGeometry(0.17, 20, 14);
    const beadA = new THREE.Mesh(beadGeo, beadMat), beadB = new THREE.Mesh(beadGeo, beadMat);
    const gizmo = new THREE.Group(); gizmo.add(equator, meridian, beadA, beadB); gizmo.rotation.set(0.38, -0.6, 0); scene.add(gizmo);

    /* ---------- input ---------- */
    // scroll → timeline: BASE screens at an even pace, plus extra screens parked where there is something to read
    // (keep h-[…vh] on the section = (BASE + extras + 1) * 100 → 3500vh)
    const BASE = 11.4;
    // about one screen of scroll per beat in the point-of-view scenes, so a normal trackpad pace doesn't rush past them:
    // see ≈2.5 screens · understand ≈3.5 · predict ≈4 · throw ≈3.9 · score ≈3.3 · fold ≈2 · speak ≈2
    const STRETCH: [number, number, number][] = [[0.19, 0.255, 2], [0.57, 0.65, 1.6], [0.65, 0.73, 2.6], [0.73, 0.81, 3.1], [0.81, 0.845, 3.5], [0.845, FOLD_T, 2.9], [FOLD_T, SPEAK_T, 1.4], [SPEAK_T, CLOSE_T, 1.4], [CLOSE_T, CLOSE_END, 2.6], [CLOSE_END, 1, 1.5]]; // last: the hand-off to About
    const knots: [number, number][] = [[0, 0]]; // [t, screens]
    for (const [t0, t1, extra] of STRETCH) {
      const [pt, ps] = knots[knots.length - 1];
      knots.push([t0, ps + (t0 - pt) * BASE], [t1, ps + (t0 - pt) * BASE + (t1 - t0) * BASE + extra]);
    }
    { const [pt, ps] = knots[knots.length - 1]; knots.push([1, ps + (1 - pt) * BASE]); }
    const total = knots[knots.length - 1][1];
    const remap = (u: number) => {
      const sc = u * total;
      for (let i = 1; i < knots.length; i++) if (sc <= knots[i][1]) return lerp(knots[i - 1][0], knots[i][0], (sc - knots[i - 1][1]) / (knots[i][1] - knots[i - 1][1]));
      return 1;
    };
    // inverse: timeline t → screens scrolled, so the turntable turns at one steady rate per screen in every stage
    const screensAt = (t: number) => {
      for (let i = 1; i < knots.length; i++) if (t <= knots[i][0]) return lerp(knots[i - 1][1], knots[i][1], (t - knots[i - 1][0]) / (knots[i][0] - knots[i - 1][0]));
      return total;
    };
    // turntable: exactly one turn, only while the hardware comes apart and back together (.06–.38);
    // otherwise it holds still and the visitor turns it by dragging
    // from wherever they leave it. Only "wear" picks an angle: temples toward the viewer, as if lifting them to your face.
    const YAW0 = 0.6, WEAR0 = 0.4, SPIN0 = screensAt(0.06), SPIN1 = screensAt(0.38);
    const baseYaw = (t: number) => YAW0 + (Math.PI * 2 * (screensAt(Math.min(Math.max(t, 0.06), 0.38)) - SPIN0)) / (SPIN1 - SPIN0);
    let breath = 1, dragged = false, dragHintA = 0;
    let outK = 0;
    let pTarget = 0, pCur = 0, mx = 0, my = 0, smy = 0, w = 1, h = 1, visible = true;
    let nudge = 0, tilt = 0, drag = false, moved = false, picking = false, downX = 0, downY = 0, smx = 0, lastT = 0, px = 0, py = 0;
    const readScroll = () => {
      const r = section.getBoundingClientRect();
      pTarget = remap(clamp01(-r.top / (r.height - window.innerHeight)));
      visible = r.bottom > 0 && r.top < window.innerHeight;
      // last screen of the section: About (tucked underneath) rises while the stage dissolves; tied to scroll, so it reverses
      // over the last 2.5 screens: the intro dissolves while pinned (nothing moves), then About rises in as it fades up
      outK = clamp01((3.5 * window.innerHeight - r.bottom) / (2.5 * window.innerHeight));
    };
    const ndc = new THREE.Vector2(), ray = new THREE.Raycaster(); let hovered: string | null = null;
    let focus: string | null = null, fKey: string | null = null, fAmt = 0;
    const inv = new THREE.Matrix4(), lray = new THREE.Ray(), hitBox = new THREE.Box3(), fc = new THREE.Vector3(), fSize = new THREE.Vector3();
    // box test in model space; smallest hit wins so lenses and internals beat the frame around them
    const pick = (): string | null => {
      ray.setFromCamera(ndc, camera);
      lray.copy(ray.ray).applyMatrix4(inv.copy(model.matrixWorld).invert());
      let best: string | null = null, vol = Infinity;
      for (const k in parts) {
        const P = parts[k]; if (!P.obj.visible || P.box.isEmpty()) continue;
        hitBox.copy(P.box).translate(P.obj.position);
        if (!lray.intersectsBox(hitBox)) continue;
        const v = hitBox.getSize(fSize).x * fSize.y * fSize.z;
        if (v < vol) { vol = v; best = k; }
      }
      return best && (best.startsWith("ring") || best === "sensor") ? "cam" : best;
    };
    const onPointer = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width) * 2 - 1; my = ((e.clientY - r.top) / r.height) * 2 - 1; ndc.set(mx, -my); moved = true;
      if (drag) { nudge += (e.clientX - px) * 0.008; tilt = Math.max(-0.5, Math.min(0.5, tilt + (e.clientY - py) * 0.005)); px = e.clientX; py = e.clientY; }
    };
    const onDown = (e: PointerEvent) => { if (pCur > WEAR0) return; drag = true; dragged = true; px = downX = e.clientX; py = downY = e.clientY; canvas.setPointerCapture(e.pointerId); };
    const onUp = (e: PointerEvent) => {
      drag = false;
      if (e.type !== "pointerup" || !picking || Math.hypot(e.clientX - downX, e.clientY - downY) > 5) return;
      const r = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
      const k = pick(); focus = k && k !== focus ? k : null;
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") focus = null; };
    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    window.addEventListener("scroll", readScroll, { passive: true });
    window.addEventListener("pointermove", onPointer);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", onKey);
    document.documentElement.style.setProperty("--about-pull", "-100vh");
    readScroll(); resize();


    /* ---------- point-of-view feed: footage scrubbed by scroll, YOLO-style boxes, then the AI read-out ---------- */
    const frames: HTMLImageElement[] = [], frames2: HTMLImageElement[] = [];
    const loadFeed = () => {
      for (let i = 1; i <= FEED.count; i++) { const im = new Image(); im.decoding = "async"; im.src = `${FEED.dir}/${String(i).padStart(4, "0")}.${FEED.ext}`; frames.push(im); }
      for (let i = 1; i <= FEED2.count; i++) { const im = new Image(); im.decoding = "async"; im.src = `${FEED2.dir}/${String(i).padStart(4, "0")}.${FEED2.ext}`; frames2.push(im); }
    };
    // dots: start (frozen-frame feet) → board target, by minimum total travel per side; cached per canvas size
    let feedKey = "", lensKey = "", lensPpu = 1;
    const featherCanvas = document.createElement("canvas");
    let glideFor = "", glideFrom: ({ x: number; y: number } | null)[] = [];
    const drawFeed = (pov: number, p: number, lensOn: boolean, e: number[]) => {
      const c = feedRef.current, g = c?.getContext("2d");
      if (!c || !g) return;
      c.style.opacity = String(pov);
      // keep drawing while the lens shows the footage, even once the full-screen view has handed over
      if (pov < 0.01 && !lensOn) return;
      const dpr = Math.min(window.devicePixelRatio, 2), cw = Math.round(w * dpr), ch = Math.round(h * dpr), mob = w < 768;
      if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; }
      g.clearRect(0, 0, cw, ch);
      const font = (wt: number, px: number) => `${wt} ${px * dpr}px -apple-system, "SF Pro Text", Inter, system-ui, sans-serif`;

      const [eSee, eUnd, ePred, eThr, eScr] = e;
      const snap = beat(eSee, SEE.snap), others = 1 - beat(eSee, SEE.fade), dark = soft(beat(eUnd, UND.dark));
      const back = soft(beat(eThr, THR.back)), play = beat(eThr, THR.play), tagA = soft(beat(eThr, THR.tag));
      // Score: the second clip takes over from the throw's last frame; the throw's tracking lets go as it does
      const f2 = eScr > 0 ? scoreFrame(beat(eScr, SCR.play)) : -1, im2 = f2 >= 0 ? frames2[Math.round(f2)] : undefined;
      const track = f2 >= 0 ? 0 : 1, push = soft(beat(eScr, SCR.push));
      // footage: plays to the pre-snap frame during Wear, holds through See → Predict, then the play runs in Throw
      const fr = play > 0 ? throwFrame(play) : seg(p, 0.5, 0.57) * FREEZE_FRAME, im = frames[Math.round(fr)];
      feedKey = `${cw}x${ch}|${f2 >= 0 ? `b${Math.round(f2)}|${push.toFixed(3)}` : `a${Math.round(fr)}`}`;
      const sc = Math.max(cw / FEED.width, ch / FEED.height), fw = FEED.width * sc, fh = FEED.height * sc, oy = (ch - fh) / 2;
      // narrow screens crop the frame; keep the quarterback (then the ball, once thrown) in view instead of centring
      const qb = trackAt(QB_TRACK, Math.max(fr, FREEZE_FRAME)), ball = fr >= RELEASE_FRAME ? trackAt(BALL_TRACK, fr) : null;
      const fx = ball ? ball[0] + ball[2] / 2 : qb ? qb[0] + qb[2] / 2 : 0.5;
      const ox = fw > cw ? Math.min(0, Math.max(cw - fw, cw / 2 - fx * fw)) : (cw - fw) / 2;
      const box = (b: number[]) => [ox + b[0] * fw, oy + b[1] * fh, b[2] * fw, b[3] * fh];
      const bracket = (X: number, Y: number, W: number, H: number, strong: boolean) => { g.strokeStyle = "#ffffff"; bracketPath(X, Y, W, H, strong); g.stroke(); };
      const bracketPath = (X: number, Y: number, W: number, H: number, strong: boolean) => {
        const r = (strong ? 9 : 6) * dpr, L = Math.max(r + 3 * dpr, Math.min(W, H) * 0.22);
        g.lineWidth = (strong ? 1.5 : 1) * dpr; g.lineCap = "round";
        g.beginPath();
        g.moveTo(X, Y + L); g.arcTo(X, Y, X + L, Y, r); g.lineTo(X + L, Y);
        g.moveTo(X + W - L, Y); g.arcTo(X + W, Y, X + W, Y + L, r); g.lineTo(X + W, Y + L);
        g.moveTo(X + W, Y + H - L); g.arcTo(X + W, Y + H, X + W - L, Y + H, r); g.lineTo(X + W - L, Y + H);
        g.moveTo(X + L, Y + H); g.arcTo(X, Y + H, X, Y + H - L, r); g.lineTo(X, Y + H - L);
      };

      const videoA = 1 - dark * (1 - back);
      if (f2 >= 0 && im2?.complete && im2.naturalWidth) {
        // follow the ball with a zoom while it is in the air, the receiver after the catch; normalised, so it carries over
        // to an upscaled source unchanged. The closing push-in rides on top.
        const zf = 1 + 0.6 * soft(clamp01(f2 / 8)) * (1 - soft(clamp01((f2 - 44) / 18)));
        const dodge = trackAt(LOGO_DODGE.map(([f, zm, dx]) => [f, zm, dx, 0, 0]), f2) ?? [1, 0];
        const z = zf * dodge[0] * (1 + 0.12 * push), zw = fw * z, zh = fh * z;
        const bt = trackAt(BALL_TRACK2, Math.min(f2, CATCH_FRAME)), rt = trackAt(RECEIVER_TRACK2, Math.max(42, Math.min(f2, 112)));
        const fb = clamp01((f2 - 40) / 14), ctr = bt && rt ? [lerp(bt[0] + bt[2] / 2, rt[0] + rt[2] / 2, fb) + dodge[1], lerp(bt[1] + bt[3] / 2, rt[1] + rt[3] * 0.4, fb)] : [0.5, 0.5];
        const k0 = 1 - soft(clamp01((f2 - 104) / 20)); // celebration: back to centre for the push-in
        const zx = Math.min(0, Math.max(cw - zw, cw / 2 - lerp(0.5, ctr[0], k0) * zw)), zy = Math.min(0, Math.max(ch - zh, ch / 2 - lerp(0.5, ctr[1], k0) * zh));
        g.drawImage(im2, zx, zy, zw, zh);
        const box2 = (b: number[]) => [zx + b[0] * zw, zy + b[1] * zh, b[2] * zw, b[3] * zh];
        // the predicted route, carried through the whip and locked to the field, drawn in step with the flight; it lets go after the catch
        // clip 2: the camera whips and follows the ball, so a field-locked line floats on empty grass; instead the ball leaves
        // a short blue comet of its last few positions (near-identical camera over 4 frames), fading after the catch
        if (f2 <= CATCH_FRAME + 8) {
          const fade = 1 - clamp01((f2 - CATCH_FRAME) / 8);
          for (let k = 1; k <= 8; k++) {
            const q = trackAt(BALL_TRACK2, Math.min(CATCH_FRAME, f2) - k * 0.5); if (!q) break;
            const [qx, qy, qw, qh] = box2(q);
            g.globalAlpha = fade * 0.8 * (1 - k / 9); g.fillStyle = "#2997ff";
            g.beginPath(); g.arc(qx + qw / 2, qy + qh / 2, (3.2 - k * 0.25) * dpr, 0, Math.PI * 2); g.fill();
          }
          g.globalAlpha = 1;
        }
        if (bt && f2 <= CATCH_FRAME) { const [bx, by, bw2, bh2] = box2(bt); g.globalAlpha = 1; bracket(bx - 4 * dpr, by - 4 * dpr, bw2 + 8 * dpr, bh2 + 8 * dpr, true); }
        // receiver: bracket from the catch; "Receiver" rolls up into "Touchdown" as he crosses, with one blue flash
        const ra = clamp01((f2 - 44) / 6) * (1 - clamp01((f2 - 106) / 8));
        if (rt && ra > 0) {
          const [X, Y, W, H] = box2(rt), roll = soft(clamp01((f2 - TD_FRAME) / 7)), flash = Math.sin(Math.PI * clamp01((f2 - TD_FRAME) / 9));
          g.globalAlpha = ra; bracket(X, Y, W, H, true);
          if (flash > 0) { g.globalAlpha = ra * flash; g.strokeStyle = "#2997ff"; g.shadowColor = "#2997ff"; g.shadowBlur = 14 * dpr; bracketPath(X, Y, W, H, true); g.stroke(); g.shadowBlur = 0; }
          const lh = 18 * dpr, ly = Y - 9 * dpr;
          g.save(); g.beginPath(); g.rect(X - 2 * dpr, ly - lh, Math.max(W, 160 * dpr), lh + 4 * dpr); g.clip();
          g.globalAlpha = ra; g.font = font(600, 13); g.fillStyle = "#ffffff"; g.textBaseline = "alphabetic";
          if (roll < 1) g.fillText(RECEIVER_LABEL, X, ly - roll * lh);
          if (roll > 0) g.fillText(TOUCHDOWN, X, ly + (1 - roll) * lh);
          g.restore();
        }
        g.globalAlpha = 1;
      } else if (videoA > 0.001 && im?.complete && im.naturalWidth) {
        g.globalAlpha = videoA; g.drawImage(im, ox, oy, fw, fh);
        g.fillStyle = `rgba(0,0,0,${0.2 * snap})`; g.fillRect(0, 0, cw, ch); g.globalAlpha = 1;
      }

      // See: every visible player bracketed at once (1.08 → 1), then all but the quarterback let go
      if (snap > 0 && dark < 1 && back === 0) {
        const k = easeOut(snap), grow = lerp(1.08, 1, k);
        for (const d of FROZEN) {
          const isQb = !!d.name, a = k * (isQb ? 1 : others) * (1 - dark);
          if (a <= 0.001) continue;
          const [X0, Y0, W0, H0] = box(d.box), W = W0 * grow, H = H0 * grow, X = X0 + W0 / 2 - W / 2, Y = Y0 + H0 / 2 - H / 2;
          g.globalAlpha = a * (isQb ? 1 : 0.75); bracket(X, Y, W, H, isQb);
          if (isQb) { g.font = font(600, 13); g.fillStyle = "#ffffff"; g.textBaseline = "alphabetic"; g.fillText(d.name!, X, Y - 9 * dpr); }
        }
        g.globalAlpha = 1;
      }

      // Throw: the board has folded back onto the field; track the quarterback, then the ball, and its path in the air
      if (back > 0 && qb && track > 0) {
        g.globalAlpha = back * track; const [X, Y, W, H] = box(qb); bracket(X, Y, W, H, true);
        g.font = font(600, 13); g.fillStyle = "#ffffff"; g.textBaseline = "alphabetic"; g.fillText("Quarterback", X, Y - 9 * dpr);
        const bb = trackAt(BALL_TRACK, fr);
        if (bb) {
          // (the predicted route is not projected onto the footage: off the receiver it reads as a stray line on empty grass)
          const [bx, by, bw2, bh2] = box(bb); bracket(bx - 4 * dpr, by - 4 * dpr, bw2 + 8 * dpr, bh2 + 8 * dpr, true);
          g.fillStyle = "#ffffff"; g.fillText("Ball", bx - 4 * dpr, by - 12 * dpr);
          if (tagA > 0) {
            g.globalAlpha = back * tagA * track; g.font = font(600, mob ? 13 : 15); g.fillStyle = "#ffffff";
            const tw = g.measureText(THROW_TAG).width, tx = Math.min(cw - tw - 16 * dpr, Math.max(16 * dpr, bx + bw2 / 2 - tw / 2));
            g.fillText(THROW_TAG, tx, by + bh2 + 26 * dpr);
          }
        }
        g.globalAlpha = 1;
      }
      if (eUnd <= UND.glide[0]) return;

      // Understand → Predict: one centred board that never moves; in Throw it folds back onto the players
      // the third cap keeps the board top (and the label + question above it, ~50px) below the navbar on wide, short screens (ultrawide/curved monitors)
      const bw = mob ? cw * 0.9 : Math.min(cw * 0.46, ch * 1.17, (h * 1.14 - 360) * dpr), bh = bw / (mob ? 1.25 : 1.5), keep = 1 - back; // back already eases out again in Score
      if (keep <= 0.001) return;
      const BX = cw * 0.5 - bw / 2, BY = ch * (mob ? 0.3 : 0.38) - bh / 2, at = (u: number, v: number) => [BX + u * bw, BY + v * bh];
      const key = `${cw}x${ch}`;
      if (glideFor !== key) {
        glideFor = key; glideFrom = BOARD.map(() => null);
        for (const side of ["Offense", "Defense"] as const) {
          const S = FROZEN.filter((d) => d.side === side).map((d) => { const [X, Y, W, H] = box(d.box); return { x: X + W / 2, y: Y + H }; });
          const Ti = BOARD.map((d, i) => (d.side === side ? i : -1)).filter((i) => i >= 0);
          const pick = assign(S.map((q) => Ti.map((i) => { const [tx, ty] = at(BOARD[i].u, BOARD[i].v); return Math.hypot(q.x - tx, q.y - ty); })));
          pick.forEach((j, si) => { if (j >= 0) glideFrom[Ti[j]] = S[si]; });
        }
      }
      const fieldA = soft(beat(eUnd, [UND.glide[0], 0.6])) * keep;
      g.lineWidth = 1 * dpr; g.strokeStyle = `rgba(255,255,255,${0.22 * fieldA})`;
      g.beginPath(); g.roundRect(BX, BY, bw, bh, 14 * dpr); g.stroke();
      g.strokeStyle = `rgba(255,255,255,${0.07 * fieldA})`;
      for (let k = 1; k < 10; k++) { const [x0, y0] = at(0, k / 10), [x1] = at(1, 0); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.stroke(); }
      { const [x0, y0] = at(0, LOS), [x1] = at(1, 0); g.strokeStyle = `rgba(255,255,255,${0.35 * fieldA})`; g.setLineDash([4 * dpr, 5 * dpr]); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.stroke(); g.setLineDash([]); }

      // Predict, in sequence: safeties split and the gap opens → the policy's three throws appear → it settles on one
      const drift = soft(beat(ePred, PRED.drift)), opts = soft(beat(ePred, PRED.opts)), pick = soft(beat(ePred, PRED.pick));
      if (drift > 0) {
        const [x0, y0] = at(SEAM[0], SEAM[1]), [x1, y1] = at(SEAM[2], SEAM[3]);
        const gr = g.createLinearGradient(x0, 0, x1, 0);
        gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.5, `rgba(255,255,255,${0.14 * drift * keep})`); gr.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = gr; g.beginPath(); g.roundRect(x0, y0, x1 - x0, y1 - y0, 12 * dpr); g.fill();
      }
      if (opts > 0) {
        g.textBaseline = "alphabetic";
        for (const o of OPTIONS) {
          const a = keep * (o.pick ? 1 : 1 - pick) * Math.min(1, opts * 1.4);
          if (a <= 0.001) continue;
          const pts = o.route.map(([u, v]) => at(u, v)), segs = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
          let left = segs.reduce((x, y) => x + y, 0) * opts, end = pts[0], dir = [0, -1];
          const blue = o.pick ? pick : 0;
          g.globalAlpha = a; g.strokeStyle = blue > 0 ? `rgba(41,151,255,${0.55 + 0.45 * blue})` : "rgba(255,255,255,0.55)";
          g.lineWidth = (1.2 + 0.8 * blue) * dpr; g.lineCap = "round"; g.lineJoin = "round"; g.setLineDash(blue > 0.5 ? [] : [5 * dpr, 4 * dpr]);
          g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
          for (let i = 0; i < segs.length && left > 0; i++) {
            const k = Math.min(1, left / segs[i]), nx = lerp(pts[i][0], pts[i + 1][0], k), ny = lerp(pts[i][1], pts[i + 1][1], k);
            g.lineTo(nx, ny); dir = [pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]]; end = [nx, ny]; left -= segs[i];
          }
          g.stroke(); g.setLineDash([]);
          const dl = Math.hypot(dir[0], dir[1]) || 1, ux = dir[0] / dl, uy = dir[1] / dl, s8 = 7 * dpr;
          g.fillStyle = g.strokeStyle; g.beginPath(); g.moveTo(end[0] + ux * 2 * dpr, end[1] + uy * 2 * dpr);
          g.lineTo(end[0] - ux * s8 - uy * s8 * 0.6, end[1] - uy * s8 + ux * s8 * 0.6); g.lineTo(end[0] - ux * s8 + uy * s8 * 0.6, end[1] - uy * s8 - ux * s8 * 0.6); g.fill();
          if (opts >= 1 && (!mob || o.pick)) {
            const lab = `${o.name} ${Math.round(o.prob * 100)}%`;
            g.font = font(o.pick ? 600 : 500, mob ? 11 : 13); g.fillStyle = blue > 0.5 ? "#2997ff" : "rgba(255,255,255,0.8)";
            const lw = g.measureText(lab).width, lx = Math.min(BX + bw - lw - 6 * dpr, Math.max(BX + 6 * dpr, end[0] - lw / 2));
            g.fillText(lab, lx, end[1] - 12 * dpr);
          }
        }
        g.globalAlpha = 1;
      }

      // players lift from where they stood and glide to the board, line of scrimmage first, outward row by row;
      // in Throw the same paths run backwards onto the players
      BOARD.forEach((d, i) => {
        const gk = soft(beat(eUnd, [UND.glide[0] + ROWS[i] * UND.row, UND.glide[1]])) * keep;
        if (gk <= 0) return;
        const [tx, ty] = at(d.u + (d.safety ? (d.u < 0.5 ? -1 : 1) * SAFETY_DRIFT * drift : 0), d.v);
        const src = glideFrom[i];
        const x = src ? lerp(src.x, tx, gk) : tx, y = src ? lerp(src.y, ty, gk) : ty;
        g.globalAlpha = src ? Math.min(1, keep * 4) : gk; // players who were out of shot simply appear (and leave) in place
        const rad = (mob ? 4 : 5) * dpr;
        if (d.side === "Offense") { g.fillStyle = "#ffffff"; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill(); }
        else { g.strokeStyle = "rgba(255,255,255,0.85)"; g.lineWidth = 1.5 * dpr; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.stroke(); }
      });
      g.globalAlpha = 1;


      // the one context label, and the wearer's question above the board
      g.textBaseline = "alphabetic"; g.textAlign = "center"; g.fillStyle = "#ffffff";
      const la = soft(beat(eUnd, UND_LABEL)) * keep;
      if (la > 0) { g.globalAlpha = la; g.font = font(600, mob ? 13 : 14); g.fillText(BOARD_LABEL, cw / 2, BY - 12 * dpr); } // above the board, clear of the routes
      const qa = soft(beat(ePred, PRED.ask)) * keep;
      if (qa > 0) { g.globalAlpha = qa * 0.6; g.font = font(500, mob ? 13 : 15); g.fillText(QUESTION, cw / 2, BY - 36 * dpr); }
      g.textAlign = "left"; g.globalAlpha = 1;
    };

    // one sound ring: 1px light sky-blue stroke, scale 1 → 2.4 and fade over 1.2s, ease-out
    const emitRing = () => {
      const host = speakRef.current; if (!host) return;
      const r = document.createElement("span");
      r.className = "absolute left-0 top-0 h-28 w-28 rounded-full border border-[#8fd3ff]";
      host.appendChild(r);
      r.animate(
        [{ transform: "translate(-50%,-50%) scale(1)", opacity: 0.95 }, { transform: "translate(-50%,-50%) scale(2.4)", opacity: 0 }],
        { duration: 1200, easing: "cubic-bezier(0.16,1,0.3,1)", fill: "forwards" },
      ).onfinish = () => r.remove();
    };

    /* ---------- frame loop ---------- */
        let lastIdx = -1, raf = 0, sceneE = [0, 0, 0, 0, 0], spokeAt = -1, spokenShown = -1;
    const textW: number[] = [];
    const v3 = new THREE.Vector3(), nrm = new THREE.Vector3(), lensW = new THREE.Vector3(), camBase = new THREE.Vector3(), lensT = new THREE.Vector3(), eyeW = new THREE.Vector3(), look = new THREE.Vector3(), tmp = new THREE.Vector3();
    const frame = (time: number) => {
      raf = requestAnimationFrame(frame);
      if (!ready || !visible) return;
      const t = time * 0.001, dt = Math.min(0.05, t - lastT); lastT = t;
      const damp = (rate: number) => 1 - Math.exp(-dt * rate);
      // tight follow once worn (the scenes are scroll-scrubbed); softer before, where it also carries the turntable
      pCur += (pTarget - pCur) * (reduce ? 1 : damp(pTarget > WEAR0 ? 12 : 4.5));
      const p = pCur;
      smx += (mx - smx) * damp(2.5); smy += (my - smy) * damp(2.5);
      if (focusReq.current !== undefined) { focus = focusReq.current === focus ? null : focusReq.current; focusReq.current = undefined; }
      if (focus) fKey = focus;
      fAmt += ((focus ? 1 : 0) - fAmt) * damp(3.2);
      const fe = ease(fAmt), inFocus = (k: string) => k === fKey || (fKey === "cam" && (k.startsWith("ring") || k === "sensor"));

      // return: pull = the straight pull-back from behind the right lens; turn = round to the right-temple view
      const fu = seg(p, FOLD_T, SPEAK_T - 0.004), returning = p >= FOLD_T;
      const pull = clamp01(fu / PULL_SHARE), turn = ease(clamp01((fu - PULL_SHARE) / (1 - PULL_SHARE)));
      // scene timelines follow scroll; the last 5% of each scene is where its caption lets go
      SCENES.forEach(([a0, a1], k) => { sceneE[k] = SCENE_LEN[k] * seg(p, a0, a0 + (a1 - a0) * 0.95); });

      const ex = ease(seg(p, 0.06, 0.17)) * (1 - ease(seg(p, 0.27, 0.38)));
      const wr = ease(seg(p, WEAR0, 0.56));          // lifting the glasses to your face
      const sp = turn;                               // round to the speaker view, after the pull-back
      const worn = returning ? 0 : wr;
      // the full-screen view hands over to the lens in the first moments of the pull (the lens fills the screen then)
      const pov = ease(seg(p, 0.46, 0.55)) * (returning ? 1 - clamp01(pull / 0.1) : 1);
      const go = returning ? 1 - soft(clamp01((seg(p, CLOSE_T, CLOSE_END - 0.006)) / 0.25)) : 1 - ease(seg(p, 0.53, 0.58));
      let lensA = returning ? 1 : 0; // refined by camera angle once the camera is placed
      // background: #000 → #f5f5f7 during the pull-back, so there is never an empty frame
      const bgK = returning ? soft(clamp01((pull - 0.15) / 0.65)) : 0;
      const speakOn = p >= SPEAK_T && p < CLOSE_T;
      // closing: the glasses step back and the whole system is drawn, stage by stage
      const closeK = seg(p, CLOSE_T, CLOSE_END - 0.006), closeOut = soft(clamp01(closeK / 0.25));
      // capture LED breathes while the finished glasses are on screen: reads instantly as a camera, i.e. smart glasses
      const pulse = reduce ? 0.6 : Math.pow(0.5 + 0.5 * Math.sin(t * 2.4), 2);
      if (ledMat) ledMat.emissiveIntensity = 0.3 + 2.6 * pulse;
      if (ledGlow) {
        // drawn without depth (the LED sits just under the frame surface), so fade it when the front turns away
        ledGlow.getWorldPosition(v3); const facing = tmp.set(0, 0, 1).applyQuaternion(pivot.quaternion).dot(v3.sub(camera.position).negate().normalize());
        ledGlow.material.opacity = pulse * go * clamp01(facing * 3) * 0.95;
      }

      for (const k in parts) {
        const P = parts[k], e = ease(clamp01((ex - P.delay) / 0.58));
        P.obj.position.copy(P.off).multiplyScalar(e);
        // focus: everything but the selected part recedes
        const dim = fKey && !inFocus(k) ? 1 - fe : 1;
        if (P.internal) { for (const m of P.mats) { m.opacity = clamp01(ex * 8) * dim; m.depthWrite = dim > 0.99; } }
        else for (const m of P.mats) {
          // lenses clear to a light tint as they come up to your eyes
          m.opacity = go * dim * (m === P.mats[0] && k.startsWith("lens") ? lerp(1, 0.2, returning ? 1 - turn : worn) : 1);
          m.depthWrite = m.opacity > 0.99;
        }
        P.obj.visible = (!P.internal || ex > 0.004) && dim > 0.02 && go > 0.01;
        const hl = !focus && (hovered === k || ((k.startsWith("ring") || k === "sensor") && hovered === "cam"));
        for (const m of P.mats) if (m !== ledMat) { m.emissive.setHex(hl ? 0x8a94a6 : 0); m.emissiveIntensity = hl ? 0.22 : 0; }
      }

      const dist0 = lerp(keyed(DIST, p)[0], 30, sp);
      const free = reduce ? 0 : 1 - worn;
      let yaw = baseYaw(p) + nudge;
      // wear: shortest way round to temples-toward-you (front facing away), so the glasses come up to your face;
      // speak: then round to a three-quarter view of the right temple
      yaw += Math.atan2(Math.sin(Math.PI - yaw), Math.cos(Math.PI - yaw)) * wr;
      yaw += Math.atan2(Math.sin(SPEAK_YAW - yaw), Math.cos(SPEAK_YAW - yaw)) * sp;
      const pitch = (0.22 + tilt) * (1 - wr) + 0.14 * sp;
      // gentle look-around parallax, damped
      // touch and pointer only steer the model before it is worn; after that the page is scroll only
      const par = free * (1 - fe) * (1 - seg(p, 0.38, 0.4));
      // idle breathing: a slow float and a faint sway, off while dragging, focused or wearing
      breath += ((drag ? 0 : 1) - breath) * damp(2);
      const br = reduce ? 0 : breath * par;
      pivot.rotation.set(pitch + smy * 0.12 * par + Math.sin(t * 0.55) * 0.025 * br, yaw + smx * 0.1 * par + Math.sin(t * 0.4) * 0.05 * br, 0);
      pivot.position.y = Math.sin(t * 0.8) * 0.16 * br;
      const fit = camera.aspect < 1.2 ? Math.min(2.2, 1.2 / camera.aspect) : 1;
      pivot.updateMatrixWorld(true);
      // frame the model a little above centre (the caption owns the bottom of the screen)
      const lift = 1.3;
      // mobile: the exploded model comes closer (labels show only for the selected part), the hero stays as it was
      camBase.set(0, 1.4 - lift, dist0 * fit * (w < 768 ? lerp(1, 0.9, ex) : 1));
      look.set(0, -lift, 0);
      // wear: the camera slips between the temples to where your eyes would be and opens to a natural field of view
      if (worn > 0) {
        // eye point sits a little back and below the bridge, so the frame rims the view instead of blocking it
        pivot.localToWorld(eyeW.set(0, -0.6, 1.5));
        pivot.localToWorld(lensT.set(0, -0.6, 60));
        camera.position.lerpVectors(camBase, eyeW, worn); look.lerp(lensT, worn);
      } else camera.position.copy(camBase);
      let fov = lerp(30, 72, ease(seg(p, 0.47, 0.56)));
      if (returning && parts.lensR) {
        // straight back along the right lens's normal, from where the lens just covers the screen; then on to the speaker view
        const P = parts.lensR; P.obj.localToWorld(lensW.copy(P.center));
        nrm.set(0, 0, 1).transformDirection(P.obj.matrixWorld);
        fov = 30;
        const tv = Math.tan((fov * Math.PI) / 360), d0 = 0.9 * Math.min(lensSize.x / 2 / (tv * camera.aspect), lensSize.y / 2 / tv);
        lensPpu = h / 2 / (d0 * tv); // lens units → screen px at the handover (lens centred, filling the screen)
        const d = lerp(d0, 24, soft(pull) * soft(pull)); // slow start keeps the temples out of shot early on
        // straight back for the first half, then an eased rise so the camera clears the near temple before it crosses the frame
        const rise = soft(clamp01((pull - 0.5) / 0.5));
        tmp.copy(lensW).addScaledVector(nrm, -d); tmp.y += 7 * rise * rise;
        camera.position.lerpVectors(tmp, camBase, turn); look.lerpVectors(lensW, look.set(0, -lift, 0), turn);
      }
      if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
      if (fKey && fe > 0.0005) {
        const F = parts[fKey];
        F.obj.localToWorld(fc.copy(F.center));
        const r = F.box.getSize(fSize).length() / 2;
        const d = Math.max(11, r * 5.5) * (w < 768 ? 1.7 : 1);
        tmp.copy(camera.position).sub(fc).normalize().multiplyScalar(d).add(fc);
        camera.position.lerp(tmp, fe); look.lerp(fc, fe);
      } else if (!focus) fKey = null;
      camera.lookAt(look);
      // lens footage follows the viewing angle: full while the camera sits behind the lens, gone to the tint before it
      // reaches the lens plane (so it is never seen mirrored from the front)
      if (returning && parts.lensR) { const dt2 = v3.copy(camera.position).sub(lensW).normalize().dot(nrm); lensA = 1 - clamp01((dt2 + 0.55) / 0.4); }
      shadow.material.opacity = go * (1 - worn) * (fKey && fKey !== "frame" ? 1 - fe : 1);

      const la = seg(p, 0.16, 0.19) * (1 - seg(p, 0.255, 0.275));
      picking = la > 0.5; if (!picking) focus = null;
      // spec-sheet callouts: anchors on the parts, text stacked in two columns outside the model
      if (la > 0) {
        const pts = labels.map((L) => { const P = parts[L.part]; if (!P) return null; P.obj.localToWorld(v3.copy(P.center)); v3.project(camera); return { x: (v3.x * 0.5 + 0.5) * w, y: (-v3.y * 0.5 + 0.5) * h }; });
        const xs = pts.flatMap((q) => (q ? [q.x] : [])), mid = (Math.min(...xs) + Math.max(...xs)) / 2;
        // model's on-screen extent (exploded bounds) so the columns clear the temples
        let x0 = Math.min(...xs), x1 = Math.max(...xs);
        for (let c = 0; c < 8; c++) {
          model.localToWorld(v3.set(c & 1 ? 8.5 : -8.5, c & 2 ? 3.2 : -3.2, c & 4 ? 9 : -9)).project(camera);
          const sx = (v3.x * 0.5 + 0.5) * w; x0 = Math.min(x0, sx); x1 = Math.max(x1, sx);
        }
        const tw = labelRefs.current.map((el, i) => (textW[i] ||= (el?.children[2] as HTMLElement | undefined)?.offsetWidth || 0));
        const wide = (left: boolean) => Math.max(0, ...pts.map((q, i) => (q && (q.x < mid) === left ? tw[i] : 0)));
        const colL = Math.max(26 + wide(true), Math.min(mid - 40, x0 - 24));
        const colR = Math.min(w - (w < 768 ? 26 : 170) - wide(false), Math.max(mid + 40, x1 + 24));
        for (const left of [true, false]) {
          let prev = -Infinity;
          pts.map((q, i) => ({ q, i })).filter(({ q }) => q && (q.x < mid) === left).sort((a, b) => a.q!.y - b.q!.y).forEach(({ q, i }) => {
            const el = labelRefs.current[i]; if (!el) return;
            const ly = Math.max(q!.y, prev + 44); prev = ly;
            const cx = left ? colL : colR, dx = cx - q!.x, dy = ly - q!.y;
            const [dot, line, text] = el.children as unknown as HTMLElement[];
            dot.style.transform = `translate(${q!.x}px,${q!.y}px)`;
            line.style.width = `${Math.hypot(dx, dy)}px`;
            line.style.transform = `translate(${q!.x}px,${q!.y}px) rotate(${Math.atan2(dy, dx)}rad)`;
            text.style.transform = `translate(${cx + (left ? -10 : 10)}px,${ly}px) translate(${left ? "-100%" : "0"},-50%)`;
            el.style.opacity = String(w < 768 && labels[i].part !== fKey ? 0 : clamp01(la * 1.6 - i * 0.1) * (fKey && labels[i].part !== fKey ? 1 - fe : 1)); // mobile: only the selected part
            el.style.visibility = "visible";
            el.dataset.left = String(left); el.dataset.active = String(hovered === labels[i].part);
          });
        }
      } else labelRefs.current.forEach((el) => { if (el) { el.style.opacity = "0"; el.style.visibility = "hidden"; } });
      if (!picking) hovered = null;
      else if (moved) { hovered = pick(); moved = false; }
      canvas.style.cursor = p > WEAR0 ? "default" : drag ? "grabbing" : hovered ? "pointer" : "grab";

      // the fold/pull-out and the pause before Speak carry no caption
      const idx = p < 0.06 ? 0 : p < 0.39 ? 1 : p < 0.57 ? 2 : p < 0.65 ? 3 : p < 0.73 ? 4 : p < 0.81 ? 5 : p < 0.845 ? 6 : p < FOLD_T ? 7 : speakOn ? 8 : p >= CLOSE_T ? 9 : -1;
      if (idx !== lastIdx) {
        captionRefs.current.forEach((c, i) => c && (c.dataset.on = String(i === idx)));
        stepRefs.current.forEach((s, i) => s && (s.dataset.on = String(i + 1 === idx)));
        lastIdx = idx;
      }
      if (stageRef.current) {

        const darkScene = returning ? bgK < 0.5 : pov > 0.5;
        stageRef.current.dataset.dark = String(darkScene);
        // dissolve in two halves so the two never overlap: the intro leaves first, then About arrives (--about-in)
        const fade = 1 - soft(seg(outK, 0, 0.55));
        document.documentElement.style.setProperty("--about-in", String(soft(seg(outK, 0.6, 1))));
        stageRef.current.style.opacity = String(fade);
        stageRef.current.style.visibility = fade < 0.01 ? "hidden" : "visible";
        stageRef.current.style.pointerEvents = fade < 0.5 ? "none" : "auto";
        const bv = returning ? Math.round(lerp(0, 245, bgK)) : darkScene ? 0 : 245;
        stageRef.current.style.backgroundColor = returning ? `rgb(${bv},${bv},${Math.round(lerp(0, 247, bgK))})` : darkScene ? DARK_BG : LIGHT_BG;
        if (stepsRef.current) stepsRef.current.style.opacity = darkScene || p >= 0.57 ? "0" : "1";
      }
      if (hintRef.current) hintRef.current.style.opacity = String(1 - seg(p, 0, 0.04));
      // "drag to rotate" floats under the hero model until the first drag or the first real scroll
      dragHintA += ((!dragged && p < 0.025 ? 1 : 0) - dragHintA) * damp(4);
      if (dragHintRef.current) dragHintRef.current.style.opacity = String(dragHintA);
      gizmo.visible = dragHintA > 0.01;
      ringMat.opacity = dragHintA * 0.26; beadMat.opacity = dragHintA;
      const ga = reduce ? 0.9 : t * 0.6, gb = reduce ? 0.4 : Math.sin(t * 0.9) * 0.7;
      beadA.position.set(Math.cos(ga) * GZ_R, 0, Math.sin(ga) * GZ_R);
      beadB.position.set(0, Math.sin(gb) * GZ_R, Math.cos(gb) * GZ_R);
      drawFeed(pov, p, lensA > 0, sceneE);
      // the lens screen: the same footage, centre-cropped to the lens
      if (lensScreen && lensTex) {
        lensScreen.visible = lensA > 0.001; lensScreen.material.opacity = lensA;
        // texture sized to the lens's on-screen size (at most 1024px wide), and re-uploaded only when the frame changes
        const src = feedRef.current;
        const tw = Math.min(1024, Math.round(w * Math.min(window.devicePixelRatio, 2))), feath = clamp01(pull / 0.3), key = `${feedKey}|${tw}|${Math.round(feath * 20)}`;
        if (lensA > 0 && src && src.width && key !== lensKey) {
          lensKey = key;
          if (lensCanvas.width !== tw) { lensCanvas.width = tw; lensCanvas.height = Math.round(tw / lensAspect); lensTex.dispose(); }
          // the screen's footprint on the lens at the handover gets the footage exactly as it was on screen, so the swap is
          // seamless at any aspect; the rest of the lens is filled with a soft blurred copy
          const lc = lensCanvas.getContext("2d")!, LW = lensCanvas.width, LH = lensCanvas.height, k = LW / (lensSize.x * lensPpu);
          const sw = w * k, sh = h * k, sx = (LW - sw) / 2, sy = (LH - sh) / 2;
          lc.filter = "blur(18px) brightness(0.92)"; lc.drawImage(src, sx - LW * 0.15, sy - LH * 0.15, sw + LW * 0.3, sh + LH * 0.3); lc.filter = "none";
          // sharp footprint feathered into the soft fill, so the lens never shows a hard-edged panel
          if (featherCanvas.width !== LW || featherCanvas.height !== LH) { featherCanvas.width = LW; featherCanvas.height = LH; }
          // feather grows as the camera pulls back: none at the handover (the lens is the screen), soft once the lens is small
          const fc2 = featherCanvas.getContext("2d")!, fx = Math.max(1, Math.min(sw, sh) * 0.22 * feath);
          fc2.globalCompositeOperation = "source-over"; fc2.clearRect(0, 0, LW, LH);
          fc2.drawImage(src, 0, 0, src.width, src.height, sx, sy, sw, sh);
          fc2.globalCompositeOperation = "destination-in";
          for (const [x0, y0, x1, y1] of [[sx, 0, sx + fx, 0], [sx + sw, 0, sx + sw - fx, 0], [0, sy, 0, sy + fx], [0, sy + sh, 0, sy + sh - fx]]) {
            const gr = fc2.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,1)");
            fc2.fillStyle = gr; fc2.fillRect(0, 0, LW, LH);
          }
          fc2.globalCompositeOperation = "source-over";
          lc.drawImage(featherCanvas, 0, 0);
          lensTex.needsUpdate = true;
        }
      }
      // speak: the line appears word by word with scroll, one sound ring per word
      // words follow scroll too: one per step through the scene's first two thirds; scrolling back hides them again
      spokeAt = speakOn ? 0 : -1;
      const wordsF = speakOn ? seg(p, SPEAK_T + 0.004, SPEAK_T + 0.02) * SPOKEN_WORDS.length : 0, shown = Math.min(SPOKEN_WORDS.length, Math.ceil(wordsF - 1e-6));
      if (shown !== spokenShown) {
        if (shown > spokenShown && shown > 0 && !reduce) emitRing(); // a ring per word, only while scrolling forward
        spokenShown = shown;
      }
      wordRefs.current.forEach((el, i) => { if (!el) return; const k = clamp01(wordsF - i); el.style.opacity = String(k); el.style.transform = `translateY(${(1 - k) * 0.2}em)`; });
      // captions 03–07 rise with scroll through the first CAP_S of their scene and let go over its last 5%
      [3, 4, 5, 6, 7, 8, 9].forEach((ci) => {
        const el = captionRefs.current[ci]; if (!el) return;
        const [a0, a1] = ci < 8 ? SCENES[ci - 3] : ci === 8 ? [SPEAK_T, CLOSE_T] : [CLOSE_T, CLOSE_END];
        const e = ci < 8 ? sceneE[ci - 3] : CAP_S * seg(p, a0, a0 + 0.005), inScene = p >= a0 && (p < a1 || ci === 9);
        const out = ci === 9 ? 1 : 1 - seg(p, a1 - (a1 - a0) * 0.05, a1);
        el.querySelectorAll<HTMLElement>("[data-mask]").forEach((m) => {
          const r = inScene ? soft(clamp01((e - Number(m.dataset.mask) * 0.15) / 0.8)) : 0;
          m.style.transform = `translateY(${(1 - r) * 110}%)`; m.style.opacity = String(r * out);
        });
      });
      // pipeline readout (See → Predict): rows light as each stage is reached; current stage brightest
      if (pipeRef.current) {
        const on = p >= 0.585 && p < 0.81, cur = idx, el0 = pipeRef.current;
        el0.style.opacity = String(on ? clamp01((p - 0.585) / 0.01) * (1 - clamp01((p - 0.8) / 0.01)) : 0);
        // starts bottom-right over the footage; as the board forms in Understand it glides to sit beside it
        // (same geometry as drawFeed's board)
        const bw = Math.min(w * 0.46, h * 1.17, h * 1.14 - 360), bh = bw / 1.5, mv = soft(beat(sceneE[1], [UND.glide[0], 1.0]));
        const x0 = w - 28 - el0.offsetWidth, y0 = h * 0.91 - el0.offsetHeight, x1 = w / 2 + bw / 2 + 20, y1 = h * 0.38 - bh / 2 - 16;
        const po = el0.querySelector<HTMLElement>("[data-po]"); if (po) po.style.opacity = cur >= 5 ? "1" : "0"; // policy output belongs to Predict
        el0.style.left = `${lerp(x0, x1, mv)}px`; el0.style.top = `${lerp(y0, y1, mv)}px`;
        el0.querySelectorAll<HTMLElement>("[data-st]").forEach((el) => {
          const st = Number(el.dataset.st); el.dataset.state = cur > st ? "done" : cur === st ? "on" : "off";
        });
        const opts = soft(beat(sceneE[2], PRED.opts)), pick = soft(beat(sceneE[2], PRED.pick));
        el0.querySelectorAll<HTMLElement>("[data-bar]").forEach((b) => {
          const v = Number(b.dataset.bar), best = b.dataset.best === "1";
          (b.firstElementChild as HTMLElement).style.transform = `scaleX(${v * opts})`;
          b.parentElement!.style.opacity = String(0.35 + 0.65 * opts * (best ? 1 : 1 - 0.5 * pick));
        });
      }
      // closing diagram: a dot runs the pipeline and each stage lights as it arrives
      if (sysRef.current) {
        sysRef.current.style.opacity = String(closeOut); // stays; it scrolls away with the stage into About
        sysRef.current.style.visibility = closeK > 0 ? "visible" : "hidden";
        const run = clamp01((closeK - 0.15) / 0.7), n = SYSTEM.length;
        sysRef.current.querySelectorAll<HTMLElement>("[data-sys]").forEach((el) => { const k = clamp01((run * (n - 1) - Number(el.dataset.sys)) * 3 + 1); el.style.opacity = String(0.25 + 0.75 * k); });
        const dot = sysRef.current.querySelector<HTMLElement>("[data-dot]"); if (dot) dot.style.left = `${(0.1 + 0.8 * run) * 100}%`;
      }
      { const eb = captionRefs.current[2]?.querySelector<HTMLElement>("[data-eyebrow]"); if (eb) eb.style.opacity = String(seg(p, 0.555, 0.57)); } // Wear: after the frame clears
      const sEl = speakRef.current;
      if (sEl && spokeAt >= 0 && parts.speakerR) {
        parts.speakerR.obj.localToWorld(v3.copy(parts.speakerR.center)).project(camera);
        sEl.style.transform = `translate(${(v3.x * 0.5 + 0.5) * w}px,${(-v3.y * 0.5 + 0.5) * h}px)`;
      }
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(frame);

    /* ---------- load ---------- */
    let disposed = false;
    // download progress straight into the DOM (no React re-render per chunk); held at 99% until shaders are compiled
    const showProgress = (f: number) => {
      const pct = Math.min(99, Math.floor(f * 100));
      if (progressBarRef.current) progressBarRef.current.style.transform = `scaleX(${pct / 100})`;
      if (progressTextRef.current) progressTextRef.current.textContent = `${pct}%`;
      progressBarRef.current?.closest("[role=progressbar]")?.setAttribute("aria-valuenow", String(pct));
    };
    new GLTFLoader().loadAsync(MODEL_URL, (e) => showProgress(e.loaded / (e.total || MODEL_BYTES))).then(
      (gltf) => {
        if (disposed) return;
        build(gltf.scene, gltf.scene.userData || {});
        // compile every stage's shaders up front (compile only sees visible objects), so stage changes don't hitch;
        // the frame loop restores per-stage visibility on its next tick
        ready = false;
        scene.traverse((o) => { o.visible = true; });
        renderer.compileAsync(scene, camera).catch(() => {}).then(() => { if (!disposed) { ready = true; setStatus("ready"); loadFeed(); } });
      },
      (err) => { console.error(err); if (!disposed) setStatus("error"); },
    );


    return () => {
      disposed = true;
      document.documentElement.style.removeProperty("--about-in");
      document.documentElement.style.removeProperty("--about-pull");
      cancelAnimationFrame(raf);
      normalTex.dispose();
      window.removeEventListener("scroll", readScroll);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      window.removeEventListener("resize", resize);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        for (const mm of mats) { (mm as THREE.MeshBasicMaterial).map?.dispose(); mm.dispose(); }
      });
      room.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
      envTex.dispose(); pmrem.dispose(); renderer.dispose();
    };
  }, []);

  if (status === "error") return null;

  return (
    <section ref={sectionRef} aria-label={UI.section} className="pointer-events-none relative z-10 h-[3500vh]">
      {/* the whole stage fades out at the end, revealing the About section tucked underneath */}
      <div ref={stageRef} data-dark="false" style={{ backgroundColor: LIGHT_BG }} className="group/stage pointer-events-auto sticky top-0 h-screen overflow-hidden text-[#1d1d1f]">
        {/* what the wearer sees: scrubbed footage + detections, under the 3D glasses so it shows through the lenses */}
        <canvas ref={feedRef} aria-hidden className="pointer-events-none absolute inset-0 block h-full w-full opacity-0 will-change-transform" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/70 to-transparent opacity-0 group-data-[dark=true]/stage:opacity-100" />
        <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full touch-pan-y" />

        {/* the pipeline as it runs: a quiet readout bottom-right through See → Predict */}
        <div ref={pipeRef} aria-hidden className="pointer-events-none absolute z-[4] hidden w-[min(360px,calc(50vw-min(23vw,58.5vh)-48px))] rounded-2xl bg-black/85 p-4 text-white opacity-0 backdrop-blur-md md:block">
          <p className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/50"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#2997ff]" />On-device pipeline</p>
          <ol className="border-l border-white/15">
            {PIPELINE.map(([name, detail, st], i) => (
              <li key={name} data-st={st} data-state="off" className="group relative py-2 pl-4 opacity-30 transition-opacity duration-300 data-[state=done]:opacity-60 data-[state=on]:opacity-100">
                <span className="absolute -left-px top-0 h-full w-[2px] bg-[#2997ff] opacity-0 group-data-[state=on]:opacity-100" />
                <p className="flex items-baseline justify-between gap-3">
                  <span className="text-[15px] font-semibold tracking-[-0.01em]"><span className="mr-2 font-mono text-[11px] font-normal text-white/40">{String(i + 1).padStart(2, "0")}</span>{name}</span>
                  <span className="font-mono text-[12px] tabular-nums text-white/70 group-data-[state=on]:text-[#2997ff]">{detail}</span>
                </p>
              </li>
            ))}
          </ol>
          <div data-po className="mt-5 space-y-2 opacity-0 transition-opacity duration-300">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/50">Policy output</p>
            {OPTIONS.map((o) => (
              <div key={o.name} className="opacity-35">
                <p className="flex justify-between font-mono text-[12px] tabular-nums"><span>{o.name}</span><span className={o.pick ? "text-[#2997ff]" : "text-white/70"}>{o.prob.toFixed(2)}</span></p>
                <div data-bar={o.prob} data-best={o.pick ? "1" : "0"} className="mt-1 h-[3px] w-full overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full w-full origin-left scale-x-0 rounded-full ${o.pick ? "bg-[#2997ff]" : "bg-white/60"}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* closing: the whole system, end to end */}
        <div ref={sysRef} aria-hidden className="pointer-events-none invisible absolute inset-x-5 top-[27%] z-[4] mx-auto max-w-[1080px] text-[#1d1d1f] opacity-0 md:inset-x-10 md:top-[30%]">
          <div className="relative">
            <div className="absolute left-[10%] right-[10%] top-[7px] h-px bg-[#1d1d1f]/15" />
            <span data-dot className="absolute top-[3px] h-[9px] w-[9px] -translate-x-1/2 rounded-full bg-[#0071e3] shadow-[0_0_0_6px_rgba(0,113,227,0.15)]" />
            <ol className="relative grid grid-cols-5 gap-2">
              {SYSTEM.map(([name, sub, short], i) => (
                <li key={name} data-sys={i} className="pt-7 text-center opacity-25">
                  <span className="absolute top-[4px] h-[7px] w-[7px] rounded-full bg-[#1d1d1f]" style={{ left: `${((i + 0.5) / SYSTEM.length) * 100}%`, transform: "translateX(-50%)" }} />
                  <p className="text-[13px] font-semibold tracking-[-0.01em] md:text-[21px]"><span className="md:hidden">{short ?? name}</span><span className="hidden md:inline">{name}</span></p>
                  <p className="mt-1.5 hidden text-[15px] text-[#6e6e73] md:block">{sub}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* speak: sound rings are emitted into this point, which tracks the right-temple speaker */}
        <div ref={speakRef} aria-hidden className="pointer-events-none absolute left-0 top-0 z-[4] h-0 w-0" />

        <button
          type="button"
          onClick={() => { const a = document.getElementById("about"); if (a) window.scrollTo({ top: a.getBoundingClientRect().top + window.scrollY, behavior: "instant" as ScrollBehavior }); }}
          className="absolute right-5 top-[76px] z-[6] flex items-center gap-1.5 rounded-full border border-[#1d1d1f]/15 bg-white/70 px-4 py-2 text-[14px] font-medium text-[#1d1d1f] shadow-[0_4px_14px_rgba(0,0,0,0.06)] backdrop-blur-md transition-colors hover:bg-white group-data-[dark=true]/stage:border-white/20 group-data-[dark=true]/stage:bg-white/10 group-data-[dark=true]/stage:text-white group-data-[dark=true]/stage:hover:bg-white/20 md:right-7"
        >
          {UI.skip}
          <svg aria-hidden width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7 2.5v9M3 7.5l4 4 4-4" /></svg>
        </button>

        {captions.map((c, i) => (
          <div
            key={c.word || c.num || "hero"}
            ref={(el) => { captionRefs.current[i] = el; }}
            data-on={i === 0}
            className={`group/cap pointer-events-none absolute bottom-[9vh] left-5 right-5 z-[4] md:left-7 ${i === 0 ? "max-w-[860px]" : "max-w-[620px]"}`}
          >
            {c.num && i === 0 && <Mask step={0}><p className="mb-2 text-[clamp(17px,1.5vw,21px)] font-semibold tracking-[-0.015em] text-[#1d1d1f]">{c.num}</p></Mask>}
            {c.num && i !== 0 && <Mask step={0}><p data-eyebrow className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[#0066cc] group-data-[dark=true]/stage:text-[#2997ff]">{c.num}</p></Mask>}
            {c.word && <Mask step={0} scroll><p className="pr-[0.08em] text-[clamp(56px,8vw,104px)] font-bold leading-[1.02] tracking-[-0.05em] group-data-[dark=true]/stage:text-white">{c.word}</p></Mask>}
            <Mask step={1} scroll={!!c.word}>
              {i === 0 ? (
                <h2 className="whitespace-pre-line text-[clamp(48px,8vw,112px)] font-bold leading-[0.92] tracking-[-0.05em]">{c.title}</h2>
              ) : (
                <h3 aria-label={c.spoken ? `“${c.title}”` : undefined} className={`group-data-[dark=true]/stage:text-white ${c.word ? "mt-3 text-[clamp(22px,2.3vw,30px)] font-semibold leading-[1.2] tracking-[-0.02em]" : "text-[clamp(34px,5vw,64px)] font-bold leading-[1.02] tracking-[-0.04em]"}`}>
                  {c.spoken
                    ? SPOKEN_WORDS.map((word, k) => (
                        <span key={k} aria-hidden ref={(el) => { wordRefs.current[k] = el; }} data-on="false" className="inline-block opacity-0 will-change-transform">{word}&nbsp;</span>
                      ))
                    : c.title}
                </h3>
              )}
            </Mask>
            {c.lead && (
              <Mask step={2}>
                <p className="mt-4 max-w-[560px] text-[clamp(21px,1.9vw,28px)] font-semibold leading-[1.2] tracking-[-0.02em] text-[#6e6e73]">{c.lead}</p>
              </Mask>
            )}
            {c.body && (
              <Mask step={c.lead ? 3 : 2} scroll={!!c.word}>
                <p className="mt-3.5 max-w-[420px] text-[17px] leading-[1.45] text-[#6e6e73] group-data-[dark=true]/stage:text-white/70">{c.body}</p>
              </Mask>
            )}
          </div>
        ))}

        <ol ref={stepsRef} className="pointer-events-none absolute right-7 top-1/2 z-[4] hidden -translate-y-1/2 transition-opacity duration-500 font-mono text-[11px] font-medium uppercase tracking-[0.14em] md:block">
          {steps.map((s, i) => (
            <li
              key={s}
              ref={(el) => { stepRefs.current[i] = el; }}
              className="group flex items-center justify-end gap-2.5 py-[7px] text-[#86868b] transition-colors duration-[400ms] data-[on=true]:text-[#1d1d1f] group-data-[dark=true]/stage:text-white/50 group-data-[dark=true]/stage:data-[on=true]:text-white"
            >
              {s}
              <i className="block h-px w-3.5 bg-current transition-[width] duration-[400ms] group-data-[on=true]:w-9 group-data-[on=true]:bg-[#0071e3]" />
            </li>
          ))}
        </ol>

        <div className="pointer-events-none absolute inset-0 z-[5]">
          {labels.map((L, i) => (
            <div key={L.part} ref={(el) => { labelRefs.current[i] = el; }} className="group absolute inset-0 text-[#1d1d1f] opacity-0">
              <div className="absolute left-0 top-0 h-0 w-0 will-change-transform"><div className="h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-current transition-transform duration-300 group-data-[active=true]:scale-[1.8]" /></div>
              <div className="absolute left-0 top-0 h-px origin-left bg-current opacity-40 transition-opacity duration-300 will-change-transform group-data-[active=true]:opacity-100" />
              <button type="button" onClick={() => { focusReq.current = L.part; }} className="pointer-events-auto absolute left-0 top-0 whitespace-nowrap text-left will-change-transform group-data-[left=true]:text-right">
                <p className="text-[13px] font-medium leading-tight tracking-[-0.01em]"><span className="mr-2 font-mono text-[10px] tabular-nums text-[#6e6e73]">{String(i + 1).padStart(2, "0")}</span>{L.name}</p>
                <p className="mt-0.5 hidden text-[11px] leading-tight text-[#6e6e73] md:block">{L.tag}</p>
              </button>
            </div>
          ))}
        </div>

        <p ref={dragHintRef} aria-hidden className="hidden">{UI.dragHint}</p>
        <div ref={hintRef} className="pointer-events-none absolute bottom-3 left-1/2 z-[4] flex -translate-x-1/2 flex-col items-center gap-2 text-center md:bottom-8">
          <span aria-hidden className="relative block h-[34px] w-[22px] rounded-full border-[1.5px] border-[#1d1d1f]/45">
            <span className="absolute left-1/2 top-[6px] h-[6px] w-[3px] -translate-x-1/2 animate-[scrollcue_1.8s_cubic-bezier(.45,0,.2,1)_infinite] rounded-full bg-[#1d1d1f]/60" />
          </span>
          <span className="hidden text-[13px] font-medium text-[#1d1d1f]/70 md:inline">{UI.scrollHint}</span>
          <span className="hidden text-[12px] text-[#86868b] md:inline">{UI.dragHint}</span>
        </div>

        {status === "loading" && (
          <div className="absolute inset-0 z-[9] grid place-items-center bg-[#f5f5f7]" role="progressbar" aria-label={UI.loadingLabel} aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}>
            <div className="w-[200px]">
              <div className="flex items-baseline justify-between text-[12px] font-medium text-[#6e6e73]">
                <span>{UI.loading}</span>
                <span ref={progressTextRef} className="tabular-nums">0%</span>
              </div>
              <div className="relative mt-3 h-px w-full overflow-hidden">
                <div className="absolute inset-0 bg-[#6e6e73] opacity-25" />
                <div ref={progressBarRef} className="absolute inset-0 origin-left scale-x-0 bg-[#1d1d1f] transition-transform duration-200 ease-out" />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
