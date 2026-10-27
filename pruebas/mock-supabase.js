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
    tarifas_conductor: [
      { id: 1, grupo: "Salario", concepto: "Salario bruto (sin antigüedad)", importe: 1725.28, unidad: "mes", pago: "Mensual", sin_pagar: 0, max_mes: null, nota: "", orden: 10, visible: true },
      { id: 3, grupo: "Dieta completa", concepto: "Dieta completa nacional", importe: 48.6, unidad: "dia", pago: "Semanal", sin_pagar: 0, max_mes: null, nota: "", orden: 30, visible: true },
      { id: 5, grupo: "Suplementos", concepto: "Fin de semana fuera (domingo)", importe: 100, unidad: "finde", pago: "Semanal", sin_pagar: 0, max_mes: 2, nota: "Como mucho 2 al mes.", orden: 50, visible: true },
      { id: 7, grupo: "Dieta fraccionada nacional", concepto: "Desayuno", importe: 5.72, unidad: "vez", pago: "Semanal", sin_pagar: 0, max_mes: null, nota: "", orden: 70, visible: true },
      { id: 20, grupo: "Otros pluses", concepto: "ADR (por minuto)", importe: 0.00812196, unidad: "minuto", pago: "Mensual", sin_pagar: 0, max_mes: null, nota: "Promedio: depende de la antigüedad.", orden: 200, visible: true },
      { id: 21, grupo: "Otros pluses", concepto: "ADR (fijo al mes)", importe: 70, unidad: "mes", pago: "Mensual", sin_pagar: 0, max_mes: null, nota: "Solo si haces ADR.", orden: 210, visible: true },
      { id: 22, grupo: "Otros pluses", concepto: "Carga o descarga internacional (de la 2.ª en adelante)", importe: 6, unidad: "vez", pago: "Semanal", sin_pagar: 0, max_mes: null, nota: "La primera no se paga. Apunta solo las que hagas a partir de la segunda: 6 € cada una.", orden: 220, visible: true },
      { id: 26, grupo: "Otros pluses", concepto: "Horas sindicales", importe: 0, unidad: "hora", pago: "Mensual", sin_pagar: 0, max_mes: null, nota: "Cada persona cobra distinto: pon tu precio por hora en «Ajustes» > «Lo que cobras tú».", orden: 245, visible: true },
      { id: 19, grupo: "Otros pluses", concepto: "Festivo", importe: 50, unidad: "dia", pago: "Mensual", sin_pagar: 0, max_mes: null, nota: "", orden: 190, visible: true },
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
      rpc: async () => ({ data: null, error: null }),
      functions: { invoke: async () => ({ data: null, error: null }) },
      storage: { from: () => ({ upload: async () => ({ error: null }), getPublicUrl: (r) => ({ data: { publicUrl: "https://example.com/documentos/" + r } }), remove: async () => ({}), list: async () => ({ data: [] }) }) },
    }),
  };
})();
