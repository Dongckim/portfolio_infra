"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const MODEL_URL = "/models/glasses.glb";
const NORMAL_URL = "/models/glasses-normal.png";

const labels = [
  { part: "cam", name: "Camera", tag: "Computer vision" },
  { part: "lensL", name: "Lens", tag: "Spatial UI" },
  { part: "frame", name: "Frame", tag: "Product design" },
  { part: "boardR", name: "Logic board", tag: "Embedded systems" },
  { part: "batteryR", name: "Battery", tag: "Rapid prototyping" },
  { part: "speakerR", name: "Speaker", tag: "Interaction design" },
];

const captions = [
  { num: "", title: "Dongchan\nKim", body: "Designing the things you see the world through." },
  { num: "01 / Analyze", title: "Take it apart first.", body: "To understand a product, start with what's inside. Select a part." },
  { num: "02 / Trace", title: "Then trace it back to a line.", body: "Every curve started as intent." },
  { num: "03 / Prototype", title: "Rebuild it. Test it. Break it." },
  { num: "04 / Ship", title: "Put back together, better." },
];

const steps = ["Analyze", "Trace", "Prototype", "Ship"];

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

// p, yaw, pitch — hero 3/4, sketch from above, side mesh, clay, teardown 3/4
// timeline: hero .00–.06 · engineer .06–.39 (exploded, labels .19–.255) · design .40–.60 · prototype .61–.77 · ship .77–.84 · lens dive .84–1
const DIST: Key[] = [[0, 40], [0.06, 40], [0.17, 54], [0.27, 54], [0.38, 40], [0.5, 38], [0.6, 36], [0.77, 36], [0.88, 34], [1, 34]];

/* ---------- sketch / outline shader ---------- */
const VS = `varying vec3 vN; varying vec3 vV; varying float vX;
void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vX = position.x; gl_Position = projectionMatrix * mv; }`;
const FS = `uniform vec3 uColor; uniform float uOpacity; uniform float uReveal; uniform float uHatch; uniform float uRim; uniform float uFill;
varying vec3 vN; varying vec3 vV; varying float vX;
void main(){
  if (vX > uReveal) discard;
  vec3 n = normalize(vN);
  float f = 1. - abs(dot(n, normalize(vV)));
  float rim = smoothstep(uRim, uRim + .22, f);
  float shade = clamp(dot(n, normalize(vec3(.35,.85,.4))) * .5 + .5, 0., 1.);
  float d = (gl_FragCoord.x * .8 + gl_FragCoord.y) * .085;
  float hatch = step(fract(d), .14) * smoothstep(.72, .3, shade) * uHatch;
  float hatch2 = step(fract((gl_FragCoord.x - gl_FragCoord.y * .6) * .07), .1) * smoothstep(.45, .15, shade) * uHatch;
  float edge = smoothstep(.8, 0., uReveal - vX);
  float a = max(max(rim, uFill), max(hatch, hatch2) * .5) + edge * rim * .6;
  gl_FragColor = vec4(uColor, clamp(a, 0., 1.) * uOpacity);
}`;
const lineMat = (color: number, hatch: number, rim: number, fill: number) =>
  new THREE.ShaderMaterial({
    vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: 0 }, uReveal: { value: 999 }, uHatch: { value: hatch }, uRim: { value: rim }, uFill: { value: fill } },
  });

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
    // overhead light (stronger in dark mode): gives the black acetate and lenses their highlights
    const top = new THREE.DirectionalLight(0xffffff, 0); top.position.set(0, 20, 3); scene.add(top);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 400);
    const pivot = new THREE.Group(); scene.add(pivot);
    const model = new THREE.Group(); pivot.add(model);

    const sketchMat = lineMat(0x2554e8, 1, 0.52, 0.07);
    const modelMat = lineMat(0x2b2f37, 0, 0.6, 0);
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x50555f, wireframe: true, transparent: true, opacity: 0, depthWrite: false });
    const constMat = new THREE.LineBasicMaterial({ color: 0x2f6bff, transparent: true, opacity: 0 });
    // original scan's normal map, glTF UV convention
    const normalTex = new THREE.TextureLoader().load(NORMAL_URL); normalTex.flipY = false;
    const mat = (k: string) => new THREE.MeshPhysicalMaterial({ ...LOOK[k], transparent: true, side: THREE.DoubleSide });

    /* ---------- state ---------- */
    const parts: Record<string, Part> = {};
    const glossMeshes: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>[] = [];
    const clayMeshes: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>[] = [];
    const lineMeshes: THREE.Mesh[] = [], modelLineMeshes: THREE.Mesh[] = [], wireObjs: THREE.Mesh[] = [];
    let ledMat: THREE.MeshPhysicalMaterial | null = null, ledGlow: THREE.Sprite | null = null;
    let constLines: THREE.LineSegments | null = null, ready = false, revealRange = [-8, 8];

    const part = (name: string, off: Vec3, delay: number, internal: boolean) => {
      const g = new THREE.Group(); g.name = name; model.add(g);
      parts[name] = { obj: g, off: new THREE.Vector3(...off), delay, internal, mats: [], center: new THREE.Vector3(), box: new THREE.Box3() };
    };
    const addShell = (name: string, geo: THREE.BufferGeometry, kind: string) => {
      const g = parts[name].obj;
      const gm = mat(kind); gm.normalMap = normalTex; const gloss = new THREE.Mesh(geo, gm); gloss.userData.part = name;
      const cm = new THREE.MeshStandardMaterial({ color: kind === "lens" ? 0x8f9399 : 0xa9acb2, roughness: 0.82, transparent: true, side: THREE.DoubleSide, normalMap: normalTex });
      const clay = new THREE.Mesh(geo, cm), sk = new THREE.Mesh(geo, sketchMat), ml = new THREE.Mesh(geo, modelMat), wf = new THREE.Mesh(geo, wireMat);
      g.add(gloss, clay, sk, ml, wf);
      glossMeshes.push(gloss); clayMeshes.push(clay); lineMeshes.push(sk); modelLineMeshes.push(ml); wireObjs.push(wf);
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

      // construction lines + vanishing rays (sketch stage)
      const bb = new THREE.Box3(); for (const n of Object.keys(SHELL)) bb.expandByObject(parts[n].obj);
      revealRange = [bb.min.x - 0.8, bb.max.x + 0.8];
      const a = bb.min, b = bb.max, P = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z), cl: THREE.Vector3[] = [];
      const C = [P(a.x, a.y, a.z), P(b.x, a.y, a.z), P(b.x, b.y, a.z), P(a.x, b.y, a.z), P(a.x, a.y, b.z), P(b.x, a.y, b.z), P(b.x, b.y, b.z), P(a.x, b.y, b.z)];
      for (const [i, j] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) {
        const u = C[i], w = C[j], dd = w.clone().sub(u).multiplyScalar(0.3); cl.push(u.clone().sub(dd), w.clone().add(dd));
      }
      const vpL = P(a.x - 16, b.y + 3, b.z + 10), vpR = P(b.x + 16, b.y + 3, b.z + 10);
      for (const c of [C[4], C[5], C[6], C[7], C[2], C[3]]) { cl.push(vpL, c.clone()); cl.push(vpR, c.clone()); }
      for (const y of [b.y - 0.6, 0, a.y + 0.5]) cl.push(P(a.x - 4, y, b.z), P(b.x + 4, y, b.z));
      for (const x of [-3.6, 0, 3.6]) cl.push(P(x, a.y - 2, b.z), P(x, b.y + 2, b.z));
      constLines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(cl), constMat);
      model.add(constLines);

      for (const k in parts) { const box = parts[k].box.setFromObject(parts[k].obj); if (!box.isEmpty()) box.getCenter(parts[k].center); }
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
    // scroll → timeline: 17 screens at an even pace, plus extra screens parked on the sketch and exploded stages
    // (keep h-[…vh] on the section = (17 + extras + 1) * 100)
    const STRETCH: [number, number, number][] = [[0.19, 0.255, 4], [0.4, 0.5, 1], [0.5, 0.51, 3]]; // exploded view, sketch drawing, finished sketch held
    const knots: [number, number][] = [[0, 0]]; // [t, screens]
    for (const [t0, t1, extra] of STRETCH) {
      const [pt, ps] = knots[knots.length - 1];
      knots.push([t0, ps + (t0 - pt) * 17], [t1, ps + (t0 - pt) * 17 + (t1 - t0) * 17 + extra]);
    }
    { const [pt, ps] = knots[knots.length - 1]; knots.push([1, ps + (1 - pt) * 17]); }
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
    // steady turntable: 1.5 turns at one rate per screen up to the lens dive, then it simply stops turning.
    // No target angles anywhere; drags, tilts and flicks carry straight on from wherever they leave it.
    const YAW0 = 0.6, YAW_RATE = (Math.PI * 3) / screensAt(0.84);
    const baseYaw = (t: number) => YAW0 + YAW_RATE * screensAt(Math.min(t, 0.84));
    let breath = 1, uRaw = 0, lastU = 0, flick = 0, flickVel = 0, dragged = false, dragHintA = 0;
    let pTarget = 0, pCur = 0, mx = 0, my = 0, smy = 0, w = 1, h = 1, visible = true;
    let nudge = 0, tilt = 0, drag = false, moved = false, picking = false, downX = 0, downY = 0, smx = 0, lastT = 0, px = 0, py = 0;
    const readScroll = () => {
      const r = section.getBoundingClientRect();
      uRaw = clamp01(-r.top / (r.height - window.innerHeight)); pTarget = remap(uRaw);
      visible = r.bottom > 0 && r.top < window.innerHeight;
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
    const onDown = (e: PointerEvent) => { drag = true; dragged = true; px = downX = e.clientX; py = downY = e.clientY; canvas.setPointerCapture(e.pointerId); };
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
    readScroll(); resize();

    /* ---------- frame loop ---------- */
    let lastIdx = -1, raf = 0, wasDark: boolean | null = null;
    const textW: number[] = [];
    const v3 = new THREE.Vector3(), camBase = new THREE.Vector3(), lensT = new THREE.Vector3(), lensW = new THREE.Vector3(), look = new THREE.Vector3(), tmp = new THREE.Vector3();
    const frame = (time: number) => {
      raf = requestAnimationFrame(frame);
      if (!ready || !visible) return;
      const t = time * 0.001, dt = Math.min(0.05, t - lastT); lastT = t;
      const damp = (rate: number) => 1 - Math.exp(-dt * rate);
      // a hard scroll whips the model round in proportion to its strength; a critically damped spring settles it back
      // onto the scroll path, so flicks never pile up and the exploded view keeps its angle
      const du = uRaw - lastU; lastU = uRaw;
      if (!reduce && dt > 0 && Math.abs(du) < 0.02) flickVel = Math.max(-4, Math.min(4, flickVel + du * 160 * Math.min(0.6, Math.abs(du / dt))));
      flickVel += (-6 * flick - 4.9 * flickVel) * dt; flick += flickVel * dt;
      pCur += (pTarget - pCur) * (reduce ? 1 : damp(4.5));
      const p = pCur;
      smx += (mx - smx) * damp(2.5); smy += (my - smy) * damp(2.5);
      if (focusReq.current !== undefined) { focus = focusReq.current === focus ? null : focusReq.current; focusReq.current = undefined; }
      if (focus) fKey = focus;
      fAmt += ((focus ? 1 : 0) - fAmt) * damp(3.2);
      const fe = ease(fAmt), inFocus = (k: string) => k === fKey || (fKey === "cam" && (k.startsWith("ring") || k === "sensor"));

      // outline + mesh read dark on light, light on the black dark-mode background
      const dark = document.documentElement.dataset.theme === "dark";
      modelMat.uniforms.uColor.value.setHex(dark ? 0xd2d6de : 0x2b2f37);
      wireMat.color.setHex(dark ? 0xa4aab4 : 0x50555f);
      if (dark !== wasDark) {
        wasDark = dark;
        ringMat.color.setHex(dark ? 0x86868b : 0x6e6e73); beadMat.color.setHex(dark ? 0xf5f5f7 : 0x1d1d1f);
        top.intensity = dark ? 1.8 : 0.9;
        // stronger reflections so the black acetate keeps its edges; floor shadow becomes a soft light pool
        for (const k in parts) for (const m of parts[k].mats) m.envMapIntensity = dark ? 3.2 : 2;
        shadow.material.color.setRGB(dark ? 6.5 : 1, dark ? 6 : 1, dark ? 5 : 1);
        for (const m of clayMeshes) { m.userData.base ??= m.material.color.getHex(); m.material.color.setHex(m.userData.base).multiplyScalar(dark ? 0.55 : 1); }
      }

      const sk = ease(seg(p, 0.4, 0.5)), mo = ease(seg(p, 0.51, 0.6)), cl = ease(seg(p, 0.61, 0.69));
      const ex = ease(seg(p, 0.06, 0.17)) * (1 - ease(seg(p, 0.27, 0.38)));
      const dv = ease(seg(p, 0.84, 0.985));
      const solid = p < 0.555 ? 1 - sk : cl;
      const clayMix = p < 0.555 ? 0 : 1 - ease(seg(p, 0.7, 0.77));
      const sketchA = sk * (1 - mo), modelA = mo * (1 - cl);

      const go = solid * (1 - clayMix), co = solid * clayMix;
      for (const m of glossMeshes) { m.material.opacity = go; m.visible = go > 0.01; m.material.depthWrite = go >= co; }
      // capture LED breathes while the finished glasses are on screen: reads instantly as a camera, i.e. smart glasses
      const pulse = reduce ? 0.6 : Math.pow(0.5 + 0.5 * Math.sin(t * 2.4), 2);
      if (ledMat) ledMat.emissiveIntensity = 0.3 + 2.6 * pulse;
      if (ledGlow) {
        // drawn without depth (the LED sits just under the frame surface), so fade it when the front turns away
        ledGlow.getWorldPosition(v3); const facing = tmp.set(0, 0, 1).applyQuaternion(pivot.quaternion).dot(v3.sub(camera.position).negate().normalize());
        ledGlow.material.opacity = pulse * go * clamp01(facing * 3) * 0.95;
      }
      for (const m of clayMeshes) { m.material.opacity = co; m.visible = co > 0.01; m.material.depthWrite = co > go; }
      sketchMat.uniforms.uOpacity.value = sketchA;
      sketchMat.uniforms.uReveal.value = lerp(revealRange[0], revealRange[1], seg(p, 0.405, 0.49));
      modelMat.uniforms.uOpacity.value = modelA;
      for (const m of lineMeshes) m.visible = sketchA > 0.01;
      for (const m of modelLineMeshes) m.visible = modelA > 0.01;
      wireMat.opacity = modelA * 0.2;
      for (const m of wireObjs) m.visible = modelA > 0.01;
      if (constLines) {
        constMat.opacity = sketchA * 0.28; constLines.visible = sketchA > 0.01;
        const n = constLines.geometry.attributes.position.count;
        constLines.geometry.setDrawRange(0, Math.floor((n * seg(p, 0.4, 0.46)) / 2) * 2);
      }

      for (const k in parts) {
        const P = parts[k], e = ease(clamp01((ex - P.delay) / 0.58));
        P.obj.position.copy(P.off).multiplyScalar(e);
        // focus: everything but the selected part recedes
        const dim = fKey && !inFocus(k) ? 1 - fe : 1;
        if (P.internal) { for (const m of P.mats) { m.opacity = clamp01(ex * 8) * dim; m.depthWrite = dim > 0.99; } }
        else { P.mats[0].opacity *= dim; if (dim < 0.99) P.mats[0].depthWrite = false; }
        P.obj.visible = (!P.internal || ex > 0.004) && dim > 0.02;
        const hl = !focus && (hovered === k || ((k.startsWith("ring") || k === "sensor") && hovered === "cam"));
        for (const m of P.mats) if (m !== ledMat) { m.emissive.setHex(hl ? 0x8a94a6 : 0); m.emissiveIntensity = hl ? 0.22 : 0; }
      }

      const [dist0] = keyed(DIST, p);
      const free = reduce ? 0 : 1 - dv;
      // drag offsets persist (scroll keeps turning from wherever it was left); only the lens dive pulls them back to face-front
      const yaw = baseYaw(p) + flick + nudge, pitch = 0.22;
      // gentle look-around parallax, damped; no idle bobbing
      const par = free * (1 - fe);
      // idle breathing: a slow float and a faint sway, off while dragging, focused or diving
      breath += ((drag ? 0 : 1) - breath) * damp(2);
      const br = reduce ? 0 : breath * par;
      pivot.rotation.set(pitch + tilt + smy * 0.12 * par + Math.sin(t * 0.55) * 0.025 * br, yaw + smx * 0.1 * par + Math.sin(t * 0.4) * 0.05 * br, 0);
      pivot.position.y = Math.sin(t * 0.8) * 0.16 * br;
      const fit = camera.aspect < 1.2 ? Math.min(2.2, 1.2 / camera.aspect) : 1;
      pivot.updateMatrixWorld(true);
      parts.lensL.obj.localToWorld(lensW.copy(parts.lensL.center));
      // lens dive: swing round the model to wherever the left lens faces, then go through it
      camBase.set(0, 1.4, dist0 * fit * (1 + (w < 768 ? 0.8 : 0) * ex));
      if (dv > 0) {
        lensT.copy(lensW).addScaledVector(v3.set(0, 0, 1).applyQuaternion(pivot.quaternion), 0.6);
        const len = lerp(camBase.length(), lensT.length(), dv);
        camera.position.copy(camBase).normalize().lerp(tmp.copy(lensT).normalize(), dv).add(v3.set(0, 1e-3, 0)).normalize().multiplyScalar(len);
      } else camera.position.copy(camBase);
      look.set(0, 0, 0).lerp(lensW, Math.min(1, dv * 1.6));
      // frame the model a little above centre (the caption owns the bottom of the screen)
      const lift = 1.3 * (1 - dv); camera.position.y -= lift; look.y -= lift;
      if (fKey && fe > 0.0005) {
        const F = parts[fKey];
        F.obj.localToWorld(fc.copy(F.center));
        const r = F.box.getSize(fSize).length() / 2;
        const d = Math.max(11, r * 5.5) * (w < 768 ? 1.7 : 1);
        tmp.copy(camera.position).sub(fc).normalize().multiplyScalar(d).add(fc);
        camera.position.lerp(tmp, fe); look.lerp(fc, fe);
      } else if (!focus) fKey = null;
      camera.lookAt(look);
      shadow.material.opacity = (1 - dv) * (0.45 + solid * 0.55) * (fKey && fKey !== "frame" ? 1 - fe : 1) * (dark ? 0.85 : 1);

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
            el.style.opacity = String(clamp01(la * 1.6 - i * 0.1) * (fKey && labels[i].part !== fKey ? 1 - fe : 1));
            el.style.visibility = "visible";
            el.dataset.left = String(left); el.dataset.active = String(hovered === labels[i].part);
          });
        }
      } else labelRefs.current.forEach((el) => { if (el) { el.style.opacity = "0"; el.style.visibility = "hidden"; } });
      if (!picking) hovered = null;
      else if (moved) { hovered = pick(); moved = false; }
      canvas.style.cursor = drag ? "grabbing" : hovered ? "pointer" : "grab";

      const idx = p < 0.06 ? 0 : p < 0.39 ? 1 : p < 0.605 ? 2 : p < 0.77 ? 3 : p < 0.84 ? 4 : 5;
      if (idx !== lastIdx) {
        captionRefs.current.forEach((c, i) => c && (c.dataset.on = String(i === idx)));
        stepRefs.current.forEach((s, i) => s && (s.dataset.on = String(i + 1 === idx)));
        lastIdx = idx;
      }
      if (stageRef.current) {
        const o = 1 - ease(seg(p, 0.92, 0.995));
        stageRef.current.style.opacity = String(o);
        stageRef.current.style.visibility = o < 0.01 ? "hidden" : "visible";
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
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(frame);

    /* ---------- load ---------- */
    let disposed = false;
    new GLTFLoader().loadAsync(MODEL_URL).then(
      (gltf) => {
        if (disposed) return;
        build(gltf.scene, gltf.scene.userData || {});
        // compile every stage's shaders up front (compile only sees visible objects), so stage changes don't hitch;
        // the frame loop restores per-stage visibility on its next tick
        ready = false;
        scene.traverse((o) => { o.visible = true; });
        renderer.compileAsync(scene, camera).catch(() => {}).then(() => { if (!disposed) { ready = true; setStatus("ready"); } });
      },
      (err) => { console.error(err); if (!disposed) setStatus("error"); },
    );


    return () => {
      disposed = true;
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
    <section ref={sectionRef} aria-label="Smart glasses, from sketch to ship" className="relative z-10 h-[2600vh] text-textPrimary">
      {/* the whole stage fades out at the end of the lens dive, revealing the About section tucked underneath */}
      <div ref={stageRef} className="sticky top-0 h-screen overflow-hidden bg-background">
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(ellipse_75%_70%_at_50%_-5%,#767b86_0%,#3f424a_36%,#202226_68%,#0e0f11_100%)] dark:block" />
        <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full touch-pan-y" />

        {captions.map((c, i) => (
          <div
            key={c.title}
            ref={(el) => { captionRefs.current[i] = el; }}
            data-on={i === 0}
            className="pointer-events-none absolute bottom-[9vh] left-5 right-5 z-[4] max-w-[620px] translate-y-5 opacity-0 transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] data-[on=true]:translate-y-0 data-[on=true]:opacity-100 md:left-7"
          >
            {c.num && <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-accent">{c.num}</p>}
            {i === 0 ? (
              <h2 className="whitespace-pre-line text-[clamp(48px,8vw,112px)] font-bold leading-[0.92] tracking-[-0.05em]">{c.title}</h2>
            ) : (
              <h3 className="text-[clamp(34px,5vw,64px)] font-bold leading-none tracking-[-0.04em]">{c.title}</h3>
            )}
            {c.body && <p className="mt-3.5 max-w-[420px] text-[17px] leading-[1.45] text-textSecondary">{c.body}</p>}
          </div>
        ))}

        <ol className="pointer-events-none absolute right-7 top-1/2 z-[4] hidden -translate-y-1/2 font-mono text-[11px] font-medium uppercase tracking-[0.14em] md:block">
          {steps.map((s, i) => (
            <li
              key={s}
              ref={(el) => { stepRefs.current[i] = el; }}
              className="group flex items-center justify-end gap-2.5 py-[7px] text-textSecondary/60 transition-colors duration-[400ms] data-[on=true]:text-textPrimary"
            >
              {s}
              <i className="block h-px w-3.5 bg-current transition-[width] duration-[400ms] group-data-[on=true]:w-9 group-data-[on=true]:bg-accent" />
            </li>
          ))}
        </ol>

        <div className="pointer-events-none absolute inset-0 z-[5]">
          {labels.map((L, i) => (
            <div key={L.part} ref={(el) => { labelRefs.current[i] = el; }} className="group absolute inset-0 text-textPrimary opacity-0">
              <div className="absolute left-0 top-0 h-0 w-0 will-change-transform"><div className="h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-current transition-transform duration-300 group-data-[active=true]:scale-[1.8]" /></div>
              <div className="absolute left-0 top-0 h-px origin-left bg-current opacity-40 transition-opacity duration-300 will-change-transform group-data-[active=true]:opacity-100" />
              <button type="button" onClick={() => { focusReq.current = L.part; }} className="pointer-events-auto absolute left-0 top-0 whitespace-nowrap text-left will-change-transform group-data-[left=true]:text-right">
                <p className="text-[13px] font-medium leading-tight tracking-[-0.01em]"><span className="mr-2 font-mono text-[10px] tabular-nums text-textSecondary">{String(i + 1).padStart(2, "0")}</span>{L.name}</p>
                <p className="mt-0.5 hidden text-[11px] leading-tight text-textSecondary md:block">{L.tag}</p>
              </button>
            </div>
          ))}
        </div>

        <p ref={dragHintRef} aria-hidden className="pointer-events-none absolute inset-x-0 top-[66%] z-[4] text-center text-[11px] font-medium tracking-[0.08em] text-textSecondary opacity-0 md:hidden">Drag to rotate</p>
        <div ref={hintRef} className="pointer-events-none absolute bottom-7 left-1/2 z-[4] flex -translate-x-1/2 flex-col items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-textSecondary">
          <span className="hidden md:inline">Scroll to explore&nbsp;&nbsp;·&nbsp;&nbsp;Drag to rotate</span>
          <span className="block h-7 w-px animate-pulse bg-gradient-to-b from-textSecondary to-transparent" />
        </div>

        {status === "loading" && (
          <div className="absolute inset-0 z-[9] grid place-items-center bg-background">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-textSecondary">Loading model…</p>
          </div>
        )}
      </div>
    </section>
  );
}
