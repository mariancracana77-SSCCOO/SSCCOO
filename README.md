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
`index.html`, `app.js` (web) · `cartel.html` (cartel QR) · `qr.js` (códigos QR, librería qrcode-generator, licencia MIT) · `admin.html`, `admin.js`, `admin.css` (panel) · `render.js` (piezas comunes) · `styles.css` · `config.js` (conexión con Supabase) · `iconos.js` · `manifest.json`, `sw.js` (para instalarla como app) · `logo.png`, `icon-*.png` · `.nojekyll`

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
- **Próxima cita** destacada con el día en grande y el botón «Añadir a mi calendario».
- Accesos rápidos a Convenio, Actas, Docs y Dudas.
- En el listado, las fechas llevan su día y mes, y cada tipo tiene su color.

## Versión 13
- Ventana «Avisos activados» más clara: «Entendido» grande y «Desactivar los avisos en este móvil» como enlace pequeño debajo, para no pulsarlo sin querer.
- En modo oscuro, el icono del calendario de los filtros de fecha ya se ve.

## Versión 14
- Filtro de fechas (año, mes, día exacto) reordenado en recuadros bien alineados, en la web y en el panel: ya no se superponen ni se salen de la pantalla en móviles pequeños.
- Los correos y enlaces largos (por ejemplo en «Nosotros») bajan de línea en vez de empujar la pantalla hacia un lado.

## Versión 15
- Arreglado el contador de visitas del día (no se enviaba).
- Arreglado el borrado de suscripciones antiguas de avisos (evita duplicados).

## Versión 16: seguridad y páginas legales
- **Aviso legal** y **Privacidad y cookies**: enlazados abajo en la web y editables en el panel, en Textos. Hay que completar la entidad de CCOO responsable y su NIF.
- Solo pueden crear cuenta en el panel los emails que un administrador haya añadido antes.
- Contraseñas del panel: mínimo 10 caracteres, con letras y números. Tras 5 fallos seguidos, hay que esperar.
- Protección contra código inyectado (CSP), enlaces filtrados y la web no se puede meter dentro de otra.
- Librerías y fuentes alojadas en la propia web: no dependen de servidores externos y no avisan a Google de cada visita.
- Nuevos archivos: `lectura.js`, `cartel.js`, `fuentes.css`, carpetas `lib/` y `fuentes/`. **Súbelos también a GitHub.**
- `CLAUDE.md`: contexto para seguir el proyecto con Claude Code.

## Versión 18: diseño «Rótulo de línea» y apartados nuevos
- **Diseño nuevo**, inspirado en los rótulos de los autobuses y en los paneles de salidas:
  - Cabecera oscura con pestañas grandes.
  - Lo urgente sale arriba como un **rótulo ámbar**. Si no hay nada urgente, sale la próxima cita.
  - «**N novedades desde tu última visita**»: cada móvil recuerda cuándo entró por última vez y marca lo nuevo con la etiqueta «Nuevo». No se envía nada a ningún sitio.
  - **Próximas paradas**: las próximas fechas sobre una línea roja, como un mapa de ruta.
  - En el calendario, las próximas fechas salen como un **panel de salidas**.
  - Abajo, siempre a mano: **«Hablar con un delegado»** y la campana de avisos.
  - Letra nueva **Atkinson Hyperlegible**, pensada para leer bien con poca visión y alojada en la propia web. Letra base más grande.
- **Apartados que crea el admin desde el panel**: en «Apartados de la web» se crean secciones nuevas.
  - Ya está creado **«Comité de empresa»**.
  - Cada apartado sale como una pestaña en la web y tiene su propia lista en el panel para publicar texto, fotos y documentos, con su fecha.
  - Las fotos se ven en galería.
  - Al publicar se avisa en los móviles y en Telegram, igual que con los avisos.
- **Clasificación por año y mes**: en Avisos, Actas, Documentos y los apartados, los desplegables de fecha se cambian por botones de año y, dentro de cada año, de mes, con cuántos hay. Las listas van separadas por meses («Octubre de 2026»). En el panel, igual.
- Festivos que duran todo el día: dicen «Todo el día» en vez de «00:00–23:59», y se añaden al calendario del móvil como día completo.
- Nuevos archivos: `fuentes/atkinson-hyperlegible-*.woff2` (4 archivos). **Súbelos también a GitHub.**

## Versión 19 (en preparación)
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
