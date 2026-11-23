// Guía de testigos (Zona Conductores > Utilidades en ruta, petición n.º 65 del padre, v196). Una carpeta por marca
// (de momento DAF: XF, XG, XG+ y CF) con los testigos del cuadro: cómo se ven, de qué color salen, qué significan y
// qué hacer. Son los símbolos normalizados (ISO 2575) que usa DAF; el dibujo puede cambiar algo según el año y el
// modelo, por eso la página manda siempre al manual del camión. Para añadir una marca: otra entrada en MARCAS.
// Sin nada en línea (CSP), textos con esc(). v212: entre /* textos */ y /* fin textos */ los códigos (g, i, c, id) van con comillas simples
// para que la función «traducir» no los cuente como texto (tope de 500 por herramienta); el texto, con comillas dobles. v201: icono de cada testigo (i) en testigos-iconos.js, como la guía de Gemini. Solo en español. Guarda solo la marca abierta en «ccoo-testigos» {m}.
// v210 (petición del padre, 23/11/2026: «cambia los testigos por estos», con las fotos de SU manual DAF): grupo «cuadro» con los
// testigos 1-39 del manual (g, num, p = página, m = texto del manual, h y nota solo si el manual los da). Grupo «otros»: los de antes
// que aún no están en las páginas del manual que tenemos, marcados «Sin comprobar». Las fotos del manual NO se publican (derechos de DAF).
(function () {
  // c: color del testigo (rojo = para; ambar = revisa pronto; verde/azul = solo informa)
  // a: lo que se lee en la pastilla; v: cómo se ve; s: qué significa; h: qué hacer
  /* textos */
  const MARCAS = [
    {
      id: 'daf', n: "DAF", sub: "XF, XG, XG+ y CF (de 2013 en adelante)",
      t: [
      // v211 (parte B): avisos ROJOS de la pantalla del manual DAF del padre (cap. 5, págs. 70-75). Texto tal cual del manual.
      { g: 'rojo', p: 70, i: 'c-carroceria', n: "Carrocería no asegurada", m: "La carrocería está desbloqueada o no está asegurada." },
      { g: 'rojo', p: 70, i: 'c-freno-rend', n: "Presión de aire demasiado baja", m: "La presión de aire de uno de los circuitos del freno de servicio es inferior a 5 bares. Se muestran los niveles actuales de presión de aire de los circuitos 1 y 2." },
      { g: 'rojo', p: 70, i: 'c-freno-rend', n: "Avería del sistema de suministro de aire", m: "Se ha producido una avería en el sistema de suministro de aire (SAC)." },
      { g: 'rojo', p: 70, i: 'c-mil', n: "Apague el motor inmediatamente", m: "Se han detectado posibles daños en el motor." },
      { g: 'rojo', p: 70, i: 'c-mil', n: "Fallo del motor", m: "Se ha detectado una avería grave del motor." },
      { g: 'rojo', p: 71, i: 'c-mil', n: "Avería del pedal del acelerador", m: "Se ha detectado una avería en el pedal del acelerador.", nota: "En función de la avería, el motor puede cambiar al modo de funcionamiento de emergencia (funcionalidad limitada y comportamiento diferente)." },
      { g: 'rojo', p: 71, i: 'c-plataforma', n: "Peldaño en uso. Marcha atrás prohibida", m: "La plataforma se está utilizando y la marcha atrás no se puede engranar." },
      { g: 'rojo', p: 71, i: 'c-plataforma', n: "Avería de la prevención de desplazamiento en pendiente, plataforma bajada", m: "Se detecta una avería en el sistema de prevención de desplazamiento en pendiente cuando la plataforma está bajada." },
      { g: 'rojo', p: 71, i: 'r-volante', n: "Avería en la dirección del eje trasero", m: "Se ha producido una avería en la dirección del eje trasero." },
      { g: 'rojo', p: 71, i: 'r-volante', n: "Avería en la servodirección", m: "Se ha detectado una avería en la servodirección." },
      { g: 'rojo', p: 71, i: 'r-ebs-camion', n: "Avería en el sistema de frenos del camión", m: "El sistema EBS del camión no funciona correctamente." },
      { g: 'rojo', p: 71, i: 'r-ebs-remolque', n: "Avería en el sistema de frenos del remolque/semirremolque", m: "Se ha producido una avería en el sistema EBS del remolque/semirremolque." },
      { g: 'rojo', p: 72, i: 'r-temp-escape', n: "Calentamiento excesivo del motor", m: "La regeneración está en curso y la temperatura de los gases de escape alcanza niveles potencialmente peligrosos para las personas o el área circundante. Temperatura alta del sistema de escape (HEST)." },
      { g: 'rojo', p: 72, i: 'r-temp-escape', n: "Filtro de hollín sucio", m: "El filtro de hollín está contaminado." },
      { g: 'rojo', p: 72, i: 'r-temp-escape', n: "Avería del sistema de escape", m: "Avería del sistema EAS." },
      { g: 'rojo', p: 72, i: 'r-aceite', n: "Presión del aceite excesivamente baja", m: "La presión del aceite del motor es demasiado baja. Compruebe el nivel de aceite del motor.", pre: "Pare inmediatamente el motor." },
      { g: 'rojo', p: 72, i: 'r-cabina', n: "Cabina sin asegurar", m: "El bloqueo de la suspensión de la cabina está abierto. Compruebe que la cabina está completamente enderezada." },
      { g: 'rojo', p: 73, i: 'r-dpf-lleno', n: "Filtro de hollín lleno, se necesita mantenimiento", m: "El filtro de hollín está lleno y es necesario realizar el mantenimiento." },
      { g: 'rojo', p: 73, i: 'c-tpms-averia', n: "Fuga grave en los neumáticos", m: "Hay una fuga grave en un neumático. Observe la pantalla para saber cuál es el neumático afectado por la fuga de presión grave." },
      { g: 'rojo', p: 73, i: 'c-tpms-averia', n: "Presión de neumáticos demasiado baja", m: "La presión de inflado de los neumáticos es excesivamente baja. Observe la pantalla para saber cuál es el neumático afectado por una presión de inflado demasiado baja." },
      { g: 'rojo', p: 73, i: 'r-bateria', n: "Tensión de carga demasiado alta", m: "La tensión de carga del alternador es demasiado alta. Este símbolo de aviso aparece cuando la tensión de carga del alternador sobrepasa los 31 V. Esto indica que la tensión de la batería es excesiva y se corre el riesgo de que se produzca una ebullición. Si se enciende este testigo, ponga en funcionamiento el mayor número posible de consumidores eléctricos.", pre: "Si el símbolo permanece encendido, no siga conduciendo en ninguna circunstancia." },
      { g: 'rojo', p: 74, i: 'r-config', n: "Error de configuración", m: "Los números de chasis programados en el sistema electrónico del motor y en el inmovilizador no coinciden." },
      { g: 'rojo', p: 74, i: 'r-temp-refr', n: "Temperatura del refrigerante demasiado alta", m: "La temperatura del refrigerante supera el valor máximo permitido. Compruebe los puntos siguientes: el nivel del refrigerante (precaución: peligro de quemaduras), signos de fugas de refrigerante, las correas trapezoidales polirranuradas y las mangueras de agua, y el embrague del ventilador." },
      { g: 'rojo', p: 74, i: 'r-nivel-refr', n: "Nivel de refrigerante demasiado bajo", m: "El nivel de refrigerante es excesivamente bajo." },
      { g: 'rojo', p: 74, i: 'r-cambio', n: "Fallo de la transmisión", m: "Se ha detectado un aviso de la transmisión. En función de la avería, la caja de cambios solo admitirá cambios manuales." },
      { g: 'rojo', p: 75, i: 'c-asiento-gir', n: "Bloquee el asiento giratorio", m: "El asiento giratorio no está bloqueado en la posición de conducción." },
      { g: 'rojo', p: 75, i: 'c-freno-estac', n: "Avería del sistema de freno de estacionamiento", m: "Se ha detectado una avería crítica en el sistema del freno de estacionamiento." },
      { g: 'rojo', p: 75, i: 'c-freno-estac', n: "Freno de estacionamiento no accionado", m: "El freno de estacionamiento no se aplica al salir del vehículo." },
      // v212 (parte C): avisos AMARILLOS de la pantalla del manual DAF del padre (cap. 5, págs. 75-94). Texto tal cual del manual.
      // Faltan las págs. 88, 89 y 95 (pedidas al padre): los de las luces (pág. 90) llevan el dibujo general hasta tener la 89.
      { g: 'amarillo', p: 76, i: 'a-camara', n: "Avería del sistema de cámaras", m: "Se ha detectado una avería en el sistema de visión digital." },
      { g: 'amarillo', p: 76, i: 'c-freno-estac', n: "Avería del sistema de freno de estacionamiento", m: "Se ha detectado una avería en el freno de estacionamiento." },
      { g: 'amarillo', p: 76, i: 'c-freno-estac', n: "Freno de estacionamiento no accionado", m: "El freno de estacionamiento no se aplica al salir del vehículo." },
      { g: 'amarillo', p: 76, i: 'r-ebs-camion', n: "Fallo del sistema de frenos del camión", m: "Se ha detectado una avería en el sistema EBS del camión." },
      { g: 'amarillo', p: 76, i: 'r-dpf-lleno', n: "Filtro de hollín lleno", m: "El nivel de hollín del filtro de partículas diésel (DPF) es alto." },
      { g: 'amarillo', p: 76, i: 'r-dpf-lleno', n: "Nivel de hollín muy alto", m: "El nivel de hollín del filtro de partículas diésel (DPF) es alto." },
      { g: 'amarillo', p: 76, i: 'r-dpf-lleno', n: "Filtro de hollín sucio", m: "El nivel de hollín ha ensuciado el filtro de partículas diésel (DPF)." },
      { g: 'amarillo', p: 76, i: 'r-dpf-lleno', n: "Avería del sistema de escape", m: "Se ha detectado una avería en el sistema EAS." },
      { g: 'amarillo', p: 77, i: 'r-dpf-lleno', n: "Nivel de hollín alto", m: "El nivel de hollín del filtro de partículas diésel (DPF) es alto." },
      { g: 'amarillo', p: 77, i: 'a-emisiones', n: "Fallo de emisiones", m: "Se ha producido un fallo de emisiones. La potencia del motor se reduce hasta en un 50%. La reducción de potencia solo se activa o desactiva con el vehículo detenido." },
      { g: 'amarillo', p: 77, i: 'a-deposito-aire', n: "Vaciar depósitos de aire", m: "Los depósitos de aire contienen demasiada agua y deben vaciarse." },
      { g: 'amarillo', p: 77, i: 'r-ebs-remolque', n: "Avería en el sistema de frenos del remolque/semirremolque", m: "Se ha detectado un fallo del sistema EBS en el sistema EBS del remolque/semirremolque." },
      { g: 'amarillo', p: 77, i: 'r-ebs-remolque', n: "Avería del freno del remolque/semirremolque, AEBS y ACC desactivados" },
      { g: 'amarillo', p: 77, i: 'r-bateria', n: "Carga de batería demasiado baja", m: "Hay una avería en el alternador." },
      { g: 'amarillo', p: 77, i: 'r-bateria', n: "Fallo del alternador", m: "Hay una avería en el alternador." },
      { g: 'amarillo', p: 78, i: 'r-bateria', n: "Tensión de carga demasiado baja", m: "Hay un fallo de carga." },
      { g: 'amarillo', p: 78, i: 'r-bateria', n: "Funcionamiento incorrecto de la batería", m: "Hay un fallo en la batería." },
      { g: 'amarillo', p: 78, i: 'r-bateria', n: "Fallo de monitorización de la batería", m: "Se ha producido un fallo en el sistema BEM." },
      { g: 'amarillo', p: 78, i: 'c-tpms-averia', n: "Presión de neumáticos alta", m: "La presión del neumático es excesivamente alta. Consulte la pantalla que se muestra para averiguar qué neumáticos tienen una presión demasiado alta." },
      { g: 'amarillo', p: 78, i: 'c-tpms-averia', n: "Presión de los neumáticos baja", m: "La presión de inflado de los neumáticos es excesivamente baja. Consulte la pantalla que se muestra para averiguar qué neumáticos tienen una presión demasiado baja." },
      { g: 'amarillo', p: 78, i: 'c-tpms-averia', n: "Presión de neumáticos demasiado baja", m: "La presión de inflado de los neumáticos es excesivamente baja." },
      { g: 'amarillo', p: 78, i: 'c-tpms-averia', n: "Compruebe la presión del neumático (delantero o trasero, izquierdo o derecho)", m: "Compruebe la presión de los neumáticos y ajústela si es necesario. Compruebe si hay pinchazos o daños en los neumáticos." },
      { g: 'amarillo', p: 78, i: 'c-tpms-averia', n: "Mal funcionamiento del sistema de control de la presión de inflado de los neumáticos" },
      { g: 'amarillo', p: 79, i: 'c-tpms-averia', n: "Fallo del sistema de presión de los neumáticos", m: "Se ha detectado una avería en el sistema de presión de inflado de los neumáticos. Según el dibujo del aviso, también puede decir: se ha detectado una avería en el sistema de control de la presión de neumáticos." },
      { g: 'amarillo', p: 79, i: 'c-tpms-averia', n: "Fallo del sistema de presión de inflado de los neumáticos del remolque/semirremolque", m: "Se ha detectado una avería en el sistema de presión de los neumáticos del remolque/semirremolque." },
      { g: 'amarillo', p: 79, i: 'c-tpms', n: "Avería del sensor de presión de los neumáticos", m: "Se muestran los neumáticos en los que se detecta un sensor de presión defectuoso." },
      { g: 'amarillo', p: 79, i: 'c-tpms', n: "Presión de los neumáticos del remolque/semirremolque insuficiente", m: "Se ha detectado que la presión de los neumáticos del remolque/semirremolque es insuficiente." },
      { g: 'amarillo', p: 79, i: 'a-abs-rem-off', n: "ABS/EBS para (semi) remolque no conectado", m: "El conector ABS/EBS del remolque/semirremolque no está conectado." },
      { g: 'amarillo', p: 79, i: 'c-abs-remolque', n: "Avería del ABS del remolque/semirremolque", m: "Se ha detectado una avería en el sistema ABS del remolque/semirremolque." },
      { g: 'amarillo', p: 79, i: 'c-abs-remolque', n: "Avería del ABS del remolque/semirremolque, AEBS y ACC desactivados", m: "Se ha detectado una avería en el sistema ABS del remolque/semirremolque." },
      { g: 'amarillo', p: 79, i: 'a-embrague', n: "Sobrecarga del embrague", m: "Se ha detectado una sobrecarga del embrague. No haga caso omiso de este aviso y elimine la sobrecarga del embrague.", h: "Para eliminar la sobrecarga del embrague: aumente la velocidad del vehículo (se cierra la línea motriz) pisando más el pedal del acelerador, o pare soltando el pedal del acelerador, o seleccione manualmente una velocidad inferior.", nota: "En los vehículos equipados con la estrategia de cambio «Lite», el cambio con el interruptor de la columna de la dirección solo es posible cuando la velocidad del vehículo es inferior a 30 km/h o cuando el freno motor está activo (a cualquier velocidad del vehículo)." },
      { g: 'amarillo', p: 80, i: 'a-embrague', n: "Se ha detectado el desgaste del embrague", m: "Se ha detectado que el embrague está desgastado." },
      { g: 'amarillo', p: 80, i: 'c-mil', n: "Sobremarcha del motor", m: "Se ha detectado una sobrevelocidad del motor." },
      { g: 'amarillo', p: 80, i: 'c-mil', n: "Temperatura del motor de arranque excesivamente alta", m: "El motor de arranque se ha recalentado. El motor de arranque deja de funcionar durante 15 minutos." },
      { g: 'amarillo', p: 80, i: 'c-mil', n: "Fallo del motor", m: "Se ha detectado un aviso del motor.", nota: "Dependiendo de la avería, el motor podría cambiar al modo de funcionamiento de emergencia." },
      { g: 'amarillo', p: 80, i: 'c-mil', n: "Reducción de la potencia del motor", m: "La potencia del motor está limitada debido a un problema relacionado con el motor o con el sistema de escape." },
      { g: 'amarillo', p: 80, i: 'c-mil', n: "La potencia del motor se reducirá en… (horas/minutos)", m: "La potencia del motor está a punto de reducirse debido a un problema relacionado con el motor. El tiempo restante se muestra en horas. Si el tiempo es inferior a 1 hora, el tiempo se muestra en minutos." },
      { g: 'amarillo', p: 81, i: 'c-mil', n: "Avería del pedal del acelerador", m: "Se ha detectado una avería en el pedal del acelerador." },
      { g: 'amarillo', p: 81, i: 'r-volante', n: "Avería en la servodirección", m: "Hay una avería en la servodirección." },
      { g: 'amarillo', p: 81, i: 'r-volante', n: "Avería en la dirección del eje trasero", m: "Se ha producido una avería en la dirección del eje trasero." },
      { g: 'amarillo', p: 81, i: 'c-vsc', n: "Avería en el control de estabilidad", m: "Se ha detectado una avería en el VSC (control de estabilidad del vehículo)." },
      { g: 'amarillo', p: 81, i: 'r-cambio', n: "Presión neumática de la transmisión baja", m: "La presión del aire para el funcionamiento de la caja de cambios es demasiado baja." },
      { g: 'amarillo', p: 81, i: 'r-cambio', n: "Temperatura de la transmisión excesivamente alta", m: "La temperatura de la transmisión es excesivamente alta." },
      { g: 'amarillo', p: 81, i: 'r-cambio', n: "Fallo de la transmisión", m: "Se ha detectado una avería en la transmisión." },
      { g: 'amarillo', p: 82, i: 'c-retardador', n: "Fallo del retardador", m: "Se ha detectado una avería en el sistema del retardador." },
      { g: 'amarillo', p: 82, i: 'a-pie-freno', n: "Pise el pedal de freno", m: "Este aviso aparece, por ejemplo, si se ha producido algún problema relacionado con el pedal del acelerador.", h: "Como medida de seguridad, cada vez que detenga el vehículo, pise el pedal de freno antes de volver a utilizar el pedal del acelerador." },
      { g: 'amarillo', p: 82, i: 'r-cambio', n: "La transmisión no está en punto muerto", m: "La transmisión no está en punto neutro." },
      { g: 'amarillo', p: 82, i: 'a-vehiculo-averia', n: "Avería del vehículo", m: "Se ha detectado una avería en el vehículo." },
      { g: 'amarillo', p: 82, i: 'a-vehiculo-averia', n: "Avería en el módulo de interruptores", m: "Se ha detectado un aviso del sistema del módulo de interruptores de la cabina." },
      { g: 'amarillo', p: 82, i: 'a-vehiculo-averia', n: "Avería del controlador del vehículo", m: "Se ha detectado una avería en el controlador del vehículo." },
      { g: 'amarillo', p: 82, i: 'a-vehiculo-averia', n: "Avería en el módulo frontal del chasis", m: "Se ha detectado una avería en el módulo frontal del chasis." },
      { g: 'amarillo', p: 82, i: 'a-vehiculo-averia', n: "Avería en el módulo trasero del chasis", m: "Se ha detectado una avería en el módulo trasero del chasis." },
      { g: 'amarillo', p: 82, i: 'a-vehiculo-averia', n: "Error de configuración", m: "Se ha detectado una avería debida a un error de configuración." },
      { g: 'amarillo', p: 83, i: 'a-temp-neum', n: "Temperatura de los neumáticos demasiado alta", m: "La temperatura de los neumáticos es demasiado alta. Observe la pantalla para saber cuáles son los neumáticos afectados por una temperatura demasiado alta." },
      { g: 'amarillo', p: 83, i: 'acc-crucero', n: "Fallo del Control de crucero adaptable", m: "Se ha activado un aviso del sistema ACC." },
      { g: 'amarillo', p: 83, i: 'a-sensor-sucio', n: "Sensor de distancia sucio", m: "Se activa cuando la cubierta del sensor o el sensor están demasiado sucios para que el sistema pueda funcionar correctamente o están bloqueados. El ACC ya no se puede activar y el AEBS se ha desactivado.", h: "Limpie la cubierta del sensor o desbloquee la cubierta o el sensor. Si tras la limpieza o el desbloqueo del sensor continúa apareciendo el aviso, póngase en contacto con un taller de servicio DAF.", nota: "Si, durante un largo periodo de tiempo, el sensor capta pocos objetos o ninguno junto a la carretera o por delante del vehículo, puede que se muestre este aviso." },
      { g: 'amarillo', p: 83, i: 'a-sensor-sucio', n: "Fallo del AEBS", m: "Se ha detectado que el sistema avanzado de frenado de emergencia funciona incorrectamente o que la cámara situada detrás del parabrisas está sucia o bloqueada. Una cámara sucia o bloqueada hace que el sistema de asistencia a la velocidad inteligente pueda no detectar todas las señales de tráfico, y que la detección de somnolencia de DAF no funcione y solo muestre un nivel de alerta máximo.", h: "Limpie el parabrisas delante de la cámara o elimine la obstrucción." },
      { g: 'amarillo', p: 84, i: 'airbag', n: "Avería en el sistema airbag", m: "Se ha detectado un aviso del sistema de airbags." },
      { g: 'amarillo', p: 84, i: 'c-chasis', n: "Avería de la suspensión neumática", m: "Se ha detectado un aviso del sistema de la suspensión neumática ECAS." },
      { g: 'amarillo', p: 84, i: 'a-alarma', n: "Avería del sistema de alarma", m: "Se ha detectado una avería en el sistema de alarma." },
      { g: 'amarillo', p: 84, i: 'c-freno-rend', n: "Escaso rendimiento del freno", m: "Rendimiento deficiente de los frenos." },
      { g: 'amarillo', p: 84, i: 'c-freno-rend', n: "Comprobar fugas de aire", m: "Posible fuga de aire en el sistema SAC." },
      { g: 'amarillo', p: 85, i: 'c-freno-rend', n: "Avería del sistema de suministro de aire", m: "Se ha detectado una avería en el sistema SAC." },
      { g: 'amarillo', p: 85, i: 'c-freno-rend', n: "Presión de aire baja", m: "Se muestran los circuitos de aire afectados." },
      { g: 'amarillo', p: 85, i: 'r-nivel-refr', n: "Avería del sensor de nivel del refrigerante", m: "Se ha detectado una avería en el sensor de nivel del refrigerante." },
      { g: 'amarillo', p: 85, i: 'r-temp-refr', n: "Temperatura del refrigerante alta", m: "Este símbolo de aviso aparece cuando la temperatura del refrigerante sobrepasa el valor máximo permitido.", h: "Compruebe el nivel del refrigerante, los signos de fuga de refrigerante, las correas trapezoidales polirranuradas y las mangueras de agua, y el embrague del ventilador.", pre: "Al comprobar el nivel del refrigerante, peligro de quemaduras." },
      { g: 'amarillo', p: 85, i: 'c-ldws', n: "Avería del sistema de advertencia de salida de carril (LDWS)", m: "Se ha detectado una avería en el sistema de advertencia de salida de carril." },
      { g: 'amarillo', p: 85, i: 'a-nivel-aceite', n: "Avería del sensor de nivel del aceite", m: "Se ha detectado una avería en el sensor de control del nivel de aceite." },
      { g: 'amarillo', p: 86, i: 'r-aceite', n: "Presión de aceite baja", m: "Pare inmediatamente el motor. Compruebe el nivel de aceite del motor.", h: "" },
      { g: 'amarillo', p: 86, i: 'c-tdf1', n: "Fallo de la TDF 1", m: "Este aviso de la toma de fuerza se activa si la TDF estaba activa y se desconecta, no con el interruptor de la TDF u otras condiciones de «desconexión» (p. ej., baja presión de aire del sistema); si la TDF no se desactiva dentro de un tiempo definido después de desconectarla con el interruptor de la TDF o por condiciones de «desconexión» (p. ej., liberación del freno de estacionamiento); o si la TDF ya estaba activa cuando se puso el contacto." },
      { g: 'amarillo', p: 86, i: 'c-tdf2', n: "Fallo de la TDF 2", m: "Este aviso de la toma de fuerza se activa si la TDF estaba activa y se desconecta, no con el interruptor de la TDF u otras condiciones de «desconexión» (p. ej., baja presión de aire del sistema); si la TDF no se desactiva dentro de un tiempo definido después de desconectarla con el interruptor de la TDF o por condiciones de «desconexión» (p. ej., liberación del freno de estacionamiento); o si la TDF ya estaba activa cuando se puso el contacto." },
      { g: 'amarillo', p: 87, i: 'c-tdf3', n: "Fallo de la TDF 3", m: "Este aviso de la toma de fuerza se activa si la TDF estaba activa y se desconecta, no con el interruptor de la TDF u otras condiciones de «desconexión» (p. ej., baja presión de aire del sistema); si la TDF no se desactiva dentro de un tiempo definido después de desconectarla con el interruptor de la TDF o por condiciones de «desconexión» (p. ej., liberación del freno de estacionamiento); o si la TDF ya estaba activa cuando se puso el contacto." },
      { g: 'amarillo', p: 87, i: 'c-adblue', n: "Nivel bajo de AdBlue®", m: "Para evitar nuevos avisos, rellene el depósito de AdBlue®.", h: "" },
      { g: 'amarillo', p: 87, i: 'c-adblue', n: "Nivel de AdBlue® demasiado bajo", m: "Para evitar nuevos avisos, rellene el depósito de AdBlue®.", h: "" },
      { g: 'amarillo', p: 87, i: 'c-adblue', n: "Nivel de AdBlue® muy bajo", m: "La potencia del motor se reducirá después de parar el vehículo. Para evitar nuevos avisos y recuperar la potencia del motor, rellene el depósito de AdBlue®.", h: "", nota: "Además de la reducción de potencia y del límite de velocidad en el siguiente aviso, conducir sin AdBlue® dañará irreparablemente el sistema de dosificación de AdBlue®." },
      { g: 'amarillo', p: 87, i: 'c-adblue', n: "Depósito de AdBlue® vacío", m: "Además del indicador de aviso «General», se activa el testigo «MIL». En el siguiente ciclo de encendido se aplicará un límite de velocidad al vehículo. Si no se quita y se vuelve a poner el contacto en ocho horas, se muestra un aviso. Este aviso informa al conductor de que la velocidad del vehículo se limitará la próxima vez que se detenga el vehículo.", nota: "El texto sigue en la página 88 del manual, que aún no tenemos." },
      { g: 'amarillo', p: 90, i: 'aviso-general', n: "Luz de freno del remolque/semirremolque", m: "Se ha detectado un fallo en la luz de freno del remolque/semirremolque.", nota: "El dibujo de este aviso está en la página 89 del manual, que aún no tenemos." },
      { g: 'amarillo', p: 90, i: 'aviso-general', n: "Avería de la luz trasera del camión", m: "Se ha detectado un fallo en las luces traseras del camión.", nota: "El dibujo de este aviso está en la página 89 del manual, que aún no tenemos." },
      { g: 'amarillo', p: 90, i: 'aviso-general', n: "Avería de luces auxiliares/Skylights", m: "Se ha detectado un fallo en la luz de carretera/skylight/luz auxiliar.", nota: "El dibujo de este aviso está en la página 89 del manual, que aún no tenemos." },
      { g: 'amarillo', p: 90, i: 'aviso-general', n: "Avería de luz antiniebla del remolque/semirremolque", m: "Se ha detectado un fallo en la luz antiniebla del remolque/semirremolque.", nota: "El dibujo de este aviso está en la página 89 del manual, que aún no tenemos." },
      { g: 'amarillo', p: 90, i: 'aviso-general', n: "Avería de la luz de marcha atrás del remolque/semirremolque", m: "Se ha detectado un fallo en la luz de marcha atrás del remolque/semirremolque.", nota: "El dibujo de este aviso está en la página 89 del manual, que aún no tenemos." },
      { g: 'amarillo', p: 90, i: 'a-limite-vel', n: "Velocidad limitada tras la siguiente parada", m: "El límite de velocidad se activa la próxima vez que el vehículo se detenga. La velocidad del vehículo está limitada a 20 km/h o 12 mph." },
      { g: 'amarillo', p: 90, i: 'a-limite-vel', n: "La velocidad se limitará en… (horas/minutos)", m: "La velocidad del vehículo está a punto de limitarse. El tiempo restante sin restricciones se muestra en horas. Si es inferior a 1 hora, la hora se muestra en minutos." },
      { g: 'amarillo', p: 90, i: 'a-limite-vel', n: "Límite de velocidad de 20 km/h (o 12 mph)", m: "Debido a un fallo del sistema EAS, la velocidad está limitada." },
      { g: 'amarillo', p: 90, i: 'acc-crucero', n: "Avería de control de crucero predictivo (PCC)", m: "Se ha detectado un fallo de funcionamiento del control de crucero predictivo." },
      { g: 'amarillo', p: 91, i: 'a-candado', n: "Avería del sistema de cierre centralizado de puertas", m: "Se ha detectado una avería en el sistema de cierre centralizado de puertas (CDS)." },
      { g: 'amarillo', p: 91, i: 'a-aire-acond', n: "Avería del sistema de aire acondicionado", m: "Se ha detectado una avería en el sistema de aire acondicionado." },
      { g: 'amarillo', p: 91, i: 'c-tacografo', n: "Tacógrafo defectuoso", m: "Se ha detectado una avería en el tacógrafo." },
      { g: 'amarillo', p: 91, i: 'pastillas-freno', n: "Se ha detectado un desgaste de los forros de los frenos del camión", m: "Este símbolo se activa cuando una pastilla de freno de una o más ruedas está gastada." },
      { g: 'amarillo', p: 91, i: 'limpiaparabrisas', n: "Nivel bajo de líquido lavaparabrisas", m: "El nivel de líquido del lavaparabrisas es demasiado bajo.", h: "Llene el depósito con lavaparabrisas apto para todas las estaciones. El tapón de llenado del depósito del lavaparabrisas se encuentra en la parte derecha, bajo el panel de esquina frontal." },
      { g: 'amarillo', p: 92, i: 'a-sobrecarga-eje', n: "Sobrecarga del eje" },
      { g: 'amarillo', p: 92, i: 'a-sobrecarga-eje', n: "Carrocería: Sobrecarga del eje adicional" },
      { g: 'amarillo', p: 92, i: 'a-limpia', n: "Avería del limpiaparabrisas" },
      { g: 'amarillo', p: 92, i: 'a-multimedia', n: "Avería del sistema multimedia" },
      { g: 'amarillo', p: 92, i: 'filtro-aire', n: "Obturación del filtro de aire" },
      { g: 'amarillo', p: 93, i: 'a-herramientas', n: "Apertura de la caja de herramientas", m: "Asegúrese de que las trampillas de la caja de herramientas de los lados izquierdo y derecho de la cabina están correctamente cerradas." },
      { g: 'amarillo', p: 93, i: 'a-panel', n: "Avería del panel de instrumentos" },
      { g: 'amarillo', p: 93, i: 'c-plataforma', n: "Avería de la prevención de desplazamiento en pendiente" },
      { g: 'amarillo', p: 93, i: 'c-somnolencia', n: "Se recomienda descansar ahora", m: "Se ha detectado somnolencia del conductor.", h: "Estacione el vehículo y descanse." },
      { g: 'amarillo', p: 93, i: 'c-somnolencia', n: "Fallo del sistema de somnolencia del conductor", m: "Se ha detectado una avería del sistema de somnolencia del conductor." },
      { g: 'amarillo', p: 93, i: 'c-angulo', n: "Fallo del sistema de ángulos muertos", m: "Se ha detectado una avería en el sistema de detección de objetos en ángulo muerto." },
      { g: 'amarillo', p: 94, i: 'c-angulo', n: "Fallo del ángulo muerto derecho", m: "Se ha detectado una avería en el sistema de detección de objetos en ángulo muerto del lado del acompañante." },
      { g: 'amarillo', p: 94, i: 'c-arranque', n: "Fallo del ángulo muerto delantero", m: "Se ha detectado una avería en el sistema de ángulos muertos delanteros." },
      { g: 'amarillo', p: 94, i: 'c-carretera-auto', n: "Fallo del asistente de luz de carretera", m: "Se ha detectado una avería en el sistema del asistente de luz de carretera." },
      { g: 'amarillo', p: 94, i: 'c-aparc', n: "Fallo del aparcamiento asistido", m: "Se ha detectado una avería en aparcamiento asistido." },
      { g: 'amarillo', p: 94, i: 'a-alcohol', n: "Fallo del dispositivo de prueba de alcoholemia. No es posible reiniciar", m: "Se ha detectado una avería en el dispositivo de prueba de alcoholemia.", h: "Acuda inmediatamente a un taller de servicio DAF. Si se apaga el vehículo por completo, es posible que no se pueda conducir debido a una avería del dispositivo de prueba de alcoholemia." },
      // v210 (petición del padre, 23/11/2026): los testigos del cuadro tal como vienen en SU manual DAF (cap. 5 «Entorno
      // del conductor», págs. 101-109): número, nombre y texto del manual; el dibujo, hecho por nosotros igual que el del manual.
      // num: número del testigo en el cuadro; p: página; m: lo que dice el manual; h: qué hacer (solo si el manual lo dice).
      { g: 'cuadro', num: 1, p: 101, i: 'c-int-izq', n: "Intermitente izquierdo, camión", m: "Este testigo parpadea simultáneamente con los intermitentes del camión." },
      { g: 'cuadro', num: 2, p: 101, i: 'c-int-rem', n: "Indicador de intermitente izquierdo, remolque/semirremolque", m: "En una combinación de camión y remolque/semirremolque, este testigo parpadea simultáneamente con los intermitentes del remolque/semirremolque." },
      { g: 'cuadro', num: 3, p: 101, i: 'c-cinturon', n: "Recordatorio del cinturón de seguridad", m: "" },
      { g: 'cuadro', num: 4, p: 101, i: 'c-carretera', n: "Luz de carretera", m: "Este testigo se ilumina cuando se enciende la luz de carretera o cuando se activa la luz de destellos con el interruptor izquierdo de la columna de la dirección." },
      { g: 'cuadro', num: 5, p: 101, i: 'c-galibo', n: "Luces de gálibo encendidas", m: "" },
      { g: 'cuadro', num: 5, p: 101, i: 'c-drl-off', n: "Luces de funcionamiento diurno apagadas", m: "Este testigo se ilumina cuando se apagan las luces de conducción diurna." },
      { g: 'cuadro', num: 6, p: 102, i: 'c-cruce', n: "Luces de cruce y luces de gálibo encendidas", m: "" },
      { g: 'cuadro', num: 6, p: 102, i: 'c-cruce-auto', n: "Modo automático de las luces de cruce y las luces de gálibo activado", m: "" },
      { g: 'cuadro', num: 6, p: 102, i: 'c-cruce-off', n: "Interruptor de luces de cruce y de gálibo encendidas", m: "" },
      { g: 'cuadro', num: 7, p: 102, i: 'c-niebla-del', n: "Luces antiniebla delanteras", m: "Este testigo se ilumina cuando se encienden las luces antiniebla delanteras." },
      { g: 'cuadro', num: 7, p: 102, i: 'c-carretera-auto', n: "Luz de carretera automática", m: "Este testigo se enciende cuando la luz de carretera automática está activada." },
      { g: 'cuadro', num: 8, p: 102, i: 'c-niebla-tras', n: "Luces antiniebla traseras", m: "Este testigo se ilumina cuando se encienden las luces antiniebla traseras." },
      { g: 'cuadro', num: 10, p: 102, i: 'c-limpia-auto', n: "Limpiaparabrisas automático", m: "" },
      { g: 'cuadro', num: 11, p: 103, i: 'c-asiento-gir', n: "Asiento giratorio", m: "Este testigo muestra que el asiento giratorio no está correctamente fijado." },
      { g: 'cuadro', num: 12, p: 103, i: 'c-tpms', n: "Control de presión de los neumáticos", m: "" },
      { g: 'cuadro', num: 12, p: 103, i: 'c-tpms-averia', n: "Avería de presión de los neumáticos", m: "" },
      { g: 'cuadro', num: 13, p: 103, i: 'c-tc', n: "Control de tracción", m: "Este testigo parpadea cuando interviene el sistema ASR." },
      { g: 'cuadro', num: 13, p: 103, i: 'c-tc-off', n: "Control de tracción desactivado", m: "Este testigo se ilumina cuando el modo de fuera de carretera desactiva el control de tracción." },
      { g: 'cuadro', num: 13, p: 103, i: 'c-vsc', n: "Control de estabilidad del vehículo (VSC)", m: "Este testigo parpadea cuando interviene el sistema VSC. Si este indicador de aviso permanece encendido, hay un fallo en el sistema." },
      { g: 'cuadro', num: 14, p: 103, i: 'c-dif-trans', n: "Bloqueo (transversal) del diferencial", m: "Este testigo se ilumina cuando se activa el bloqueo transversal." },
      { g: 'cuadro', num: 14, p: 103, i: 'c-dif-long', n: "Bloqueo (longitudinal) del diferencial", m: "Este testigo se ilumina cuando se activa el bloqueo del diferencial longitudinal." },
      { g: 'cuadro', num: 14, p: 104, i: 'c-dif-ambos', n: "Bloqueo del diferencial longitudinal y transversal", m: "Este testigo se ilumina cuando se activa el bloqueo del diferencial longitudinal y transversal." },
      { g: 'cuadro', num: 15, p: 104, i: 'c-tdf1', n: "Testigo de la TDF 1", m: "La TDF 1 puede ser una TDF del motor, NMV o una TDF de la caja de cambios." },
      { g: 'cuadro', num: 15, p: 104, i: 'c-tdf2', n: "Testigo de la TDF 2", m: "La TDF 2 es una TDF a la caja de cambios." },
      { g: 'cuadro', num: 15, p: 104, i: 'c-tdf3', n: "Testigo de la TDF 3", m: "La TDF 3 es un motor o TDF NMV." },
      { g: 'cuadro', num: 15, p: 104, i: 'c-dpf', n: "Filtro de partículas diésel", m: "Este testigo se ilumina cuando el nivel de hollín del DPF o del filtro de hollín es (demasiado) alto o si el filtro está sucio." },
      { g: 'cuadro', num: 16, p: 104, i: 'c-somnolencia', n: "Detección de somnolencia del conductor", m: "Este testigo indica que se ha detectado somnolencia debido al tiempo de conducción y al comportamiento del conductor." },
      { g: 'cuadro', num: 17, p: 104, i: 'c-arranque', n: "Asistente de arranque", m: "Este testigo indica que hay una avería en el sistema de asistencia de arranque." },
      { g: 'cuadro', num: 17, p: 104, i: 'c-arranque-off', n: "Asistente de arranque desactivado", m: "Este testigo indica que el sistema de asistencia de arranque está desactivado." },
      { g: 'cuadro', num: 18, p: 105, i: 'c-angulo', n: "Detección de objetos en ángulo muerto", m: "Este testigo indica que hay una avería en el sistema de detección de objetos en ángulo muerto." },
      { g: 'cuadro', num: 18, p: 105, i: 'c-angulo-off', n: "Detección de objetos en ángulo muerto desactivado", m: "Este testigo indica que el sistema de detección de objetos en ángulo muerto está desactivado." },
      { g: 'cuadro', num: 19, p: 105, i: 'c-aparc', n: "Aparcamiento asistido", m: "Este testigo indica que hay una avería en el sistema de aparcamiento asistido." },
      { g: 'cuadro', num: 19, p: 105, i: 'c-aparc-off', n: "Aparcamiento asistido desactivado", m: "Este testigo indica que el sistema de aparcamiento asistido está desactivado." },
      { g: 'cuadro', num: 20, p: 105, i: 'c-aebs', n: "Sistema avanzado de frenado de emergencia (AEBS)", m: "Este testigo indica que hay una avería de AEBS o que la cámara situada detrás del parabrisas está sucia o bloqueada." },
      { g: 'cuadro', num: 20, p: 105, i: 'c-aebs-off', n: "AEBS desactivado", m: "Este testigo indica que el AEBS está desactivado." },
      { g: 'cuadro', num: 21, p: 105, i: 'c-ldws', n: "Sistema de advertencia de salida de carril", m: "Este testigo se ilumina cuando: el LDWS no puede detectar ninguna línea, cuando la cámara está bloqueada, cuando el LDWS se ha desactivado o cuando se detecta una avería." },
      { g: 'cuadro', num: 21, p: 106, i: 'c-ldws-off', n: "Sistema de advertencia de salida de carril desactivado", m: "Este testigo indica que el LDWS está desactivado." },
      { g: 'cuadro', num: 0, p: 106, i: 'c-combustible', n: "Nivel de combustible", m: "Este testigo se ilumina en color rojo cuando el nivel de combustible es crítico.", h: "Reposte lo antes posible." },
      { g: 'cuadro', num: 22, p: 106, i: 'c-eje-motor', n: "Eje delantero motor", m: "" },
      { g: 'cuadro', num: 23, p: 106, i: 'c-trampilla', n: "Rígido: Trampilla elevadora", m: "" },
      { g: 'cuadro', num: 23, p: 106, i: 'c-carroceria', n: "Aviso general de la carrocería", m: "" },
      { g: 'cuadro', num: 23, p: 106, i: 'c-volquete', n: "Volquete", m: "" },
      { g: 'cuadro', num: 24, p: 106, i: 'c-chasis', n: "Chasis a un nivel de conducción no normal", m: "Este testigo se ilumina cuando el chasis no se encuentra a la altura de conducción normal." },
      { g: 'cuadro', num: 0, p: 106, i: 'c-adblue', n: "Nivel bajo de AdBlue", m: "Este testigo se ilumina en rojo cuando el nivel de AdBlue alcanza un valor crítico." },
      { g: 'cuadro', num: 26, p: 107, i: 'c-retardador', n: "Freno motor o retardador activo", m: "Este testigo se ilumina cuando están activos el freno motor o el retardador. Si el indicador parpadea, el par de frenado se reduce debido a una función de protección del intarder. Esta reducción del par de frenado puede activarse, por ejemplo, si la temperatura del motor es demasiado alta. Este indicador comienza a parpadear y aparece un aviso emergente en la pantalla general cuando el pedal del acelerador prevalece sobre la función del freno motor o el retardador.", nota: "El indicador del retardador no aparece cuando el freno motor o el retardador están activos durante la integración del tercer freno o una reducción de velocidad realizada por el ACC (control de crucero adaptable)." },
      { g: 'cuadro', num: 27, p: 107, i: 'c-hill', n: "Ayuda de arranque en pendiente", m: "Este testigo se ilumina cuando la función Hill Start Aid está activada." },
      { g: 'cuadro', num: 28, p: 107, i: 'c-abs-tractor', n: "ABS del tractor", m: "Este testigo se ilumina cuando se enciende el contacto y desaparece tras 3 segundos. Si el testigo continúa encendido, hay un fallo en el sistema ABS del camión." },
      { g: 'cuadro', num: 28, p: 107, i: 'c-abs-remolque', n: "ABS del (semi) remolque", m: "Este testigo se ilumina cuando se enciende el contacto y hay un remolque/semirremolque con sistema ABS enganchado al camión. El testigo se apaga a los 3 segundos. Si el testigo sigue encendido, hay un fallo en el sistema ABS del remolque/semirremolque." },
      { g: 'cuadro', num: 29, p: 108, i: 'c-freno-rend', n: "Escaso rendimiento del freno", m: "Consulte la sección «Frenos» en el capítulo «Conducción» del manual." },
      { g: 'cuadro', num: 30, p: 108, i: 'c-freno-estac', n: "Freno de estacionamiento", m: "Este testigo se ilumina cuando se acciona el freno de estacionamiento o cuando la presión del sistema de suministro de aire es demasiado baja para poder soltar el freno de estacionamiento." },
      { g: 'cuadro', num: 31, p: 108, i: 'c-int-der', n: "Intermitente derecho, camión", m: "Este testigo parpadea simultáneamente con los intermitentes del camión." },
      { g: 'cuadro', num: 32, p: 108, i: 'c-int-rem', n: "Intermitente derecho, (semi) remolque", m: "Con una combinación de camión y (semi) remolque, este indicador de aviso parpadea simultáneamente con los intermitentes del (semi) remolque." },
      { g: 'cuadro', num: 33, p: 108, i: 'c-stop', n: "Luz STOP", m: "Este testigo indica que el camión debe detenerse y estacionarse lo antes posible.", h: "Para y estaciona lo antes posible." },
      { g: 'cuadro', num: 34, p: 108, i: 'c-mil', n: "Testigo de avería (MIL)", m: "Este testigo se ilumina cuando el nivel de emisiones excede el límite legal o para indicar un aviso genérico relacionado con el motor o el sistema de escape. Cómo se comprueba: con la llave en contacto y el motor apagado, el testigo se enciende 5 segundos, se apaga 10 segundos y vuelve a encenderse otros 5 (comprobación del sistema). Después parpadea 1 segundo cada 5 segundos. Cualquier otro patrón de parpadeo es señal de fallo." },
      { g: 'cuadro', num: 35, p: 109, i: 'c-eta', n: "Hora estimada de llegada (ETA)", m: "Este testigo se ilumina cuando se utiliza el sistema de navegación." },
      { g: 'cuadro', num: 36, p: 109, i: 'c-despertador', n: "Reloj con alarma", m: "Este testigo se ilumina cuando el despertador está activado." },
      { g: 'cuadro', num: 37, p: 109, i: 'c-tacografo', n: "Anomalía en el tacógrafo", m: "Consulte el manual de instrucciones del tacógrafo." },
      { g: 'cuadro', num: 38, p: 109, i: 'c-horas', n: "Horas de conducción", m: "Tiempo de conducción restante." },
      { g: 'cuadro', num: 39, p: 109, i: 'c-plataforma', n: "Plataforma bajada", m: "Prevención de desplazamiento activada." },
      // Otros testigos que salían en la guía de antes (v196/v201) y que no están en las páginas del manual que tenemos.
      // v212: quitados los que ya salen en el manual (batería, airbag, EBS, pastillas, filtro de aire, caja de cambios, crucero, limpiaparabrisas).
        { g: 'otros', i: 'aviso-general', c: 'ambar', a: "!", n: "Aviso general", v: "Un triángulo con un signo de admiración.", s: "Hay un aviso o una avería que no es grave. La pantalla central dice cuál.", h: "Lee el mensaje de la pantalla. Puedes seguir, pero arréglalo pronto." },
        { g: 'otros', i: 'adblue-scr-fallo', c: 'ambar', a: "SCR", n: "Avería del sistema AdBlue (SCR)", v: "Un tubo de escape con un aviso, o el motor con la palabra SCR o NOx.", s: "El sistema que limpia los gases con AdBlue no funciona bien: AdBlue malo, sensor o bomba.", h: "Al taller pronto: si no se arregla, el camión limita la velocidad o la potencia." },
        { g: 'otros', i: 'regeneracion-dpf-activa', c: 'ambar', a: "REGEN", n: "Regeneración en marcha", v: "Tres rayas onduladas hacia arriba (calor del escape), a veces junto al filtro.", s: "El filtro se está limpiando: el escape va muy caliente.", h: "No pares encima de hierba, papel o cosas que ardan. No interrumpas la regeneración si no hace falta." },
        { g: 'otros', i: 'precalentamiento', c: 'ambar', a: "PRECAL", n: "Precalentamiento", v: "Dos bujías (en algunos modelos, una espiral como un muelle).", s: "El motor está calentando antes de arrancar en frío.", h: "Espera a que se apague y luego arranca. Si sigue encendido circulando, al taller." },
        { g: 'otros', i: 'agua-combustible', c: 'ambar', a: "AGUA", n: "Agua en el gasoil", v: "Un surtidor o filtro con gotas de agua.", s: "Hay agua en el filtro separador de gasoil.", h: "Purga el filtro como dice el manual o al taller. El agua puede estropear la inyección." },
        { g: 'otros', i: 'eje-elevable', c: 'verde', a: "EJE", n: "Eje elevable subido", v: "Dos ruedas, una más alta, con una flecha hacia arriba.", s: "El eje elevable está subido (para ir vacío o con poca carga).", h: "Solo informa. Baja solo si hace falta por el peso." },
      ],
    },
  ];
  const COLOR = { rojo: "Rojo: para", ambar: "Ámbar: revisa pronto", verde: "Verde: informa", azul: "Azul: informa" };
  const GRUPOS = { rojo: "Avisos rojos de la pantalla", amarillo: "Avisos amarillos de la pantalla", cuadro: "Testigos del cuadro", otros: "Otros, sin comprobar" };
  // Lo que dice el manual (pág. 70) para todos los avisos rojos
  const ROJO = { h: "Detenga el vehículo inmediatamente con suma precaución. Aparque el vehículo en un lugar seguro y pare el motor. Acuda lo antes posible a un taller de servicio DAF para reparar la anomalía.", nota: "Los avisos de color rojo solo se pueden suprimir con el freno de estacionamiento accionado." };
  // Lo que dice el manual (pág. 75) para todos los avisos amarillos
  const AMARILLO = { h: "Podrá proseguir el viaje, pero deberá tomar las medidas apropiadas en la primera oportunidad que se presente para subsanar la anomalía. Acuda lo antes posible a un taller de servicio DAF para reparar la anomalía.", pre: "Es posible que el vehículo se comporte de forma diferente a la habitual con un aviso de color amarillo; por tanto, conduzca el vehículo con especial precaución." };
  /* fin textos */
  window.TestigosDatos = { MARCAS, COLOR, GRUPOS, ROJO, AMARILLO };

  const $ = (i) => document.getElementById(i);
  if (!$("v-testigos")) return;
  // v201: el dibujo de cada testigo sale de testigos-iconos.js (SVG fijos del archivo, nunca datos del usuario)
  const ICONOS = window.TestigosIconos || {};
  const KEY = "ccoo-testigos";
  let marca = null, grupo = "";
  try { const g = JSON.parse(localStorage.getItem(KEY) || "{}"); if (MARCAS.some(m => m.id === g.m)) marca = g.m; } catch (e) { /* sin datos */ }
  const guarda = () => { try { localStorage.setItem(KEY, JSON.stringify({ m: marca })); } catch (e) { /* sin almacenamiento */ } };
  const normal = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  // v211: traducible como las demás de Zona Conductores (zona-idioma.js, grupo «testigos» de la función traducir):
  // todo lo que se pinta pasa por Z.T con el texto en español tal cual está en este archivo
  const Z = typeof ZonaIdioma === "function" ? ZonaIdioma("testigos", "v-testigos", () => pinta()) : { T: (x, v) => x.replace(/\{(\w+)\}/g, (m, k) => v && v[k] != null ? v[k] : m) };
  const t = (s) => esc(Z.T(s || ""));
  function pinta() {
    const m = MARCAS.find(x => x.id === marca);
    $("te-marcas").hidden = !!m;
    $("te-carpeta").hidden = !m;
    if (!m) {
      $("te-marcas").innerHTML = MARCAS.map(x => `<a class="panel desc-promo cond util te-marca" href="#testigos" data-m="${esc(x.id)}">${icono("carpeta")}<span><b>${esc(x.n)}</b><small>${t(x.sub)} · ${esc(Z.T("{n} testigos", { n: x.t.length }))}</small></span>${icono("der", "p")}</a>`).join("");
      return;
    }
    $("te-nombre").textContent = m.n;
    $("te-sub").textContent = Z.T(m.sub);
    $("te-colores").innerHTML = [["", Z.T("Todos")], ...Object.entries(GRUPOS).map(([k, v]) => [k, Z.T(v)])].map(([k, v]) => `<button type="button" class="zc-chip${k === grupo ? " activa" : ""}" data-c="${esc(k)}" aria-pressed="${k === grupo}">${esc(v)}</button>`).join("");
    const q = normal($("te-busca").value.trim());
    const l = m.t.filter(x => (!grupo || x.g === grupo) && (!q || normal([x.num, x.a, x.n, x.m, x.nota, x.pre, x.v, x.s].map(s => s == null ? "" : `${s} ${Z.T(String(s))}`).join(" ")).includes(q)));
    $("te-cuenta").textContent = Z.T("{a} de {b} testigos", { a: l.length, b: m.t.length });
    $("te-lista").innerHTML = l.length ? l.map(tarjeta).join("")
      : `<div class="zc-aviso">${esc(Z.T("No hay ningún testigo que coincida. Prueba con otra palabra (freno, AdBlue…) o con el número del cuadro."))}</div>`;
  }
  // Cada texto en su propio elemento (la etiqueta en <b>, el texto en <span>) para que se traduzcan por separado
  const linea = (et, txt) => txt ? `<p><b>${esc(et)}</b> <span>${t(txt)}</span></p>` : "";
  function tarjeta(x) {
    const ico = `<span class="te-icono" aria-hidden="true">${ICONOS[x.i] || ""}</span>`;
    if (x.g === "rojo" || x.g === "amarillo" || x.g === "cuadro") {
      const sub = x.g === "rojo" ? Z.T("Aviso rojo en la pantalla: para") : x.g === "amarillo" ? Z.T("Aviso amarillo en la pantalla: sigue con precaución") : x.num ? Z.T("N.º {n} en el cuadro", { n: x.num }) : Z.T("Indicador del cuadro");
      // v212: «h» vacío ("") = el propio texto del manual ya dice qué hacer
      const hacer = x.h != null ? x.h : x.g === "rojo" ? ROJO.h : x.g === "amarillo" ? AMARILLO.h : "";
      return `<article class="panel te-item ${x.g === "cuadro" ? "manual" : x.g}">${ico}
      <div><h3>${t(x.n)}</h3><p class="te-color">${esc(sub)}</p><p class="te-comp">${esc(Z.T("Comprobado en manual DAF, pág. {p}", { p: x.p }))}</p>
      ${x.m ? linea(Z.T("Qué dice el manual:"), x.m) : `<p>${esc(Z.T("El manual solo da el nombre de este testigo."))}</p>`}
      ${linea(Z.T("Precaución del manual:"), x.pre || (x.g === "amarillo" ? AMARILLO.pre : ""))}${linea(Z.T("Qué hacer:"), hacer)}${linea(Z.T("Nota del manual:"), x.nota)}</div></article>`;
    }
    return `<article class="panel te-item ${esc(x.c)}">${ico}
      <div><h3>${t(x.n)}</h3><p class="te-color">${t(COLOR[x.c])}</p><p class="te-comp">${esc(Z.T("Sin comprobar en el manual"))}</p>
      ${linea(Z.T("Cómo se ve:"), x.v)}${linea(Z.T("Qué significa:"), x.s)}${linea(Z.T("Qué hacer:"), x.h)}</div></article>`;
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
