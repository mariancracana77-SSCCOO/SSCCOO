// Guía de testigos (Zona Conductores > Utilidades en ruta, petición n.º 65 del padre, v196). Una carpeta por marca
// (de momento DAF: XF, XG, XG+ y CF) con los testigos del cuadro: cómo se ven, de qué color salen, qué significan y
// qué hacer. Son los símbolos normalizados (ISO 2575) que usa DAF; el dibujo puede cambiar algo según el año y el
// modelo, por eso la página manda siempre al manual del camión. Para añadir una marca: otra entrada en MARCAS.
// Sin nada en línea (CSP), textos con esc(). v201: icono de cada testigo (i) en testigos-iconos.js, como la guía de Gemini. Solo en español. Guarda solo la marca abierta en «ccoo-testigos» {m}.
// v210 (petición del padre, 23/11/2026: «cambia los testigos por estos», con las fotos de SU manual DAF): grupo «cuadro» con los
// testigos 1-39 del manual (g, num, p = página, m = texto del manual, h y nota solo si el manual los da). Grupo «otros»: los de antes
// que aún no están en las páginas del manual que tenemos, marcados «Sin comprobar». Las fotos del manual NO se publican (derechos de DAF).
(function () {
  // c: color del testigo (rojo = para; ambar = revisa pronto; verde/azul = solo informa)
  // a: lo que se lee en la pastilla; v: cómo se ve; s: qué significa; h: qué hacer
  /* textos */
  const MARCAS = [
    {
      id: "daf", n: "DAF", sub: "XF, XG, XG+ y CF (de 2013 en adelante)",
      t: [
      // v210 (petición del padre, 23/11/2026): los testigos del cuadro tal como vienen en SU manual DAF (cap. 5 «Entorno
      // del conductor», págs. 101-109): número, nombre y texto del manual; el dibujo, hecho por nosotros igual que el del manual.
      // num: número del testigo en el cuadro; p: página; m: lo que dice el manual; h: qué hacer (solo si el manual lo dice).
      { g: "cuadro", num: 1, p: 101, i: "c-int-izq", n: "Intermitente izquierdo, camión", m: "Este testigo parpadea simultáneamente con los intermitentes del camión." },
      { g: "cuadro", num: 2, p: 101, i: "c-int-rem", n: "Indicador de intermitente izquierdo, remolque/semirremolque", m: "En una combinación de camión y remolque/semirremolque, este testigo parpadea simultáneamente con los intermitentes del remolque/semirremolque." },
      { g: "cuadro", num: 3, p: 101, i: "c-cinturon", n: "Recordatorio del cinturón de seguridad", m: "" },
      { g: "cuadro", num: 4, p: 101, i: "c-carretera", n: "Luz de carretera", m: "Este testigo se ilumina cuando se enciende la luz de carretera o cuando se activa la luz de destellos con el interruptor izquierdo de la columna de la dirección." },
      { g: "cuadro", num: 5, p: 101, i: "c-galibo", n: "Luces de gálibo encendidas", m: "" },
      { g: "cuadro", num: 5, p: 101, i: "c-drl-off", n: "Luces de funcionamiento diurno apagadas", m: "Este testigo se ilumina cuando se apagan las luces de conducción diurna." },
      { g: "cuadro", num: 6, p: 102, i: "c-cruce", n: "Luces de cruce y luces de gálibo encendidas", m: "" },
      { g: "cuadro", num: 6, p: 102, i: "c-cruce-auto", n: "Modo automático de las luces de cruce y las luces de gálibo activado", m: "" },
      { g: "cuadro", num: 6, p: 102, i: "c-cruce-off", n: "Interruptor de luces de cruce y de gálibo encendidas", m: "" },
      { g: "cuadro", num: 7, p: 102, i: "c-niebla-del", n: "Luces antiniebla delanteras", m: "Este testigo se ilumina cuando se encienden las luces antiniebla delanteras." },
      { g: "cuadro", num: 7, p: 102, i: "c-carretera-auto", n: "Luz de carretera automática", m: "Este testigo se enciende cuando la luz de carretera automática está activada." },
      { g: "cuadro", num: 8, p: 102, i: "c-niebla-tras", n: "Luces antiniebla traseras", m: "Este testigo se ilumina cuando se encienden las luces antiniebla traseras." },
      { g: "cuadro", num: 10, p: 102, i: "c-limpia-auto", n: "Limpiaparabrisas automático", m: "" },
      { g: "cuadro", num: 11, p: 103, i: "c-asiento-gir", n: "Asiento giratorio", m: "Este testigo muestra que el asiento giratorio no está correctamente fijado." },
      { g: "cuadro", num: 12, p: 103, i: "c-tpms", n: "Control de presión de los neumáticos", m: "" },
      { g: "cuadro", num: 12, p: 103, i: "c-tpms-averia", n: "Avería de presión de los neumáticos", m: "" },
      { g: "cuadro", num: 13, p: 103, i: "c-tc", n: "Control de tracción", m: "Este testigo parpadea cuando interviene el sistema ASR." },
      { g: "cuadro", num: 13, p: 103, i: "c-tc-off", n: "Control de tracción desactivado", m: "Este testigo se ilumina cuando el modo de fuera de carretera desactiva el control de tracción." },
      { g: "cuadro", num: 13, p: 103, i: "c-vsc", n: "Control de estabilidad del vehículo (VSC)", m: "Este testigo parpadea cuando interviene el sistema VSC. Si este indicador de aviso permanece encendido, hay un fallo en el sistema." },
      { g: "cuadro", num: 14, p: 103, i: "c-dif-trans", n: "Bloqueo (transversal) del diferencial", m: "Este testigo se ilumina cuando se activa el bloqueo transversal." },
      { g: "cuadro", num: 14, p: 103, i: "c-dif-long", n: "Bloqueo (longitudinal) del diferencial", m: "Este testigo se ilumina cuando se activa el bloqueo del diferencial longitudinal." },
      { g: "cuadro", num: 14, p: 104, i: "c-dif-ambos", n: "Bloqueo del diferencial longitudinal y transversal", m: "Este testigo se ilumina cuando se activa el bloqueo del diferencial longitudinal y transversal." },
      { g: "cuadro", num: 15, p: 104, i: "c-tdf1", n: "Testigo de la TDF 1", m: "La TDF 1 puede ser una TDF del motor, NMV o una TDF de la caja de cambios." },
      { g: "cuadro", num: 15, p: 104, i: "c-tdf2", n: "Testigo de la TDF 2", m: "La TDF 2 es una TDF a la caja de cambios." },
      { g: "cuadro", num: 15, p: 104, i: "c-tdf3", n: "Testigo de la TDF 3", m: "La TDF 3 es un motor o TDF NMV." },
      { g: "cuadro", num: 15, p: 104, i: "c-dpf", n: "Filtro de partículas diésel", m: "Este testigo se ilumina cuando el nivel de hollín del DPF o del filtro de hollín es (demasiado) alto o si el filtro está sucio." },
      { g: "cuadro", num: 16, p: 104, i: "c-somnolencia", n: "Detección de somnolencia del conductor", m: "Este testigo indica que se ha detectado somnolencia debido al tiempo de conducción y al comportamiento del conductor." },
      { g: "cuadro", num: 17, p: 104, i: "c-arranque", n: "Asistente de arranque", m: "Este testigo indica que hay una avería en el sistema de asistencia de arranque." },
      { g: "cuadro", num: 17, p: 104, i: "c-arranque-off", n: "Asistente de arranque desactivado", m: "Este testigo indica que el sistema de asistencia de arranque está desactivado." },
      { g: "cuadro", num: 18, p: 105, i: "c-angulo", n: "Detección de objetos en ángulo muerto", m: "Este testigo indica que hay una avería en el sistema de detección de objetos en ángulo muerto." },
      { g: "cuadro", num: 18, p: 105, i: "c-angulo-off", n: "Detección de objetos en ángulo muerto desactivado", m: "Este testigo indica que el sistema de detección de objetos en ángulo muerto está desactivado." },
      { g: "cuadro", num: 19, p: 105, i: "c-aparc", n: "Aparcamiento asistido", m: "Este testigo indica que hay una avería en el sistema de aparcamiento asistido." },
      { g: "cuadro", num: 19, p: 105, i: "c-aparc-off", n: "Aparcamiento asistido desactivado", m: "Este testigo indica que el sistema de aparcamiento asistido está desactivado." },
      { g: "cuadro", num: 20, p: 105, i: "c-aebs", n: "Sistema avanzado de frenado de emergencia (AEBS)", m: "Este testigo indica que hay una avería de AEBS o que la cámara situada detrás del parabrisas está sucia o bloqueada." },
      { g: "cuadro", num: 20, p: 105, i: "c-aebs-off", n: "AEBS desactivado", m: "Este testigo indica que el AEBS está desactivado." },
      { g: "cuadro", num: 21, p: 105, i: "c-ldws", n: "Sistema de advertencia de salida de carril", m: "Este testigo se ilumina cuando: el LDWS no puede detectar ninguna línea, cuando la cámara está bloqueada, cuando el LDWS se ha desactivado o cuando se detecta una avería." },
      { g: "cuadro", num: 21, p: 106, i: "c-ldws-off", n: "Sistema de advertencia de salida de carril desactivado", m: "Este testigo indica que el LDWS está desactivado." },
      { g: "cuadro", num: 0, p: 106, i: "c-combustible", n: "Nivel de combustible", m: "Este testigo se ilumina en color rojo cuando el nivel de combustible es crítico.", h: "Reposte lo antes posible." },
      { g: "cuadro", num: 22, p: 106, i: "c-eje-motor", n: "Eje delantero motor", m: "" },
      { g: "cuadro", num: 23, p: 106, i: "c-trampilla", n: "Rígido: Trampilla elevadora", m: "" },
      { g: "cuadro", num: 23, p: 106, i: "c-carroceria", n: "Aviso general de la carrocería", m: "" },
      { g: "cuadro", num: 23, p: 106, i: "c-volquete", n: "Volquete", m: "" },
      { g: "cuadro", num: 24, p: 106, i: "c-chasis", n: "Chasis a un nivel de conducción no normal", m: "Este testigo se ilumina cuando el chasis no se encuentra a la altura de conducción normal." },
      { g: "cuadro", num: 0, p: 106, i: "c-adblue", n: "Nivel bajo de AdBlue", m: "Este testigo se ilumina en rojo cuando el nivel de AdBlue alcanza un valor crítico." },
      { g: "cuadro", num: 26, p: 107, i: "c-retardador", n: "Freno motor o retardador activo", m: "Este testigo se ilumina cuando están activos el freno motor o el retardador. Si el indicador parpadea, el par de frenado se reduce debido a una función de protección del intarder. Esta reducción del par de frenado puede activarse, por ejemplo, si la temperatura del motor es demasiado alta. Este indicador comienza a parpadear y aparece un aviso emergente en la pantalla general cuando el pedal del acelerador prevalece sobre la función del freno motor o el retardador.", nota: "El indicador del retardador no aparece cuando el freno motor o el retardador están activos durante la integración del tercer freno o una reducción de velocidad realizada por el ACC (control de crucero adaptable)." },
      { g: "cuadro", num: 27, p: 107, i: "c-hill", n: "Ayuda de arranque en pendiente", m: "Este testigo se ilumina cuando la función Hill Start Aid está activada." },
      { g: "cuadro", num: 28, p: 107, i: "c-abs-tractor", n: "ABS del tractor", m: "Este testigo se ilumina cuando se enciende el contacto y desaparece tras 3 segundos. Si el testigo continúa encendido, hay un fallo en el sistema ABS del camión." },
      { g: "cuadro", num: 28, p: 107, i: "c-abs-remolque", n: "ABS del (semi) remolque", m: "Este testigo se ilumina cuando se enciende el contacto y hay un remolque/semirremolque con sistema ABS enganchado al camión. El testigo se apaga a los 3 segundos. Si el testigo sigue encendido, hay un fallo en el sistema ABS del remolque/semirremolque." },
      { g: "cuadro", num: 29, p: 108, i: "c-freno-rend", n: "Escaso rendimiento del freno", m: "Consulte la sección «Frenos» en el capítulo «Conducción» del manual." },
      { g: "cuadro", num: 30, p: 108, i: "c-freno-estac", n: "Freno de estacionamiento", m: "Este testigo se ilumina cuando se acciona el freno de estacionamiento o cuando la presión del sistema de suministro de aire es demasiado baja para poder soltar el freno de estacionamiento." },
      { g: "cuadro", num: 31, p: 108, i: "c-int-der", n: "Intermitente derecho, camión", m: "Este testigo parpadea simultáneamente con los intermitentes del camión." },
      { g: "cuadro", num: 32, p: 108, i: "c-int-rem", n: "Intermitente derecho, (semi) remolque", m: "Con una combinación de camión y (semi) remolque, este indicador de aviso parpadea simultáneamente con los intermitentes del (semi) remolque." },
      { g: "cuadro", num: 33, p: 108, i: "c-stop", n: "Luz STOP", m: "Este testigo indica que el camión debe detenerse y estacionarse lo antes posible.", h: "Para y estaciona lo antes posible." },
      { g: "cuadro", num: 34, p: 108, i: "c-mil", n: "Testigo de avería (MIL)", m: "Este testigo se ilumina cuando el nivel de emisiones excede el límite legal o para indicar un aviso genérico relacionado con el motor o el sistema de escape. Cómo se comprueba: con la llave en contacto y el motor apagado, el testigo se enciende 5 segundos, se apaga 10 segundos y vuelve a encenderse otros 5 (comprobación del sistema). Después parpadea 1 segundo cada 5 segundos. Cualquier otro patrón de parpadeo es señal de fallo." },
      { g: "cuadro", num: 35, p: 109, i: "c-eta", n: "Hora estimada de llegada (ETA)", m: "Este testigo se ilumina cuando se utiliza el sistema de navegación." },
      { g: "cuadro", num: 36, p: 109, i: "c-despertador", n: "Reloj con alarma", m: "Este testigo se ilumina cuando el despertador está activado." },
      { g: "cuadro", num: 37, p: 109, i: "c-tacografo", n: "Anomalía en el tacógrafo", m: "Consulte el manual de instrucciones del tacógrafo." },
      { g: "cuadro", num: 38, p: 109, i: "c-horas", n: "Horas de conducción", m: "Tiempo de conducción restante." },
      { g: "cuadro", num: 39, p: 109, i: "c-plataforma", n: "Plataforma bajada", m: "Prevención de desplazamiento activada." },
      // Otros testigos que salían en la guía de antes (v196/v201). Aún sin comprobar en el manual del padre: se irán
      // cambiando por los avisos de la pantalla (partes B y C, págs. 70-97).
        { g: "otros", i: "presion-aire-frenos", c: "rojo", a: "(!)", n: "Freno: presión de aire baja", v: "Un círculo con un signo de admiración dentro y dos arcos a los lados.", s: "No hay presión de aire suficiente en los circuitos de freno, o hay una avería en el sistema de frenos.", h: "No arranques hasta que se apague (deja el motor en marcha para que cargue el aire). Si sale circulando, para con cuidado: el freno puede ir peor." },
        { g: "otros", i: "presion-aceite", c: "rojo", a: "ACEITE", n: "Presión de aceite del motor", v: "Una aceitera con una gota cayendo.", s: "La presión de aceite del motor es demasiado baja.", h: "Para y apaga el motor enseguida: puede romperse. Mira el nivel de aceite y no arranques sin hablar con el taller." },
        { g: "otros", i: "temperatura-refrigerante", c: "rojo", a: "TEMP", n: "Temperatura del motor alta", v: "Un termómetro metido en unas olas.", s: "El refrigerante del motor está demasiado caliente.", h: "Baja la carga del motor y para con seguridad. Déjalo al ralentí un poco y apágalo. No abras el depósito en caliente." },
        { g: "otros", i: "refrigerante-nivel", c: "ambar", a: "REFR", n: "Nivel de refrigerante bajo", v: "Un depósito con una línea de nivel y unas olas.", s: "Falta líquido refrigerante.", h: "Con el motor frío, mira el nivel y rellena con el líquido que pide DAF. Si se repite, al taller." },
        { g: "otros", i: "alternador-bateria-rojo", c: "rojo", a: "BAT", n: "Carga de la batería", v: "Una batería con los signos + y −.", s: "El alternador no carga las baterías.", h: "Apaga lo que no haga falta y ve al taller. Si apagas el motor, puede que no vuelva a arrancar." },
        { g: "otros", i: "cabina-sin-bloquear", c: "rojo", a: "CABINA", n: "Cabina no bloqueada", v: "Un camión con la cabina inclinada hacia delante.", s: "La cabina no ha quedado bien enganchada después de bascularla.", h: "No circules. Vuelve a bajar la cabina hasta que quede bloqueada." },
        { g: "otros", i: "airbag", c: "rojo", a: "AIRBAG", n: "Airbag", v: "Una persona sentada con un globo delante.", s: "Avería en el airbag o en los pretensores del cinturón.", h: "Puedes seguir, pero el airbag puede no funcionar. Al taller lo antes posible." },
        { g: "otros", i: "aviso-general", c: "ambar", a: "!", n: "Aviso general", v: "Un triángulo con un signo de admiración.", s: "Hay un aviso o una avería que no es grave. La pantalla central dice cuál.", h: "Lee el mensaje de la pantalla. Puedes seguir, pero arréglalo pronto." },
        { g: "otros", i: "adblue-scr-fallo", c: "ambar", a: "SCR", n: "Avería del sistema AdBlue (SCR)", v: "Un tubo de escape con un aviso, o el motor con la palabra SCR o NOx.", s: "El sistema que limpia los gases con AdBlue no funciona bien: AdBlue malo, sensor o bomba.", h: "Al taller pronto: si no se arregla, el camión limita la velocidad o la potencia." },
        { g: "otros", i: "regeneracion-dpf-activa", c: "ambar", a: "REGEN", n: "Regeneración en marcha", v: "Tres rayas onduladas hacia arriba (calor del escape), a veces junto al filtro.", s: "El filtro se está limpiando: el escape va muy caliente.", h: "No pares encima de hierba, papel o cosas que ardan. No interrumpas la regeneración si no hace falta." },
        { g: "otros", i: "precalentamiento", c: "ambar", a: "PRECAL", n: "Precalentamiento", v: "Dos bujías (en algunos modelos, una espiral como un muelle).", s: "El motor está calentando antes de arrancar en frío.", h: "Espera a que se apague y luego arranca. Si sigue encendido circulando, al taller." },
        { g: "otros", i: "ebs-rojo", c: "rojo", a: "EBS", n: "Avería grave del EBS", v: "Las letras EBS en rojo, a veces con STOP.", s: "Fallo importante en el freno electrónico.", h: "Para con seguridad: la frenada puede ser más débil. Llama al taller o a asistencia." },
        { g: "otros", i: "ebs-ambar", c: "ambar", a: "EBS", n: "Avería leve del EBS", v: "Las letras EBS en ámbar.", s: "Fallo en el freno electrónico que no es grave.", h: "Puedes seguir con cuidado. Al taller pronto." },
        { g: "otros", i: "pastillas-freno", c: "ambar", a: "PASTILLAS", n: "Desgaste de pastillas de freno", v: "Un círculo con una línea discontinua (las pastillas) a cada lado.", s: "Las pastillas de freno están gastadas.", h: "Al taller a cambiarlas pronto." },
        { g: "otros", i: "agua-combustible", c: "ambar", a: "AGUA", n: "Agua en el gasoil", v: "Un surtidor o filtro con gotas de agua.", s: "Hay agua en el filtro separador de gasoil.", h: "Purga el filtro como dice el manual o al taller. El agua puede estropear la inyección." },
        { g: "otros", i: "filtro-aire", c: "ambar", a: "AIRE F", n: "Filtro de aire obstruido", v: "Un filtro (rectángulo con rayas) con una flecha.", s: "El filtro de aire del motor está sucio y entra poco aire.", h: "Al taller a cambiarlo. El motor puede perder potencia." },
        { g: "otros", i: "caja-cambios-rojo", c: "ambar", a: "CAJA", n: "Avería de la caja de cambios (TraXon)", v: "Un círculo de puntos con un signo de admiración (en otros, unos engranajes con un aviso).", s: "Fallo en la caja de cambios automática.", h: "Para con seguridad cuando puedas y lee el mensaje. Al taller." },
        { g: "otros", i: "acc-crucero", c: "verde", a: "CRUCERO", n: "Control de crucero o ACC", v: "Un velocímetro con una flecha (y un camión delante si es el ACC).", s: "El control de crucero o el de distancia está conectado.", h: "Solo informa." },
        { g: "otros", i: "eje-elevable", c: "verde", a: "EJE", n: "Eje elevable subido", v: "Dos ruedas, una más alta, con una flecha hacia arriba.", s: "El eje elevable está subido (para ir vacío o con poca carga).", h: "Solo informa. Baja solo si hace falta por el peso." },
        { g: "otros", i: "temperatura-caja", c: "rojo", a: "TEMP CAJA", n: "Temperatura alta de la caja de cambios o del retarder", v: "Un engranaje con un termómetro al lado.", s: "El aceite de la caja de cambios (o del retarder/Intarder) está demasiado caliente, por ejemplo en una bajada larga frenando con el retarder.", h: "Afloja: menos retarder, marcha más corta y freno de servicio a ratos. Si no se apaga, para con seguridad y deja enfriar. Si sale a menudo, al taller." },
        { g: "otros", i: "limpiaparabrisas", c: "ambar", a: "LIMPIA", n: "Líquido del limpiaparabrisas bajo", v: "Un parabrisas con un chorro de agua por encima.", s: "Queda poco líquido en el depósito del limpiaparabrisas.", h: "Rellénalo en la próxima parada (en invierno, con anticongelante)." },
      ],
    },
  ];
  /* fin textos */
  const COLOR = { rojo: "Rojo: para", ambar: "Ámbar: revisa pronto", verde: "Verde: informa", azul: "Azul: informa" };
  const GRUPOS = { cuadro: "Del cuadro (manual DAF)", otros: "Otros, sin comprobar" };
  window.TestigosDatos = { MARCAS, COLOR, GRUPOS };

  const $ = (i) => document.getElementById(i);
  if (!$("v-testigos")) return;
  // v201: el dibujo de cada testigo sale de testigos-iconos.js (SVG fijos del archivo, nunca datos del usuario)
  const ICONOS = window.TestigosIconos || {};
  const KEY = "ccoo-testigos";
  let marca = null, grupo = "";
  try { const g = JSON.parse(localStorage.getItem(KEY) || "{}"); if (MARCAS.some(m => m.id === g.m)) marca = g.m; } catch (e) { /* sin datos */ }
  const guarda = () => { try { localStorage.setItem(KEY, JSON.stringify({ m: marca })); } catch (e) { /* sin almacenamiento */ } };
  const normal = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  function pinta() {
    const m = MARCAS.find(x => x.id === marca);
    $("te-marcas").hidden = !!m;
    $("te-carpeta").hidden = !m;
    if (!m) {
      $("te-marcas").innerHTML = MARCAS.map(x => `<a class="panel desc-promo cond util te-marca" href="#testigos" data-m="${esc(x.id)}">${icono("carpeta")}<span><b>${esc(x.n)}</b><small>${esc(x.sub)} · ${x.t.length} testigos</small></span>${icono("der", "p")}</a>`).join("");
      return;
    }
    $("te-nombre").textContent = m.n;
    $("te-sub").textContent = m.sub;
    $("te-colores").innerHTML = [["", "Todos"], ...Object.entries(GRUPOS)].map(([k, t]) => `<button type="button" class="zc-chip${k === grupo ? " activa" : ""}" data-c="${esc(k)}" aria-pressed="${k === grupo}">${esc(t)}</button>`).join("");
    const q = normal($("te-busca").value.trim());
    const l = m.t.filter(x => (!grupo || x.g === grupo) && (!q || normal(`${x.num || ""} ${x.a || ""} ${x.n} ${x.m || ""} ${x.nota || ""} ${x.v || ""} ${x.s || ""}`).includes(q)));
    $("te-cuenta").textContent = `${l.length} de ${m.t.length} testigos`;
    $("te-lista").innerHTML = l.length ? l.map(tarjeta).join("")
      : `<div class="zc-aviso">No hay ningún testigo que coincida. Prueba con otra palabra (aceite, freno, AdBlue…) o con el número del cuadro.</div>`;
  }
  function tarjeta(x) {
    const ico = `<span class="te-icono" aria-hidden="true">${ICONOS[x.i] || ""}</span>`;
    if (x.g === "cuadro") return `<article class="panel te-item manual">${ico}
      <div><h3>${esc(x.n)}</h3><p class="te-color">${x.num ? "N.º " + esc(x.num) + " en el cuadro" : "Indicador del cuadro"}</p><p class="te-comp">Comprobado en manual DAF, pág. ${esc(x.p)}</p>
      ${x.m ? `<p><b>Qué dice el manual:</b> ${esc(x.m)}</p>` : `<p>El manual solo da el nombre de este testigo.</p>`}
      ${x.h ? `<p><b>Qué hacer:</b> ${esc(x.h)}</p>` : ""}${x.nota ? `<p><b>Nota del manual:</b> ${esc(x.nota)}</p>` : ""}</div></article>`;
    return `<article class="panel te-item ${esc(x.c)}">${ico}
      <div><h3>${esc(x.n)}</h3><p class="te-color">${esc(COLOR[x.c])}</p><p class="te-comp">Sin comprobar en el manual</p>
      <p><b>Cómo se ve:</b> ${esc(x.v)}</p><p><b>Qué significa:</b> ${esc(x.s)}</p><p><b>Qué hacer:</b> ${esc(x.h)}</p></div></article>`;
  }
  $("te-marcas").addEventListener("click", (e) => {
    const a = e.target.closest("[data-m]");
    if (!a) return;
    e.preventDefault();
    marca = a.dataset.m;
    guarda();
    pinta();
    window.scrollTo(0, 0);
  });
  $("te-volver").addEventListener("click", () => { marca = null; grupo = ""; $("te-busca").value = ""; guarda(); pinta(); });
  $("te-colores").addEventListener("click", (e) => {
    const b = e.target.closest("[data-c]");
    if (!b) return;
    grupo = b.dataset.c;
    pinta();
  });
  $("te-busca").addEventListener("input", pinta);
  pinta();
})();
