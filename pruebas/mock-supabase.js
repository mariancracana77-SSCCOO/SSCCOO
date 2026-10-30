// Supabase de mentira para las pruebas: sustituye a lib/supabase.js (lo cambia humo.cjs al cargar la página).
// Devuelve datos de ejemplo sin conectarse a nada. No se usa nunca en la web publicada.
(function () {
  const hoy = new Date(), dia = (n) => { const d = new Date(hoy); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const T = {
    comunicados: [
      { id: 1, titulo: "Asamblea general de la plantilla", contenido: "Se convoca asamblea en el comedor.\n\n" + "Texto largo de prueba. ".repeat(60), fecha: hoy.toISOString(), categoria: "Asamblea", urgente: true, fijado: false, adjuntos: [] },
      { id: 2, titulo: "Calendario de vacaciones", contenido: "Ya está disponible el calendario.", fecha: new Date(hoy - 864e5 * 3).toISOString(), categoria: "General", adjuntos: [] },
    ],
    eventos: [
      { id: 1, titulo: "Reunión con la empresa", fecha: dia(5), hora: "10:00", lugar: "Sala de juntas", tipo: "Reunión", importante: true },
      { id: 2, titulo: "Festivo local", fecha: dia(12), hora: "00:00", tipo: "Festivo" },
    ],
    convenio_secciones: [{ id: 1, titulo: "Vacaciones", contenido: "23 días laborables.", categoria: "Vacaciones", articulo: "28", orden: 1, visible: true, adjuntos: [] }],
    documentos: [{ id: 1, titulo: "Convenio de Girona", fecha: dia(-30), categoria: "Convenio", url: "https://example.com/c.pdf", nombre_archivo: "convenio.pdf", tipo_archivo: "application/pdf", tamano: 120000 }],
    actas: [{ id: 1, titulo: "Comité de octubre", fecha: dia(-10), tipo: "Comité de empresa", resumen: "Resumen del acta.", acuerdos: "- Acuerdo uno\n- Acuerdo dos", adjuntos: [] }],
    paginas: [{ slug: "inicio", contenido: "Bienvenida de prueba." }, { slug: "quienes", contenido: "Somos la sección sindical." }],
    preguntas: [{ id: 1, pregunta: "¿Cuántos días de vacaciones tengo?", respuesta: "Los que marca el convenio.", categoria: "General", orden: 1 }],
    delegados: [{ id: 1, nombre: "Delegado de prueba", cargo: "Secretario", orden: 1 }],
    enlaces: [], plantillas: [], restricciones: [], encuestas: [], encuesta_votos: [], opciones: [],
    apartados: [
      { id: 1, slug: "comite", titulo: "Comité", descripcion: "", icono: "", orden: 1, visible: true, padre_id: null },
      { id: 2, slug: "zona-conductores", titulo: "Zona Conductores", descripcion: "", icono: "", orden: 2, visible: true, padre_id: null },
      { id: 3, slug: "convenio-y-leyes", titulo: "Convenio y leyes", descripcion: "", icono: "", orden: 3, visible: true, padre_id: null },
      { id: 4, slug: "prl", titulo: "PRL", descripcion: "", icono: "", orden: 4, visible: true, padre_id: null },
      { id: 5, slug: "actas-prl", titulo: "Actas de PRL", descripcion: "", icono: "", orden: 1, visible: true, padre_id: 4 },
    ],
    publicaciones: [{ id: 1, apartado_id: 2, titulo: "Normas de descanso", contenido: "Contenido de prueba.", fecha: dia(-2), publicado: true, adjuntos: [] },
      { id: 2, apartado_id: 5, titulo: "Reunión de seguridad y salud", contenido: "Se revisa la evaluación de riesgos.", fecha: dia(-3), publicado: true, adjuntos: [] }],
    calc_permisos: [], calc_categorias: [], calc_ajustes: [{ clave: "vac_dias", valor: "23" }],
    // «Aparcamientos en mi ruta»: unos cuantos en la AP-7 / A9 entre Girona y Narbona (datos de prueba)
    aparcamientos: [
      { osm: "w1", pais: "ES", lat: 42.1600, lon: 2.8650, nombre: "Área de prueba", horario: null, pago: 0, precio: null, vigilado: false, duchas: true, aseos: true, plazas: 40, area: true, camion: true },
      { osm: "w2", pais: "ES", lat: 42.3500, lon: 2.8900, nombre: "Parking vigilado de prueba", horario: "24/7", pago: 1, precio: "2 EUR/hour", vigilado: true, duchas: true, aseos: true, plazas: 80, area: false, camion: true },
      { osm: "w3", pais: "FR", lat: 42.6000, lon: 2.9200, nombre: "Aire de prueba", horario: null, pago: null, precio: null, vigilado: false, duchas: false, aseos: true, plazas: null, area: true, camion: false },
      { osm: "w4", pais: "FR", lat: 42.8000, lon: 2.9500, nombre: "Parking que cierra", horario: "Mo-Fr 08:00-09:00", pago: 0, precio: null, vigilado: false, duchas: false, aseos: false, plazas: 12, area: false, camion: true },
      { osm: "w5", pais: "FR", lat: 43.0500, lon: 2.9900, nombre: null, cerca: "Sigean", horario: null, pago: null, precio: null, vigilado: false, duchas: false, aseos: false, plazas: null, area: false, camion: true },
      { osm: "w7", pais: "ES", lat: 42.2467, lon: 2.8612, nombre: "Área sentido Francia", horario: null, pago: null, precio: null, vigilado: false, duchas: true, aseos: true, plazas: 25, area: true, camion: true },
      { osm: "w8", pais: "ES", lat: 42.2467, lon: 2.8588, nombre: "Área sentido Barcelona", horario: null, pago: null, precio: null, vigilado: false, duchas: true, aseos: true, plazas: 25, area: true, camion: true },
      { osm: "w6", pais: "FR", lat: 44.9000, lon: 4.8000, nombre: "Lejos de la ruta", horario: null, pago: 0, precio: null, vigilado: false, duchas: false, aseos: false, plazas: null, area: true, camion: true },
    ],
    // Avisos de compañeros (el «Aire de prueba» avisado cerrado hace un rato)
    peajes_paises: [
      { id: 1, pais: "ES", nombre: "España", cobra: "peaje", precio_km: 0.17, nota: "Estimación. Revisar.", orden: 1, visible: true },
      { id: 2, pais: "FR", nombre: "Francia", cobra: "peaje", precio_km: 0.25, nota: "Estimación clase 4. Revisar.", orden: 2, visible: true },
      { id: 3, pais: "AT", nombre: "Austria", cobra: "autopista", precio_km: 0.5724, nota: "ASFINAG 2026.", orden: 6, visible: true }],
    cortes: [
      { id: "dgt:1", pais: "ES", fuente: "dgt", tipo: "carril", via: "AP-7", lat: 42.34, lon: 2.874, lat2: 42.352, lon2: 2.8758, rumbo: 0, texto: "carril derecho · por obras · km 30–31,5 · Pont de molins", inicio: null, fin: null },
      { id: "dgt:2", pais: "ES", fuente: "dgt", tipo: "cortada", via: "AP-7", lat: 42.58, lon: 2.91, lat2: null, lon2: null, rumbo: null, texto: "km 1 · La jonquera", inicio: null, fin: new Date(Date.now() + 5 * 3600000).toISOString() },
      { id: "dgt:3", pais: "ES", fuente: "dgt", tipo: "accidente", via: "AP-7", lat: 42.70, lon: 2.928, lat2: null, lon2: null, rumbo: 180, texto: "sentido contrario: no debe salir", inicio: null, fin: null },
      { id: "dgt:4", pais: "ES", fuente: "dgt", tipo: "cortada", via: "GI-555", lat: 42.30, lon: 2.95, lat2: null, lon2: null, rumbo: null, texto: "otra carretera: no debe salir", inicio: null, fin: null }],
    avisos_aparcamiento: [{ id: 1, osm: "w3", tipo: "cerrado", cuando: new Date(Date.now() - 40 * 60000).toISOString() }],
    tarifas_conductor: [
      { id: 1, grupo: "Salario", concepto: "Salario bruto (sin antigüedad)", importe: 1725.28, unidad: "mes", pago: "Mensual", sin_pagar: 0, max_mes: null, nota: "", orden: 10, visible: true },
      { id: 2, grupo: "Dieta completa", concepto: "Dieta completa internacional", importe: 67.48, importe_nuevo: 69.83, desde: "2027-01-01", unidad: "dia", pago: "Semanal", sin_pagar: 0, max_mes: null, nota: "", orden: 20, visible: true },
      { id: 3, grupo: "Dieta completa", concepto: "Dieta completa nacional", importe: 48.6, importe_nuevo: 50.82, desde: "2027-01-01", unidad: "dia", pago: "Semanal", sin_pagar: 0, max_mes: null, nota: "", orden: 30, visible: true },
      { id: 5, grupo: "Suplementos", concepto: "Fin de semana fuera (domingo)", importe: 100, unidad: "finde", pago: "Semanal", sin_pagar: 0, max_mes: 2, nota: "Como mucho 2 al mes.", orden: 50, visible: true },
      { id: 7, grupo: "Dieta fraccionada nacional", concepto: "Desayuno", importe: 5.72, importe_nuevo: 5.92, desde: "2027-01-01", unidad: "vez", pago: "Semanal", sin_pagar: 0, max_mes: null, nota: "", orden: 70, visible: true },
      { id: 6, grupo: "Dieta fraccionada nacional", concepto: "Dormir", importe: 13.74, unidad: "vez", pago: "Semanal", sin_pagar: 0, max_mes: null, nota: "", orden: 60, visible: true },
      { id: 10, grupo: "Dieta fraccionada internacional", concepto: "Dormir", importe: 15.6, unidad: "vez", pago: "Semanal", sin_pagar: 0, max_mes: null, nota: "", orden: 100, visible: true },
      { id: 11, grupo: "Dieta fraccionada internacional", concepto: "Desayuno", importe: 6.2, unidad: "vez", pago: "Semanal", sin_pagar: 0, max_mes: null, nota: "", orden: 110, visible: true },
      { id: 15, grupo: "Dieta GB-CG-MA", concepto: "Dormir", importe: 18, unidad: "vez", pago: "Semanal", sin_pagar: 0, max_mes: null, nota: "", orden: 150, visible: true },
      { id: 20, grupo: "Otros pluses", concepto: "ADR (por minuto)", importe: 0.00812196, unidad: "minuto", pago: "Semanal", sin_pagar: 0, max_mes: null, nota: "Promedio: depende de la antigüedad.", orden: 200, visible: true },
      { id: 21, grupo: "Otros pluses", concepto: "ADR (fijo al mes)", importe: 70, unidad: "mes", pago: "Mensual", sin_pagar: 0, max_mes: null, nota: "Solo si haces ADR.", orden: 210, visible: true },
      { id: 22, grupo: "Otros pluses", concepto: "Carga o descarga internacional (de la 2.ª en adelante)", importe: 6, unidad: "vez", pago: "Semanal", sin_pagar: 0, max_mes: null, nota: "La primera no se paga. Apunta solo las que hagas a partir de la segunda: 6 € cada una.", orden: 220, visible: true },
      { id: 26, grupo: "Otros pluses", concepto: "Horas sindicales", importe: 0, unidad: "hora", pago: "Semanal", sin_pagar: 0, max_mes: null, nota: "Cada persona cobra distinto: pon tu precio por hora en «Ajustes» > «Lo que cobras tú».", orden: 245, visible: true },
      { id: 19, grupo: "Otros pluses", concepto: "Festivo", importe: 50, unidad: "dia", pago: "Semanal", sin_pagar: 0, max_mes: null, nota: "", orden: 190, visible: true },
      { id: 25, grupo: "Otros pluses", concepto: "Kilómetros", importe: 0.037, unidad: "km", pago: "Semanal", sin_pagar: 0, max_mes: null, nota: "", orden: 250, visible: true },
    ],
  };
  window.__LLAMADAS = []; // lo que la web ha pedido (para comprobar que no recarga de más)
  function consulta(tabla) {
    let filas = (T[tabla] || []).slice(), unica = false, op = "select";
    const q = {
      select() { return q; }, order() { return q; }, limit() { return q; }, range() { return q; }, in() { return q; },
      gte() { return q; }, lte() { return q; }, neq() { return q; }, is() { return q; }, not() { return q; }, or() { return q; }, ilike() { return q; },
      eq(c, v) { filas = filas.filter(f => !(c in f) || String(f[c]) === String(v)); return q; },
      single() { unica = true; return q; }, maybeSingle() { unica = true; return q; },
      insert(f) { op = "insert"; filas = [Object.assign({ id: 99 }, f)]; return q; },
      update(f) { op = "update"; filas = filas.map(x => Object.assign({}, x, f)); return q; },
      upsert(f) { op = "upsert"; return q; }, delete() { op = "delete"; return q; },
      then(ok, mal) { window.__LLAMADAS.push(op + ":" + tabla); return Promise.resolve({ data: unica ? (filas[0] || null) : filas, error: null, count: filas.length }).then(ok, mal); },
    };
    return q;
  }
  const canal = { on() { return canal; }, subscribe() { return canal; }, unsubscribe() {} };
  // Ruta de prueba Girona → Narbona: un punto cada ~1,5 km por la AP-7/A9 a 75 km/h
  const RUTA_PRUEBA = (() => { const p = [], n = 90; for (let i = 0; i <= n; i++) { const f = i / n; p.push([+(41.98 + f * 1.2).toFixed(5), +(2.82 + f * 0.18).toFixed(5), +(f * 135).toFixed(1), Math.round(f * 108)]); }
    return { desde: { nombre: "Girona", lat: 41.98, lon: 2.82 }, hasta: { nombre: "Narbona, Francia", lat: 43.18, lon: 3.0 }, km: 135, min: 108, peaje: true, ferry: false,
      tramos: [{ via: "", km: 4, hacia: "" }, { via: "AP-7", km: 70, hacia: "La Jonquera / França" }, { via: "A9", km: 61, hacia: "Narbonne" }], puntos: p, fina: p.map(x => [x[0], x[1]]), autopista: [[4, 135]], peajes: [[70, 135]],
    alternativas: [{ km: 142, min: 124, peaje: false, ferry: false, tramos: [{ via: "N-II", km: 60, hacia: "La Jonquera" }, { via: "D900", km: 82, hacia: "Narbonne" }],
      puntos: p.map(x => [x[0], +(x[1] - 0.06).toFixed(5), +(x[2] * 1.05).toFixed(1), Math.round(x[3] * 1.15)]), fina: p.map(x => [x[0], +(x[1] - 0.06).toFixed(5)]), autopista: [], peajes: [] }] }; })();
  // Con localStorage «prueba-sesion» = 1, el panel entra como administrador de prueba
  const SES = (() => { try { return localStorage.getItem("prueba-sesion") === "1"; } catch (_) { return false; } })()
    ? { access_token: "x", user: { id: "u1", email: "prueba@example.com" } } : null;
  const auth = {
    getSession: async () => ({ data: { session: SES }, error: null }),
    onAuthStateChange: (cb) => { Promise.resolve().then(() => cb(SES ? "SIGNED_IN" : "INITIAL_SESSION", SES)); return { data: { subscription: { unsubscribe() {} } } }; },
    signInWithPassword: async () => ({ data: null, error: { message: "Invalid login credentials" } }),
    signOut: async () => ({ error: null }), getUser: async () => ({ data: { user: null } }),
    mfa: { getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: "aal1", nextLevel: "aal1" } }), listFactors: async () => ({ data: { totp: [], all: [] } }) },
  };
  window.supabase = {
    createClient: () => ({
      from: consulta, auth, channel: () => canal, removeChannel() {},
      rpc: async (n) => ({ data: n === "avisar_aparcamiento" ? "ok" : null, error: null }),
      // «Fleuré» sin código postal: hay dos pueblos y la función pregunta cuál (como la de verdad)
      functions: { invoke: async (n, o) => ({ data: n === "traducir" && o?.body?.modo === "textos" ? { textos: { "Ir": "Mergi", "Ir a: {t}": "Mergi la: {t}", "Calcular la ruta": "Calculează ruta", "Cada día": "În fiecare zi", "Al empezar a trabajar": "Când începi lucrul" } } : n !== "ruta" ? null : typeof o?.body?.buscar === "string" ? { lugares: /fleur/i.test(o.body.buscar)
          ? [{ nombre: "Fleuré, France", detalle: "61200, Orne, Normandie, France", lat: 48.69, lon: -0.058 }, { nombre: "Fleuré, France", detalle: "86340, Vienne, Nouvelle-Aquitaine, France", lat: 46.478, lon: 0.522 }]
          : [{ nombre: "Figueres, España", detalle: "17600, Girona, Catalunya, España", lat: 42.266, lon: 2.96 }] } : (o?.body?.elegir && typeof o.body.hasta === "string" && /fleur/i.test(o.body.hasta) && !o.body.cp_hasta)
        ? { elegir: { hasta: [{ nombre: "Fleuré, France", detalle: "61200, Orne, Normandie, France", cp: "61200", lat: 48.69, lon: -0.058 }, { nombre: "Fleuré, France", detalle: "86340, Vienne, Nouvelle-Aquitaine, France", cp: "86340", lat: 46.478, lon: 0.522 }] } }
        : RUTA_PRUEBA, error: null }) },
      storage: { from: () => ({ upload: async () => ({ error: null }), getPublicUrl: (r) => ({ data: { publicUrl: "https://example.com/documentos/" + r } }), remove: async () => ({}), list: async () => ({ data: [] }) }) },
    }),
  };
})();
