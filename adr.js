// Test de ADR (Zona Conductores, petición n.º 39 del padre). Es su página «ADR: tests y ayudas» pasada tal cual:
// las preguntas, las respuestas, las explicaciones, el descifrador de la placa naranja y los consejos son los suyos,
// sin cambiar ni una palabra (si hay que corregir algo, que lo diga él). Aquí solo cambia la forma: sin <script>
// en línea ni onclick (CSP), todo con delegación y esc(), y los colores de Zona Conductores. No se guarda nada.
(function () {
  const $ = (i) => document.getElementById(i);
  const vista = $("adr-vista");
  if (!vista) return;
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
    ["Si un transporte tiene material de categoría 3 (como la gasolina), ¿cuánto multiplica cada litro en el cálculo de los 1.000 puntos?", ["×50", "×3", "×1"], 2, "Categoría 3: ×1. La 2 multiplica ×3 y la 1 ×50. Se aplica la exención de 1.000 puntos."],
    ["¿Qué debe llevar el documento de transporte de la mercancía?", ["Solo el nombre del cliente", "Número ONU, denominación, clase, grupo de embalaje y cantidad", "Solo la matrícula"], 1, "Número ONU, nombre oficial, clase, grupo de embalaje (si tiene) y cantidad."],
    ["Si hay un accidente con derrame, lo primero es…", ["Recoger la carga y seguir", "Parar el motor, señalizar, avisar al 112 y seguir las instrucciones escritas", "Esperar sin avisar"], 1, "Para el motor, señaliza, llama al 112 e indica la materia con su número ONU."]
  ];
  const KEM = { "2": "emisión de gas", "3": "inflamabilidad de un líquido", "4": "inflamabilidad de un sólido", "5": "comburente (favorece el incendio)", "6": "toxicidad o riesgo de infección", "7": "radiactividad", "8": "corrosividad", "9": "riesgo de reacción violenta espontánea", "0": "sin peligro secundario" };
  let tab = 0, qi = 0, score = 0, order = [], failed = [], done = false, respondida = false, placaTxt = "";
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  const start = (list) => { order = list; qi = 0; score = 0; failed = []; done = false; respondida = false; };
  const nuevo10 = () => start(shuffle(Q.map((_, i) => i)).slice(0, 10));

  function test() {
    if (done || qi >= order.length) {
      vista.innerHTML = `<div class="panel zc-caja"><h2>Resultado: ${score} de ${order.length}</h2><p>${score / order.length >= .8 ? "Muy bien, vas preparado." : "Repasa los fallos y vuelve a intentarlo."}</p>` +
        (failed.length ? `<button type="button" class="btn zc-btn" data-adr="repasar">Repasar los ${failed.length} fallos</button>` : "") +
        `<button type="button" class="btn zc-btn" data-adr="nuevo">Nuevo test de 10 preguntas</button></div>`;
      return;
    }
    const q = Q[order[qi]];
    vista.innerHTML = `<div class="panel zc-caja"><div class="zc-barra" aria-hidden="true"><i style="width:${Math.round(qi / order.length * 100)}%"></i></div>` +
      `<p class="zc-pista">Pregunta ${qi + 1} de ${order.length}</p><h2>${esc(q[0])}</h2>` +
      q[1].map((o, i) => `<button type="button" class="zc-opc" data-o="${i}">${esc(o)}</button>`).join("") + `<div id="adr-fb"></div></div>`;
  }
  // El ancho de la barra va con style="" (es CSS, no un script: la CSP de estilos lo permite)
  function responde(b) {
    if (respondida) return;
    respondida = true;
    const q = Q[order[qi]], o = +b.dataset.o, todas = vista.querySelectorAll(".zc-opc");
    todas.forEach(x => { x.disabled = true; });
    todas[q[2]].classList.add("bien");
    if (o === q[2]) score++; else { b.classList.add("mal"); if (failed.indexOf(order[qi]) < 0) failed.push(order[qi]); }
    $("adr-fb").innerHTML = `<p class="zc-exp">${esc(q[3])}</p><button type="button" class="btn zc-btn" data-adr="siguiente">${qi + 1 >= order.length ? "Ver resultado" : "Siguiente"}</button>`;
    $("adr-fb").querySelector("button").focus();
  }

  function placa() {
    vista.innerHTML = `<div class="panel zc-caja"><h2>Descifra la placa naranja</h2><p class="zc-pista">Escribe el número de peligro (por ejemplo 33, 268 o X323).</p>` +
      `<label class="sr-only" for="adr-k">Número de peligro</label><input id="adr-k" class="zc-placa-in" maxlength="4" placeholder="33" autocomplete="off" autocapitalize="characters" value="${esc(placaTxt)}"><div id="adr-kr"></div></div>` +
      `<div class="zc-aviso">Si repites una cifra (33, 66…) el peligro es más intenso. Una X delante prohíbe echar agua.</div>`;
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
    if (x) r += `<li><b>X</b>: reacciona peligrosamente con el agua. No uses agua.</li>`;
    for (let i = 0; i < d.length; i++) {
      const c = d[i], m = KEM[c];
      if (i > 0 && c === d[i - 1] && c !== "0") r += `<li><b>${esc(c)} repetido</b>: peligro intensificado.</li>`;
      else if (i === 0) r += `<li><b>${esc(c)}</b>: peligro principal, ${esc(m || "cifra no válida")}.</li>`;
      else r += `<li><b>${esc(c)}</b>: peligro secundario, ${esc(m || "cifra no válida")}.</li>`;
    }
    kr.innerHTML = r + "</ul>";
  }

  function carnet() {
    vista.innerHTML = `<div class="panel zc-caja"><h2>Sacarlo o renovarlo sin perder tiempo</h2><ol class="zc-lista">` +
      `<li><b>Pide que lo gestione y lo pague la empresa.</b> El convenio de Girona (art. 44) dice que la formación del ADR corre a cargo de la empresa y cuenta como jornada de trabajo, siempre que lo necesites para tu puesto.</li>` +
      `<li><b>No esperes al último mes.</b> La renovación se hace con un curso y una prueba antes de que caduque (5 años). Si caduca, hay que volver a sacar todo desde cero.</li>` +
      `<li><b>Agrupa los cursos.</b> Si necesitas más de uno (por ejemplo bultos y cisternas), se pueden hacer a la vez.</li>` +
      `<li><b>Elige un centro autorizado con fechas cercanas</b> y pregunta si ya incluye la inscripción al examen.</li>` +
      `<li><b>Practica con el test</b> en los ratos de espera de carga. Repasa solo los fallos.</li>` +
      `<li><b>Pregunta por la bonificación.</b> Muchas empresas pueden descontar parte del curso de sus cuotas de formación.</li></ol>` +
      `<div class="zc-aviso"><b>Si la empresa se niega</b> a pagarlo o a darte las horas, pulsa «Hablar con un delegado». Guarda por escrito lo que te contesten.</div></div>`;
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
