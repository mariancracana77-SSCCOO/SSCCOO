// Guía de testigos (Zona Conductores > Utilidades en ruta, petición n.º 65 del padre, v196). Una carpeta por marca
// (de momento DAF: XF, XG, XG+ y CF) con los testigos del cuadro: cómo se ven, de qué color salen, qué significan y
// qué hacer. Son los símbolos normalizados (ISO 2575) que usa DAF; el dibujo puede cambiar algo según el año y el
// modelo, por eso la página manda siempre al manual del camión. Para añadir una marca: otra entrada en MARCAS.
// Sin nada en línea (CSP), textos con esc(). v201: icono de cada testigo (i) en testigos-iconos.js, como la guía de Gemini. Solo en español. Guarda solo la marca abierta en «ccoo-testigos» {m}.
(function () {
  // c: color del testigo (rojo = para; ambar = revisa pronto; verde/azul = solo informa)
  // a: lo que se lee en la pastilla; v: cómo se ve; s: qué significa; h: qué hacer
  /* textos */
  const MARCAS = [
    {
      id: "daf", n: "DAF", sub: "XF, XG, XG+ y CF (de 2013 en adelante)",
      t: [
        { i: "stop-general", c: "rojo", a: "STOP", n: "STOP", v: "Un triángulo rojo con un signo de admiración, o la palabra STOP, a veces con un pitido.", s: "Avería grave. Suele salir junto a otro testigo o un mensaje en la pantalla central que dice qué pasa.", h: "Para en cuanto puedas hacerlo con seguridad, apaga el motor y lee el mensaje de la pantalla. No sigas circulando." },
        { i: "presion-aire-frenos", c: "rojo", a: "(!)", n: "Freno: presión de aire baja", v: "Un círculo con un signo de admiración dentro y dos arcos a los lados.", s: "No hay presión de aire suficiente en los circuitos de freno, o hay una avería en el sistema de frenos.", h: "No arranques hasta que se apague (deja el motor en marcha para que cargue el aire). Si sale circulando, para con cuidado: el freno puede ir peor." },
        { i: "freno-estacionamiento", c: "rojo", a: "(P)", n: "Freno de estacionamiento", v: "Una P dentro de un círculo con dos arcos a los lados.", s: "El freno de mano está puesto.", h: "Quítalo antes de arrancar. Si sigue encendido con el freno quitado, avisa al taller." },
        { i: "presion-aceite", c: "rojo", a: "ACEITE", n: "Presión de aceite del motor", v: "Una aceitera con una gota cayendo.", s: "La presión de aceite del motor es demasiado baja.", h: "Para y apaga el motor enseguida: puede romperse. Mira el nivel de aceite y no arranques sin hablar con el taller." },
        { i: "temperatura-refrigerante", c: "rojo", a: "TEMP", n: "Temperatura del motor alta", v: "Un termómetro metido en unas olas.", s: "El refrigerante del motor está demasiado caliente.", h: "Baja la carga del motor y para con seguridad. Déjalo al ralentí un poco y apágalo. No abras el depósito en caliente." },
        { i: "refrigerante-nivel", c: "ambar", a: "REFR", n: "Nivel de refrigerante bajo", v: "Un depósito con una línea de nivel y unas olas.", s: "Falta líquido refrigerante.", h: "Con el motor frío, mira el nivel y rellena con el líquido que pide DAF. Si se repite, al taller." },
        { i: "alternador-bateria-rojo", c: "rojo", a: "BAT", n: "Carga de la batería", v: "Una batería con los signos + y −.", s: "El alternador no carga las baterías.", h: "Apaga lo que no haga falta y ve al taller. Si apagas el motor, puede que no vuelva a arrancar." },
        { i: "cabina-sin-bloquear", c: "rojo", a: "CABINA", n: "Cabina no bloqueada", v: "Un camión con la cabina inclinada hacia delante.", s: "La cabina no ha quedado bien enganchada después de bascularla.", h: "No circules. Vuelve a bajar la cabina hasta que quede bloqueada." },
        { i: "cinturon", c: "rojo", a: "CINT", n: "Cinturón de seguridad", v: "Una persona sentada con el cinturón cruzado.", s: "No llevas el cinturón abrochado.", h: "Abróchate el cinturón." },
        { i: "airbag", c: "rojo", a: "AIRBAG", n: "Airbag", v: "Una persona sentada con un globo delante.", s: "Avería en el airbag o en los pretensores del cinturón.", h: "Puedes seguir, pero el airbag puede no funcionar. Al taller lo antes posible." },
        { i: "aviso-general", c: "ambar", a: "!", n: "Aviso general", v: "Un triángulo con un signo de admiración.", s: "Hay un aviso o una avería que no es grave. La pantalla central dice cuál.", h: "Lee el mensaje de la pantalla. Puedes seguir, pero arréglalo pronto." },
        { i: "check-engine-ambar", c: "ambar", a: "MOTOR", n: "Avería del motor (emisiones)", v: "El dibujo de un motor visto de lado.", s: "Avería en el motor o en el control de emisiones. El motor puede bajar la potencia.", h: "Puedes seguir con cuidado. Al taller lo antes posible. Si parpadea o el motor va mal, para." },
        { i: "adblue-scr-fallo", c: "ambar", a: "ADBLUE", n: "AdBlue bajo", v: "Un depósito con una gota azul o las letras AdBlue / DEF.", s: "Queda poco AdBlue. Si se acaba, el motor pierde potencia y puede no volver a arrancar.", h: "Llena el depósito de AdBlue (el de tapa azul) cuanto antes." },
        { i: "adblue-scr-fallo", c: "ambar", a: "SCR", n: "Avería del sistema AdBlue (SCR)", v: "Un tubo de escape con un aviso, o el motor con la palabra SCR o NOx.", s: "El sistema que limpia los gases con AdBlue no funciona bien: AdBlue malo, sensor o bomba.", h: "Al taller pronto: si no se arregla, el camión limita la velocidad o la potencia." },
        { i: "dpf-saturado", c: "ambar", a: "DPF", n: "Filtro de partículas", v: "Un recuadro con las letras DPF y un tubo a cada lado (en otros, puntitos dentro).", s: "El filtro de partículas está lleno y necesita limpiarse (regeneración).", h: "Si se puede, conduce un rato por autovía para que se limpie solo. Si no se apaga, haz la regeneración parado como dice el manual o ve al taller." },
        { i: "regeneracion-dpf-activa", c: "ambar", a: "REGEN", n: "Regeneración en marcha", v: "Tres rayas onduladas hacia arriba (calor del escape), a veces junto al filtro.", s: "El filtro se está limpiando: el escape va muy caliente.", h: "No pares encima de hierba, papel o cosas que ardan. No interrumpas la regeneración si no hace falta." },
        { i: "precalentamiento", c: "ambar", a: "PRECAL", n: "Precalentamiento", v: "Dos bujías (en algunos modelos, una espiral como un muelle).", s: "El motor está calentando antes de arrancar en frío.", h: "Espera a que se apague y luego arranca. Si sigue encendido circulando, al taller." },
        { i: "abs-ebs-tractor", c: "ambar", a: "ABS", n: "ABS del camión", v: "Las letras ABS dentro de un círculo.", s: "El ABS del camión no funciona. El freno sigue, pero las ruedas pueden bloquearse.", h: "Conduce con más cuidado y frena con suavidad. Al taller pronto." },
        { i: "abs-remolque", c: "ambar", a: "ABS R", n: "ABS o EBS del remolque", v: "Un remolque con las letras ABS, o un remolque con un signo de admiración.", s: "Avería en el sistema de frenos del remolque o el remolque no tiene ABS conectado.", h: "Mira que el cable del remolque (el de ABS/EBS) esté bien enchufado. Si sigue, al taller." },
        { i: "ebs-rojo", c: "rojo", a: "EBS", n: "Avería grave del EBS", v: "Las letras EBS en rojo, a veces con STOP.", s: "Fallo importante en el freno electrónico.", h: "Para con seguridad: la frenada puede ser más débil. Llama al taller o a asistencia." },
        { i: "ebs-ambar", c: "ambar", a: "EBS", n: "Avería leve del EBS", v: "Las letras EBS en ámbar.", s: "Fallo en el freno electrónico que no es grave.", h: "Puedes seguir con cuidado. Al taller pronto." },
        { i: "pastillas-freno", c: "ambar", a: "PASTILLAS", n: "Desgaste de pastillas de freno", v: "Un círculo con una línea discontinua (las pastillas) a cada lado.", s: "Las pastillas de freno están gastadas.", h: "Al taller a cambiarlas pronto." },
        { i: "esp", c: "ambar", a: "ESP", n: "Control de estabilidad (VSC)", v: "Un camión de frente con dos líneas en S debajo, como si patinara.", s: "Si parpadea: el sistema está actuando para que no vuelques o derrapes. Si se queda fijo: está desconectado o averiado.", h: "Si parpadea, baja la velocidad. Si se queda fijo, conduce con más cuidado y al taller." },
        { i: "agua-combustible", c: "ambar", a: "AGUA", n: "Agua en el gasoil", v: "Un surtidor o filtro con gotas de agua.", s: "Hay agua en el filtro separador de gasoil.", h: "Purga el filtro como dice el manual o al taller. El agua puede estropear la inyección." },
        { i: "filtro-aire", c: "ambar", a: "AIRE F", n: "Filtro de aire obstruido", v: "Un filtro (rectángulo con rayas) con una flecha.", s: "El filtro de aire del motor está sucio y entra poco aire.", h: "Al taller a cambiarlo. El motor puede perder potencia." },
        { i: "suspension-ecas", c: "ambar", a: "SUSP", n: "Suspensión neumática", v: "Dos líneas con una flecha arriba y abajo entre ellas.", s: "La suspensión de aire no está a la altura normal de marcha, o hay una avería.", h: "Pon la altura de marcha con el mando. Si no baja o no sube, no circules y al taller." },
        { i: "caja-cambios-rojo", c: "ambar", a: "CAJA", n: "Avería de la caja de cambios (TraXon)", v: "Un círculo de puntos con un signo de admiración (en otros, unos engranajes con un aviso).", s: "Fallo en la caja de cambios automática.", h: "Para con seguridad cuando puedas y lee el mensaje. Al taller." },
        { i: "gasoil", c: "ambar", a: "GASOIL", n: "Reserva de gasoil", v: "Un surtidor de gasolinera.", s: "Queda poco gasoil.", h: "Echa gasoil pronto. Si se acaba, hay que purgar el circuito." },
        { i: "tpms", c: "ambar", a: "TPMS", n: "Presión de los neumáticos", v: "Un neumático visto de lado con un signo de admiración.", s: "Algún neumático tiene la presión baja (si el camión lleva este sistema).", h: "Para y mira las ruedas. Infla o cambia la rueda antes de seguir." },
        { i: "ldws-carril", c: "ambar", a: "CARRIL", n: "Aviso de salida de carril (LDWS)", v: "Un camión entre dos líneas de carretera.", s: "Encendido fijo: el sistema está apagado o no ve las líneas.", h: "Vuelve a conectarlo si lo apagaste. Si no se va, limpia el parabrisas delante de la cámara." },
        { i: "bloqueo-diferencial", c: "ambar", a: "BLOQ", n: "Bloqueo del diferencial", v: "Un eje entre dos ruedas con un punto en medio.", s: "El bloqueo del diferencial está puesto.", h: "Quítalo en cuanto salgas del terreno malo: no circules con él puesto en asfalto." },
        { i: "tacografo", c: "ambar", a: "TACÓG", n: "Tacógrafo", v: "Un reloj o el símbolo del tacógrafo con un aviso.", s: "Avería o aviso del tacógrafo (tarjeta, fallo, falta de datos).", h: "Mira el mensaje del tacógrafo. Si es una avería, haz las anotaciones a mano y avisa a la empresa." },
        { i: "acc-crucero", c: "verde", a: "CRUCERO", n: "Control de crucero o ACC", v: "Un velocímetro con una flecha (y un camión delante si es el ACC).", s: "El control de crucero o el de distancia está conectado.", h: "Solo informa." },
        { i: "retarder-mx-brake", c: "verde", a: "RALENTÍ", n: "Freno motor o ralentizador", v: "Un círculo con una cruz dentro y arcos a los lados.", s: "El freno motor o el ralentizador está funcionando.", h: "Solo informa." },
        { i: "pto", c: "verde", a: "PTO", n: "Toma de fuerza", v: "Un engranaje con una flecha o las letras PTO.", s: "La toma de fuerza (para el volquete, la grúa o el equipo de frío) está conectada.", h: "Desconéctala antes de circular si no la necesitas." },
        { i: "intermitentes", c: "verde", a: "INTERM", n: "Intermitentes del camión y del remolque", v: "Dos flechas verdes; en algunos, una más con un remolque.", s: "Los intermitentes funcionan. Si el del remolque no parpadea, alguna bombilla del remolque falla.", h: "Si el del remolque no se enciende, mira las luces y el enchufe del remolque." },
        { i: "luces-cruce", c: "verde", a: "CRUCE", n: "Luces de cruce", v: "Un faro con rayas hacia abajo.", s: "Las luces de cruce están encendidas.", h: "Solo informa." },
        { i: "luces-carretera", c: "azul", a: "LARGAS", n: "Luces de carretera (largas)", v: "Un faro con rayas rectas.", s: "Las largas están encendidas.", h: "Quítalas si viene alguien de frente o vas detrás de otro." },
        { i: "niebla-delantera", c: "verde", a: "NIEBLA D", n: "Antinieblas delanteros", v: "Un faro con rayas hacia abajo cruzadas por una línea ondulada.", s: "Los antinieblas delanteros están encendidos.", h: "Solo informa." },
        { i: "niebla-trasera", c: "ambar", a: "NIEBLA T", n: "Antiniebla trasero", v: "Un faro mirando al otro lado con rayas rectas y una línea ondulada.", s: "El antiniebla trasero está encendido.", h: "Apágalo cuando ya no haya niebla: deslumbra a los de detrás." },
        { i: "aebs-desactivado", c: "ambar", a: "AEBS", n: "Frenada de emergencia (AEBS) o radar no disponible", v: "Un camión con un obstáculo delante tachado con una cruz.", s: "El radar de delante está tapado (nieve, barro, insectos) o el sistema está desconectado. La frenada automática y el ACC no funcionan.", h: "En la próxima parada limpia el radar del parachoques y el parabrisas delante de la cámara. Si sigue, al taller." },
        { i: "eje-elevable", c: "verde", a: "EJE", n: "Eje elevable subido", v: "Dos ruedas, una más alta, con una flecha hacia arriba.", s: "El eje elevable está subido (para ir vacío o con poca carga).", h: "Solo informa. Baja solo si hace falta por el peso." },
        { i: "temperatura-caja", c: "rojo", a: "TEMP CAJA", n: "Temperatura alta de la caja de cambios o del retarder", v: "Un engranaje con un termómetro al lado.", s: "El aceite de la caja de cambios (o del retarder/Intarder) está demasiado caliente, por ejemplo en una bajada larga frenando con el retarder.", h: "Afloja: menos retarder, marcha más corta y freno de servicio a ratos. Si no se apaga, para con seguridad y deja enfriar. Si sale a menudo, al taller." },
        { i: "limpiaparabrisas", c: "ambar", a: "LIMPIA", n: "Líquido del limpiaparabrisas bajo", v: "Un parabrisas con un chorro de agua por encima.", s: "Queda poco líquido en el depósito del limpiaparabrisas.", h: "Rellénalo en la próxima parada (en invierno, con anticongelante)." },
      ],
    },
  ];
  /* fin textos */
  const COLOR = { rojo: "Rojo: para", ambar: "Ámbar: revisa pronto", verde: "Verde: informa", azul: "Azul: informa" };
  window.TestigosDatos = { MARCAS, COLOR };

  const $ = (i) => document.getElementById(i);
  if (!$("v-testigos")) return;
  // v201: el dibujo de cada testigo sale de testigos-iconos.js (SVG fijos del archivo, nunca datos del usuario)
  const ICONOS = window.TestigosIconos || {};
  const KEY = "ccoo-testigos";
  let marca = null, color = "";
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
    $("te-colores").innerHTML = [["", "Todos"], ...Object.entries(COLOR)].map(([k, t]) => `<button type="button" class="zc-chip${k === color ? " activa" : ""}" data-c="${esc(k)}" aria-pressed="${k === color}">${esc(t)}</button>`).join("");
    const q = normal($("te-busca").value.trim());
    const l = m.t.filter(x => (!color || x.c === color) && (!q || normal(`${x.a} ${x.n} ${x.v} ${x.s}`).includes(q)));
    $("te-cuenta").textContent = `${l.length} de ${m.t.length} testigos`;
    $("te-lista").innerHTML = l.length ? l.map(x => `<article class="panel te-item ${esc(x.c)}">
      <span class="te-icono" aria-hidden="true">${ICONOS[x.i] || ""}</span>
      <div><h3>${esc(x.n)}</h3><p class="te-color">${esc(COLOR[x.c])}</p><p class="te-comp">${x.ok ? "Comprobado en " + esc(x.ok) : "Sin comprobar"}</p>
      <p><b>Cómo se ve:</b> ${esc(x.v)}</p><p><b>Qué significa:</b> ${esc(x.s)}</p><p><b>Qué hacer:</b> ${esc(x.h)}</p></div></article>`).join("")
      : `<div class="zc-aviso">No hay ningún testigo que coincida. Prueba con otra palabra (aceite, freno, AdBlue…).</div>`;
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
  $("te-volver").addEventListener("click", () => { marca = null; color = ""; $("te-busca").value = ""; guarda(); pinta(); });
  $("te-colores").addEventListener("click", (e) => {
    const b = e.target.closest("[data-c]");
    if (!b) return;
    color = b.dataset.c;
    pinta();
  });
  $("te-busca").addEventListener("input", pinta);
  pinta();
})();
