// Simulador de carga en 3D (petición n.º 46; lo pidió Lorena el 15/11/2026: «usa un modelo 3d del camión real, para que
// sea visualmente entendible»). Lo carga carga.js con import() solo cuando el conductor elige «Lateral» o «3D»: quien no
// lo usa no descarga three.js (lib/three, versión 0.170.0, licencia MIT en lib/three/LICENSE-three.txt).
// El camión está hecho aquí con piezas sencillas (cajas redondeadas y cilindros) parecido al de la empresa: tractora
// DAF con la parte de abajo azul eléctrico y la de arriba crema, y semirremolque de lonas azul oscuro con 3 ejes. Sin
// logos ni matrículas. Las lonas y el techo son casi transparentes para ver dentro cómo van los palets.
// No hace cuentas: pinta las filas que le da carga.js (CargaCuentas), en cm. Sin animaciones: solo se dibuja cuando
// cambia algo o se mueve la cámara (gasta lo mínimo de batería).
import * as THREE from "./lib/three/three.module.min.js?v=170";
import { OrbitControls } from "./lib/three/OrbitControls.js?v=170";
import { RoundedBoxGeometry } from "./lib/three/RoundedBoxGeometry.js?v=170";

const AZUL = 0x1f45c8, CREMA = 0xeee3b8, LONA = 0x1b2133, CHASIS = 0x23293a, NEGRO = 0x15171c, GOMA = 0x1a1a1a, LLANTA = 0xc9ccd2, CROMO = 0xf2f2ee, MADERA = 0xb48a55, CRISTAL = 0x223041;
// Medidas reales, en metros. Europalet: 1,20 × 0,80 × 0,144 (tabla de arriba 22 mm, tacos 78 mm, tablas de abajo 22 mm).
// Remolque de lonas: 13,60 × 2,48 por dentro (los palets van en los 2,40 del simulador), 2,55 por fuera, 2,70 de alto
// por dentro y 4,00 m de alto en total (el máximo en España); un «mega» de 3,00 m lleva el suelo más bajo y ruedas pequeñas.
// Tractora tipo DAF: cabina de 2,30 de largo, 2,49 de ancho y 3,95 de alto; batalla 3,80; conjunto de 16,50 m.
const ALTO_PALET = 0.144, ALTO_CARGA = 1.2, ALTO_TOTAL = 4.0, ANCHO_DENTRO = 2.48, FRENTE = -2.9, PERSONA = 1.75;
let ALTO_SUELO = 1.18, ALTO_DENTRO = 2.7;
const fm = (n) => n.toFixed(2).replace(".", ",") + " m";
const mat = (c, extra) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6, metalness: 0.05 }, extra || {}));

export function crea(caja) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
  } catch (e) { return null; } // sin WebGL: carga.js se queda con la vista de arriba
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const lienzo = renderer.domElement;
  lienzo.className = "cg-3d-lienzo";
  lienzo.setAttribute("aria-hidden", "true");
  caja.appendChild(lienzo);

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(35, 2, 0.1, 200);
  const controles = new OrbitControls(camara, lienzo);
  controles.enableDamping = false; // sin inercia: no hay que dibujar sin parar
  controles.maxPolarAngle = Math.PI * 0.49; // que no se meta bajo el suelo
  controles.minDistance = 3; controles.maxDistance = 60;
  controles.screenSpacePanning = true;

  escena.add(new THREE.HemisphereLight(0xffffff, 0x8a8f99, 1.6));
  const sol = new THREE.DirectionalLight(0xffffff, 1.6); sol.position.set(-8, 14, 10); escena.add(sol);
  const sol2 = new THREE.DirectionalLight(0xffffff, 0.5); sol2.position.set(10, 6, -12); escena.add(sol2);

  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(120, 60), mat(0xcfcac0, { roughness: 1 }));
  suelo.rotation.x = -Math.PI / 2; escena.add(suelo);

  const camion = new THREE.Group(); escena.add(camion);   // tractora + remolque (cambia con el largo)
  const carga = new THREE.Group(); escena.add(carga);     // palets, huecos y lo que sobra
  const geos = [], mats = [];
  const guarda = (o) => { o.traverse?.(n => { if (n.geometry) geos.push(n.geometry); if (n.material) mats.push(n.material); }); return o; };
  const limpia = (g) => { g.traverse(n => { if (n.geometry) n.geometry.dispose(); if (n.material) [].concat(n.material).forEach(m => { m.map?.dispose(); m.dispose(); }); }); g.clear(); };

  function caja3(w, h, d, material, x, y, z, radio) {
    const g = radio ? new RoundedBoxGeometry(w, h, d, 2, radio) : new THREE.BoxGeometry(w, h, d);
    const m = new THREE.Mesh(g, material); m.position.set(x, y, z); return m;
  }
  function rueda(x, z, doble, radio) {
    const g = new THREE.Group(), ancho = doble ? 0.62 : 0.34, r = radio || 0.52;
    const goma = new THREE.Mesh(new THREE.CylinderGeometry(r, r, ancho, 28), mat(GOMA, { roughness: 0.9 }));
    goma.rotation.x = Math.PI / 2; g.add(goma);
    const llanta = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.58, r * 0.58, ancho + 0.02, 20), mat(LLANTA, { metalness: 0.5, roughness: 0.35 }));
    llanta.rotation.x = Math.PI / 2; g.add(llanta);
    const buje = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, ancho + 0.06, 12), mat(0x6b6f78));
    buje.rotation.x = Math.PI / 2; g.add(buje);
    g.position.set(x, r, z); return g;
  }

  // ---- El camión (x: largo, de la cabina a las puertas; z: ancho; y: alto). El remolque empieza en x = 0. ----
  function pintaCamion(L, W) {
    limpia(camion);
    const ancho = Math.max(W, ANCHO_DENTRO) + 0.07, z0 = Math.max(W, ANCHO_DENTRO) / 2, lona = mat(LONA, { transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide });
    const marco = mat(LONA, { roughness: 0.5 }), azul = mat(AZUL, { roughness: 0.35, metalness: 0.15 }), crema = mat(CREMA, { roughness: 0.4 });
    // Remolque: suelo, paredes, postes, largueros de arriba, lonas casi transparentes y techo
    const r = new THREE.Group();
    r.add(caja3(L + 0.1, 0.14, ancho, mat(0x7a5a3a, { roughness: 0.9 }), L / 2, ALTO_SUELO - 0.07, z0));          // suelo de madera
    r.add(caja3(L + 0.12, 0.2, ancho + 0.04, mat(0x2d3550), L / 2, ALTO_SUELO - 0.24, z0));                         // larguero lateral
    r.add(caja3(0.08, ALTO_DENTRO, ancho, marco, -0.04, ALTO_SUELO + ALTO_DENTRO / 2, z0));                          // pared de delante
    const top = ALTO_SUELO + ALTO_DENTRO;
    [-ancho / 2, ancho / 2].forEach(dz => {
      r.add(caja3(L + 0.1, 0.1, 0.06, marco, L / 2, top, z0 + dz));                                                    // larguero de arriba
      for (const px of [L, L * 0.5]) r.add(caja3(0.07, ALTO_DENTRO, 0.06, marco, px, ALTO_SUELO + ALTO_DENTRO / 2, z0 + dz)); // postes
      const l = new THREE.Mesh(new THREE.PlaneGeometry(L, ALTO_DENTRO), lona); l.position.set(L / 2, ALTO_SUELO + ALTO_DENTRO / 2, z0 + dz); r.add(l);
    });
    r.add(caja3(0.08, 0.1, ancho, marco, L, top, z0));                                                                  // marco de las puertas
    const techo = new THREE.Mesh(new THREE.PlaneGeometry(L, ancho), lona); techo.rotation.x = -Math.PI / 2; techo.position.set(L / 2, top + 0.03, z0); r.add(techo);
    // Chasis azul, patas de apoyo y 3 ejes atrás
    [-0.5, 0.5].forEach(dz => r.add(caja3(L - 0.4, 0.28, 0.14, mat(0x24408f), L / 2, ALTO_SUELO - 0.48, z0 + dz)));
    [-0.85, 0.85].forEach(dz => r.add(caja3(0.12, ALTO_SUELO - 0.55, 0.12, mat(0x3a3f4a), 3.3, (ALTO_SUELO - 0.55) / 2, z0 + dz)));
    const ejes = Math.max(L - 4.2, 4.5), rr = ALTO_SUELO < 1.05 ? 0.4 : 0.535; // 3 ejes separados 1,31 m; ruedas 385/65 R22.5
    [-1.31, 0, 1.31].forEach(dx => [-(ancho / 2 - 0.3), ancho / 2 - 0.3].forEach(dz => r.add(rueda(ejes + dx, z0 + dz, true, rr))));
    r.add(caja3(0.1, 0.3, ancho - 0.1, mat(0x30343d), L - 0.05, 0.55, z0));                                                   // parachoques de atrás
    // Tractora
    const t = new THREE.Group(), cabX0 = FRENTE, cabL = 2.3, cabA = 2.49, base = 0.95;
    const cx = cabX0 + cabL / 2;
    t.add(caja3(cabL, 1.45, cabA, azul, cx, base + 0.72, z0, 0.12));                    // parte de abajo, azul
    t.add(caja3(cabL - 0.05, 1.55, cabA - 0.02, crema, cx + 0.02, base + 2.2, z0, 0.18)); // parte de arriba, crema
    t.add(caja3(cabL - 0.3, 0.12, cabA - 0.3, mat(0xf4f4f0), cx + 0.1, base + 2.94, z0, 0.05)); // techo (3,95 m)
    // Parabrisas y ventanillas
    const cristal = mat(CRISTAL, { roughness: 0.15, metalness: 0.3 });
    t.add(caja3(0.04, 0.9, cabA - 0.36, cristal, cabX0 - 0.005, base + 1.95, z0));
    [-cabA / 2, cabA / 2].forEach(dz => t.add(caja3(0.75, 0.62, 0.04, cristal, cabX0 + 0.62, base + 1.9, z0 + dz)));
    // Calandra: marco claro, rejilla negra con barras cromadas, faros y parachoques azul
    t.add(caja3(0.06, 0.95, 1.5, mat(CROMO, { roughness: 0.3, metalness: 0.4 }), cabX0 - 0.02, base + 0.82, z0));
    t.add(caja3(0.07, 0.82, 1.36, mat(NEGRO), cabX0 - 0.03, base + 0.82, z0));
    for (let i = 0; i < 4; i++) t.add(caja3(0.08, 0.05, 1.3, mat(CROMO, { metalness: 0.5, roughness: 0.25 }), cabX0 - 0.04, base + 0.52 + i * 0.2, z0));
    [-0.95, 0.95].forEach(dz => t.add(caja3(0.06, 0.13, 0.36, mat(0xfafaf2, { emissive: 0x777766 }), cabX0 - 0.03, base + 0.42, z0 + dz)));
    t.add(caja3(0.3, 0.55, cabA, azul, cabX0 + 0.1, base - 0.2, z0, 0.06));           // parachoques
    [-cabA / 2 - 0.12, cabA / 2 + 0.12].forEach(dz => {                              // retrovisores
      t.add(caja3(0.1, 0.42, 0.14, mat(NEGRO), cabX0 + 0.12, base + 2.05, z0 + dz));
      t.add(caja3(0.04, 0.04, 0.16, mat(NEGRO), cabX0 + 0.18, base + 2.25, z0 + dz * 0.95));
    });
    // Chasis de la tractora, depósito, faldones azules y quinta rueda
    [-0.45, 0.45].forEach(dz => t.add(caja3(5.85, 0.28, 0.12, mat(CHASIS), 0.17, 0.85, z0 + dz)));
    t.add(caja3(1.2, 0.55, 0.5, mat(0xc4c8cf, { metalness: 0.6, roughness: 0.3 }), 0.55, 0.78, z0 - cabA / 2 + 0.3, 0.08)); // depósito
    t.add(caja3(1.2, 0.5, 0.06, azul, 0.55, 0.8, z0 + cabA / 2 - 0.05, 0.03));
    t.add(caja3(1.0, 0.12, 1.2, mat(0x2b2f37), 1.95, 1.04, z0)); // quinta rueda
    // Ruedas 315/70 R22.5 (radio 0,5 m): eje delantero simple y trasero doble, batalla 3,80 m
    [[-1.45, false], [2.35, true]].forEach(([x, d]) => [-(cabA / 2 - 0.25), cabA / 2 - 0.25].forEach(dz => t.add(rueda(x, z0 + dz, d, 0.5))));
    camion.add(r, t);
  }

  // Números de las recogidas encima de cada montón (una textura por número)
  const numeros = {};
  function textoNumero(n) {
    if (numeros[n]) return numeros[n];
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const x = c.getContext("2d");
    x.fillStyle = "rgba(0,0,0,.55)"; x.beginPath(); x.arc(64, 64, 58, 0, Math.PI * 2); x.fill();
    x.fillStyle = "#fff"; x.font = "bold 76px system-ui, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(String(n), 64, 68);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
    return (numeros[n] = tx);
  }

  // Letrero con una medida («13,60 m»), siempre de cara a la cámara
  function etiqueta(txt, x, y, z) {
    const c = document.createElement("canvas"); c.width = 256; c.height = 72;
    const g = c.getContext("2d");
    g.fillStyle = "rgba(255,255,255,.88)"; g.beginPath(); g.roundRect ? g.roundRect(4, 4, 248, 64, 18) : g.rect(4, 4, 248, 64); g.fill();
    g.fillStyle = "#15171c"; g.font = "bold 40px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, 128, 40);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, depthTest: false })); s.scale.set(2.0, 0.56, 1); s.position.set(x, y, z); s.renderOrder = 6;
    return s;
  }
  // Persona de 1,75 m (gris, sin cara) para comparar tamaños
  function persona(x, z) {
    const g = new THREE.Group(), m = mat(0x7d8593, { roughness: 0.8 });
    [-0.1, 0.1].forEach(dz => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.07, 0.85, 10), m); p.position.set(0, 0.425, dz); g.add(p); });
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.62, 12), m); c.position.y = 1.16; g.add(c);
    [-0.25, 0.25].forEach(dz => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8), m); b.position.set(0, 1.12, dz); g.add(b); });
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), m); h.position.y = PERSONA - 0.11; g.add(h);
    g.position.set(x, 0, z); carga.add(g);
    carga.add(etiqueta(fm(PERSONA), x, PERSONA + 0.45, z));
  }

  let ultimo = null, vistaActual = "3d";
  // rows: las filas de CargaCuentas (cm). colores: uno por recogida (1, 2, 3…)
  function pinta(rows, Lc, Wc, colores, oscuro, extra) {
    ultimo = [rows, Lc, Wc, colores, oscuro, extra];
    const L = Lc / 100, W = Wc / 100, altos = extra?.altos || [];
    ALTO_DENTRO = Math.min(Math.max((extra?.alto || 270) / 100, 1.5), 3.5);
    ALTO_SUELO = Math.min(1.18, Math.max(0.9, ALTO_TOTAL - 0.12 - ALTO_DENTRO));
    const Wi = Math.max(W, ANCHO_DENTRO), oz = (Wi - W) / 2; // los palets van centrados en el ancho de dentro
    escena.background = new THREE.Color(oscuro ? 0x14181f : 0xeef0f3);
    suelo.material.color.set(oscuro ? 0x262b34 : 0xcfcac0);
    pintaCamion(L, W);
    limpia(carga);
    const borde = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });
    const rojo = new THREE.MeshBasicMaterial({ color: 0xc8102e, transparent: true, opacity: 0.45, depthWrite: false });
    const porColor = {}, maderas = [];
    // Un palet de madera de verdad: tabla de arriba, 3 travesaños, 9 tacos y 3 tablas abajo (todas las piezas en un solo dibujo)
    const tabla = (x, y, z, w, h, d) => maderas.push([x, y, z, w, h, d]);
    function palet(cx, y0, cz, w, d) {
      tabla(cx, y0 + ALTO_PALET - 0.011, cz, w, 0.022, d);
      const zs = [cz - d / 2 + 0.05, cz, cz + d / 2 - 0.05], xs = [cx - w / 2 + 0.0725, cx, cx + w / 2 - 0.0725];
      zs.forEach(z => { tabla(cx, y0 + 0.1 + 0.011, z, w, 0.022, 0.1); tabla(cx, y0 + 0.011, z, w, 0.022, 0.1); xs.forEach(x => tabla(x, y0 + 0.022 + 0.039, z, 0.145, 0.078, 0.1)); });
    }
    let x = 0, masAlto = 0;
    rows.forEach(row => {
      row.items.forEach(p => {
        const w = p.w / 100, d = p.h / 100, cx = x + (p.x + p.w / 2) / 100, cz = oz + (p.y + p.h / 2) / 100;
        const m = porColor[p.r] || (porColor[p.r] = mat(colores[(p.r - 1) % colores.length], { roughness: 0.55 }));
        const H = Math.max((altos[p.r - 1] || ALTO_CARGA * 100) / 100, ALTO_PALET + 0.05), hb = H - ALTO_PALET;
        const alturas = p.s ? 2 : 1;
        for (let k = 0; k < alturas; k++) {
          const y0 = ALTO_SUELO + k * H;
          palet(cx, y0, cz, w, d);
          const b = caja3(w - 0.04, hb, d - 0.04, m, cx, y0 + ALTO_PALET + hb / 2, cz, 0.03);
          carga.add(b);
          const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w - 0.04, hb, d - 0.04)), borde);
          e.position.copy(b.position); carga.add(e);
        }
        const arriba = ALTO_SUELO + alturas * H, techo = ALTO_SUELO + ALTO_DENTRO;
        masAlto = Math.max(masAlto, arriba);
        if (arriba > techo + 0.005) { // lo que pasa del techo, en rojo
          const sob = new THREE.Mesh(new THREE.BoxGeometry(w - 0.02, arriba - techo, d - 0.02), rojo);
          sob.position.set(cx, (techo + arriba) / 2, cz); sob.renderOrder = 4; carga.add(sob);
        }
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: textoNumero(p.r), depthTest: true, depthWrite: false }));
        s.scale.set(0.42, 0.42, 1); s.position.set(cx, arriba + 0.3, cz); s.renderOrder = 5; carga.add(s);
      });
      // Huecos libres: rectángulo de rayas en el suelo
      row.free.forEach(h => {
        if (h.w < 30 || h.h < 30) return;
        const x0 = x + h.x / 100 + 0.04, z0 = oz + h.y / 100 + 0.04, x1 = x + (h.x + h.w) / 100 - 0.04, z1 = oz + (h.y + h.h) / 100 - 0.04, y = ALTO_SUELO + 0.01;
        const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x0, y, z0), new THREE.Vector3(x1, y, z0), new THREE.Vector3(x1, y, z1), new THREE.Vector3(x0, y, z1), new THREE.Vector3(x0, y, z0)]);
        const l = new THREE.Line(g, new THREE.LineDashedMaterial({ color: oscuro ? 0xd0d4dc : 0x333333, dashSize: 0.18, gapSize: 0.12 }));
        l.computeLineDistances(); carga.add(l);
        const f = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, depthWrite: false }));
        f.rotation.x = -Math.PI / 2; f.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); carga.add(f);
      });
      x += row.al / 100;
    });
    if (maderas.length) {
      const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat(MADERA, { roughness: 0.85 }), maderas.length), M = new THREE.Matrix4();
      maderas.forEach(([px, py, pz, w, h, d], i) => im.setMatrixAt(i, M.makeScale(w, h, d).setPosition(px, py, pz)));
      carga.add(im);
    }
    // Para ver el tamaño real: medidas del remolque y una persona de 1,75 m junto a las puertas
    const tope = ALTO_SUELO + ALTO_DENTRO;
    carga.add(etiqueta(fm(L), L * 0.3, tope + 0.5, Wi + 0.3));
    carga.add(etiqueta(fm(ALTO_DENTRO), L - 0.9, ALTO_SUELO + ALTO_DENTRO / 2, Wi + 0.3));
    persona(Math.max(L, x) + 1.1, Wi + 0.7);
    // Lo que no cabe: zona roja detrás de las puertas
    if (x > L) {
      const sobra = new THREE.Mesh(new THREE.BoxGeometry(x - L, ALTO_DENTRO, W), new THREE.MeshBasicMaterial({ color: 0xc8102e, transparent: true, opacity: 0.28, depthWrite: false }));
      sobra.position.set(L + (x - L) / 2, ALTO_SUELO + ALTO_DENTRO / 2, oz + W / 2); carga.add(sobra);
    }
    centra(L, Wi, Math.max(L, x) + 1.4);
  }

  // Cámara: «3d» en diagonal desde delante y desde arriba; «lado» de costado, casi sin perspectiva
  let centro = new THREE.Vector3();
  function centra(L, W, largo) {
    const nuevo = new THREE.Vector3((largo + FRENTE) / 2, 1.9, W / 2);
    const mismo = centro.distanceTo(nuevo) < 0.01;
    centro = nuevo;
    if (!mismo || !camara.userData.puesta) vista(vistaActual);
    else dibuja();
  }
  function vista(nombre) {
    vistaActual = nombre;
    const largo = centro.x * 2 - FRENTE * 2 + 0.8, asp = camara.aspect || 2; // de la defensa de la tractora a la trasera
    if (nombre === "lado") {
      camara.fov = 22; camara.updateProjectionMatrix();
      const dist = Math.max(largo / asp, 4.6) / (2 * Math.tan(THREE.MathUtils.degToRad(camara.fov / 2))) * 1.08;
      camara.position.set(centro.x, centro.y + 0.4, centro.z + dist);
    } else {
      camara.fov = 35; camara.updateProjectionMatrix();
      // Que quepa el camión entero (tractora incluida) en pantallas estrechas y anchas: se mide con una esfera que lo
      // envuelve y el ángulo más estrecho de la cámara (el vertical en el PC, el horizontal en un móvil muy estrecho)
      const r = Math.hypot(largo / 2, 2.6, 1.6), vf = THREE.MathUtils.degToRad(camara.fov / 2), hf = Math.atan(Math.tan(vf) * asp);
      const dist = r / Math.sin(Math.min(vf, hf)) * 0.8;
      const dir = new THREE.Vector3(-0.5, 0.58, 0.82).normalize();
      camara.position.copy(centro).addScaledVector(dir, dist);
    }
    controles.target.copy(centro); controles.update();
    camara.userData.puesta = true;
    dibuja();
  }
  function dibuja() { renderer.render(escena, camara); }
  function tamano() {
    const w = caja.clientWidth, h = caja.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camara.aspect = w / h; camara.updateProjectionMatrix();
    dibuja();
  }
  controles.addEventListener("change", dibuja);
  controles.addEventListener("start", () => caja.classList.add("tocado")); // al moverlo ya sabe cómo: se quita la pista
  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(() => { tamano(); if (ultimo) vista(vistaActual); }) : null;
  ro?.observe(caja);
  tamano();
  return {
    pinta, vista, tamano,
    destruye() { ro?.disconnect(); controles.dispose(); limpia(camion); limpia(carga); Object.values(numeros).forEach(t => t.dispose()); renderer.dispose(); lienzo.remove(); },
  };
}
