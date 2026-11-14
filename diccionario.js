// Diccionario del conductor (Zona Conductores, petición n.º 42). Es el «Diccionario del conductor» del padre pasado tal
// cual: las 53 palabras, las definiciones y las categorías son las suyas, sin cambiar ni una palabra. Aquí solo cambia la
// forma: sin <script> en línea ni oninput/onclick (CSP), todo con esc() y delegación, y los colores de Zona Conductores.
// No se guarda nada en el móvil.
(function () {
  const $ = (i) => document.getElementById(i);
  if (!$("v-diccionario")) return;
  const C = ["Papeles y aduanas","Conducción","Trabajo y nómina","Vehículo"];
  // [categoría (posición en C), palabra, definición]
  const W = [
    [0,"CMR","Carta de porte internacional por carretera. Es el contrato de transporte que firman remitente, transportista y destinatario."],
    [0,"Albarán","Documento de entrega de la mercancía. Si hay daños, faltas o esperas, escríbelo como reserva antes de firmar."],
    [0,"Reserva","Anotación que haces en el albarán o el CMR para dejar constancia de un problema (golpe, falta de bultos, espera)."],
    [0,"EORI","Número que identifica a una empresa para hacer trámites de aduanas en la Unión Europea."],
    [0,"DUA","Documento Único Administrativo: la declaración de aduanas para entrar o sacar mercancía de la UE."],
    [0,"T1 / T2","Documentos de tránsito aduanero: permiten mover mercancía sin pagar aduanas hasta su destino."],
    [0,"TIR","Sistema internacional de tránsito aduanero por carretera. El camión va precintado y con un carnet TIR."],
    [0,"Cabotaje","Transporte dentro de un país hecho por una empresa de otro país. Tiene límites legales."],
    [0,"Tarjeta de transporte","Autorización que permite a la empresa hacer transporte de mercancías por carretera con ese vehículo."],
    [0,"LOTT","Ley de Ordenación de los Transportes Terrestres. Es la base de las infracciones y sanciones del sector."],
    [0,"Viñeta","Pago por usar las carreteras de algunos países, en lugar de peaje por tramo."],
    [0,"ADR","Acuerdo europeo para el transporte de mercancías peligrosas por carretera."],
    [0,"Número ONU","Código de 4 cifras que identifica la materia peligrosa. Va en la parte baja de la placa naranja."],
    [0,"Número de peligro","Código de 2 o 3 cifras en la parte alta de la placa naranja que indica el tipo de peligro."],
    [1,"Tacógrafo","Aparato que registra conducción, pausas y descansos. Es la prueba en los controles."],
    [1,"Tarjeta de conductor","Tarjeta personal que insertas en el tacógrafo digital. Es tuya, no del camión."],
    [1,"Tarjeta de empresa","Tarjeta con la que la empresa descarga los datos del tacógrafo y de las tarjetas de conductor."],
    [1,"Registro manual","Anotación a mano de tu actividad cuando el tacógrafo no ha podido registrarla."],
    [1,"Tiempo de conducción","Máximo de 9 horas al día (10, dos veces por semana) y pausa de 45 minutos tras 4,5 horas."],
    [1,"Descanso diario","Normalmente 11 horas seguidas. Puede reducirse a 9 horas hasta 3 veces entre dos descansos semanales."],
    [1,"Descanso semanal","Normal: 45 horas seguidas. Reducido: mínimo 24 horas, con compensación posterior."],
    [1,"Disponibilidad","Tiempo en que no trabajas pero debes estar listo para hacerlo y lo sabes de antemano, por ejemplo una espera."],
    [1,"Conducción en equipo","Dos conductores en el mismo vehículo, que se turnan al volante."],
    [1,"CAP","Certificado de Aptitud Profesional: formación obligatoria que hay que renovar cada 5 años."],
    [1,"Cuña","Calzo que se pone en las ruedas para que el camión no se mueva al aparcar o cargar."],
    [2,"Convenio colectivo","Acuerdo entre empresas y representantes de trabajadores que fija sueldos, jornada y condiciones del sector."],
    [2,"Salario base","Parte fija de tu sueldo según tu categoría, sin pluses ni pagas extra."],
    [2,"Plus","Complemento que se suma al salario base: nocturnidad, convenio, peligrosidad…"],
    [2,"Dieta","Compensación por los gastos de comer y dormir cuando trabajas fuera de tu localidad."],
    [2,"Pernocta","Dormir fuera de casa por trabajo. Suele cambiar el importe de la dieta."],
    [2,"Prorrata","Reparto de las pagas extra en las 12 nóminas del año, en lugar de cobrarlas aparte."],
    [2,"Paga extra","Pago adicional al año, normalmente en verano, Navidad y, en tu convenio, marzo."],
    [2,"Antigüedad","Complemento que sube con los años en la empresa. En el convenio de Girona, un 10% del salario base por tramo."],
    [2,"Finiquito","Liquidación de lo que te deben al terminar el contrato: salario, pagas y vacaciones pendientes."],
    [2,"Indemnización","Dinero extra que se paga en algunos despidos. No es lo mismo que el finiquito."],
    [2,"Despido improcedente","Despido sin causa justificada. La empresa paga indemnización o te readmite."],
    [2,"Preaviso","Aviso previo que hay que dar para terminar un contrato o pedir un permiso."],
    [2,"Baja / IT","Incapacidad Temporal: no puedes trabajar por enfermedad o accidente y cobras una prestación."],
    [2,"Mutua","Entidad que gestiona las bajas por accidente de trabajo y algunas por enfermedad."],
    [2,"Subrogación","Cuando una empresa pierde una contrata y la nueva se queda con los trabajadores."],
    [2,"Conciliación previa","Intento de acuerdo obligatorio, antes de ir a juicio, entre trabajador y empresa."],
    [2,"Vida laboral","Informe de la Seguridad Social con todos tus periodos de alta y cotización."],
    [2,"PRL","Prevención de Riesgos Laborales: las normas para evitar accidentes y enfermedades en el trabajo."],
    [2,"EPI","Equipo de Protección Individual: chaleco, guantes, calzado de seguridad, etc."],
    [2,"Delegado","Representante de los trabajadores en la empresa. Defiende tus derechos ante la dirección."],
    [3,"MMA","Masa Máxima Autorizada: el peso máximo con el que puede circular el vehículo cargado."],
    [3,"MMTA","Masa Máxima Técnica Admisible: el máximo que permite el fabricante. La MMA no puede superarla."],
    [3,"Tara","Peso del vehículo vacío, sin carga ni conductor."],
    [3,"Tractora","Cabeza del camión que arrastra el semirremolque."],
    [3,"Semirremolque","Remolque que se apoya en parte sobre la tractora. Es el que lleva la carga."],
    [3,"ITV","Inspección Técnica de Vehículos. Los camiones la pasan con más frecuencia que un turismo."],
    [3,"ATP","Acuerdo para el transporte de mercancías perecederas: camiones frigoríficos o isotermos."],
    [3,"AdBlue","Líquido que reduce las emisiones del motor diésel. Sin él, el camión puede limitar potencia."]
];;
  let cat = -1, qv = "";
  const n = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  function chips() {
    $("dic-chips").innerHTML = [["-1", "Todos"], ...C.map((c, i) => [String(i), c])]
      .map(([v, t]) => `<button type="button" class="zc-chip${+v === cat ? " activa" : ""}" data-c="${esc(v)}" aria-pressed="${+v === cat}">${esc(t)}</button>`).join("");
  }
  function list() {
    const q = n(qv);
    const r = W.filter(w => (cat < 0 || w[0] === cat) && (!q || n(w[1]).indexOf(q) >= 0 || n(w[2]).indexOf(q) >= 0)).sort((a, b) => a[1].localeCompare(b[1], "es"));
    $("dic-cuenta").textContent = r.length === 1 ? "1 palabra" : r.length + " palabras";
    $("dic-lista").innerHTML = r.length
      ? r.map(w => `<div class="panel zc-palabra"><div class="zc-cat">${esc(C[w[0]])}</div><b>${esc(w[1])}</b><p>${esc(w[2])}</p></div>`).join("")
      : `<p class="zc-vacio">No hay resultados. Prueba con otra palabra.</p>`;
  }
  $("dic-q").addEventListener("input", (e) => { qv = e.target.value; list(); });
  $("dic-chips").addEventListener("click", (e) => { const b = e.target.closest(".zc-chip"); if (b) { cat = +b.dataset.c; chips(); list(); } });
  chips(); list();
})();
