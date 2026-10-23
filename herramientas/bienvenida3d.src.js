// Bienvenida en 3D real (WebGL, three.js). Fuente: se empaqueta en ../bienvenida3d.js (ver herramientas/LEEME-bienvenida3d.txt).
// Misma coreografía que la de CSS: primer plano del conductor saludando, la cámara se aleja hasta verlo de lado,
// el camión frena y encoge hasta el sitio que ocupa en el logo (el CSS hace salir el logo desde ahí).
// Si algo falla (sin WebGL, error), no hace nada y se queda la versión de CSS.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const DURA = 2.9;          // segundos que dura el camión (luego el CSS dibuja el aro y sale el logo)
const AZUL = 0x1d5ba8, AZUL_OSC = 0x14407a, GRIS = 0x222a33;

(function () {
  const bv = document.getElementById("bienvenida");
  if (!bv || document.documentElement.classList.contains("bv-corta")) return;
  const ref = bv.querySelector(".bv-camion");
  // Sin WebGL no se intenta (se queda la versión de CSS, sin errores en la consola)
  try { const t = document.createElement("canvas"); if (!(t.getContext("webgl2") || t.getContext("webgl"))) return; } catch (_) { return; }
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (_) { return; }
  if (!renderer.getContext()) return;

  const movil = Math.min(innerWidth, innerHeight) < 700;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  const cv = renderer.domElement;
  cv.className = "bv-canvas";
  cv.setAttribute("aria-hidden", "true");

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camara = new THREE.PerspectiveCamera(38, 1, 0.5, 600);

  // ---------- Luces ----------
  scene.add(new THREE.HemisphereLight(0xdfeaff, 0x20262e, 0.55));
  const sol = new THREE.DirectionalLight(0xfff4e6, 2.4);
  sol.position.set(5, 11, 9);
  sol.castShadow = true;
  sol.shadow.mapSize.set(movil ? 1024 : 2048, movil ? 1024 : 2048);
  Object.assign(sol.shadow.camera, { left: -9, right: 9, top: 7, bottom: -7, near: 1, far: 40 });
  sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.02; sol.shadow.radius = 4;
  sol.target.position.set(3.5, 0, 0);
  scene.add(sol, sol.target);
  const contra = new THREE.DirectionalLight(0x7aa7ff, 0.9);
  contra.position.set(-6, 4, -7); scene.add(contra);

  // ---------- Materiales ----------
  const pintura = new THREE.MeshPhysicalMaterial({ color: AZUL, roughness: 0.38, metalness: 0.05, clearcoat: 0.8, clearcoatRoughness: 0.18, envMapIntensity: 0.9 });
  const pinturaOsc = new THREE.MeshPhysicalMaterial({ color: AZUL_OSC, roughness: 0.45, clearcoat: 0.5, envMapIntensity: 0.7 });
  const chasis = new THREE.MeshStandardMaterial({ color: GRIS, roughness: 0.7, metalness: 0.3 });
  const plata = new THREE.MeshStandardMaterial({ color: 0xdfe6ee, roughness: 0.25, metalness: 0.7, envMapIntensity: 1.1 });
  const goma = new THREE.MeshStandardMaterial({ color: 0x14181d, roughness: 0.85 });
  const cristal = new THREE.MeshPhysicalMaterial({ color: 0xcfe4f4, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.6 });
  const piel = new THREE.MeshStandardMaterial({ color: 0xedb98f, roughness: 0.6 });
  const camisa = new THREE.MeshStandardMaterial({ color: 0xc4122f, roughness: 0.7 });
  const interior = new THREE.MeshStandardMaterial({ color: 0x2b3540, roughness: 0.8 });
  const luz = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2cc, emissiveIntensity: 0.9, roughness: 0.2 });
  const freno = new THREE.MeshStandardMaterial({ color: 0xaa1020, emissive: 0xff2030, emissiveIntensity: 0.5, roughness: 0.3 });

  const camion = new THREE.Group(); // suspensión: sube y baja un poco
  scene.add(camion);
  function malla(geo, mat, x, y, z, padre) {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
    (padre || camion).add(m); return m;
  }

  // ---------- Caja y chasis ----------
  malla(new RoundedBoxGeometry(4.8, 2.38, 2.3, 6, 0.08), pintura, 2.5, 2.19, 0);
  malla(new RoundedBoxGeometry(4.95, 0.14, 2.34, 3, 0.05), pinturaOsc, 2.52, 1.04, 0);   // faldón inferior
  malla(new THREE.BoxGeometry(6.8, 0.34, 1.3), chasis, 3.5, 0.78, 0);                       // chasis
  malla(new RoundedBoxGeometry(0.12, 0.3, 2.3, 3, 0.04), plata, 0.1, 0.62, 0);              // paragolpes trasero
  [-0.8, 0.8].forEach(z => malla(new RoundedBoxGeometry(0.06, 0.2, 0.32, 3, 0.03), freno, 0.07, 1.25, z));
  // Letras CC en los dos lados de la caja
  const lienzo = document.createElement("canvas"); lienzo.width = 1024; lienzo.height = 512;
  const c2 = lienzo.getContext("2d");
  c2.font = "900 470px 'Arial Rounded MT Bold','Arial Black',Helvetica,Arial,sans-serif";
  c2.textAlign = "center"; c2.textBaseline = "middle"; c2.lineJoin = "round";
  c2.shadowColor = "rgba(5,25,60,.55)"; c2.shadowBlur = 26; c2.shadowOffsetY = 12;
  c2.lineWidth = 34; c2.strokeStyle = "#0e3a70"; c2.strokeText("CC", 512, 268);
  c2.shadowColor = "transparent";
  const gr = c2.createLinearGradient(0, 70, 0, 460); gr.addColorStop(0, "#ffffff"); gr.addColorStop(1, "#c9d6e6");
  c2.fillStyle = gr; c2.fillText("CC", 512, 268);
  const tex = new THREE.CanvasTexture(lienzo); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const decal = new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.4, polygonOffset: true, polygonOffsetFactor: -2 });
  [[1, 0], [-1, Math.PI]].forEach(([s, ry]) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 1.85), decal);
    p.position.set(2.5, 2.2, s * 1.152); p.rotation.y = ry; camion.add(p);
  });

  // ---------- Cabina (hueca: se ve el conductor por la ventanilla) ----------
  const perfil = [[4.95, 0.62], [4.95, 2.55], [5.95, 2.58], [6.5, 1.78], [6.85, 1.62], [6.9, 0.85], [6.9, 0.62]];
  // el contorno de la puerta lleva el paso de rueda (arco alrededor de la rueda delantera)
  const arco = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI; arco.push([5.8 + 0.64 * Math.cos(a), 0.5 + 0.64 * Math.sin(a)]); }
  const forma = new THREE.Shape(perfil.concat(arco).map(p => new THREE.Vector2(p[0], p[1])));
  const hueco = new THREE.Path([[5.1, 2.36], [5.86, 2.4], [6.3, 1.86], [5.1, 1.86]].map(p => new THREE.Vector2(p[0], p[1])));
  forma.holes.push(hueco);
  const puerta = new THREE.ExtrudeGeometry(forma, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 4, curveSegments: 8 });
  malla(puerta, pintura, 0, 0, 1.0);
  malla(puerta, pintura, 0, 0, -1.1);
  function tira(a, b, ancho, mat, grosor = 0.07) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const m = malla(new RoundedBoxGeometry(Math.hypot(dx, dy), grosor, ancho, 2, 0.02), mat, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0);
    m.rotation.z = Math.atan2(dy, dx); return m;
  }
  tira(perfil[1], perfil[2], 2.18, pintura, 0.1);                       // techo
  tira(perfil[3], perfil[4], 2.18, pintura, 0.1);                       // capó
  tira(perfil[4], perfil[5], 2.18, pintura, 0.1);                       // frontal
  const parabrisas = tira(perfil[2], perfil[3], 2.0, cristal, 0.02); parabrisas.castShadow = false;
  malla(new THREE.BoxGeometry(0.06, 1.95, 2.1), pintura, 4.97, 1.58, 0);  // trasera de la cabina
  malla(new THREE.BoxGeometry(1.95, 0.06, 2.1), interior, 5.93, 0.68, 0); // suelo
  // faros, rejilla, paragolpes, retrovisor
  [-0.72, 0.72].forEach(z => {
    malla(new RoundedBoxGeometry(0.08, 0.22, 0.4, 3, 0.04), luz, 6.9, 1.2, z);
    malla(new RoundedBoxGeometry(0.06, 0.1, 0.3, 3, 0.03), pinturaOsc, 6.88, 1.0, z);
  });
  for (let i = 0; i < 5; i++) malla(new RoundedBoxGeometry(0.06, 0.05, 0.85, 2, 0.02), i % 2 ? chasis : plata, 6.92, 0.98 + i * 0.1, 0);
  malla(new RoundedBoxGeometry(0.2, 0.28, 2.3, 4, 0.06), plata, 6.9, 0.58, 0);
  [-1, 1].forEach(s => {
    malla(new THREE.BoxGeometry(0.04, 0.04, 0.22), chasis, 6.4, 2.05, s * 1.2);
    malla(new RoundedBoxGeometry(0.08, 0.3, 0.05, 2, 0.02), chasis, 6.4, 1.98, s * 1.27);
  });

  // ---------- Interior: asiento, salpicadero, volante ----------
  malla(new RoundedBoxGeometry(0.18, 0.95, 0.75, 3, 0.07), interior, 5.2, 1.5, 0.55);
  malla(new RoundedBoxGeometry(0.7, 0.2, 0.75, 3, 0.07), interior, 5.5, 1.1, 0.55);
  malla(new RoundedBoxGeometry(0.12, 0.2, 0.3, 3, 0.05), interior, 5.2, 2.08, 0.55);
  const salpi = malla(new RoundedBoxGeometry(0.9, 0.5, 2.0, 3, 0.07), interior, 6.2, 1.3, 0); salpi.rotation.z = -0.4;
  const columna = malla(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 12), chasis, 6.0, 1.5, 0.55); columna.rotation.z = 0.9;
  const volante = new THREE.Group(); volante.position.set(5.88, 1.72, 0.55); volante.rotation.z = 0.7; camion.add(volante);
  const aro = malla(new THREE.TorusGeometry(0.24, 0.032, 12, 40), goma, 0, 0, 0, volante); aro.rotation.y = Math.PI / 2;
  [0, 1.05, 2.1].forEach(a => { const r = malla(new THREE.CylinderGeometry(0.014, 0.014, 0.46, 8), goma, 0, 0, 0, volante); r.rotation.x = a; r.rotation.z = Math.PI / 2; r.rotation.set(a, 0, Math.PI / 2); });
  const aroGrupo = aro; aroGrupo.castShadow = true;

  // ---------- Conductor ----------
  const chofer = new THREE.Group(); chofer.position.set(5.5, 0, 0.55); camion.add(chofer);
  malla(new THREE.CapsuleGeometry(0.34, 0.5, 8, 20), camisa, 0, 1.55, 0, chofer).scale.set(0.8, 1, 1.05);
  malla(new THREE.CylinderGeometry(0.1, 0.12, 0.16, 16), piel, 0.03, 1.98, 0, chofer);
  const cabeza = new THREE.Group(); cabeza.position.set(0.05, 2.2, 0); chofer.add(cabeza);
  malla(new THREE.SphereGeometry(0.27, 40, 28), piel, 0, 0, 0, cabeza).scale.set(0.95, 1.04, 1);
  malla(new THREE.SphereGeometry(0.055, 16, 12), piel, 0, -0.02, 0.27, cabeza);                        // nariz
  [-1, 1].forEach(s => {
    malla(new THREE.SphereGeometry(0.07, 16, 12), piel, s * 0.26, -0.01, -0.01, cabeza).scale.set(0.5, 1, 0.8);   // orejas
    const ojo = malla(new THREE.SphereGeometry(0.052, 20, 14), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }), s * 0.095, 0.05, 0.235, cabeza); ojo.scale.set(1, 1.15, 0.6); ojo.name = "ojo";
    malla(new THREE.SphereGeometry(0.028, 16, 12), new THREE.MeshStandardMaterial({ color: 0x2a1c16, roughness: 0.2 }), s * 0.095, 0.05, 0.262, cabeza).name = "ojo";
    const ceja = malla(new THREE.CapsuleGeometry(0.012, 0.07, 4, 8), new THREE.MeshStandardMaterial({ color: 0x3b2a20 }), s * 0.1, 0.135, 0.245, cabeza); ceja.rotation.z = Math.PI / 2 + s * 0.12;
  });
  const sonrisa = malla(new THREE.TorusGeometry(0.085, 0.011, 8, 28, Math.PI), new THREE.MeshStandardMaterial({ color: 0x8a3a30, roughness: 0.5 }), 0, -0.075, 0.245, cabeza); sonrisa.rotation.z = Math.PI;
  const pelo = malla(new THREE.SphereGeometry(0.285, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.52), new THREE.MeshStandardMaterial({ color: 0x4a3326, roughness: 0.8 }), 0, 0.03, -0.035, cabeza); pelo.rotation.x = -0.35;
  cabeza.userData.base = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0));
  cabeza.quaternion.copy(cabeza.userData.base);
  // brazo que sale por la ventanilla: hombro, codo apoyado en el borde y antebrazo que saluda
  const brazoSup = new THREE.Group(); brazoSup.position.set(0.02, 1.88, 0.2); chofer.add(brazoSup);
  const sup = malla(new THREE.CapsuleGeometry(0.105, 0.3, 6, 14), camisa, 0, 0, 0, brazoSup);
  sup.rotation.x = Math.PI / 2; sup.position.z = 0.22;
  const codo = new THREE.Group(); codo.position.set(0, 0, 1.0); brazoSup.add(codo);
  codo.position.set(0, -0.02, 0.46);
  const ante = new THREE.Group(); ante.scale.setScalar(0.72); codo.add(ante);
  malla(new THREE.SphereGeometry(0.1, 16, 12), camisa, 0, 0, 0, ante);
  malla(new THREE.CapsuleGeometry(0.085, 0.3, 6, 14), camisa, 0, 0.2, 0, ante);
  malla(new THREE.CapsuleGeometry(0.075, 0.22, 6, 14), piel, 0, 0.5, 0, ante);
  malla(new THREE.SphereGeometry(0.1, 20, 14), piel, 0, 0.72, 0, ante).scale.set(1, 1.1, 0.7);
  [-0.06, -0.02, 0.02, 0.06].forEach((x, i) => { const d = malla(new THREE.CapsuleGeometry(0.018, 0.09, 4, 8), piel, x, 0.83 + (i === 1 || i === 2 ? 0.015 : 0), 0, ante); });
  malla(new THREE.CapsuleGeometry(0.02, 0.07, 4, 8), piel, 0.1, 0.7, 0, ante).rotation.z = -0.8;
  // el otro brazo, en el volante
  const lejano = malla(new THREE.CapsuleGeometry(0.085, 0.55, 6, 14), camisa, 0.28, 1.88, -0.05, chofer); lejano.rotation.z = -1.25;
  // ventanilla que sube al final (cristal lateral del lado visible)
  const vent = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([[5.08, 2.38], [5.88, 2.42], [6.33, 1.84], [5.08, 1.84]].map(p => new THREE.Vector2(p[0], p[1])))), cristal);
  vent.position.z = 1.05; camion.add(vent);
  const ventLejos = vent.clone(); ventLejos.position.z = -1.05; camion.add(ventLejos);
  const ventCerrada = new THREE.Mesh(vent.geometry, new THREE.MeshPhysicalMaterial({ color: 0xd6dee6, roughness: 0.2, clearcoat: 1 })); ventCerrada.position.z = 1.04; ventCerrada.visible = false;

  // ---------- Ruedas ----------
  const ruedas = [];
  function rueda(x, z) {
    const g = new THREE.Group(); g.position.set(x, 0.5, z); g.rotation.x = z > 0 ? Math.PI / 2 : -Math.PI / 2;
    const giro = new THREE.Group(); g.add(giro);
    const R = 0.5, w = 0.17;
    const pts = [[0.3, -w], [0.43, -w], [0.485, -w + 0.04], [R, -0.08], [R, 0.08], [0.485, w - 0.04], [0.43, w], [0.3, w]].map(p => new THREE.Vector2(p[0], p[1]));
    const neu = malla(new THREE.LatheGeometry(new THREE.SplineCurve(pts).getPoints(30), 56), goma, 0, 0, 0, giro);
    for (let i = 0; i < 28; i++) { // dibujo del neumático
      const t = malla(new THREE.BoxGeometry(0.05, 0.2, 0.05), goma, 0, 0, 0, giro); const a = i / 28 * Math.PI * 2;
      t.position.set(Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5); t.rotation.y = -a; t.castShadow = false;
    }
    const llanta = malla(new THREE.LatheGeometry([[0, 0.18], [0.14, 0.2], [0.27, 0.17], [0.31, 0.12], [0.3, -0.1], [0, -0.1]].map(p => new THREE.Vector2(p[0], p[1])), 40), plata, 0, 0, 0, giro);
    malla(new THREE.SphereGeometry(0.075, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), plata, 0, 0.2, 0, giro);
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; malla(new THREE.CylinderGeometry(0.026, 0.026, 0.05, 10), new THREE.MeshStandardMaterial({ color: 0x7d8b9b, metalness: 0.8, roughness: 0.3 }), Math.cos(a) * 0.16, 0.2, Math.sin(a) * 0.16, giro); }
    camion.add(g); ruedas.push({ giro, signo: z > 0 ? -1 : 1 });
  }
  [1.05, 2.58, 5.8].forEach(x => { rueda(x, 1.0); rueda(x, -1.0); });

  // ---------- Suelo y línea discontinua ----------
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(80, 30), new THREE.ShadowMaterial({ opacity: 0.5 }));
  suelo.rotation.x = -Math.PI / 2; suelo.receiveShadow = true; scene.add(suelo);
  const raya = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true });
  const rayas = [];
  const NR = 30, PASO = 3.4;
  for (let i = 0; i < NR; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.2), raya.clone());
    m.rotation.x = -Math.PI / 2; m.position.set(0, 0.005, 2.7); scene.add(m); rayas.push(m);
  }

  // ---------- Encuadre: cámara en órbita alrededor del conductor que se aleja (zoom exponencial) hasta quedar de lado,
  // con el camión exactamente donde está el del logo ----------
  const CX = 3.5, CY = 1.79, LARGO = 7.0, FOV0 = 36, FOV1 = 18;
  let W = 1, H = 1, ppu0 = 100, ppu1 = 17, dx = 0, dy = 0;
  const T0 = new THREE.Vector3(5.95, 2.0, 0.6), T1 = new THREE.Vector3(CX, CY, 0), objetivo = new THREE.Vector3();
  function ajusta() {
    W = innerWidth; H = innerHeight;
    renderer.setSize(W, H, false); camara.aspect = W / H;
    const r = ref.getBoundingClientRect();
    ppu1 = r.width / LARGO;
    dx = -((r.left + r.width / 2) - W / 2) / ppu1; dy = ((r.top + r.height / 2) - H / 2) / ppu1;
    T1.set(CX + dx, CY + dy, 0);
    ppu0 = Math.min(W, H * 0.62) * 0.5;
  }
  ajusta();
  addEventListener("resize", ajusta);

  // ---------- Animación ----------
  const suave = (a, b, x) => { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); };
  const tmp = new THREE.Object3D(), qLook = new THREE.Quaternion();
  const ease = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  let camino = 0, ultimo = 0;
  function fotograma(t) {
    const x = Math.min(1, t / DURA), u = x * x * (3 - 2 * x) * 0.6 + (1 - Math.pow(1 - x, 2)) * 0.4;
    const ppu = ppu0 * Math.pow(ppu1 / ppu0, u), fov = THREE.MathUtils.lerp(FOV0, FOV1, u);
    const dist = (H / 2) / (ppu * Math.tan(THREE.MathUtils.degToRad(fov / 2)));
    const g = 1 - u, az = g * g * 0.78, el = g * g * 0.2;          // azimut/elevación: de tres cuartos por delante a de lado
    const tt = suave(0, 0.85, u);
    objetivo.copy(T0).lerp(T1, tt);
    camara.position.set(objetivo.x + dist * Math.sin(az) * Math.cos(el), objetivo.y + dist * Math.sin(el), objetivo.z + dist * Math.cos(az) * Math.cos(el));
    camara.fov = fov; camara.updateProjectionMatrix(); camara.up.set(0, 1, 0); camara.lookAt(objetivo);
    // carretera: va rápido y frena hacia 2,6 s
    const dt = t - ultimo; ultimo = t;
    const v = 13 * (1 - suave(2.0, 2.65, t) * 0.999);
    camino += v * Math.max(0, dt);
    ruedas.forEach(r => { r.giro.rotation.y = r.signo * camino / 0.5; });
    const desp = camino % PASO, fade = 1 - suave(1.9, 2.5, t);
    rayas.forEach((m, i) => {
      const px = CX + (i - NR / 2) * PASO - desp;
      m.position.x = px; m.material.opacity = fade * (1 - suave(10, 38, Math.abs(px - CX))) * 0.9; m.visible = m.material.opacity > 0.01;
    });
    // suspensión y frenazo
    const bote = Math.sin(t * 15) * 0.014 * (1 - suave(2.0, 2.6, t));
    camion.position.y = bote;
    camion.rotation.z = -Math.sin(Math.PI * suave(2.35, 2.9, t)) * 0.03;
    // conductor: mira al frente y se gira hacia la cámara
    tmp.position.copy(cabeza.getWorldPosition(new THREE.Vector3())); tmp.lookAt(camara.position); qLook.copy(tmp.quaternion);
    const mira = suave(0.45, 1.05, t);
    cabeza.quaternion.copy(cabeza.userData.base).slerp(qLook, mira * 0.92);
    cabeza.rotateZ(Math.sin(suave(1.0, 1.6, t) * Math.PI) * -0.1);
    const parp = (t > 1.75 && t < 1.93) ? 0.1 : 1;
    cabeza.children.forEach(c => { if (c.name === "ojo") c.scale.y = (c.geometry.parameters.radius > 0.04 ? 1.15 : 1) * parp; });
    // saludo: el antebrazo sube, mueve la mano y baja; luego se mete el brazo y sube la ventanilla
    const sube = suave(0.55, 1.0, t), baja = suave(1.95, 2.2, t);
    const ola = Math.sin((t - 1.0) * 9) * 0.38 * suave(1.0, 1.15, t) * (1 - suave(1.8, 2.0, t));
    ante.rotation.z = THREE.MathUtils.lerp(Math.PI * 0.94, 0, sube) * (1 - baja) + baja * 3.0 + ola;
    brazoSup.position.z = 0.2 - suave(1.9, 2.15, t) * 0.45; brazoSup.visible = t < 2.2;
    const cierre = suave(1.95, 2.3, t);
    vent.position.y = -(1 - cierre) * 0.62 + 0; vent.visible = true;
    renderer.render(scene, camara);
  }

  // ---------- Puesta en marcha ----------
  // El primer fotograma se dibuja ya (así no hay salto al empezar) y el reloj arranca cuando el CSS pone .bv-anda
  bv.insertBefore(cv, bv.firstChild);
  let t0 = null, vivo = true;
  function bucle(ahora) {
    if (!vivo) return;
    if (!bv.isConnected || bv.classList.contains("fuera")) { fin(); return; }
    if (t0 == null && bv.classList.contains("bv-anda")) t0 = ahora;
    const t = typeof window.__BV_T === "number" ? window.__BV_T : t0 == null ? 0 : (ahora - t0) / 1000; // __BV_T: solo para las pruebas
    if (t < DURA + 1.7) { fotograma(Math.min(t, DURA)); requestAnimationFrame(bucle); }
    else cv.style.visibility = "hidden"; // el camión ya se ha fundido con el logo: no se dibuja más
  }
  function fin() {
    vivo = false; removeEventListener("resize", ajusta);
    try { renderer.dispose(); pmrem.dispose(); } catch (_) {}
  }
  try {
    fotograma(0);
    bv.classList.add("bv-gl");
    requestAnimationFrame(bucle);
  } catch (e) { cv.remove(); vivo = false; }
})();
