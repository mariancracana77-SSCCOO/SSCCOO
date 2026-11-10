# Web Sección Sindical CCOO Calsina Carré

- Web para los trabajadores: https://mariancracana77-ssccoo.github.io/SSCCOO/
- Panel para publicar: https://mariancracana77-ssccoo.github.io/SSCCOO/admin.html

## Qué tiene la web
- **Inicio**: el aviso más importante, **novedades** (lo último que se ha subido en cualquier sección), próximas fechas y accesos rápidos.
- **Avisos**: buscador, filtros, urgentes en rojo, fijados arriba y archivos adjuntos (PDF, fotos, Word…).
- **Calendario**: vista de mes con un color por tipo. Al tocar un día se ve lo que hay.
- **Convenio**: apartados que se abren al tocarlos, con buscador.
- **Actas**: por año, con resumen, acuerdos y archivos.
- **Documentos**: todos los archivos (convenio en PDF, tablas, formularios…) con su tipo, tamaño y fecha de subida.
En todo se ve cuándo se publicó y cuándo se actualizó. Si alguien tiene la web abierta cuando se publica algo, le sale un aviso al momento.

## Cómo publica tu padre (panel)
Entra en `admin.html`. En el móvil, abajo: Inicio, Avisos, Calendario, Actas y «Más» (Convenio, Documentos, Textos, Ajustes). En el ordenador, todo en la barra de la izquierda.
- Botón rojo **+** (o «Nuevo…») para crear. Al tocar algo de la lista se abre para **editarlo**: arriba pone claramente «Nuevo aviso» o «Editando aviso» y el título.
- Pestaña **Vista previa**: cómo lo verán los trabajadores, antes de publicar.
- **Archivos**: toca la zona de archivos y elige uno o varios (PDF, fotos, Word, Excel, PowerPoint; máx. 20 MB cada uno). Se ven en una lista antes de publicar; los marcados en rojo no se pueden subir y explican por qué.
- Si cierra sin guardar, el panel pregunta antes de perder los cambios.

Para dar formato al texto: línea en blanco entre párrafos; `- ` al principio de la línea para listas; `**así**` para negrita.

## Archivos (no hace falta tocarlos)
`index.html`, `app.js` (web) · `cartel.html` (cartel QR) · `qr.js` (códigos QR, librería qrcode-generator, licencia MIT) · `admin.html`, `admin-*.js` (7 partes), `admin.css` (panel) · `render.js` (piezas comunes) · `styles.css` · `config.js` (conexión con Supabase) · `iconos.js` · `manifest.json`, `sw.js` (para instalarla como app) · `logo.png`, `icon-*.png` · `_config.yml` (deja fuera de la web la documentación)

Nota para leer el historial de abajo: lo más nuevo está en «Versión 157» y siguientes, después de «Novedades de la versión 9». Los apuntes antiguos hablan de `admin.js`: ese archivo ya no existe; desde la versión 67 el panel está repartido en los 7 archivos `admin-*.js`. Pruebas: `pruebas/humo.cjs` (prueba rápida), `pruebas/estatica.cjs` (sin navegador: archivos, versiones y nada en línea) y `pruebas/navegador.cjs` (calendario .ics, zona horaria y service worker sin conexión).

## Ajustes (todo desde el panel, sin tocar código)
En la pestaña **Ajustes** del panel se pueden añadir, renombrar, ordenar, cambiar de color y quitar las categorías y tipos de todas las secciones (filtros de avisos, tipos de acta, tipos del calendario, categorías del convenio y de documentos).

También se añade o se quita a otros delegados que puedan publicar. La persona añadida entra en `admin.html` y pulsa «Primera vez: crear la cuenta».

## Gratis
Supabase (plan gratuito) y GitHub Pages. Supabase pausa los proyectos gratuitos si pasan 7 días sin ninguna visita; si pasa, se reactiva desde el panel de Supabase.

## Asistente de actas (gratis)
En el panel, **Nueva acta**: escribe o pega las notas, o sube una **foto de las notas a mano** o un **PDF**, y pulsa **Generar acta**. Rellena título, tipo, fecha, resumen y acuerdos; se revisa y se pulsa **Publicar**. Nunca publica solo.

Usa la IA gratuita de Google (Gemini). La clave se crea gratis en https://aistudio.google.com (botón «Get API key») y se guarda en Supabase → Edge Functions → Secrets con el nombre `GEMINI_API_KEY`.
Ojo: en el plan gratuito Google puede usar lo que se le envía para mejorar sus productos, así que no conviene poner nombres ni datos personales ni información confidencial de la empresa. Tiene un límite de usos diario, de sobra para unas cuantas actas.

## App, avisos al móvil y canales
- **Instalar la app**: en la web hay un botón «Instalar». En Android lo hace Chrome directamente; en iPhone salen los pasos (Safari → Compartir → Añadir a pantalla de inicio). No es un archivo descargado, así que **no sale ningún aviso de seguridad**.
- **Avisos al móvil**: cada trabajador pulsa «Activar avisos». Cuando se publica algo con la casilla «Avisar en los móviles y en Telegram», le llega una notificación aunque tenga la app cerrada. En iPhone hace falta instalar la app primero.
- **Telegram (automático)**: panel → Ajustes → Avisos y canales. Se crea un canal, un bot con @BotFather, se hace al bot administrador del canal y se pegan el token y el nombre. Desde ese momento todo lo nuevo se publica allí solo.
- **WhatsApp (con un toque)**: WhatsApp no permite publicar automáticamente. Al publicar, el panel ofrece «Enviar por WhatsApp» con el texto ya escrito. En Ajustes se puede poner el enlace del canal o grupo para que salga un botón «Unirse» en la web.
- **Programar avisos**: en un aviso nuevo, «Programar la publicación» con día y hora. Se publica y avisa solo (se revisa cada 10 minutos).
- **Añadir al calendario**: cada fecha del calendario tiene «Añadir a mi calendario» (con recordatorio 2 horas antes).
- **Compartir**: cada aviso tiene botones de WhatsApp y Compartir, con enlace directo a ese aviso.
- **Cartel para el tablón**: Ajustes → «Abrir el cartel para imprimir» (A4 con QR de la app y del canal de Telegram).
- **Supabase siempre activo**: la tarea de cada 10 minutos también evita que el plan gratuito pause el proyecto.

## Más funciones
- **Filtros por fecha**: en Avisos, Actas y Documentos (y en las listas del panel) se puede filtrar por año, mes o un día exacto. El buscador también entiende fechas: «12/10», «octubre», «15 de enero»…
- **Ir a un mes** en el calendario: toca el nombre del mes y elige otro.
- **Archivo**: los avisos de hace más de 3 meses pasan a la pestaña «Archivo» (se cambia en Ajustes; los fijados nunca se archivan). Al buscar o filtrar por fecha se busca también en el archivo.
- **Preguntas frecuentes**: sección propia en la web; se escriben en el panel → Preguntas.
- **Plantillas**: panel → Plantillas. Al crear un aviso nuevo, «Empezar desde una plantilla». Lo que va entre [corchetes] es lo que hay que rellenar (el panel avisa si se queda alguno).
- **Traducir**: botón en avisos, actas, preguntas y convenio. Catalán, inglés, rumano, árabe, francés y portugués. Usa la IA gratuita de Google y guarda cada traducción para no repetirla.
- **Copia de seguridad**: panel → Ajustes → «Descargar copia con archivos» (ZIP con todo) o «Solo los textos». El panel recuerda hacerla si pasa más de un mes.

## Actualizar la web (importante)
Cada vez que se cambie algún archivo, hay que subir el número de versión en **tres** sitios para que los móviles cojan la versión nueva:
1. `config.js` → `window.VERSION_WEB = "10"`
2. `sw.js` → `const VERSION = "10"`
3. En `index.html`, `admin.html` y `cartel.html`, los `?v=10` de los archivos .js y .css.
La versión que está viendo cada uno sale al pie de la web y en el panel (Ajustes y menú «Más»).

Si un móvil se queda con una versión vieja: Chrome → ⋮ → Configuración → Configuración de sitios → Todos los sitios → mariancracana77-ssccoo.github.io → Borrar y restablecer.

## Novedades de la versión 9
- **Calendario en el panel**: vista de mes con las fechas, los avisos programados y las actas. Toca un día para ver lo que hay, «Añadir fecha» ese día o «Programar aviso ese día». Toca cualquier cosa para editarla. Botón «Lista» para la vista de siempre.
- **Inicio del panel**: visitas a la web, próximos 14 días y avisos programados.
- **Visitas anónimas**: cuántos móviles distintos han abierto la web cada día y cuántas veces. No se guarda quién es nadie (ni IP, ni nombre, ni identificador).
- **Duplicar**: al editar algo, «Duplicar» crea una copia para cambiar solo lo necesario (por ejemplo, la fecha).
- **Buscar en toda la web**: lupa arriba a la derecha.
- **Delegados** y **Enlaces útiles**: salen en «Quiénes somos»; se editan en el panel. Publica teléfono o email solo si la persona está de acuerdo.

## Versión 168: ficha de normas por país en «Restricciones en mi ruta»
Lo pidió Lorena: cada país de «Restricciones en mi ruta» tiene ahora su ficha con tarjetas por tema (Peajes, Cadenas e invierno, Prohibiciones y festivos), cada una con etiquetas de peso (más de 3,5 t, más de 7,5 t) y de cuándo vale (todo el año, por fechas, según la situación), su fuente oficial y el día en que se comprobó. Arriba, botones para ver un solo tema y un buscador (país, cadenas, 3PMSF, peaje…). Las normas están en la tabla nueva `normas_pais` y el padre las edita en el panel, en «Restricciones camiones» > «Normas por país». Solo salen en la web las marcadas como «Comprobado»: se han puesto visibles las 5 confirmadas en la web oficial el 10/11/2026 (España: restricciones de la DGT; Alemania: peaje y prohibiciones de domingo y de sábados de verano; Austria: GO-Maut). Las de Francia, Suiza, Italia y el invierno de Alemania y Austria quedan ocultas («Sin comprobar») para que el padre las revise.

## Versión 167: los datos del conductor ya no se pierden con la app abierta dos veces
Lo pidió Lorena: al padre se le borraban los datos que había recuperado. La causa: Mis descansos, Mis incentivos y Mis aparcamientos leían los datos del móvil solo al abrirse, y con cualquier toque volvían a guardar lo que tenían en memoria. Si la app estaba abierta dos veces (la instalada en segundo plano y una pestaña del navegador), la ventana vieja guardaba su memoria vacía encima. Ahora cada ventana vuelve a leer los datos cuando otra los cambia (y avisa), antes de guardar comprueba que nadie los haya cambiado, guarda una copia de seguridad automática en el móvil (con un cuadro para recuperarla si la herramienta sale vacía) y pide al navegador que no borre los datos si le falta espacio. No cambia ni mueve los datos que ya hay.

## Versión 166: banderas de los países y letra más pequeña
Lo pidió Lorena: en Zona Conductores cada país sale con su bandera (restricciones para camiones, prohibiciones de circular de «Restricciones en mi ruta» y la tabla de peajes por países), dibujada en la propia web, sin emojis. En «Restricciones en mi ruta» ya no hay dos listas separadas: una sola por país (España y Cataluña primero) y, dentro de cada uno, sus prohibiciones y su web oficial. Y en «Lectura» (el botón Aa) hay una opción nueva de letra «Pequeña», más pequeña que la normal; se recuerda en ese móvil como las demás.

## Versión 165: todas las prohibiciones de circular en la web
Petición 34 del panel: las prohibiciones que se apuntan en el panel solo salían dentro de una ruta calculada y solo si te pillaban por el camino. Ahora «Restricciones en mi ruta» enseña la lista completa por país (días, horas, meses y fechas), sin tener que calcular ruta, y marca «Ahora en vigor» las que tocan en ese momento. Además, los enlaces oficiales de restricciones ya no salen al abrir Zona Conductores (lo pidió el padre): solo dentro de «Restricciones en mi ruta».

## Versión 164: «Restricciones en mi ruta» en Zona Conductores
Pestaña nueva (petición 33 del panel): pones de dónde sales y adónde llegas y calcula la ruta para tu camión (la misma que «Aparcamientos en mi ruta», gratis), pero solo enseña las prohibiciones de circular según la hora de salida, los cortes y avisos de tráfico, otras rutas y las carreteras, con los enlaces oficiales de restricciones por país debajo. Avisa de que no todos los límites de altura y peso de puentes y calles están en el mapa.

## Versión 163: Inicio en el ordenador, opción B «Institucional»

Lo eligió Lorena. Solo en el ordenador (desde 1000 px): se queda el bloque oscuro de Inicio como señal de autopista (aviso urgente con el rótulo de luces, cuenta atrás, novedades y buscador) y «Próximas paradas», como en la v160. «Lo último» sin iconos, una noticia debajo de otra. A la derecha, «Sabías que…» y «Todo lo que hay en la web» como listas de enlaces de texto (en vez de los botones con iconos de «Ir a»). Pie oscuro en columnas (contacto, «Afíliate» y lo legal), miga de pan en las páginas de dentro y sin barra roja abajo. En el móvil, «Ir a» con paneles oscuros con borde de color y los 4 más usados en grande, «Lo último» con barra de color y la app en pastilla («Señales»). La cabecera no cambia.

## Versión 162: vuelta al diseño de la v160

Lo pidió Lorena: se quita el rediseño de la v161 (portada de ordenador estilo periódico y estilos nuevos del móvil) y la web vuelve a verse como en la v160 mientras se prepara la opción B «Institucional».

## Versión 160: Mis descansos: el mismo fondo rojo suave en su barra de pestañas que Mis incentivos (lo pidió el padre, petición 32).
## Versión 159: Mis incentivos: fondo rojo suave en la barra Día · Semana · Mes · Ajustes, de día y de noche (lo pidió el padre, petición 31).
## Versión 158: revisión a fondo (pantallas, panel, código, seguridad y legal). El archivo de «Añadir al calendario» sale con horas válidas. Mejor accesibilidad: zoom al 400 %, foco visible, teclado en el calendario, Traducir y ventanas, contrastes y botones de 44 px. El panel ya no deja textos vacíos ni dice «sin permiso» cuando falla la red. Telegram y la copia de seguridad avisan si algo falla, y la copia va de 1000 en 1000. sw.js: solo borra sus cachés (antes también las del Comité), espera 4 s a la red y luego enseña lo guardado. Aparcamientos avisa si el móvil no deja guardar. Se escapa lo que llega de fuera en mapas, tarjetas e iconos. El panel no funciona dentro de otra web. Las peticiones ya no prometen «al momento» y no pierden lo escrito. «Avisar a Lorena» es solo para emergencias. Pruebas nuevas: `pruebas/estatica.cjs` y `pruebas/navegador.cjs`.

## Versión 157: vuelta a la dirección de siempre (mariancracana77-ssccoo.github.io/SSCCOO) con la marca de antes: nombre «Sección Sindical CCOO Calsina Carré», el logo con CCOO, iconos, cartel, manifest y vista previa al compartir como en la v148. Todo lo nuevo de las versiones 149 a 156 se queda igual.

## Versión 156: Horarios de la dieta, solo el cuadro (petición 25 del panel): se quita el ayudante «¿Qué me toca?» y el título del cuadro pasa a «Cuándo se cobra cada parte de la dieta internacional». La tabla y la regla del festivo siguen igual.

## Versión 155: Horarios de la dieta en «Mis incentivos» (petición 25 del panel, opciones B + C): en «Día» sale un cuadro plegable «Cuándo se cobra cada parte de la dieta» con la tabla de dormir, desayuno, comida y cena, la regla del festivo (100 % o 50 %) y el ayudante «¿Qué me toca?» (hora de salida, de llegada y horas de conducción → qué partes tocan y el festivo). Solo informa: no marca ni guarda nada. El padre puede cambiar la tabla en el panel, Textos → «Horarios de la dieta» (`paginas.horarios_dieta`); vacío = la tabla de siempre.
## Versión 154: Festivos con bandera (petición 24 del panel): los festivos que en «Lugar» pone España llevan la bandera de España y los de Cataluña/Catalunya, la senyera, dibujadas con CSS, en la casilla del día, en el detalle del día y en «Próximas fechas». Los festivos ya estaban apuntados (de octubre de 2026 a diciembre de 2027): no cambia datos.

## Versión 153: Calendario más bonito (petición 23 del panel): en la vista Mes, el número de semana va en una pastilla gris pizarra con el número en blanco (no en rojo, como pidió; la semana de hoy, más oscura y con un aro) y los días con algo apuntado (huelga, festivo, asamblea, reunión…) salen teñidos con el color de su tipo, con una barra abajo y marcas más grandes en vez de un puntito. Solo diseño: no cambia datos ni el panel.

## Versión 152: «Borrar toda la semana» en Mis incentivos (pestaña Semana): botón separado abajo, solo si esa semana tiene algo apuntado; pregunta dos veces dentro de la página (con «Antes, guardar mi copia (PDF)» y «Cancelar») y borra solo esos 7 días (importes, días libres y fotos de la hoja); después sale «Semana borrada · Deshacer» durante 12 segundos. Las demás semanas no se tocan. Va también la herramienta del plan B (`herramientas/plan-b.sh`).
## Versión 151: recuperar fácil los datos de la app antigua en Mis descansos, Mis incentivos y Aparcamientos en mi ruta: si están vacíos, arriba sale el cuadro «¿Usabas la app antigua? Recupera tus datos» con los pasos (modo avión, copia en PDF en la app antigua, «Recuperar una copia» aquí) y un botón grande (con «No lo necesito: ocultar»); el mismo cuadro, plegado, siempre en Ajustes (en Aparcamientos, dentro de «Mis aparcamientos»). Botón «Guardar mi copia ahora» arriba si nunca se ha guardado copia o hace 7 días o más (siempre en Ajustes); la fecha de la última copia se guarda en el móvil (`ccoo-copia-*`). Mis descansos ya no sustituye lo que hay al recuperar: añade los apuntes que faltan (como ya hacían Mis incentivos y Aparcamientos). Va también la documentación de la opción A (sin GitHub en los avisos, sin ramas respaldo).

## Versión 150: web sin marca en la cuenta nueva (sindicatocc20-gif.github.io/sindicatocc): nombre «Sindicato CC» en títulos, cabecera, panel, cartel, manifest y vista previa al compartir; el mismo logo de siempre, pero sin «CCOO», sin el nombre de la empresa ni el correo: arriba «Sección sindical» y abajo «Sindicato CC» (lo pidió el padre); el camión con «CC» se queda. Las claves internas que guardan los datos de los conductores en el móvil no cambian.

## Versión 149: en Mis descansos > Lo apuntado, todo va por semanas (propuesta E): cada semana con las horas trabajadas, los reducidos usados y el semanal, una tabla día · trabajo · descanso después, y las semanas pasadas plegadas. Sustituye a los relojes de la v147 (petición n.º 18)

## Versión 148: en Mis incentivos > Semana, «Todas las semanas» y «La semana pasada…» van en una caja con fondo suave para distinguirlas del resto (petición n.º 19)

## Versión 147: en Mis descansos > Lo apuntado, cada jornada es un reloj de 24 h (trabajo en gris y el descanso de después en su color, con las horas trabajadas en el centro), dos o más por fila (petición n.º 18, propuesta F)

## Versión 146: en Mis incentivos > Semana, la lista «Todas las semanas», una debajo de otra con lo ganado (la más reciente arriba; al tocar una se abre; petición n.º 17 del padre)

## Versión 145: en «Lo apuntado», las jornadas con la cabecera en gris y sus horas de trabajo, y el descanso de después en su propia franja de color (para que no parezca que esas horas son el descanso; petición n.º 16 del padre)

## Versión 144: «Lo apuntado» de Mis descansos más claro (propuesta A «Tarjeta con color»: cabecera verde, naranja o roja con las horas en grande, «Empieza» y «Termina» en dos líneas, etiquetas y el aviso en una caja; petición n.º 15 del padre)

## Versión 143: Mis descansos más fácil (propuesta C «Línea del día»: «Te quedan» en grande, línea de la jornada y días que quedan para el semanal; petición n.º 14 del padre)

## Versión 142: Mis incentivos, la semana con la hoja de trabajo en un solo PDF y preguntar dónde guardarlo (petición n.º 13 del padre)

## Versión 141: calendario por mes o por año (petición n.º 12 del padre)
- En Calendario, botones «Mes» y «Año». «Año» enseña los 12 meses en pequeño, con los días que tienen algo del color de su tipo y hoy marcado; las flechas pasan de año en año y al tocar un día o un mes se vuelve a «Mes» con ese día (`index.html`, `app.js` `pintaAno`, `styles.css` `.cal-ano`). El filtro «Ver:» sirve también en el año.

## Versión 140: botón «Marcar este día como libre» en amarillo (petición n.º 11 del padre)
- En Mis incentivos > Día, el botón para marcar un día libre sale en amarillo con letra oscura, de día y en modo oscuro (`styles.css`, `.gan-libre-btn`). Solo cambia el color.

## Versión 139: negrita, listas y fotos grandes en el chat de «Lo que has pedido» (lo pidió Lorena)
- En el chat de cada petición, lo escrito entre `**` sale en negrita y las líneas que empiezan por «- » salen como lista. Las fotos ocupan todo el ancho del mensaje y llevan su nombre debajo. Igual que en el panel del Comité.

## Versión 138: «Me gusta, adelante» en vez de «Publicar» (lo pidió Lorena)
- En «Lo que has pedido», el botón para dar el sí se llama «Me gusta, adelante» y encima pone «Si te gusta, pulsa «Me gusta, adelante». Lorena lo sube a la web.». Al pulsarlo sale «Hecho: en unos minutos lo verás en la web.». Igual que en el panel del Comité.

## Versión 137: destacar un aviso solo unas horas (petición n.º 10 del padre)
- En el editor de avisos, debajo de «Destacar en Inicio el día», hay «Desde las» y «Hasta las». Con horas, el aviso sale arriba del todo en Inicio, en rojo, solo entre esas horas, y después vuelve a ser un aviso normal en su sitio. Sin horas, sigue como antes: el día entero.
- Se guarda en `destacar_desde`/`destacar_hasta`, que ya tenían hora: no cambia la base de datos, ni la web, ni la función `notificar` (la notificación «Destacado» llega al empezar esas horas). En la lista del panel, la etiqueta dice «Destacado el … de 10:00 a 14:00». «Quitar el destacado» borra también las horas.

## Versión 136: «Confirmado por Lorena» en lo que ha pedido el padre (lo pidió Lorena)
- En «Lo que has pedido», lo que Lorena ya aprobó (con su visto bueno o ya publicado) sale aparte en el grupo verde «Confirmado por Lorena». Ahí no le pide decidir ni sale en «Te toca a ti»: pone «Lorena dijo que sí: subiéndose» o «Ya está en la web».
- Su app apunta el visto bueno en la petición (`ficha.visto_bueno_lorena`) al pulsar «Bien, publícalo». Lo descartado o deshecho va a «Cerradas sin cambios». Igual que en el panel del Comité.

## Versión 135: botón «Abrir el mapa» en azul (petición n.º 9 del padre)
- En Aparcamientos en mi ruta, el botón «Abrir el mapa» va relleno del azul de Zona Conductores con letra e icono blancos, de día y de noche.

## Versión 134: «Que lo siga Lorena», «Quitar de mi lista» y lo pedido agrupado (lo pidió Lorena)
- En «Lo que has pedido», las peticiones salen agrupadas con su número: «Te toca a ti» (arriba y abierto), «En marcha», «Hechas», «Pasadas a Lorena» y «Quitadas de mi lista». Cada una con «N.º» y el estado en color.
- «Que lo siga Lorena» (con confirmación): la petición sale de la lista de tu padre, le llega un aviso a Lorena y en su app sale en «Mis tareas». Cuando Lorena la marca como hecha, tu padre ve el resultado («Hecha por Lorena») y le llega un aviso.
- «Quitar de mi lista»: la guarda en «Quitadas de mi lista» (no se borra nada) y se puede volver a poner.
- En las publicadas, «No me gusta, quitarlo» (es «Volver a como estaba antes», con confirmación en la página).
- Arreglo: los filtros de «Lo que has pedido» no escondían nada desde la v128.
- Servidor: columnas `pasada_lorena`, `oculta_padre` y `hecha_lorena`; RPC `pasar_a_lorena`, `quitar_de_mi_lista` y `lorena_tarea_hecha` (esta solo para la app de Lorena); avisos al móvil de Lorena y del padre. SQL en `herramientas/sql/v134-pasar-a-lorena.sql`.

## Versión 133: las pestañas de arriba vuelven a como estaban (petición n.º 7 del padre)
- Se quita lo de la versión 131: las pestañas principales vuelven a su aspecto de antes (letra clara sobre la cabecera oscura y la elegida subrayada en rojo). Los subapartados siguen como botones rojos.

## Versión 132: el asistente de actas tapa nombres y datos antes de enviar (traído del comité)
- En «Nueva acta», antes de enviar nada a la IA de Google: en el texto (nota, Word o PDF con texto) los nombres se cambian por [PERSONA 1], [PERSONA 2]… y vuelven a su sitio en el acta; DNI, teléfonos, emails, cuentas, n.º de la Seg. Social y matrículas se quedan tapados.
- Las fotos y los PDF escaneados se tapan con el dedo antes de enviarlos («Fino», «Medio», «Gordo», «Deshacer»).
- «Nombres que se tapan siempre» (solo en ese dispositivo) y los de los delegados se tapan solos.
- Nuevo paso «Preparar y revisar»: enseña exactamente lo que se enviará, con lo tapado marcado, antes de «Enviar y hacer el acta».

## Versión 131: pestañas principales en rojo (petición n.º 5 del padre)
- Las pestañas de arriba (de Inicio a Afíliate) son botones rojos con letra blanca, como los subapartados; la elegida, blanca con letra roja. La del camión de Zona Conductores sigue azul.

## Versión 130: total de cada día en verde en el PDF de «Mis incentivos» (petición n.º 4 del padre)
- En el PDF de la semana o del mes, la línea de cada día con lo ganado («lunes, 26 de octubre: 64,88 €») sale en el mismo verde que «Total de la semana». La pantalla no cambia.

## Versión 129: avisos al móvil solo para tu padre
- En «Pedir un cambio a Claude», «Avisarme en este móvil»: le llega un aviso cuando Claude le contesta o le toca decidir algo. Solo a los móviles del panel (tabla `push_admin`, función `avisar-padre`, disparador `peticiones_avisa_padre`), nunca a los de los trabajadores.
- En la web, un móvil que solo activó los avisos del panel no se apunta a los de los trabajadores, y apagar los de la web no apaga los del panel.

## Versión 128: tu padre ve en el panel lo que ha pedido y lo que se ha hecho
- «Lo que has pedido»: cada petición plegada con su título, estado, «Te toca a ti» y «N mensajes nuevos»; «En marcha» / «Terminadas» / «Todas», buscador y «Ver las más antiguas»; dentro, «Lo que ha hecho Claude» (columna `peticiones_claude.ficha`).
- CLAUDE.md: medidor, vuelta automática, chats que no se borran, turno entre sesiones, modo alerta, revisor barato y subir de modelo si lo barato falla.

## Versión 127: PDF de «Mis descansos» con los descansos en azul (petición n.º 2 del padre)
- En el PDF, cada jornada lleva su descanso en otra línea, en azul y más grande («Descanso después: 11 h · descanso diario normal»), y cada descanso semanal igual («Descanso: 62 h · normal»). Un poco de aire entre unas y otras. Los avisos siguen en rojo.

## Versión 126: Zona Conductores con el azul del camión (petición n.º 3 del padre, segunda parte)
- Todo Zona Conductores (pestaña del camión, subapartados Mis descansos, Mis incentivos y Aparcamientos en mi ruta, tarjetas y raya del título) con el azul de la cabina del camión de Calsina de la foto del padre; se quita el morado.

## Versión 125: el padre ve las fotos y decide antes de publicar (lo pidió Lorena)
- Antes de publicar lo que pide el padre, Claude le deja en el chat de la petición las fotos de cómo queda y tres botones: «Publicar», «Añadir algo o mejorarlo» y «Descartar» (pregunta antes si está seguro).
- En «Pedir un cambio a Claude», las fotos de cada mensaje (las que manda el padre y las capturas que pone Claude de lo que ha hecho) se ven dentro del chat; al tocarlas, se abren en grande.

## Versión 124: morado dentro de Zona Conductores (petición n.º 3 del padre)
- Los apartados de dentro de Zona Conductores (Mis descansos, Mis incentivos, Aparcamientos en mi ruta: botones, tarjetas y raya del título) pasan de azul a morado. La pestaña camión sigue azul.

## Versión 123: dedo en el camión de Zona Conductores (petición n.º 1 del padre)
- En la pestaña camión de Zona Conductores, un dedo pequeño en un círculo crema que hace un toque suave; no sale cuando ya estás dentro.

## Versión 122: volver a como estaba antes (lo pidió Lorena)
- En «Pedir un cambio a Claude», cada petición ya publicada tiene «Volver a como estaba antes»: Claude quita ese cambio de la web, con copia antes, y avisa a Lorena.
- «Avisar a Lorena» sale ahora en todas las peticiones.

## Versión 121: cada petición es como un chat (lo pidió Lorena)
- En «Pedir un cambio a Claude», cada petición enviada tiene «Añadir algo a esta petición» (texto, fotos o vídeos): lo añadido y lo que contesta Claude salen debajo, como un chat, sin crear otra petición.
- Si Claude no hace una petición (va contra las condiciones de Lorena o no se entiende), sale «Avisar a Lorena», que le manda un aviso al móvil.
- Consejos encima del formulario y aviso cuando Claude está en pausa.

## Versión 117: el panel avisa a Claude al momento
- Al enviar en «Pedir un cambio a Claude», el panel deja un comentario corto (sin el texto) en una pull request «buzón» de GitHub que nunca se fusiona; eso despierta a Claude. Si no se puede, queda la revisión de cada hora. Ya no hace falta el timbre.

## Versión 116: copias de seguridad completas (lo pidió Lorena)
- Copia automática cada domingo dentro de Supabase (las 8 últimas). La copia del panel (Ajustes) ya lleva también delegados, enlaces, encuestas, peajes, prohibiciones, aparcamientos de los conductores y peticiones a Claude (con sus archivos), y enseña cuándo fue la última copia automática.

## Versión 115: el PDF de «Mis descansos» con colores (lo pidió el padre)
- Como el de «Mis incentivos»: banda roja arriba, cada apartado con su franja oscura y colores fijos (verde = bien, naranja = reducido, rojo = atención o por compensar, azul = información), con la leyenda arriba.

## Versión 114: «Pedir un cambio a Claude» en el panel (lo pidió Lorena para su padre)
- Página del panel (también en el Inicio) para escribir o dictar un cambio y añadir fotos, vídeos o audios. Claude lo mira al tocar el timbre (página de Claude) o en la revisión de cada hora, lo deja hecho y avisa a Lorena; no se publica sin su «publica».

## Versión 113: las dietas festivas se distinguen (lo pidió el padre)
- En «Mis incentivos», las dietas festivas llevan junto a «Nacional» la etiqueta roja «Festivo» con un calendario, la fila en rojo suave y, en su grupo, un sello de calendario en la cabecera. Así no se confunden con las normales.

- La pestaña Zona Conductores pasa a ser un camión como el de Calsina (lo pidió el padre, con una foto de su web): remolque azul con chapas y letras crema, tres ejes atrás y cabeza tractora crema con la parte de abajo azul. El azul de toda Zona Conductores pasa a ser el de Calsina.

- Aparcamientos: se puede quitar lo dicho («Lo has confirmado · quitar»; en «Decir qué tiene», cambiar la respuesta o elegir «No lo sé» borra la de antes). La ventanita del mapa ya no se sale de la pantalla ni queda tapada por los botones.

- Mis aparcamientos: al borrar uno que propusiste, se quita también del mapa de todos (solo desde el móvil que lo propuso; los enviados antes de esta versión se quitan desde el panel).

- «Decir qué tiene»: botón «No tiene nada: solo aparcamiento» (la tarjeta pone «Solo aparcamiento») y casilla de plazas (con botones «unas 5, 10, 20…» para no tener que contar; sale lo que diga la mayoría como «unas N plazas»; se puede cambiar o quitar). «¿Algo está mal?» pregunta siempre las plazas.
- La pestaña camión, más realista y como la foto del padre, sin «CC».

## Versión 112: la pestaña Zona Conductores es un camión (lo pidió el padre)
- Como el camión del logo: caja azul con «CC» y el nombre, cabina y ruedas. La elegida va sobre una carretera blanca.

## Versión 111: aparcamientos de los conductores y Zona Conductores en azul (lo pidió el padre)
- En cada aparcamiento: «Lo confirmo: está bien» y «Decir qué tiene» (aseos, duchas, vigilado, bar o restaurante). Sale enseguida a todos; manda la mayoría.
- Zona Conductores en azul (el del camión del logo): la pestaña de arriba, los botones de dentro y las tarjetas.
- Panel: los campos opcionales de texto vacíos ya se guardan (antes había que escribir algo).
- Lo que un conductor propone en el mapa sale enseguida a todos, sin aprobarlo. En el panel («Aparcamientos de los conductores») se puede poner en «Rechazado» para quitarlo, y el Inicio avisa de los nuevos desde la última vez que se miró.

## Versión 110: «Borrar ruta»

- En «Aparcamientos en mi ruta», el botón **«Cambiar ruta» pasa a ser «Borrar ruta»** (lo pidió el padre): quita la ruta calculada y el destino, y deja el formulario listo para escribir otra. El origen y las medidas del camión se quedan, y la ruta borrada se puede volver a abrir con «Abrir la última ruta».

## Versión 109: la Plaça destaca en «Mis incentivos»

- **Plaça** (lo pidió el padre): nuevo concepto de la tabla de la empresa (12,53 € por día; 13,49 € desde 2027), al final de «Otros pluses». Se ve como una plaza de aparcamiento: señal azul con la P y la fila en azul claro con el borde azul, en «Día» y en «Ajustes». También se añadió la **Nacional Festiva** (dieta completa y fraccionada) de la misma tabla. Los conceptos están en Supabase (`tarifas_conductor`); el estilo va por el nombre (`esPlaza` en `ganancias.js`).

## Versión 108: mejoras de los mapas (lo pidió el padre)

- **Dónde te toca parar.** Al calcular la ruta, sale en qué kilómetro y a qué hora tocan la pausa de 45 minutos (cada 4 h 30 de conducción) y el descanso diario (después de 9 h, o de 10 h si se marca), con los 3 aparcamientos más cercanos antes de cada parada. Si ya has conducido hoy, se pone en «¿Ya has conducido hoy?». Las horas de llegada de todos los aparcamientos ya cuentan las pausas.
- **¿Algo está mal en este aparcamiento?** En cada aparcamiento hay un enlace para avisar a la sección de que ya no existe, de que no se puede aparcar con camión, de que tiene otras plazas o de otra cosa. Se envía sin saber quién lo manda. En el panel («Aparcamientos de los conductores»), al ponerlo en «Aplicado» se corrige para todos: se quita, se cambian las plazas o la nota sale como «Aviso de la sección».
- **Prohibiciones de circular.** Si el día del viaje alguna prohibición pilla al camión en un país por donde pasa, sale un aviso con las horas. Las prohibiciones se editan en el panel («Prohibiciones de circular»). Están puestas las de cada semana de Alemania, Austria, Suiza, Francia e Italia, que hay que revisar, y faltan los festivos.
- **Última ruta sin cobertura.** La última ruta calculada se guarda en el móvil y se abre con «Abrir la última ruta», aunque no haya internet.
- **Copia de «Mis aparcamientos».** Se guarda en PDF y se recupera en otro móvil con «Recuperar una copia».

## Versión 107: «Aparcamientos en mi ruta» deja de estar en pruebas

- Fuera el aviso «En pruebas» arriba de la sección y la etiqueta «En pruebas» de su tarjeta en Zona Conductores (lo pidió el padre).

## Versión 106: añadir aparcamientos desde el mapa

- **«Añadir aparcamiento» en el mapa** de «Aparcamientos en mi ruta» (lo pidió el padre). El conductor toca el sitio en el mapa (o usa su posición) y le pone nombre, plazas, vigilado, duchas, aseos y una nota.
- **Se guarda en su móvil**, en «Mis aparcamientos», y sale con un pin azul en el mapa, en la ruta y durante el viaje. Desde la lista se ve en el mapa, se lleva con «Llevarme aquí» y se borra.
- **Si marca «Proponerlo también a los compañeros»**, llega al panel sin saber quién lo manda. Está en «Aparcamientos propuestos», dentro de Zona Conductores, y en el Inicio sale una banda con los que faltan por revisar. Cuando el padre lo pone en «Aprobado», sale a todos los conductores.
- Tabla `aparcamientos_compas` y función `proponer_aparcamiento`. La función comprueba que el sitio esté en Europa y que no lleve emails ni teléfonos. Admite como mucho 30 propuestas al día y no repite un sitio que ya se ha propuesto.

## Versión 105: nocturnidad en horas y minutos

- **La nocturnidad se apunta en horas y minutos**, como el ADR (lo pidió el padre; las horas sindicales siguen igual): dos casillas, horas arriba y minutos abajo. Se siguen guardando en horas (20 minutos = 0,333 h), así que lo ya apuntado se ve igual (2,5 h sale como «2 h 30 min») y el importe es el mismo. La guía rápida lo cuenta.

## Versión 104: el calendario del panel, en su día

- **Arreglo**: en el calendario del panel los días salían corridos una columna (el lunes 23 de noviembre aparecía debajo de la V). Pasaba desde la v84, cuando el calendario de la web ganó la columna con el número de semana: el del panel usaba los mismos estilos sin esa columna. Ahora el panel tiene sus 7 columnas (`.cal-7` en `admin.css`). Lo avisó el padre.

## Versión 103: quitar el destacado de un aviso

- **Botón «Quitar el destacado»** en el editor de avisos, junto a «Destacar en Inicio el día» (lo pidió el padre: no lo podía quitar). Borra el día y desmarca «Urgente» de una vez; luego se guarda.
- **El aviso destacado ya no desaparece de «Lo último»** (lo pidió el padre: que no se quite nada): sale arriba en Inicio y también en su sitio.
- Si se borra el día a mano y no se toca la casilla «Urgente», al guardar el aviso deja de ser urgente (antes se quedaba urgente para siempre, porque el día destacado lo había marcado).

## Versión 102: destacar un aviso un día, avisos que se repiten hasta una fecha y días libres

- **Avisos: «Destacar en Inicio el día»** (lo pidió el padre). Sustituye a «Destacar desde / hasta» de la v101: el aviso se ve en la web como siempre y solo ese día (de 0:00 a 23:59) sale destacado en rojo arriba del todo en Inicio. Al guardar con ese día, el aviso se marca como urgente; el resto de días sale como un aviso normal. «Fijar» ya no depende de la fecha.
- **Avisos que se repiten: «Repetir hasta» y «Cada día»** (lo pidió el padre): se elige el último día en que se publica (vacío = siempre) y hay una frecuencia nueva, cada día. La vista previa dice cuándo sale la próxima vez o que ya terminó; en la lista sale «Terminado».
- **«Mis incentivos»: día libre** (lo pidió el padre): en «Día», «Marcar este día como libre (no he trabajado)»; en «Semana» sale «Libre» en vez de «Sin apuntar», y en el PDF de la semana «Días libres: …». Va también en la copia y en la guía rápida.
- **Aviso a todos los móviles el día que un aviso sale destacado** (lo pidió el padre): ese día llega «DESTACADO HOY: …» a todos los móviles y a Telegram, una sola vez, aunque el aviso sea antiguo. Si se cambia el día, se vuelve a avisar ese nuevo día. Función `notificar` v7 (copia en `herramientas/funciones/notificar.ts`) y columna `comunicados.destacado_avisado` (el historial no la apunta).
- **«Mis incentivos»: banderas en «GB-CG-MA»** (lo pidió el padre: es más fácil de entender): Reino Unido, Suiza y Marruecos en la franja del grupo y en cada fila (en las filas solo las banderas, porque el texto no cabe).
- **«Semana»: sin los kilómetros de cada día** (cargaba mucho la lista); el total de la semana sigue arriba.
- Supabase: `avisos_recurrentes.hasta` (date), frecuencia `diaria` (nueva regla `avisos_recurrentes_frecuencia_v102`) y `publicar_recurrentes()` con las dos cosas.

## Versión 101: destacar un aviso unos días sin que desaparezca

- **«Destacar desde / hasta» en los avisos** (lo pidió el padre: al programar un aviso para destacarlo la semana que viene, desaparecía de la web hasta ese día). Ahora, en el editor de avisos, debajo de «Urgente» y «Fijar», hay dos fechas: el aviso se ve siempre en la web y solo sale urgente (en rojo, arriba) o fijado entre esas fechas. «Programar la publicación» sigue sirviendo para esconderlo hasta un día, y su ayuda lo explica.
- Si se pone fecha en «Programar la publicación» a un aviso que ya se ve en la web, el panel pregunta antes de esconderlo y recuerda que existe «Destacar desde».
- En la lista del panel, el aviso lleva la etiqueta «Destacado desde el … hasta el …».
- Supabase: columnas `destacar_desde` y `destacar_hasta` en `comunicados` (migración `comunicados_destacar_fechas`).

## Versión 100: kilómetros en «Semana» de «Mis incentivos»

- **Kilómetros de la semana arriba del todo** (lo pidió el padre), justo debajo de «Esta semana … €», como en el mes.
- **Cada día lleva sus kilómetros y los acumulados de la semana**: «589 km · llevas 1232 km esta semana».

## Versión 99: kilómetros en «Mes» de «Mis incentivos»

- **Kilómetros del mes** (lo pidió el padre): en «Mes» sale una cifra con el total de kilómetros apuntados (la suma de todas las semanas) y, en «Por semanas», los kilómetros de cada semana. El PDF del mes lo dice también en «Cuentas del mes».

## Versión 98: Ajustes de «Mis incentivos» como «Día»

- En «Ajustes» > «Lo que cobras tú», las etiquetas «Nacional», «Internacional» y «GB-CG-MA» salían estiradas a todo el ancho y con la bandera encima del texto (lo vio Lorena). Ahora son pequeñas, en una línea, y los grupos de dietas van en su caja con la franja y la bandera, igual que en «Día».

## Versión 97: bandera de España en lo nacional

- **«Mis incentivos»: lo nacional lleva la bandera de España** (lo pidió el padre, como lo internacional lleva la de la Unión Europea): franja clara con la bandera a la derecha y una línea roja debajo en «Dieta fraccionada nacional» (sobre fondo rojo la bandera no se veía), etiqueta «Nacional» blanca con borde rojo y la banderita y, en «Dieta completa nacional», la raya de la izquierda con los colores de la bandera.

## Versión 96: las guías rápidas se traducen

- **«Aparcamientos en mi ruta»: la guía rápida se traduce** (lo pidió Lorena). Dentro de «Cómo se usa (guía rápida)» hay un selector «Idioma de la guía · Language» con los mismos idiomas que el resto (rumano, árabe, inglés, francés…). Es el mismo idioma que en «Mis descansos» y «Mis incentivos»: si se elige en uno, sale en los demás.
- **«Mis incentivos»: colores nuevos por zona** (lo pidió el padre): nacional con franja y etiqueta rojas; internacional en el azul de la bandera de la Unión Europea con su círculo de 12 estrellas amarillas (en la franja y en la etiqueta); GB-CG-MA, oscuro. «Dieta completa internacional» y «Dieta completa nacional», que van en el mismo grupo, llevan también su etiqueta y una raya de su color a la izquierda.
- **El botón «Ir» de las guías también se traduce** en las tres secciones (antes salía siempre «Ir»).
- Función `traducir` (Supabase): grupo nuevo «aparcar», que solo traduce los textos escritos como `T("…")` en `aparcar.js` (copia del código en `herramientas/funciones/traducir.ts`).

## Versión 95: botón «Ir» en las guías rápidas y guía en «Aparcamientos en mi ruta»

- **Botón «Ir» en cada paso de las guías rápidas** (lo pidió Lorena: «por si alguien no sabe»): en «Mis incentivos», «Mis descansos» y «Aparcamientos en mi ruta», cada paso de «Cómo se usa (guía rápida)» lleva un botón «Ir» que abre la pestaña que toca, baja hasta el sitio y lo marca en rojo un momento.
- **Guía de «Mis incentivos» al día**: pasos nuevos «El ADR» (horas y minutos, cobro semanal) y «Copia de seguridad»; la hoja de trabajo ya estaba.
- **Guía nueva en «Aparcamientos en mi ruta»**: calcular la ruta, pueblos con el mismo nombre, los aparcamientos y sus filtros, lista o mapa, cortes y peajes, el viaje, «Llevarme aquí» y el mapa sin ruta. Si aún no hay ruta, el «Ir» lleva al formulario.
- «Mis descansos»: la guía decía que la copia estaba en «Ajustes»; está en «Lo apuntado».
- **«Mis incentivos»: nacional, internacional y GB-CG-MA ya no se confunden** (lo pidió el padre: «Dormir», «Desayuno»… se llaman igual en los tres). Cada grupo va en su propia caja (nacional con borde rojo, internacional con franja roja, GB-CG-MA con franja oscura) y cada fila lleva su etiqueta «Nacional», «Internacional» o «GB-CG-MA». En el PDF sale «Dormir (nacional)». Los nombres del panel no cambian.
- **Guía del panel** (para el padre) al día con «Importes de Mis incentivos», «Peajes camión» y lo nuevo para los conductores.

## Versión 94: ADR en horas y minutos, hoja de trabajo de cada semana y festivo en el cobro semanal

- **«Mis incentivos»: los conceptos por minuto (ADR) se apuntan en horas y minutos** (lo pidió el padre): dos casillas, horas arriba y minutos abajo. La fila enseña el precio por hora y por minuto (0,49 € la hora · 0,0081 € el minuto) y el cálculo es el mismo: 2 h 30 min = 1,22 €. En el resumen y el PDF sale «2 h 30 min».
- **Hoja de trabajo de cada semana**: en «Semana», abajo, se hace una foto a la hoja de papel (o se elige de la galería) y queda guardada en esa semana (hasta 6 páginas). «Descargar la hoja en PDF» la pasa a PDF en A4 (una foto por página, vertical u horizontal) para imprimirla, y «Enviar» la comparte por WhatsApp. Las fotos se quedan solo en el móvil (IndexedDB `ccoo-ganancias-hojas`, no van a ningún servidor ni a la «Copia de todo»).
- **El festivo (50 €) pasa al cobro semanal** (datos en Supabase, tarifa id 19) y los textos de ayuda ya no lo ponen en la nómina.

## Versión 93: letra y botones más cómodos en toda la web y el panel

- **Arreglado: en «Mis incentivos» la pestaña Ajustes salía vacía** (sin «Lo que cobras tú» ni el calendario para descargar por días o semanas; lo avisó el padre). Venía de la v89: una variable de Ajustes se llamaba igual que la función nueva de los importes con fecha y daba error al pintar la pestaña.
- Revisión de comodidad en un móvil pequeño con letra normal y muy grande (lo pidió Lorena: hay compañeros mayores). Ningún texto por debajo de unos 13,5 px: etiquetas de los avisos, actas y documentos, rótulo de «Urgente», cuenta atrás, «Esta semana / Este mes», tira de «Mis incentivos», pestañas de «Mis descansos» y «Mis incentivos», tipos de «Próximas fechas», pie de página.
- Botones y enlaces sueltos con al menos 44 px para el dedo: «Ver todas», enlaces del pie, filtros del calendario, «Ver todos los documentos», mapa de la web en Buscar; casillas de «Mis incentivos» y del buzón más grandes.
- Panel: letras del menú de abajo del móvil más grandes (caben en 320 px) y plegables («Visitas y estadísticas», «Más formato») más fáciles de tocar.

## Versión 92: más fácil de usar (sin deslizar para cambiar de sección y aparcamientos más cómodos)

- **«Aparcamientos en mi ruta» más fácil** (lo pidió Lorena: hay compañeros mayores): al calcular la ruta, el formulario se recoge (botón «Cambiar ruta») y la página baja sola al resultado; «Empezar viaje» sale arriba; botones grandes para saltar a Aparcamientos, Cortes (en rojo si hay alguno), Peajes y Otras rutas; los aparcamientos van primero, luego cortes, peajes y otras rutas; los peajes por país, plegados. Textos más cortos.
- **Mapa más cómodo en el móvil**: más bajito; con un dedo se baja por la página y el mapa se mueve con dos dedos (sale un aviso si se intenta con uno); botón **«Pantalla completa»** para manejarlo con un dedo y «Cerrar mapa» (en rojo) para volver.
- **Se quita el gesto de deslizar a izquierda o derecha para cambiar de sección** (lo pidió el padre: al mover el mapa con el dedo te cambiaba de apartado). Ahora solo se cambia de sección tocando las pestañas de arriba. «Desliza hacia abajo para actualizar» tampoco se activa sobre un mapa.

## Versión 91: buscar y filtrar aparcamientos, «Dónde estoy» y mapa sin ruta

- **Buscar y filtrar la lista** de aparcamientos de la ruta (lo pidió Lorena): por texto (nombre, pueblo o carretera, perdona faltas) y, en «Más filtros», vigilado, duchas, aseos, solo áreas de autopista, plazas para camión (con plazas, 10, 20 o 50 o más) y tramo «del km … al km …». Se combinan con cerrados / abiertos / sin horario, valen también para el mapa y dice «Salen N de M» con «Quitar filtros».
- **Botón «Dónde estoy»** en todos los mapas: centra el mapa en tu posición (no sale del móvil).
- **Buscador de sitios encima del mapa**: pueblo, ciudad o código postal; va allí y enseña los aparcamientos a menos de 30 km. Si hay varios sitios con ese nombre, pregunta cuál.
- **Mapa de aparcamientos sin ruta**: debajo del formulario, «Abrir el mapa»; con «Dónde estoy» o buscando un sitio salen los aparcamientos de alrededor.

## Versión 90: aparcamientos de la ruta más claros y sin navegador

- **Sin navegador** (lo pidió el padre: ya usa uno de pago y quiere solo información): fuera los botones de Google Maps («Ir guiado» y «Llevarme aquí»). La ruta sirve solo para saber qué aparcamientos hay en el camino.
- **Al calcular la ruta, lo primero son los aparcamientos en tres cifras grandes: cerrados, abiertos y sin horario** (lo pidió el padre). Se toca una cifra para ver esa lista; «Ver todos» los enseña del primero al último. Se quitaron los avisos de compañeros: el padre prefiere solo información.
- **Plazas para camiones en grande en cada aparcamiento** y **fuera gratis/de pago** (el padre: los precios de OpenStreetMap fallaban y no le servían). Se buscan hasta a 3 km de la ruta (antes 1,5) y en el viaje salen más por delante.
- **Se ven todos, bajando:** al calcular la ruta sale la lista entera de la ruta (con un rótulo cada 100 km) y en el viaje todos los que quedan por delante, del más cercano al más lejano (antes solo 5 o 6). Las cifras de cerrados / abiertos / sin horario siguen filtrando.
- **Peajes aproximados para camión** (lo pidió el padre: 5 ejes, categoría de camión grande): al calcular la ruta sale el total aproximado y por país, y en cada ruta alternativa «peajes ≈ X €» para compararlas. Los precios por km de cada país están en la tabla `peajes_paises` y el padre los cambia en el panel («Peajes camión», botón en Zona Conductores). Comprobados: Austria (ASFINAG 2026), Italia (Autostrade, clase 5, 2026) y Suiza (LSVA 2025); el resto son estimaciones marcadas «Revisar». No incluye túneles, ferris ni viñetas.
- **«Llevarme aquí»** en cada aparcamiento (lo pidió el padre): abre el navegador del móvil del conductor (iGO u otro; el móvil pregunta con cuál) con ese aparcamiento de destino. En iPhone, el mapa de Apple. Sin Google.
- **Nombres de los aparcamientos** (lo pidió el padre): el de OpenStreetMap; si no tiene, el oficial de las autopistas alemanas (1.825 con nombre y plazas de camión, Autobahn GmbH, una vez al día); si tampoco, «Área en la AP-7, cerca de La Jonquera» (la vía sale de la ruta y el pueblo más cercano de OpenStreetMap, que se baja por países).
- **Cortes y avisos oficiales en la ruta** (lo pidió el padre: «como Bison Futé»): al calcular la ruta salen las carreteras cortadas, cortadas en un sentido, accidentes y restricciones de peso de tu ruta y de tu sentido, con el km; los carriles cortados, obras y retenciones, plegados debajo. También en el mapa (marcas «!») y en el viaje (los 3 próximos, y en voz si está activada). Fuentes oficiales y abiertas: DGT, Servei Català de Trànsit y Autobahn GmbH (Alemania), renovadas cada 15 min por la función `cortes`. Francia (autopistas de peaje) necesita registrarse en Bison Futé: pendiente.
- **Rutas alternativas:** además de la principal, hasta 2 más (como un navegador), con km, tiempo, si hay peajes y las carreteras principales. Se elige tocándola (o, en el mapa, tocando la línea gris) y los aparcamientos se recalculan para esa ruta.
- **Lista o mapa:** botones «Lista» y «Mapa» al calcular la ruta y durante el viaje. El mapa (OpenStreetMap) enseña la ruta en rojo y cada aparcamiento con un círculo con sus plazas para camiones (verde = abierto, gris = cerrado, negro = sin horario); al tocarlo sale su ficha. En el viaje, tu posición en azul. La librería del mapa (Leaflet 1.9.4) va alojada en `lib/` y solo se carga al abrir el mapa.
- **Código postal:** al lado de «Desde» y «Hasta» hay un campo opcional de código postal (lo pidió el padre: hay muchos pueblos con el mismo nombre). Con él sale el pueblo exacto; sin él, si hay varios con ese nombre (p. ej. «Fleuré»: Orne y Vienne), se pregunta cuál con su código postal y su región.
- **Solo los de tu sentido de marcha:** en autopista, las áreas del otro lado (a las que solo llegarías dando la vuelta) no salen. La función `ruta` devuelve ahora la ruta fina y los tramos de autopista para saber a qué lado queda cada una.

- **«Aparcamientos en mi ruta» avisa de que está en pruebas**, arriba de la pantalla y en la tarjeta de Zona Conductores.
- **Todos los aparcamientos de la ruta**, debajo de la ruta calculada, con tres botones: **Abiertos**, **Cerrados** y **Todos** (lo pidió el padre: le interesa sobre todo saber cuáles estarán cerrados). Cuenta cuántos hay abiertos, cuántos cerrados y cuántos no tienen el horario apuntado. Con **«Salgo a las…»** se calcula a qué hora pasas por cada uno (vacío = ahora).
- **Durante el viaje**, «Ver también los cerrados» enseña también los que estarán cerrados cuando llegues, marcados.

## Versión 89: importes de 2027 desde el 1 de enero y «Aparcamientos en mi ruta»

- **«Aparcamientos en mi ruta»** (nuevo en Zona Conductores, lo pidió el padre para usarlo durante el trayecto): pones adónde vas (vacío el origen = donde estás) y los datos del camión (alto, ancho, largo, peso, ADR, se guardan en el móvil). Calcula una ruta para camión (gratis, sin claves) y enseña las carreteras, los km y las horas, con «Ir guiado con Google Maps». Con «Empezar viaje», una pantalla con los aparcamientos que tienes **por delante** en la ruta, a cuántos km y a qué hora llegas, solo los **abiertos cuando llegues**; **verde** los gratis, **azul con moneda y precio** los de pago, gris si no se sabe; «Llevarme aquí» abre el Maps. Opciones: «Avisarme en voz alta» y «Solo gratis». Modo «Sin destino»: los que tienes delante en la dirección en la que vas. La pantalla se queda encendida durante el viaje.
- Los aparcamientos salen de OpenStreetMap (el mapa libre) y se renuevan solos cada mes, país por país (España, Francia, Italia, Portugal, Andorra, Alemania, Suiza, Bélgica, Países Bajos, Luxemburgo, Austria y Reino Unido). Mientras conduces, la ubicación no sale del móvil.

- **Precios con fecha en «Mis incentivos»**: cada concepto puede tener un «Importe nuevo» y «A partir del día». La calculadora usa el precio de cada día: los días de 2026 con el de ahora y desde el 1 de enero de 2027 con el nuevo, también en una semana que cruza el año (la 53) y en los PDF.
- **Tabla de dietas 2027 ya cargada**: nacional (desayuno 5,92 €, comer 16,46 €, cenar 14,22 €, dormir 14,22 €, completa 50,82 €), internacional / Unión Europea (7,34 €, 20,83 € ×3, completa 69,83 €) y GB-CG-MA / resto de países, Reino Unido y Suiza (8,29 €, 23,68 € ×3, completa 79,33 €).
- **En la app**, antes del cambio cada concepto avisa: «Desde el 1 de enero de 2027: 50,82 €».
- **En el panel** (Importes de «Mis incentivos»), dos campos nuevos en cada concepto y una etiqueta «Desde el 1 ene 2027: 50,82 €» en la lista. El año que viene: pasar el importe nuevo a «Importe» y poner el siguiente con su fecha.

## Versión 88: PDF con logo, encabezado y colores; mes entero; enviar por WhatsApp; horas sindicales en el cobro semanal

- **PDF de «Mis incentivos»**: el logo arriba a la izquierda, banda roja de encabezado («Mis incentivos · Sección Sindical CCOO Calsina Carré»), el título en grande («Semana 44 de 2026» u «Octubre de 2026») y debajo las fechas. Cada semana lleva su banda oscura con el número, el año y las fechas («Semana 44 de 2026 · del lunes, 26 de octubre al domingo, 1 de noviembre»), los días, un **resumen por conceptos** (cuántas dietas, cargas, kilómetros… y lo que suman, para comparar con lo que paga la empresa) y tres líneas de color: **azul** el cobro semanal, gris oscuro lo de la nómina y **verde** el total (lo que ganas; en rojo parecía que se perdía dinero). Una línea gris explica los colores. El logo sale también en la copia en PDF de «Mis descansos».
- **«Descargar este mes (PDF)»** en «Mes»: el mes entero, semana por semana, y al final «Cuentas del mes» con el salario, lo de la nómina, lo semanal y el total bruto.
- **«Enviar por WhatsApp u otra app»** junto a cada descarga (en «Semana» y en «Mes»): abre el menú de compartir del móvil con el PDF, para mandárselo a un delegado si algo no cuadra. Solo sale en los móviles que lo permiten.
- **Horas sindicales** pasan al grupo «Cobro semanal» (lo dijo el padre). Está cambiado en la tabla de importes del panel, así que la app ya lo cuenta así; los textos de ayuda lo dicen desde esta versión.

## Versión 87: detalles de diseño

- **Bienvenida**: el camión entero sale una vez al día; si vuelves a abrir la app antes de 12 horas, solo el logo (algo más de un segundo). Los rayos rojos del final, un poco más vivos.
- **Ceros sin barra**: las horas y cifras se leen «10:00» y no «1Ø:ØØ» (solo cambia el cero; el resto de la letra es la misma).
- **Barra de abajo** («Hablar con un delegado» y «Avisos») un poco más baja: tapa menos.
- **«Mis descansos»**: «Instala la app» y «Activa los avisos» en una sola línea, uno al lado del otro (antes eran dos tiras). «Activa los avisos» sigue siendo un solo toque.
- **«Ir a» en el PC** a tres columnas.
- **Pie de página**: el párrafo sobre la web solo en Inicio; en el resto, una línea con «Aviso legal · Privacidad · Acceso para publicar».

## Versión 86: más cómodo en el móvil (revisión de comodidad)

- **Calendario en el móvil** (web y panel): el mes va en una línea y «Hoy» y las flechas en fila debajo (antes el título se partía y los botones se apilaban).
- **Panel en el móvil**: cabecera más baja («Panel» y «CCOO Calsina Carré»): se gana casi un tercio de pantalla en cada página. El botón flotante «+ Nuevo» se esconde mientras se ve el «+ Nuevo aviso» de arriba, que hace lo mismo y tapaba la primera tarjeta.
- **Importes por minuto** (ADR): «0,0081 € por minuto (unos 0,49 € por hora)» en vez de «0,00812196 €», en la web y en la lista del panel.
- **«Mis descansos»**: a partir de la segunda visita el aviso legal sale plegado en dos líneas con «Leer el aviso completo» (el texto no cambia).
- **Ajustes del panel en PC**: «Copia de seguridad», «Archivos sin usar» y «Archivo de avisos» van a la derecha de «Avisos y canales», sin hueco.

## Versión 85: «Cobro semanal» y «En la nómina»

- El PDF de una semana se llama «mis-incentivos-semana-44-2026.pdf» y arriba del todo pone «Semana 44 de 2026» (si son varias, «Semanas 43 a 44 de 2026»).
- En «Semana» vuelve la lista de días grande, uno debajo de otro (el padre la prefiere: hay gente mayor), con el título «Semana 44» y «Ir a otra semana» plegado.
- En «Mis incentivos», los dos grupos de pago se llaman como los entiende un conductor: **Cobro semanal** (dietas, suplementos, cargas y kilómetros: lo que la empresa paga por semanas) y **En la nómina** (festivo, nocturnidad, ADR y horas sindicales: van con el salario a fin de mes). Es la columna «Periodicidad pago» de la tabla de la empresa. Cada concepto en «Día» dice a cuál va. En la tira de arriba: «incentivos» y «con el salario». La guía rápida lo explica.

## Versión 84: semanas del año y «Mis incentivos» más cómodo

- **Semana del año** (la 44, la 45…, de lunes a domingo, como en los calendarios de pared y los tacógrafos): sale en el Calendario de la web (columna «Sem.», la actual en rojo), en «Mis descansos» (en cada descanso semanal) y en toda «Mis incentivos»: «Día» (bajo la fecha), «Semana» (título, con «Ir a la semana…» para escribir el número), «Mes» (desglose «Por semanas», que lleva a cada una), el calendario para descargar (S44, S45…) y los PDF («mis-incentivos-semana-44-2026.pdf», «Semana 44 (del … al …)»).
- **Tira de totales** siempre arriba: Hoy, Semana N y el mes; tocando una cifra vas a esa vista.
- **«Semana»**: los siete días en tarjetas (con lo ganado y marcados los que tienen algo), «Esta semana», y «La semana pasada (semana 43): …» con la diferencia.
- **Ajustes**: «Al abrir Mis incentivos, enséñame: lo último que miré / Día / Semana / Mes».
- Animaciones suaves: la pantalla entra al cambiar de pestaña, las cifras que cambian dan un pequeño salto, las filas marcadas se encienden. Con «reducir movimiento» no hay ninguna.

## Versión 83: Mis incentivos, cada uno con lo suyo

- **Horas sindicales**: nuevo concepto (con la nómina). Cada persona pone su precio por hora.
- **Lo que cobras tú** (Ajustes): cada conductor puede poner su propio importe de cualquier concepto (salario con antigüedad, dietas, pluses…). Vacío = el de la tabla.
- **La nómina se mueve**: en «Mes» la nómina suma el salario, los fijos y lo que se paga con la nómina (festivo, nocturnidad, ADR, horas sindicales). En «Día» sale una línea con la nómina y lo semanal del mes, y en Ajustes el recuadro «Así queda…» cambia al momento. Los conceptos que se quitan ya no cuentan.
- **Descargar por semanas**: calendario en Ajustes para elegir semanas o días y bajar solo eso en PDF (y «Descargar esta semana» en «Semana»). Recuperar una copia añade esos días sin borrar el resto.
- Nombres como en la tabla de la empresa: Comer, Cenar, Desayunar, Festivo.

## Versión 82: «Mis incentivos»

- La calculadora de la Zona Conductores pasa a llamarse **Mis incentivos** (lo pidió el secretario). Lo apuntado en los móviles se mantiene.
- Carga o descarga internacional: la tabla dice «1.ª carga no se paga; de la 2.ª en adelante, 6 €». Ahora el conductor apunta solo las de la segunda en adelante y cada una suma 6 € (antes la calculadora quitaba una cada día, y no es así).
- Traducir: si el modelo de Gemini no contesta en 40 s se pasa al otro, y los textos se traducen en tandas a la vez (antes se quedaba esperando y no traducía nada).

## Versión 81: Mis ganancias

- Zona Conductores > **Mis ganancias**: cada conductor apunta lo que hace cada día (dieta completa o por partes, noche fuera, fin de semana, cargas, kilómetros, ADR, nocturnidad, festivo…) y ve lo que gana ese día, la semana y el mes (con el salario). Se guarda solo en su móvil, con copia en PDF y traducible.
- Los importes salen de la tabla de 2026 y se cambian en el panel: Zona Conductores > «Importes de «Mis ganancias»». Se pueden añadir conceptos nuevos, ocultarlos o poner topes (como mucho 2 fines de semana al mes) y lo que no se paga (la primera carga del día).

## Versión 80: confirmar al terminar la jornada

- Mis descansos: «Termino la jornada» pide confirmación (antes un toque sin querer la cerraba y, con menos de 10 minutos, la perdía sin avisar). Quitar un apunte, anular la jornada, borrar todo y recuperar una copia ya la pedían.

## Versión 79: panel sin botón «Nuevo» donde no crea nada

- En el panel (móvil), el botón flotante «Nuevo» ya no sale en Revisar la ortografía, Historial, Textos, Ajustes ni Archivos: tapaba los mensajes de estado.

## Versión 78: Actas de PRL

- Nuevo subapartado «Actas de PRL» dentro de PRL (creado en Supabase, slug `actas-prl`). Sus publicaciones salen con el aspecto de las actas del comité (fecha en rojo, etiqueta «Acta de PRL», «Reunión del…»). Se publican desde el panel, en «Apartados de la web».

## Versión 77: avisos claros de usos y límites

- Traducir: el menú de idiomas y cada tarjeta traducida avisan de que es traducción automática con IA, que puede tener errores y que vale el texto en español (`.menu-aviso`, `.aviso-trad`).
- Mis descansos: el aviso de que es solo una ayuda (no prueba oficial, no sustituye al tacógrafo) sube arriba de la pantalla y explica para qué sirve y para qué no; la copia en PDF lleva lo mismo.
- Función `traducir` (Supabase): reintenta con espera si Gemini da 503 o 429 y apunta cada fallo en el registro.

## Versión 76: guía de Mis descansos al día

La guía rápida explica cómo empezar con una hora anterior y cómo corregir lo apuntado con el lápiz.

## Versión 75: Mis descansos, hora de inicio anterior

En «Hoy» se puede poner la hora real a la que empezaste (si te acuerdas tarde), y cambiarla con la jornada en marcha. En la lista, el lápiz permite cambiar las horas de una jornada o de un descanso semanal ya apuntados.

## Versión 74: la bienvenida vuelve al camión plano
- Se quita el 3D: vuelve el camión del logo de lado, con el conductor dentro de la ventanilla, y el logo sale de él.
- Se mantienen los rayos rojos y las chispas al aparecer el logo y el vuelo del logo hasta la cabecera.

## Versión 73: la bienvenida no empieza con la app oculta
- Si al abrir la app el móvil aún está enseñando su pantalla de carga (página oculta), la animación espera a que se vea. Sale entera cada vez que la app arranca de cero.

## Versión 72: la bienvenida en 3D se ve entera
- En la app instalada en Android, la animación empieza cuando se quita la pantalla de carga de Android. Antes empezaba por detrás y del primer plano en 3D solo se veía un segundo.
- Por ahora la animación entera sale siempre (`BV_HORAS = 0` en `app.js`) para comprobar que se ve bien; después saldrá entera si han pasado 3 horas desde la última vez y, si no, la corta (solo el logo).
- La versión corta ya no enseña un segundo el camión antes del logo.

## Versión 71: final nuevo de la bienvenida
- Empieza con un primer plano en 3D del camión (con frontal, parabrisas, faros y techo), visto un poco de frente, con el conductor y el brazo fuera de la ventanilla. Se ve la cabina por dentro y el conductor con detalle, con una mano en un volante con grosor y el brazo que llega hasta ella; las ruedas tienen grosor. Nos mira y saluda mientras la cámara se aleja pasando por el lateral del camión hasta verlo de lado. Mete el brazo, sube la ventanilla, el camión frena y se forma el logo. La línea discontinua de la carretera ahora es blanca. Al salir el logo, rayos rojos que giran detrás y chispas con el latido (el logo es el mismo).
- Al terminar, el logo vuela hasta su sitio en la cabecera mientras la web se abre en círculo, y el logo de la cabecera da un pequeño rebote al llegar.
- La barra de carga solo sale si la web sigue cargando cuando acaba la animación. La animación dura algo más que antes (unos 5 segundos).
- Con «reducir movimiento» en el móvil, o si se toca para saltarla, desaparece fundiéndose como antes.

## Versión 70: calendario en el móvil y atajos
- En Calendario, «Las fechas, en tu calendario»: con un toque se añade el calendario de la Sección Sindical a Google Calendar, iPhone u Outlook, y las fechas nuevas aparecen solas. Lo sirve la función `calendario` de Supabase (pública, solo lo que ya se ve en la web).
- Al mantener pulsado el icono de la app: atajos a Avisos, Calendario, Mis descansos y Buzón.
- El nombre de la pestaña del navegador cambia según la sección.
- Página propia en español cuando un enlace no existe (`404.html`).
- Enlace «Saltar al contenido» para quien usa teclado o lector de pantalla.

## Versión 69: guía del panel en el menú
- En el panel, «Guía del panel» en el menú (en el PC, abajo del menú lateral; en el móvil, en «Más») abre la guía con capturas en otra pestaña.

## Versión 68: aviso de versión nueva
- Cuando se publica una versión, la web y el panel que estén abiertos (también la app instalada que el móvil deja en segundo plano) enseñan «Hay una versión nueva» con el botón «Actualizar». Al volver a la app se comprueba si hay versión nueva.

## Versión 67: el panel, en partes más pequeñas
- `admin.js` (unas 2.600 líneas) pasa a 7 archivos por temas: `admin-base.js`, `admin-sesion.js`, `admin-listas.js`, `admin-editor.js`, `admin-herramientas.js`, `admin-ajustes.js` y `admin-calendario.js`. El código es el mismo; solo cambia que el arranque espera a que estén cargadas todas las partes. No cambia nada de lo que se ve.
- La prueba rápida (`pruebas/humo.cjs`) entra también en el panel con una sesión de prueba y abre todas las páginas y editores.

## Versión 10
- **Botón «Aa»** (arriba, en la web y en el panel): tamaño de letra (normal, grande, muy grande), contraste alto y colores (automático, claro, oscuro). Se guarda en cada móvil.
- **Activar avisos** más fiable: si el navegador falla («Registration failed»), lo reintenta solo; si aun así no puede, explica qué hacer (por ejemplo, en Brave hay que activar los servicios de Google para mensajería push).

## Versión 11: diseño «Tablón»
- **Portada nueva**: arriba, el aviso urgente más reciente en rojo; debajo, todo lo nuevo mezclado (avisos, fechas, actas, documentos, convenio y dudas), agrupado en Hoy, Esta semana, Este mes y Antes.
- **Pestañas arriba** (Todo, Avisos, Fechas, Actas, Docs, Convenio, Dudas, Nosotros), iguales en móvil y ordenador. En el móvil se deslizan de lado.
- **Barra fija abajo** con «Activar avisos» (o «Avisos activados») y «Contacto».
- Se han borrado todas las suscripciones a avisos antiguas: cada persona tiene que pulsar «Activar avisos» una vez más.
- El panel no cambia.

## Versión 12: portada con más vida
- Saludo con la fecha y un resumen de la semana (avisos, actas, documentos y citas nuevas).
- **Próxima cita** (el rótulo de Inicio cuando no hay nada urgente): diseño nuevo de carretera. El título sale en un panel luminoso de autopista (letras blancas de puntos y luces rojas que parpadean en las esquinas) y, debajo, en un poste, dos señales en el rojo del logo: el lugar con los días que faltan (como los kilómetros de una señal) y el día y la hora. Prefiere reuniones y asambleas a los festivos y, si es la misma cita que la cuenta atrás, no se repite.
- **Animación de entrada**: ahora empieza cuando la página ha cargado (en la app instalada, Android tapaba los primeros segundos con su pantalla y la animación terminaba sin verse) y sale aunque el móvil tenga «quitar animaciones» (lo activa el ahorro de batería). Se sigue saltando tocándola.

## Versión 66: Inicio del panel y formularios más cómodos
- **Inicio del panel**: lo de cada día arriba (accesos, próximas fechas, avisos programados y lo último); las visitas y estadísticas, plegadas al final, solo se cargan al abrirlas. Nuevo acceso «Publicar en un apartado» (Comité, Zona Conductores…).
- **Programar con atajos**: «Mañana a las 8:00», «El lunes a las 8:00» y «Ahora (sin programar)».
- **Avisos de errores fáciles**: hora de fin antes que la de inicio en el calendario, y opciones movidas o quitadas en una encuesta que ya tiene votos.
- **Filtros rápidos** encima de cada lista: Programados, Ocultos, Urgentes, Fijados y Con cuenta atrás (solo salen los que tienen algo).
- **Volver a avisar de un cambio**: al editar un aviso, fecha, acta, documento, publicación o encuesta, casilla «Avisar otra vez de este cambio»; la notificación sale como «Cambio: …».
- **Pantalla de entrar** más limpia: los enlaces de contraseña y cuenta nueva, dentro de «¿Problemas para entrar?» (se abre solo si falla la entrada).

## Versión 65: panel más claro al publicar
- **El botón dice lo que va a pasar**: «Publicar y avisar», «Publicar sin avisar», «Programar y avisar» o «Guardar sin publicar», según lo marcado. Un aviso a los móviles no se puede retirar, así que se ve antes de pulsar.
- **Lo que falta, en el propio campo**: borde rojo y la frase debajo (por ejemplo, el título o el archivo de un documento); se quita al escribir.
- **Textos**: solo se guarda lo que has cambiado (el botón dice cuántos), cada texto cambiado pone «sin guardar» y, si te vas sin guardar, pregunta antes. Lo mismo en Ajustes con los filtros y categorías.
- **«Ver en la web»** en el editor de lo ya publicado: abre la web justo en ese aviso, publicación o encuesta.
- **Lo recién guardado** se resalta un momento en la lista para encontrarlo.

## Versión 64: más ligera y más cómoda
- **Gasta menos datos**: al volver a la web no se recarga todo si se cargó hace menos de un minuto, y los cambios internos del servidor (marcar un aviso como enviado) ya no hacen recargar a todos los móviles. Las fotos grandes se reducen al subirlas (2000 px) y los archivos se guardan un año en el móvil.
- **Bienvenida**: entera la primera vez de cada día; si se vuelve a abrir el mismo día, solo el logo (algo más de 1 s).
- **Más fiable**: si falla una sola parte al cargar, esa parte sale de la copia guardada en vez de quedarse vacía; sin conexión, los enlaces compartidos con «?…» (WhatsApp, Facebook) también abren.
- **Panel**: errores explicados en español (y, si se cierra la sesión, botón para volver a entrar sin perder lo escrito); aviso si otra persona ha cambiado lo que estás editando; al borrar sale «Deshacer» en vez de preguntar.
- **Accesibilidad**: las ventanas reciben el foco, se cierran con Escape y no se sale de ellas con Tab.
- **Mantenimiento**: `herramientas/version.py N` cambia la versión en todos los sitios; `pruebas/humo.cjs` prueba la web y el panel con datos de prueba.

## Versión 63: Mis descansos más ligero y «¿Dónde está…?»
- **Mis descansos**: solo descansos (sin conducción ni pausas), en pestañas (Hoy, Apuntar, Lo apuntado, Ajustes), guía rápida plegable y traducible, y avisos de instalar/activar en una línea.
- **¿Dónde está…?** en Dudas y en el buscador: cada sección y subapartado con su camino y botón para ir; entiende preguntas como «¿dónde está el buzón?».
- **Vista PC**: nombres de archivo enteros, texto del acceso a Mis descansos y difuminado de «Leer más» solo cuando hace falta.

## Versión 62: buscador de toda la web
- Busca también secciones y subapartados, publicaciones y archivos (por nombre o por dónde están). Cada resultado dice dónde está, lo buscado sale resaltado y hay saltos por grupo. Sin escribir nada: búsquedas útiles y el mapa de la web.

## Versión 61: «Leer más» en los textos largos
- Avisos, actas, publicaciones y fechas del calendario con mucho texto salen recortados con un botón «Leer más» (y «Leer menos»). Entero si se llega por enlace directo o buscando.

## Versión 60: Mis descansos completo (diario, conducción y pausas)
- **Hoy**: «Empiezo la jornada» dice hasta qué hora se puede trabajar antes del descanso diario (11 h, 9 h reducido —quedan N de 3—, partido 3 h + 9 h, o 9 h en 30 h con doble tripulación). Cronómetro de conducción con aviso de la pausa de 45 min tras 4 h 30 (o 15 + 30). «Termino la jornada» la apunta sola.
- **Jornadas a mano**, horas de conducción de la semana (56 h), de dos semanas (90 h) y días de 10 h (2 por semana).
- **Lo apuntado** con filtro: todo, descansos semanales, en fin de semana, entre semana o jornadas. El descanso semanal puede ser cualquier día.
- **Personalizar**: qué bloques se ven y con cuánta antelación avisa cada cosa.
- La copia en PDF incluye jornadas y conducción.

## Versión 59: colores en «Próximas fechas»
- **Calendario**: las etiquetas de «Próximas fechas» (Asamblea, Reunión, Festivo…) salen con el color que se pone a cada tipo en Ajustes, no todas en rojo.

## Versión 58: más traducciones y subapartados en rojo
- **Traducir**: también el rótulo de Inicio (lo urgente o la próxima cita), la lista «Lo último» (un botón para toda la lista) y cada fecha del calendario.
- **Mis descansos en tu idioma**: selector de idioma arriba; toda la calculadora (explicaciones, avisos y fechas) sale traducida. La copia en PDF sigue en español.
- **Avisos al móvil en tu idioma**: el idioma elegido (en Mis descansos o en «Avisos activados») hace que las notificaciones lleguen traducidas.
- **Horas por compensar**: ahora sale también el total.
- **Subapartados**: botones en el rojo del logo con letra blanca; el que estás viendo, en blanco.

## Versión 57: avisos para no perder los descansos
- **Mis descansos**: explica cuándo se pueden borrar los datos guardados en el móvil. En el navegador: al borrar el historial, en incógnito, en iPhone tras unos días sin entrar o al cambiar de móvil. En la app: al desinstalarla, borrar sus datos o cambiar de móvil. Recomienda la copia en PDF.

## Versión 56: cabecera sin cortar y subapartados más visibles
- **Idioma**: se quita el botón de idioma de arriba (en el móvil cortaba «Calsina Carré» y traducir toda la web de golpe iba lento). Se traduce cada publicación con su botón «Traducir»; el último idioma elegido sale el primero del menú.
- **Subapartados**: la segunda fila se ve más (letra blanca, borde claro, fondo propio) y, si hay más subapartados escondidos, sale una flecha roja redonda a ese lado.

## Versión 55: idioma de toda la web y colores del calendario
- **Botón de idioma** junto a «Aa»: el trabajador elige su idioma (catalán, inglés, rumano, árabe, francés, portugués, alemán, polaco o serbio) y avisos, actas, convenio, dudas y publicaciones se traducen solos al verse. Se recuerda en el móvil; franja para volver al español.
- **Calendario**: cada punto con el color de su tipo y etiquetas «Ver: Todo · Asamblea · Reunión…» que filtran.
- **Panel**: el selector de color de las etiquetas (Ajustes) y el calendario del panel enseñan el color de cada tipo.

## Versión 54: copia de descansos en PDF y editor más cómodo
- **Mis descansos**: la copia se guarda en PDF (se lee e imprime) y se puede recuperar desde ese mismo PDF (las copias .json siguen valiendo). Pantalla con márgenes, fechas que caben y menos negrita.
- **Editor del panel**: las cajas de texto crecen con lo escrito, botones «Negrita» y «Lista», ayuda de formato plegada y campos más grandes en el móvil.

## Versión 53: revisar la ortografía de todo
- Panel: botón **«Revisar la ortografía»** (Inicio y menú Herramientas). Pasa lo publicado por el corrector (Gemini gratis) en tandas pequeñas y enseña cada propuesta marcada: Aplicar, Dejar como está o Abrir. También «Aplicar todos».
- No cambia nada sin aprobarlo, no pisa un texto que haya cambiado mientras tanto y todo queda en el Historial. No toca textos legales, nombres, lugares, enlaces, emails, teléfonos ni opciones de encuestas.
- Recuerda lo ya revisado en ese navegador (localStorage `ccoo-revisado`) para no repetirlo.

## Versión 52: pestañas agrupadas, subapartados y «Mis descansos»
- **Pestañas agrupadas**: de 15 a 10 (Inicio, Avisos, Calendario, Comité de empresa, Convenio y leyes, Zona Conductores, PRL, Documentos, Nosotros, Afíliate). Lo de dentro sale en una segunda fila (Actas dentro de Comité; Convenio, Calcula, Decretos y leyes e Info laboral dentro de Convenio y leyes; Dudas dentro de Nosotros).
- **Subapartados**: en el panel, al crear un apartado, «Dónde sale en la web» (pestaña principal o dentro de otro). Menú del panel agrupado igual y buscador de secciones en «Más».
- **Mis descansos** (Zona Conductores): calculadora del descanso semanal (Reglamento 561/2006, cuadernillo de FENADISMER, II Acuerdo Marco). Datos solo en el móvil, copia en archivo y avisos al móvil (12 h y 2 h antes; 3 días antes del plazo de una compensación).
- Inicio: motivo de la próxima cita, color propio por tipo en las etiquetas, iconos de «Ir a» en rojo.
- Buscadores que perdonan faltas de ortografía. WhatsApp, Compartir y Traducir también en actas y publicaciones.
- El editor del panel ya no se corta por la derecha en ningún móvil.

## Versión 51: contraseña sin email y todos los archivos juntos
- **Códigos de rescate**: en Ajustes, «Si te olvidas de la contraseña», cada administrador genera 8 códigos de un solo uso y los guarda en papel. En la pantalla de entrar, «Tengo un código de rescate» pone una contraseña nueva al momento, sin email.
- **Poner contraseña nueva** a otro administrador desde Ajustes, «Quién puede publicar».
- Las dos cosas usan la función `cuenta` de Supabase y la tabla `codigos_rescate` (solo guarda un resumen cifrado de cada código).
- **Todos los archivos y fotos** (botón en Documentos del panel): todo lo subido en cualquier sección, con búsqueda por nombre del archivo o por título, filtros Fotos/PDF/Otros y «Abrir donde está».

## Versión 50: entrar en el panel sin bloqueos
- Ya no hay espera tras varios intentos fallidos al entrar (Supabase sigue frenando los ataques por su cuenta).
- «He olvidado la contraseña» abre una pantalla dentro de la app para escribir el código del email y la contraseña nueva. Para que el email traiga el código, la plantilla «Reset password» de Supabase tiene que llevar `{{ .Token }}`. El botón del email sigue sirviendo.
- El botón se queda parado 2 minutos tras enviar (el email gratuito de Supabase solo deja unos pocos por hora) y los avisos explican qué hacer si el enlace ha caducado.
- Ajustes: «Cambiar mi contraseña».
- Las tarjetas de Ajustes y las listas ya no se salen por la derecha con la letra grande del móvil. El mensaje del pie del editor («Revisando la ortografía…») va en su propia línea.

## Versión 44: cartel con el rojo del logo
- El cartel para el tablón (`cartel.html`) cambia los detalles amarillos por el rojo del logo (#AB1012; «Calsina Carré» en el tono claro #E0262B para que se lea sobre la cabecera oscura).

## Versión 43: avisos de encuestas, compartirlas, icono de notificación y cartel nuevo
- **Encuestas**: al publicar una se avisa en los móviles y en Telegram, como los avisos (casilla «Avisar…»; columnas `notificar`/`notificado` en `encuestas` y la función `notificar` las incluye). Cada encuesta tiene enlace directo (`#encuesta-<id>`) y botón «Compartir la encuesta» por WhatsApp.
- **Icono pequeño de las notificaciones**: `badge-96.png`, el camión del logo en blanco (Android lo pinta en un solo color; antes salía un cuadrado).
- **Cartel para el tablón** (`cartel.html`) rehecho con el estilo de la web: QR grande con el logo en el centro (nivel H, comprobado que se lee), qué ofrece la app y los pasos para Android e iPhone.
- **Próximas paradas**: la carretera pasa a rojo CCOO (con la línea blanca discontinua), paradas blancas con borde rojo y la próxima en rojo; la fecha en etiqueta roja (la autopista amarilla no gustó).
- **Guía del panel** actualizada (página aparte, con capturas, y en PDF).

## Versión 42: encuestas anónimas y más animaciones
- **Encuestas anónimas**: en el panel, «Encuestas» (pregunta, de 2 a 6 opciones, día de cierre opcional). Salen en la portada; se vota tocando una opción y se ven los resultados en barras. Al servidor solo va «+1 a esta opción» (tablas `encuestas` y `encuesta_votos`, función `votar_encuesta`): nadie puede saber qué votó cada uno. Un voto por móvil (se recuerda en el propio móvil). Cerradas, los resultados se ven 15 días más.
- **Visitas más fiables** (Inicio del panel): «móviles distintos esta semana» y «este mes» cuentan cada móvil una sola vez (antes «últimos 7 días» sumaba los móviles de cada día, y un mismo móvil contaba hasta 7 veces). Tabla `moviles_periodo` y función `contar_movil`. Además, el navegador donde está abierta la sesión del panel ya no cuenta visitas ni lecturas. Nuevo: «Desde dónde se abre (últimos 7 días)», cuántas veces desde la app instalada y cuántas desde el navegador (tabla `visitas_origen`, función `contar_origen`).
- **Buscador a mano** en la portada («Buscar avisos, actas, documentos…»).
- **Calendario del móvil**: «Añadir a mi calendario» ahora avisa el día antes y 2 horas antes (si es de todo el día, la tarde anterior).
- Más detalles: el aviso urgente lleva una tira como los paneles luminosos de las autopistas; «Próximas paradas» es una autopista vista desde arriba (asfalto, línea amarilla y señales ámbar en cada parada, con «Estás aquí» al principio); al cambiar a modo claro/oscuro el color nuevo se extiende en círculo; se pasa de pestaña deslizando el dedo a los lados; al votar sale «Gracias por participar» con una marca que se dibuja (y vibra en Android); sin cobertura sale el camión aparcado con los intermitentes y se ve lo último que se cargó (copia en el propio móvil), y al volver la conexión arranca y se actualiza solo; botón «volver arriba» con un aro que se llena según lo que se ha bajado; en «Lo último» las tarjetas de más abajo entran suaves; tocar el logo de la cabecera le da una vuelta.
- Animaciones: «desliza para actualizar» con el camión del logo; la campana se balancea cuando llega algo nuevo; la cuenta atrás corre como un marcador y la cifra que cambia gira; la línea de «Próximas paradas» se dibuja de parada en parada; el aviso urgente da un destello; al cambiar de pestaña la pantalla entra por el lado de la pestaña. Todo se desactiva si el móvil tiene «reducir movimiento».

## Versión 41: animación al abrir la app
- Al abrir la web sale una pantalla de bienvenida: el camión del logo (el mismo, sin su borde gris) llega por la carretera con las ruedas girando y un camionero saludando, frena, encoge hasta su sitio y el logo se forma a su alrededor (aro rojo que se dibuja, logo que nace del camión, latido de sello y destello). Dura unos 4 segundos; tocar la pantalla la salta. Si el móvil tiene las animaciones desactivadas, sale el logo quieto. Si algo falla, se quita sola a los 8 segundos.
- Al quitarse, las tarjetas de la portada entran una detrás de otra, y las tarjetas y botones se hunden un poco al tocarlos.
- Nuevo archivo: `camion.webp` (el camión del logo recortado).

## Versión 40: logo en alta calidad (ampliado con IA)
- El logo de siempre (mismo dibujo, relieve, colores y correo) se ha ampliado x4 con Real-ESRGAN (modelo «anime 6B», gratuito y de código abierto) a partir de la imagen que pasó la usuaria. Ahora tiene 2048 px y se ve nítido en todos los tamaños. Se rehacen todos los iconos, la tarjeta al compartir y las capturas.

## Versión 39: logo más nítido
- El logo sale ahora de una imagen original más nítida que pasó la usuaria (mismo dibujo): se recorta el círculo, se quita el fondo, se limpian los blancos y se afina. Se rehacen todos los iconos, la tarjeta al compartir y las capturas.

## Versión 38: vuelve el logo de siempre, más nítido
- Se recupera el logo original (el de la v36 y anteriores), sin cambiar el dibujo: solo más nítido, con los blancos limpios y sin el fondo grisáceo de alrededor (ahora es transparente fuera del círculo). Se quita `logo.svg`.
- Se mantienen los iconos para Android (sobre fondo oscuro), iPhone y pestaña del navegador, la pantalla de carga oscura, la tarjeta al compartir y las capturas, todo con este logo.

## Versión 37: logo nuevo, limpio
- El logo se ha redibujado en vectorial (`logo.svg`, la fuente para volver a sacar los PNG): mismo diseño (aro rojo con «Sección Sindical CCOO» y «Calsina Carré», engranaje rojo y camión azul con «CC»), pero nítido, con fondo transparente y borde blanco. Se quita el email, que en el icono no se podía leer.
- Iconos nuevos: `icon-192.png`, `icon-512.png`, `logo.png`, `icon-maskable-512.png` (para Android, sobre fondo oscuro), `apple-touch-icon.png` (iPhone) y `favicon-32.png` (pestaña del navegador). También se rehacen `og.png` y las capturas de `capturas/`.
- Al abrir la app instalada, la pantalla de carga es oscura (el mismo asfalto de la cabecera) con el logo, y la barra del navegador también es oscura (`theme_color` #15191E).
- La versión anterior de los iconos queda en la rama `respaldo-v36`.

## Versión 36: más profesional y más segura
- **Vista previa al compartir**: al mandar el enlace de la web por WhatsApp o Telegram sale una tarjeta con el logo y el nombre (`og.png`).
- **Instalar la app** en Android enseña capturas de la app (carpeta `capturas/`, en `manifest.json`).
- **Foto destacada en los avisos**: la primera foto que se adjunta sale en grande arriba del aviso y como miniatura en «Lo último»; las demás, en galería, y los documentos, en lista.
- **Verificación en dos pasos** en el panel (Ajustes > Verificación en dos pasos): con la app gratuita Google Authenticator. Si está activada, al entrar se pide el código de 6 cifras. El servidor también lo exige: `is_admin()` solo da permiso con la sesión verificada a quien la tenga activada (las cuentas sin dos pasos siguen igual).
- **Corrector de ortografía**: al guardar, los títulos y textos que han cambiado pasan por un corrector (Gemini gratis, función `corregir`). Si propone cambios, se ven marcados (verde lo nuevo, tachado lo que se quita) y se elige «Corregir y guardar», «Guardar sin corregir» o «Volver a editar». Si el corrector no responde, se guarda igual. Además, los campos de texto tienen el corrector del propio móvil activado.
- Textos: en Privacidad ya no salen los datos personales del secretario (dice que la web está en proceso y que es anónima); en Aviso legal, la nota «[COMPLETAR…]» se cambia por «web en proceso».
- Cambios: `index.html`, `manifest.json`, `og.png`, `capturas/`, `render.js`, `app.js`, `styles.css`, `admin.html`, `admin.js`, `admin.css` (y la versión en `cartel.html`, `config.js` y `sw.js`). En Supabase: función `is_admin()` y función nueva `corregir`.

## Versión 35: el rojo del modo noche, del mismo tono que el de CCOO
- El rojo de los textos en modo noche pasa de #ff4d4d (algo anaranjado) a #ff2d50: el mismo tono que el rojo CCOO (#c4122f), solo más luminoso para que se lea sobre el fondo oscuro (el #c4122f exacto se queda en 3,1:1, por debajo del 4,5:1 recomendado para texto).
- Cambios: `styles.css`, `admin.css` (y la versión en los HTML, `config.js` y `sw.js`).

## Versión 34: más rojo en modo noche
- Lo que aún salía rosado en modo noche ahora es el mismo rojo vivo (#ff4d4d): la pestaña elegida y su subrayado, los botones-enlace («Leer más», «Ver»…), el cargo de los delegados, las fechas rojas del panel «Próximas fechas» del Calendario y, en el panel, el icono de «borrado» del Historial. El color «Rosa» que se elige para un tipo de evento sigue siendo rosa a propósito.
- Cambios: `styles.css`, `admin.css` (y la versión en los HTML, `config.js` y `sw.js`).

## Versión 33: fechas en rojo en modo noche
- En modo noche, las fechas de «Próximas paradas» (por ejemplo «VIE 23 OCT»), los enlaces «Ver todas», los iconos de «Ir a» y otros detalles salían en rosa. Ahora son rojo vivo (#ff4d4d), que se sigue leyendo bien sobre el fondo oscuro.
- Cambios: `styles.css` (y la versión en los HTML, `config.js` y `sw.js`).

## Versión 32: restricciones en otro idioma, con el traductor del móvil
- El traductor de Google por enlace (v31) no funciona con algunas webs oficiales (la alemana, BALM, da «No se puede traducir esta página»). Ahora todos los botones abren la página oficial directamente (siempre al día) y, en las que no están en español, pone «Al abrirla, tu móvil te ofrece traducirla al español». El aviso de arriba explica cómo: en Android «Traducir» o los tres puntos y «Traducir»; en iPhone, «aA» y «Traducir».
- Cambios: `render.js`, `app.js`, `admin.js`, `styles.css`.

## Versión 31: restricciones en otros idiomas, traducidas al español
- En «Zona Conductores», los países cuya página oficial no está en español (Alemania, Italia, Portugal, Rumanía) se abren **traducidos al español por Google**. Es la página oficial en ese momento, así que siempre está al día sin hacer nada. Debajo de cada uno hay un enlace «Ver la página original». El aviso de arriba explica que es una traducción automática.
- Se decide con el campo «Idioma de la página» del panel: si no pone «español», se abre traducida.
- Se han vuelto a añadir Alemania, Italia, Portugal y Rumanía (se habían borrado porque salían en otro idioma).
- Cambios: `render.js`, `app.js`, `admin.js`, `styles.css` (y la versión en los HTML, `config.js` y `sw.js`).

## Versión 30: todo lo nuevo se cambia desde el panel
- Página nueva en el panel **«Restricciones camiones»** (en el menú «Más» y con un botón dentro del apartado «Zona Conductores»): añadir, cambiar, ocultar, borrar y reordenar países y enlaces, y cambiar la **fecha de revisión** (con botón «Poner hoy»). Si un enlace se escribe sin `https://`, se añade solo. Si no queda ningún país, el bloque no sale en la web.
- **Textos** tiene tres campos nuevos: el texto del **aviso de privacidad** y las dos **casillas de consentimiento** (buzón y avisos en el móvil). Vacíos, salen los de siempre. Las palabras «política de privacidad» siempre son un enlace (si no se escriben, se añade al final).
- Base de datos: tabla nueva `restricciones` (país, quién lo publica, idioma, enlace, posición, se ve). Lectura pública; crear, cambiar y borrar solo administradores. Apunta los cambios en el Historial (se puede recuperar lo borrado) y entra en la copia de seguridad. Se rellenó con los 7 países de la v28. No se ha borrado ni renombrado nada.
- Si la tabla no se puede leer, la web enseña la lista de la v28 que va dentro del código.
- Cambios: `index.html`, `app.js`, `admin.js`, `render.js`, `admin.html`, `cartel.html`, `config.js`, `sw.js`.

## Versión 29: aviso de privacidad y casillas de consentimiento
- **Aviso de privacidad** abajo, encima de la barra fija, solo la primera vez: «Esta web usa solo lo necesario para funcionar. Puedes leer cómo tratamos tus datos en Privacidad y en el Aviso legal.», con los dos enlaces y el botón «Entendido». No bloquea nada: se puede navegar con él puesto. Al pulsar «Entendido» no vuelve a salir en ese móvil (si el navegador no deja guardar, vuelve a salir la próxima vez).
- **Casilla sin marcar** antes de enviar datos: en el **buzón anónimo** de «Dudas» y al **activar los avisos en el móvil** (sale una ventana antes del permiso del navegador). Sin marcarla no se envía nada y el mensaje dice qué falta.
- No se han cambiado los textos legales (Privacidad, Aviso legal): lo que les falta está en el informe para que lo revise un asesor.
- Cambios: `index.html`, `app.js`, `styles.css`.

## Versión 28: restricciones de circulación para camiones (Zona Conductores)
- En el apartado **Zona Conductores** sale arriba el bloque **«Restricciones de circulación para camiones»**: un aviso («Estos enlaces llevan a páginas oficiales. Antes de salir, comprueba la información en la fuente oficial. Revisado por última vez: …»), una frase de para qué sirve y un botón grande por país que abre la página oficial en una pestaña nueva: España (DGT), Cataluña (Servei Català de Trànsit), Francia (Bison Futé), Alemania (BALM), Italia (Ministerio de Infraestructuras y Transportes), Portugal (Infraestruturas de Portugal) y Rumanía (Policía Rumana). Fuentes comprobadas el 17 de octubre de 2026.
- La **fecha de revisión** se cambia desde el panel: **Textos → «Restricciones para camiones: fecha de revisión»**. Si se deja vacía, sale el 17 de octubre de 2026. No ha hecho falta tocar Supabase (es un texto más de la tabla `paginas`).
- Arreglado: los contadores ocultos de las pestañas ensanchaban la página por dentro (no se notaba al usarla, pero no era correcto).
- Cambios: `index.html`, `app.js`, `styles.css`, `admin.js`.

## Versión 27: ocultar un apartado del Convenio sin borrarlo
- En el panel, cada apartado del Convenio tiene la casilla **«Se ve en la web»**. Desmarcándola, el apartado desaparece de la web (lista, filtros, buscador y «Sabías que»), pero se conserva y se puede volver a publicar. En el panel sale «Oculto en la web» y «Guardado sin publicar».
- Base de datos: columna nueva `convenio_secciones.visible` (`boolean`, por defecto `true`). Se guardó antes una copia del esquema; los 11 apartados siguen visibles y los permisos no han cambiado. Lo oculto lo filtra la web: quien pida los datos directamente al servidor todavía podría leerlo (no es información privada).
- Cambios: `admin.js`, `app.js`.

## Versión 26: abre más rápido en el móvil
- **Caché más inteligente** (`sw.js`): los archivos que llevan número de versión (`?v=26`) ya no se vuelven a pedir a internet cada vez; salen del propio móvil al momento. Cuando hay versión nueva, la página pide otro número y ese sí se descarga, así que las actualizaciones siguen llegando. Sin conexión, la web sigue abriendo con su diseño. Además, una respuesta con error ya no sustituye a la copia buena guardada.
- **Inicio del panel con menos consultas** (de 25 a 20): las publicaciones de todos los apartados se piden de una vez (antes, una vez por apartado), los apartados no se piden dos veces y lo de las calculadoras ya no se carga ahí.
- Cambios: `sw.js`, `admin.js`.

## Versión 25: ocultar sin borrar y borrar con más cuidado
- **Publicaciones de los apartados** (Comité de empresa, Decretos y leyes, Info laboral…): casilla **«Se ve en la web»**. Desmarcándola, la publicación se oculta sin borrarla (y en el panel sale «Oculto en la web» y «Guardado sin publicar»). Si se crea ya oculta, no se avisa a nadie.
- **Borrar un apartado de la web que tiene publicaciones**: como se borrarían también todas ellas, ahora hay que **escribir BORRAR** para confirmarlo, y el aviso recuerda que, si solo quieres que no se vea, basta con desmarcar «Se ve en la web». Si está vacío, basta con aceptar.
- **La web enseña solo lo publicado aunque en ese móvil esté abierta la sesión del panel**: antes, el administrador veía en la web los avisos programados antes de la hora y lo oculto (los trabajadores no, eso ya lo filtraba el servidor). Tampoco sale la banda «Hay 1 novedad» por algo oculto o programado.
- Cambios: `admin.js`, `app.js`, `render.js`.

## Versión 24: el panel en el móvil hace lo que se espera (Convenio y Apartados de la web)
- **Convenio (y todas las secciones) en el móvil**: el botón «Nuevo apartado» de arriba estaba escondido en el móvil, y el botón flotante «+ Nuevo» abría una lista con todo («¿Qué quieres crear?»), así que parecía que te llevaba a otro sitio. Ahora el botón de arriba se ve, ancho y grande, y el flotante crea directamente en la sección donde estás («Nuevo apartado», «Publicar», «Nueva acta»…). La lista general solo sale desde el Inicio del panel.
- **Apartados de la web**: tocar la tarjeta de «Decretos y leyes», «Info laboral» o «Comité de empresa» **abre la sección** para publicar dentro (con «Fotos y documentos»). Cada tarjeta dice cuántas publicaciones tiene. El nombre, el dibujo y la posición se cambian con el botón aparte **«Cambiar nombre y ajustes»**, que avisa arriba: «Aquí solo cambias el nombre y el aspecto…» con el botón **«Abrir y publicar contenido»**.
- Al crear un apartado de la web nuevo, el panel lleva directamente a su sección para empezar a publicar.
- El botón flotante ya no tapa la última tarjeta en el móvil.
- Al cerrar el editor y saltar a otra sección, la dirección de la página ya no se queda con la sección anterior.
- **Más rápida**: el logo pasa de 353 KB a 27 KB (es lo que más pesaba de toda la web). El cartel usa la versión grande para imprimir.
- **Modo oscuro**: los enlaces azules se leían mal (contraste 2,1:1); ahora tienen un azul claro (más de 7:1).
- **Botones de al menos 44 px** para el dedo: flechas y «Hoy» del calendario de la web, botones de Ajustes, «Aa» y «Ver calendario» del panel.
- Seguridad: los nombres de los apartados pasan por `esc()` en el menú y la cabecera del panel. Quitado código que no se usaba.
- Cambios: `admin.js`, `admin.css`, `styles.css`, `cartel.html`, `logo.png`.

## Versión 23: se ven todas las secciones, festivos de España y «Calendario»
- **Barra de secciones**: con 12 pestañas, en el móvil solo caben 2 o 3 y no se notaba que se puede deslizar (parecía que solo existían, por ejemplo, «Info laboral» y «Comité de empresa»). Ahora sale una **flecha ámbar a cada lado** cuando hay más secciones escondidas por ese lado; al pulsarla, la barra se desliza. También en el ordenador, donde ya no cabía «Nosotros». Si caben todas, no sale ninguna flecha.
- La pestaña **«Fechas» pasa a llamarse «Calendario»** (también en «Ir a» de la portada).
- **Festivos nacionales** de lo que queda de 2026 y de todo 2027 añadidos al calendario (Todos los Santos, Constitución, Inmaculada, Navidad, Año Nuevo, Reyes, Viernes Santo, Día del Trabajo, Asunción, Fiesta Nacional). Se añadieron **sin avisar** a los móviles ni a Telegram, y se pueden cambiar o borrar desde el panel como cualquier fecha.
- Los festivos (tipo «Festivo») **no cuentan como novedad**: salen en el Calendario y en «Próximas paradas», pero no en «Lo último» ni en el contador de la pestaña. Así, añadir los del año no muestra «14 novedades» a todo el mundo.
- Cambios: `index.html`, `app.js` (`flechasPestanas`, `esFestivo`), `styles.css`.

## Versión 22: tres idiomas más para traducir
- El botón **Traducir** de avisos, actas, preguntas y apartados del convenio añade **alemán, polaco y serbio**, además de catalán, inglés, rumano, árabe, francés y portugués. Sigue siendo gratis (Gemini) y cada traducción se guarda para no volver a pedirla.
- Con nueve idiomas el menú se hacía demasiado alto y en el móvil se metía debajo de la cabecera: ahora sale en dos columnas y se le ajusta el alto al hueco que queda, con desplazamiento dentro si hace falta.
- Cambios: `render.js` (lista de idiomas), `app.js` (`colocaMenuIdiomas`), `styles.css` (dos columnas) y la función `traducir` de Supabase (la misma lista, en el servidor).

## Versión 21: archivos en los apartados del convenio
- **Panel, Convenio → Nuevo apartado**: ahora hay un campo **«Archivos del apartado»** para subir uno o varios archivos (PDF, fotos, Word, Excel, PowerPoint). Se ve el nombre, el tipo y el tamaño de cada uno, y se pueden quitar antes de guardar. Máximo 20 MB por archivo, con aviso claro si se pasa o si el tipo no vale. Usa la misma subida que Documentos y Avisos (`subirArchivo()`, bucket `documentos`).
- **Web, Convenio**: al abrir un apartado, sus archivos salen debajo de la explicación como enlaces de descarga, con el icono del tipo y el tamaño.
- La limpieza de «archivos sin usar» (Ajustes) y la copia de seguridad en ZIP ahora tienen en cuenta también los archivos del convenio y de los apartados de la web, para no borrarlos ni dejarlos fuera de la copia.
- Base de datos: columna nueva `convenio_secciones.adjuntos` (`jsonb`, por defecto `[]`). No se ha tocado ningún dato ni ninguna política de seguridad.

## Versión 20: dos arreglos
- **Panel, Calendario**: pulsar «Calendario» no abría el calendario y se quedaba a la vista la página anterior (normalmente Ajustes), así que no se podían editar ni borrar fechas. Había un trozo de código copiado de otra pantalla que usaba una variable que ahí no existe (`k`) y rompía el dibujado. Arreglado en `admin.js` (`pintaCalAdm`). Ya se puede abrir una fecha desde el día y borrarla.
- **Web, Convenio**: la tarjeta de arriba («Aquí encontrarás el convenio colectivo aplicable y los documentos más importantes») tenía pinta de botón pero era un simple recuadro de texto: al pulsarla no pasaba nada. Ahora es un enlace de verdad a **Documentos**, con flecha y la línea «Ver los documentos del convenio». Cambiado en `index.html`, `app.js` (`pintaConvenio`) y `styles.css`.

## Versión 19: ocho mejoras grandes (novedades en directo, buzón, calculadoras, portada viva, estadísticas, canales, historial y panel móvil)
### Fase 1: novedades en directo
- Si se publica algo (aviso, fecha, acta, documento o algo en un apartado) mientras alguien tiene la web abierta, aparece arriba una banda amarilla **«Hay 1 novedad · Ver»**. Al pulsarla se muestra lo nuevo sin recargar la página. Los cambios y borrados se actualizan solos, sin avisar.
- **Contador pequeño en cada pestaña** con lo nuevo desde la última visita de ese móvil. Desaparece al entrar en la pestaña. Se guarda solo en el propio móvil.
- Arreglado: la cabecera con las pestañas ya se queda fija arriba al bajar por la página. Antes se iba con el resto.

### Fase 2: buzón anónimo
- En **«Dudas»**, abajo, un formulario corto para enviar una **pregunta o una sugerencia**, con un aviso bien visible de no poner nombres ni datos personales. Máximo 1000 letras.
- **Es anónimo de verdad**: se guarda solo el texto, si es pregunta o sugerencia y el día, sin la hora. No se guarda ni la IP ni nada del móvil.
- Si el mensaje lleva un email o un teléfono, no se envía.
- Límites: 3 mensajes al día por móvil (contados en el propio móvil) y 40 al día en total (los cuenta el servidor).
- En el panel, **«Buzón anónimo»** con pestañas *Sin leer / Leídos / Archivados*. Cada mensaje tiene los botones *Convertir en pregunta frecuente* (abre el editor ya relleno y, al guardarla, archiva el mensaje), *Leído*, *Archivar* y *Borrar*.
- En **Inicio** del panel sale un aviso cuando hay mensajes sin leer, y en el menú un número rojo.
- El texto de **Privacidad** ya explica el buzón y lo que se guarda en el móvil.

### Fase 3: calculadoras del convenio
- Pestaña nueva **«Calcula»** en la web, con tres calculadoras. Todo se calcula en el móvil y no se guarda ni se envía nada. Arriba hay un aviso visible: «Cálculo orientativo. Ante cualquier duda, pregunta a un delegado».
  - **Vacaciones que te quedan**: días al año menos los ya disfrutados, con la parte proporcional si empezaste este año.
  - **Permisos retribuidos**: asistente «¿Qué ha pasado?». Se elige el motivo y, si hace falta, contesta una pregunta («¿Tienes que desplazarte?»). Dice cuántos días corresponden y de dónde sale.
  - **Horas extra**: por categoría, con horas normales y en festivo. Da el importe bruto.
- En el panel, página **«Calculadoras»**: días de vacaciones, notas y aviso, lista de permisos (añadir, cambiar, ocultar) y precios de las horas extra por categoría. **Nada está fijo en el código.**
- Valores de partida: los **mínimos del Estatuto de los Trabajadores** (30 días de vacaciones y permisos del art. 37). **Hay que revisarlos con el convenio.** Los precios de las horas extra están vacíos hasta que se pongan.

### Fase 4: portada más viva
- **Cuenta atrás** en la portada hasta la próxima cita marcada como importante. En el panel, al crear o editar una fecha, se marca la casilla *«Cita importante: sale en la portada con cuenta atrás»*. Muestra días y horas, o horas y minutos el último día, y se actualiza cada minuto.
- **«Sabías que…»**: cada día sale un apartado distinto del convenio (el mismo para todos ese día), con un enlace para leerlo entero.
- **Recuadros grises de carga** mientras llegan los datos, en vez de una pantalla vacía.
- En el móvil, **desliza hacia abajo** desde arriba del todo para actualizar sin recargar la página.
- Las animaciones son mínimas y se quitan si el móvil tiene activado «reducir movimiento».

### Fase 5: estadísticas en el panel
- En el **Inicio del panel**, apartado nuevo **«Estadísticas»** con tres gráficas propias, sin librerías de fuera. Cada una muestra el dato al pasar el ratón o el dedo y se puede **ver como tabla**:
  - **Lo más leído**: veces que se ha abierto cada aviso, acta, documento o publicación de un apartado.
  - **Móviles con avisos activados**, por semana. Se apunta cada noche con una tarea programada. Las semanas anteriores a hoy son una estimación.
  - **Secciones más visitadas** en los últimos 30 días.
- En las listas del panel (Avisos, Actas, Documentos, apartados) sale «Leído N veces» en cada elemento.
- **Todo es anónimo**: solo se suma 1 en un contador. Un aviso cuenta como leído si se ve en pantalla al menos 2 segundos, y un documento cuando se abre. Cada cosa se cuenta una sola vez por visita.

### Fase 6: vista previa en todos los canales y avisos que se repiten
- Al escribir un aviso, la **vista previa** enseña a la vez cómo quedará **en la web, en la notificación del móvil, en el canal de Telegram y en WhatsApp**. En el móvil van en pestañas y en el PC, una debajo de otra. Recorta igual que la función que envía los avisos, así que lo que se ve es lo que llega.
- **Avisa si el título se va a cortar** en la notificación del móvil (se ven unas 45 letras), justo debajo del título y en la vista previa. También avisa si el texto se corta, si la casilla de avisar está desmarcada o si está programado.
- **Avisos que se repiten**, en el panel en *Avisos que se repiten*, o con el botón que hay en Avisos: cada semana, cada mes o cada año, a la hora que se elija, con *Activo* para pausarlos. Ejemplo: «Recuerda entregar la hoja de horas», el día 25 de cada mes a las 9:00. Muestra cuándo será la próxima vez.
- Los publica la tarea programada de la función `notificar` (cada 10 minutos). Salen como un aviso normal y se avisa en los móviles y en Telegram. No se repiten aunque la tarea pase varias veces el mismo día. Si se elige el día 31 y el mes tiene menos días, sale el último día del mes.

### Fase 7: historial y deshacer
- En la base de datos se apunta **cada cambio**: quién (el email del administrador), qué (aviso, fecha, acta…), qué registro, si se creó, cambió o borró, cuándo y la **versión anterior**. Los cambios automáticos, como la marca de «ya avisado», no se apuntan. Se guarda un año.
- En el panel, sección **«Historial»** con filtros por tipo y por acción. En los cambios se puede ver qué campo cambió y cómo estaba. Cada línea tiene su botón:
  - **Recuperar**, para algo borrado.
  - **Volver a como estaba**, para un cambio.
  - **Deshacer (quitarlo)**, para algo creado por error.
- Ahora, al borrar algo, **sus archivos se conservan** para poder recuperarlo con sus fotos y PDF. En **Ajustes > Archivos sin usar** se quitan los que ya no usa nada y tienen más de 30 días.
- Los avisos de «¿Borrar…?» ya no dicen «no se puede deshacer»: dicen que se puede recuperar en «Historial».

### Fase 8: panel más rápido en el móvil
- **Botón flotante «+ Nuevo»** en todas las páginas del panel (en el móvil). Pregunta *«¿Qué quieres crear?»* con la lista de todo (aviso, fecha, publicación en el Comité, acta, documento…). Lo de la sección en la que estás sale primero.
- **Reordenar arrastrando**, con el dedo o el ratón, desde las tres rayas de la izquierda: apartados del convenio, preguntas, plantillas, delegados, enlaces, apartados de la web, permisos y precios de las calculadoras. Si se lleva al borde de la pantalla, baja sola. También funciona con el teclado (flechas arriba y abajo). Se guarda solo y el historial no se llena con cada cambio de orden.
- **Archivos**: ahora se pueden soltar en cualquier parte del editor (sale «Suelta aquí para añadir los archivos») o **pegar** con Ctrl+V una foto copiada.
- **Borrador guardado solo**: mientras se escribe, cada 4 segundos y al cambiar de app, se guarda un borrador en el propio móvil. Si la app se cierra sin querer, al volver a abrir ese editor sale *«Tienes un borrador sin guardar… ¿Lo recuperas?»*. Los archivos hay que volver a elegirlos. Al publicar, o al salir diciendo «salir sin guardar», el borrador se borra.

### Cierre de la versión 19
- Versión subida en los 3 sitios (`?v=19` en los HTML, `VERSION_WEB` en `config.js`, `VERSION` en `sw.js`).
- **Pendiente de revisar antes de usarlo con la plantilla**: los valores de «Calcula» son los mínimos del Estatuto de los Trabajadores, no los del convenio de Girona. Revisarlos en el panel, en «Calculadoras». Los precios de las horas extra están vacíos: hasta que se pongan, esa calculadora no sale.
- Sigue pendiente completar la entidad de CCOO responsable y su NIF en Textos > Aviso legal y Privacidad.
