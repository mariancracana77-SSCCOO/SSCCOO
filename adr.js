// Test de ADR (Zona Conductores, petición n.º 39 del padre). Es su página «ADR: tests y ayudas» pasada tal cual:
// las preguntas, las respuestas, las explicaciones, el descifrador de la placa naranja y los consejos son los suyos,
// sin cambiar ni una palabra (si hay que corregir algo, que lo diga él; en la v173 él pidió corregir el ejemplo de la gasolina en la pregunta de los 1.000 puntos; en la v174 pidió más preguntas). Aquí solo cambia la forma: sin <script>
// en línea ni onclick (CSP), todo con delegación y esc(), y los colores de Zona Conductores. No se guarda nada.
(function () {
  const $ = (i) => document.getElementById(i);
  const vista = $("adr-vista");
  if (!vista) return;
  // v177 (petición n.º 45): lo de entre /* textos */ y /* fin textos */ lo saca la función «traducir» para traducirlo (zona-idioma.js)
  /* textos */
  // [pregunta, [opciones], n.º de la correcta (desde 0), explicación]
  const Q = [
    ["¿Qué indica el número de arriba en la placa naranja?", ["El número ONU de la materia", "El número de identificación de peligro", "El peso de la carga"], 1, "Arriba va el número de peligro (2 o 3 cifras) y abajo el número ONU de 4 cifras."],
    ["En la placa 33 / 1203, ¿qué transporta el camión?", ["Gasóleo", "Gasolina", "Gas licuado"], 1, "UN 1203 es gasolina: líquido muy inflamable, número de peligro 33."],
    ["¿Qué número de peligro lleva normalmente el gasóleo (UN 1202)?", ["30", "33", "23"], 0, "El gasóleo es líquido inflamable con punto de inflamación más alto: 30."],
    ["Una X delante del número de peligro significa que…", ["La materia es radiactiva", "Reacciona peligrosamente con el agua", "Hay que ventilar la carga"], 1, "La X prohíbe usar agua salvo autorización de expertos."],
    ["¿Qué clase ADR corresponde a las materias corrosivas?", ["Clase 6.1", "Clase 8", "Clase 5.1"], 1, "Clase 8: corrosivas. La 6.1 es tóxicas y la 5.1 comburentes."],
    ["¿Qué clase corresponde a los líquidos inflamables?", ["Clase 2", "Clase 3", "Clase 4.1"], 1, "Clase 3: líquidos inflamables. La 2 son gases y la 4.1 sólidos inflamables."],
    ["¿Y las materias radiactivas?", ["Clase 7", "Clase 9", "Clase 1"], 0, "Clase 7: radiactivas. La clase 1 son explosivos."],
    ["¿Cuánto tiempo es válido el certificado de formación del conductor ADR?", ["2 años", "5 años", "10 años"], 1, "Cinco años. Hay que renovarlo antes de que caduque."],
    ["¿Qué documento debe ir en la cabina con las instrucciones para una emergencia?", ["Las instrucciones escritas", "El permiso de circulación", "La hoja de ruta de la empresa"], 0, "Las instrucciones escritas, en un idioma que el conductor entienda."],
    ["Durante la carga y descarga, el motor debe estar…", ["Siempre en marcha", "Parado, salvo que se necesite para la bomba", "Al ralentí"], 1, "Debe estar parado, salvo que sea necesario para bombear."],
    ["Fumar durante la carga y descarga está…", ["Permitido lejos del camión", "Prohibido", "Permitido en cabina"], 1, "Está prohibido, también cerca del vehículo."],
    ["¿Cuál es el extintor mínimo para la cabina?", ["Uno de polvo de 2 kg", "Uno de CO2 de 1 kg", "No hace falta en cabina"], 0, "Al menos uno de 2 kg de polvo, apto para incendios de cabina y motor."],
    ["Cada miembro de la tripulación debe llevar…", ["Chaleco reflectante y linterna portátil", "Solo casco", "Una cuña por persona"], 0, "Chaleco reflectante, linterna que no produzca chispas, guantes y protección ocular. Las cuñas y señales son del vehículo."],
    ["Si un transporte tiene material de categoría 3 (como el gasóleo, UN 1202), ¿cuánto multiplica cada litro en el cálculo de los 1.000 puntos?", ["×50", "×3", "×1"], 2, "Categoría 3: ×1. La 2 (como la gasolina, UN 1203) multiplica ×3 y la 1 ×50. Se aplica la exención de 1.000 puntos."],
    ["¿Qué debe llevar el documento de transporte de la mercancía?", ["Solo el nombre del cliente", "Número ONU, denominación, clase, grupo de embalaje y cantidad", "Solo la matrícula"], 1, "Número ONU, nombre oficial, clase, grupo de embalaje (si tiene) y cantidad."],
    ["Si hay un accidente con derrame, lo primero es…", ["Recoger la carga y seguir", "Parar el motor, señalizar, avisar al 112 y seguir las instrucciones escritas", "Esperar sin avisar"], 1, "Para el motor, señaliza, llama al 112 e indica la materia con su número ONU."],
    // v174 (petición n.º 41 del padre: más preguntas y más variadas). Estas 44 las ha escrito Claude: que las revise alguien con el ADR.
    ["¿Qué clase ADR corresponde a los gases?", ["Clase 2", "Clase 3", "Clase 9"], 0, "Clase 2: gases (comprimidos, licuados o disueltos). La 3 son líquidos inflamables y la 9 materias diversas."],
    ["¿Qué clase corresponde a los explosivos?", ["Clase 5.2", "Clase 1", "Clase 4.1"], 1, "Clase 1: materias y objetos explosivos. La 5.2 son peróxidos orgánicos."],
    ["La clase 4.3 agrupa las materias que…", ["Se calientan solas al aire", "En contacto con el agua desprenden gases inflamables", "Son radiactivas"], 1, "Clase 4.3: con el agua desprenden gases inflamables. Su etiqueta es azul."],
    ["¿Qué son las materias de la clase 5.1?", ["Comburentes", "Corrosivas", "Infecciosas"], 0, "Clase 5.1: comburentes, que avivan el fuego aunque no ardan. La 5.2 son peróxidos orgánicos."],
    ["La clase 6.2 corresponde a…", ["Materias tóxicas", "Materias infecciosas", "Gases tóxicos"], 1, "Clase 6.2: infecciosas (por ejemplo residuos hospitalarios). La 6.1 son las tóxicas."],
    ["¿Qué clase es «materias y objetos peligrosos diversos»?", ["Clase 7", "Clase 8", "Clase 9"], 2, "Clase 9: diversos, como las baterías de litio o las materias peligrosas para el medio ambiente."],
    ["La clase 4.2 son materias…", ["Que pueden inflamarse solas (espontáneamente)", "Corrosivas", "Comburentes"], 0, "Clase 4.2: espontáneamente inflamables, se calientan y arden solas en contacto con el aire."],
    ["¿Qué dibujo lleva la etiqueta de la clase 3?", ["Una calavera", "Una llama sobre fondo rojo", "Un trébol"], 1, "Clase 3: llama sobre fondo rojo. La calavera es de tóxicos y el trébol de radiactivos."],
    ["Una calavera con tibias sobre fondo blanco es la etiqueta de…", ["Materias tóxicas (6.1)", "Corrosivas (clase 8)", "Comburentes (5.1)"], 0, "Calavera: tóxicas (6.1) y gases tóxicos (2.3)."],
    ["La etiqueta con líquido cayendo sobre una mano y un metal, con la mitad de abajo negra, es de…", ["Clase 4.1", "Clase 8 (corrosivas)", "Clase 9"], 1, "Es la etiqueta de las corrosivas, clase 8."],
    ["Una llama sobre un círculo, en fondo amarillo, indica…", ["Comburente (5.1)", "Líquido inflamable (3)", "Explosivo (1)"], 0, "Llama sobre círculo y fondo amarillo: comburentes (5.1)."],
    ["Una bombona de gas sobre fondo verde indica…", ["Gas inflamable", "Gas no inflamable y no tóxico (2.2)", "Gas tóxico"], 1, "Fondo verde con bombona: gas no inflamable y no tóxico (2.2). El inflamable (2.1) es rojo con llama."],
    ["Una etiqueta de rayas verticales rojas y blancas con una llama es de la clase…", ["4.1 (sólidos inflamables)", "4.3", "5.2"], 0, "Rayas rojas y blancas: 4.1, sólidos inflamables."],
    ["¿Qué etiqueta lleva fondo azul con una llama?", ["Clase 2.1", "Clase 4.3", "Clase 3"], 1, "Fondo azul: 4.3, materias que con el agua desprenden gases inflamables."],
    ["¿Qué marca llevan las materias peligrosas para el medio ambiente?", ["Un pez y un árbol", "Un trébol", "Una gota"], 0, "La marca de medio ambiente es un pez y un árbol."],
    ["¿Qué tamaño tiene normalmente la placa naranja?", ["20 x 15 cm", "40 x 30 cm", "60 x 40 cm"], 1, "Mide 40 cm de ancho por 30 de alto. Solo si el vehículo no tiene sitio se admite una más pequeña."],
    ["Un camión de bultos (no cisterna) con placas naranjas, ¿dónde las lleva?", ["Solo detrás", "Una delante y otra detrás, sin números", "En los laterales"], 1, "En bultos van dos placas naranjas lisas: una delante y otra detrás."],
    ["Cuando el vehículo va vacío y limpio, las placas naranjas…", ["Se dejan como están", "Se quitan o se tapan", "Se ponen solo delante"], 1, "Si ya no hay peligro (vacío y limpio), se quitan o se tapan."],
    ["El número de peligro 20 significa…", ["Gas asfixiante o sin peligro secundario", "Líquido inflamable", "Materia corrosiva"], 0, "20: gas asfixiante o que no tiene peligro secundario."],
    ["El número de peligro 80 indica…", ["Materia corrosiva", "Materia tóxica", "Gas inflamable"], 0, "El 8 es corrosividad; el 0 indica que no hay peligro secundario."],
    ["El número de peligro 23 indica…", ["Gas inflamable", "Líquido tóxico", "Sólido inflamable"], 0, "2 = gas, 3 = inflamable: gas inflamable."],
    ["En el número de peligro 268, ¿qué significa el 6?", ["Toxicidad", "Corrosividad", "Inflamabilidad"], 0, "268: gas (2) tóxico (6) y corrosivo (8)."],
    ["¿Qué grupo de embalaje es el de mayor peligro?", ["Grupo I", "Grupo II", "Grupo III"], 0, "Grupo I: gran peligro. II: peligro medio. III: peligro bajo."],
    ["¿Qué categoría de transporte no puede acogerse a la exención de 1.000 puntos?", ["Categoría 0", "Categoría 3", "Categoría 4"], 0, "La categoría 0 no admite la exención: siempre se aplica el ADR completo."],
    ["Con material de categoría 1, ¿por cuánto se multiplica la cantidad para los 1.000 puntos?", ["×1", "×3", "×50"], 2, "Categoría 1: ×50. Categoría 2: ×3. Categoría 3: ×1."],
    ["En los túneles, ¿qué categoría es la más restrictiva?", ["A", "C", "E"], 2, "De la A (sin restricciones) a la E (la más restrictiva)."],
    ["¿Dónde aparece el código de restricción en túneles de la mercancía?", ["En el documento de transporte", "Solo en la placa naranja", "En el permiso de conducir"], 0, "Va en el documento de transporte, entre paréntesis, por ejemplo (D/E)."],
    ["¿Pueden ir pasajeros en un vehículo que transporta mercancías peligrosas?", ["Sí, siempre", "No, solo la tripulación", "Sí, si van en la cabina"], 1, "Está prohibido llevar pasajeros, solo la tripulación."],
    ["¿Puede el conductor abrir un bulto con mercancías peligrosas?", ["Sí, para revisarlo", "No, está prohibido", "Solo de noche"], 1, "El conductor no puede abrir los bultos."],
    ["Al estacionar el vehículo con mercancías peligrosas, hay que…", ["Poner el freno de estacionamiento", "Dejar el motor en marcha", "Dejar las luces de emergencia toda la noche"], 0, "Siempre hay que poner el freno de estacionamiento."],
    ["El cigarrillo electrónico durante la carga y descarga está…", ["Permitido", "Prohibido, igual que fumar", "Permitido en la cabina"], 1, "La prohibición de fumar incluye los cigarrillos electrónicos."],
    ["¿Cuántas cuñas debe llevar como mínimo cada vehículo?", ["Ninguna", "Una, adecuada al vehículo", "Una por rueda"], 1, "Al menos una cuña (calzo) del tamaño adecuado por vehículo."],
    ["Además de la cuña, el vehículo debe llevar…", ["Dos señales de advertencia que se sostengan solas", "Una escalera", "Un botiquín de quirófano"], 0, "Dos señales de advertencia autoportantes (triángulos o conos)."],
    ["¿Qué líquido se lleva en el vehículo para emergencias en los ojos?", ["Agua de lavado de ojos", "Alcohol", "Ninguno"], 0, "Líquido lavaojos, salvo con algunas mercancías de las clases 1 y 2."],
    ["En un camión de más de 7,5 toneladas, ¿qué capacidad mínima de extintores se exige en total?", ["4 kg", "8 kg", "12 kg"], 2, "Más de 7,5 t: 12 kg en total, con al menos un extintor de 6 kg. Hasta 3,5 t son 4 kg y de 3,5 a 7,5 t, 8 kg."],
    ["Los extintores deben llevar…", ["Precinto y la fecha de la próxima revisión", "Solo el nombre de la empresa", "Nada"], 0, "Deben ir precintados y con la fecha de la siguiente inspección."],
    ["La linterna de la tripulación debe ser…", ["De llama", "Sin superficie metálica que pueda hacer chispas", "De cualquier tipo"], 1, "Se prohíben las luces de llama; la linterna no debe poder hacer chispas."],
    ["¿Cuánto dura como máximo el certificado de aprobación de un vehículo ADR?", ["Un año", "Cinco años", "Diez años"], 0, "El certificado de aprobación del vehículo vale como mucho un año."],
    ["Una cisterna para líquidos inflamables con punto de inflamación de hasta 60 °C debe estar aprobada como…", ["AT", "FL", "EX/II"], 1, "FL: líquidos inflamables (hasta 60 °C) y gases inflamables. AT es para el resto de cisternas."],
    ["Para conducir una cisterna con mercancías peligrosas, además del curso básico hace falta…", ["El curso de especialización en cisternas", "Nada más", "Solo el CAP"], 0, "Cisternas: curso básico más especialización en cisternas."],
    ["Si renuevas el certificado ADR en los 12 meses antes de que caduque, ¿desde cuándo cuentan los 5 años nuevos?", ["Desde el día del examen", "Desde la fecha de caducidad del anterior", "Desde el 1 de enero"], 1, "Si apruebas en esos 12 meses, la validez nueva empieza al acabar la anterior: no pierdes días."],
    ["Las empresas que transportan, cargan o descargan mercancías peligrosas deben tener…", ["Un consejero de seguridad", "Un abogado", "Un vigilante en cada camión"], 0, "Deben designar un consejero de seguridad, con certificado."],
    ["¿Qué indica la marca de «cantidades limitadas»?", ["Un rombo con las esquinas de arriba y de abajo negras", "La placa naranja con números", "Un triángulo rojo"], 0, "Cantidades limitadas: rombo blanco con las puntas de arriba y abajo negras."],
    ["En un incendio de cabina con mercancías peligrosas, lo correcto es…", ["Intentar apagarlo solo si es pequeño y seguro; si no, alejarse y avisar", "Abrir la carga para sacarla", "Seguir conduciendo hasta un taller"], 0, "Si se puede con seguridad, extintor; si no, alejarse, avisar al 112 y seguir las instrucciones escritas."]
  ];
  const KEM = { "2": "emisión de gas", "3": "inflamabilidad de un líquido", "4": "inflamabilidad de un sólido", "5": "comburente (favorece el incendio)", "6": "toxicidad o riesgo de infección", "7": "radiactividad", "8": "corrosividad", "9": "riesgo de reacción violenta espontánea", "0": "sin peligro secundario" };
  /* fin textos */
  const Z = typeof ZonaIdioma === "function" ? ZonaIdioma("adr", "v-adr", () => render()) : { T: (x, v) => x.replace(/\{(\w+)\}/g, (m, k) => v && v[k] != null ? v[k] : m), TH: null };
  const T = Z.T, TH = Z.TH || ((x, v) => esc(T(x, v)).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"));
  let tab = 0, qi = 0, score = 0, order = [], failed = [], done = false, respondida = false, placaTxt = "";
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  const start = (list) => { order = list; qi = 0; score = 0; failed = []; done = false; respondida = false; };
  // v174: en cada test nuevo salen primero las que aún no han salido en esta visita (no se guarda nada en el móvil)
  const salidas = new Set();
  const nuevo10 = () => {
    let nuevas = shuffle(Q.map((_, i) => i).filter(i => !salidas.has(i)));
    if (nuevas.length < 10) { salidas.clear(); nuevas = nuevas.concat(shuffle(Q.map((_, i) => i).filter(i => nuevas.indexOf(i) < 0))); }
    const elegidas = nuevas.slice(0, 10);
    elegidas.forEach(i => salidas.add(i));
    start(elegidas);
  };

  function test() {
    if (done || qi >= order.length) {
      vista.innerHTML = `<div class="panel zc-caja"><h2>${esc(T("Resultado: {a} de {n}", { a: score, n: order.length }))}</h2><p>${esc(score / order.length >= .8 ? T("Muy bien, vas preparado.") : T("Repasa los fallos y vuelve a intentarlo."))}</p>` +
        (failed.length ? `<button type="button" class="btn zc-btn" data-adr="repasar">${esc(T("Repasar los {n} fallos", { n: failed.length }))}</button>` : "") +
        `<button type="button" class="btn zc-btn" data-adr="nuevo">${esc(T("Nuevo test de 10 preguntas"))}</button></div>`;
      return;
    }
    const q = Q[order[qi]];
    vista.innerHTML = `<div class="panel zc-caja"><div class="zc-barra" aria-hidden="true"><i style="width:${Math.round(qi / order.length * 100)}%"></i></div>` +
      `<p class="zc-pista">${esc(T("Pregunta {a} de {n}", { a: qi + 1, n: order.length }))}</p><h2>${esc(T(q[0]))}</h2>` +
      q[1].map((o, i) => `<button type="button" class="zc-opc" data-o="${i}">${esc(T(o))}</button>`).join("") + `<div id="adr-fb"></div></div>`;
  }
  // El ancho de la barra va con style="" (es CSS, no un script: la CSP de estilos lo permite)
  function responde(b) {
    if (respondida) return;
    respondida = true;
    const q = Q[order[qi]], o = +b.dataset.o, todas = vista.querySelectorAll(".zc-opc");
    todas.forEach(x => { x.disabled = true; });
    todas[q[2]].classList.add("bien");
    if (o === q[2]) score++; else { b.classList.add("mal"); if (failed.indexOf(order[qi]) < 0) failed.push(order[qi]); }
    $("adr-fb").innerHTML = `<p class="zc-exp">${esc(T(q[3]))}</p><button type="button" class="btn zc-btn" data-adr="siguiente">${esc(qi + 1 >= order.length ? T("Ver resultado") : T("Siguiente"))}</button>`;
    $("adr-fb").querySelector("button").focus();
  }

  function placa() {
    vista.innerHTML = `<div class="panel zc-caja"><h2>${esc(T("Descifra la placa naranja"))}</h2><p class="zc-pista">${esc(T("Escribe el número de peligro (por ejemplo 33, 268 o X323)."))}</p>` +
      `<label class="sr-only" for="adr-k">${esc(T("Número de peligro"))}</label><input id="adr-k" class="zc-placa-in" maxlength="4" placeholder="33" autocomplete="off" autocapitalize="characters" value="${esc(placaTxt)}"><div id="adr-kr"></div></div>` +
      `<div class="zc-aviso">${esc(T("Si repites una cifra (33, 66…) el peligro es más intenso. Una X delante prohíbe echar agua."))}</div>`;
    descifra();
  }
  function descifra() {
    const inp = $("adr-k");
    if (!inp) return;
    placaTxt = inp.value;
    const s = inp.value.toUpperCase().replace(/[^0-9X]/g, ""), kr = $("adr-kr");
    if (!s) { kr.innerHTML = ""; return; }
    const x = s[0] === "X", d = x ? s.slice(1) : s;
    if (!d) { kr.innerHTML = ""; return; }
    let r = `<div class="zc-placa" aria-hidden="true"><div>${esc(s)}</div><div>????</div></div><ul>`;
    if (x) r += `<li>${TH("**X**: reacciona peligrosamente con el agua. No uses agua.")}</li>`;
    for (let i = 0; i < d.length; i++) {
      const c = d[i], m = KEM[c];
      if (i > 0 && c === d[i - 1] && c !== "0") r += `<li>${TH("**{c} repetido**: peligro intensificado.", { c })}</li>`;
      else if (i === 0) r += `<li>${TH("**{c}**: peligro principal, {m}.", { c, m: m ? T(m) : T("cifra no válida") })}</li>`;
      else r += `<li>${TH("**{c}**: peligro secundario, {m}.", { c, m: m ? T(m) : T("cifra no válida") })}</li>`;
    }
    kr.innerHTML = r + "</ul>";
  }

  function carnet() {
    const li = (h) => `<li>${h}</li>`;
    vista.innerHTML = `<div class="panel zc-caja"><h2>${esc(T("Sacarlo o renovarlo sin perder tiempo"))}</h2><ol class="zc-lista">` +
      li(TH("**Pide que lo gestione y lo pague la empresa.** El convenio de Girona (art. 44) dice que la formación del ADR corre a cargo de la empresa y cuenta como jornada de trabajo, siempre que lo necesites para tu puesto.")) +
      li(TH("**No esperes al último mes.** La renovación se hace con un curso y una prueba antes de que caduque (5 años). Si caduca, hay que volver a sacar todo desde cero.")) +
      li(TH("**Agrupa los cursos.** Si necesitas más de uno (por ejemplo bultos y cisternas), se pueden hacer a la vez.")) +
      li(TH("**Elige un centro autorizado con fechas cercanas** y pregunta si ya incluye la inscripción al examen.")) +
      li(TH("**Practica con el test** en los ratos de espera de carga. Repasa solo los fallos.")) +
      li(TH("**Pregunta por la bonificación.** Muchas empresas pueden descontar parte del curso de sus cuotas de formación.")) + `</ol>` +
      `<div class="zc-aviso">${TH("**Si la empresa se niega** a pagarlo o a darte las horas, pulsa «Hablar con un delegado». Guarda por escrito lo que te contesten.")}</div></div>`;
  }

  const tabs = document.querySelectorAll("[data-adr-tab]");
  function render() {
    tabs.forEach(b => { const on = +b.dataset.adrTab === tab; b.classList.toggle("activa", on); b.setAttribute("aria-selected", on ? "true" : "false"); });
    if (tab === 0) { if (!order.length) nuevo10(); test(); } else if (tab === 1) placa(); else carnet();
  }
  document.querySelector(".zc-tabs").addEventListener("click", (e) => { const b = e.target.closest("[data-adr-tab]"); if (b) { tab = +b.dataset.adrTab; render(); } });
  vista.addEventListener("click", (e) => {
    const o = e.target.closest(".zc-opc");
    if (o && !o.disabled) { responde(o); return; }
    const a = e.target.closest("[data-adr]");
    if (!a) return;
    if (a.dataset.adr === "siguiente") { qi++; respondida = false; test(); }
    else if (a.dataset.adr === "repasar") { start(shuffle(failed)); test(); }
    else if (a.dataset.adr === "nuevo") { nuevo10(); test(); }
    vista.querySelector("h2")?.setAttribute("tabindex", "-1");
    vista.querySelector("h2")?.focus({ preventScroll: true });
  });
  vista.addEventListener("input", (e) => { if (e.target.id === "adr-k") descifra(); });
  render();
})();
