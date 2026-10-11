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
