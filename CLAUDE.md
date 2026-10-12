# Web de la Sección Sindical CCOO Calsina Carré

Contexto para Claude Code. Léelo entero antes de tocar nada.

## Qué es
Web/app (PWA) gratuita y solo informativa para la plantilla de Calsina Carré: avisos, calendario, convenio, actas, documentos, dudas y «Nosotros». La gestiona sola desde el panel el secretario de la sección (padre de Lorena, usuario GitHub `mariancracana77-SSCCOO`). Lorena (estudiante de 2º SMX) es quien desarrolla y habla con Claude.

- Web pública: https://mariancracana77-ssccoo.github.io/SSCCOO/  (repo GitHub `SSCCOO`, GitHub Pages, con `.nojekyll`)
- Panel: `admin.html` (email + contraseña de Supabase)
- Versión actual: **18**

## Reglas del proyecto (no negociables)
- Responder siempre en **español**, claro y sin tecnicismos innecesarios.
- **Sin emojis** en la interfaz.
- **Todo gratis**: nada de servicios de pago. IA = Google Gemini gratuito (no API de Claude).
- **Sin datos personales** de trabajadores. Teléfono/email de delegados solo con su consentimiento.
- **Nunca pedir ni aceptar claves/tokens en el chat**: los secretos los mete la usuaria en el panel de Supabase o en Ajustes del panel.
- El padre debe poder hacerlo todo **desde el panel, sin tocar código**.
- Móvil y PC cómodos, letra grande y modo oscuro deben seguir funcionando.

## Archivos
- `index.html` + `app.js`: web pública con el diseño «Rótulo de línea» (v18):
  - Cabecera oscura (asfalto `#15191E`) con pestañas en Barlow Condensed y subrayado ámbar.
  - Portada: rótulo ámbar con lo urgente (o la próxima cita), tira «N novedades desde tu última visita» (localStorage `ccoo-ultima-visita`), «Próximas paradas» como línea de ruta, «Lo último» con la marca «Nuevo» y accesos «Ir a».
  - Barra fija abajo: «Hablar con un delegado» (`#delegados`) y la campana de avisos.
  - Calendario con «Próximas fechas» como panel de salidas (`.tablero`).
  - Vista `apartado` (`#ap-<slug>`) para los apartados que crea el admin.
  - Clasificación por año y mes con botones (`pintaFechas`) y listas separadas por meses (`porMeses`).
  - Vista `legal` (#aviso-legal, #privacidad).
  - Tiempo real (Fase 1): los INSERT se guardan en `PEND` y se muestra la banda `#banda-novedad`. «Ver» llama a `cargar()` y lleva a lo nuevo. Contadores por pestaña (`pintaContadores`) con localStorage `ccoo-visto` y `ccoo-ultima-visita`.
  - `html, body { overflow-x: clip }`: con `hidden` deja de funcionar la cabecera `sticky`.
- `admin.html` + `admin.js` + `admin.css`: panel (Resumen con visitas, Calendario mensual, secciones, Textos, Ajustes: canales Telegram/WhatsApp, copia ZIP, archivo, administradores, listas; asistente de actas con Gemini a partir de fotos/archivos).
  - Las secciones se definen en el objeto `SECCIONES`.
  - «Apartados de la web» (`SECCIONES.apartados`) crea apartados. Cada uno genera una sección dinámica `ap<id>` (`seccionApartado`, tabla `publicaciones` filtrada por `apartado_id`) que se coloca tras Actas (`construirPaginas`).
- `config.js`: cliente Supabase, `VERSION_WEB`, `WEB_URL`, `VAPID_PUBLICA`, ayudas (textoHTML, compartir, ICS, lectura «Aa», `urlSegura`).
- `render.js`: plantillas HTML de tarjetas. `iconos.js`: iconos SVG. `styles.css`: estilos (al final, bloques «Tablón», portada, modales, filtro de fechas, tema oscuro manual).
- `lectura.js`: aplica letra/contraste/tema antes de pintar + anti-iframe.
- `sw.js`: service worker (caché network-first, HTML sin caché, push).
- `cartel.html` + `cartel.js` + `qr.js`: cartel con QR para imprimir.
- `lib/supabase.js` (supabase-js 2.58.0 UMD) y `lib/jszip.min.js` (3.10.1): **alojados aquí a propósito** (no CDN).
- `fuentes.css` + `fuentes/`: Atkinson Hyperlegible (texto), Barlow Condensed (títulos) y Barlow (de reserva), alojadas aquí (no Google Fonts, por privacidad).
- Diseño: colores en `:root` de `styles.css` (asfalto, `--rotulo`, `--ambar-rotulo` `#FFB000`, rojo CCOO `#C4122F`, hueso `#F5F3EE`). El bloque «Diseño Rótulo de línea» está al final de `styles.css`.

## Al publicar una versión nueva (3 sitios)
1. `?v=N` en `index.html`, `admin.html`, `cartel.html`
2. `VERSION_WEB` en `config.js`
3. `VERSION` en `sw.js`
Añadir una línea en `README.md` y entregar zip `SSCCOO-web-vN.zip`. La usuaria sube los archivos a GitHub a mano.

## Seguridad (mantenerla)
- **CSP** en `<meta>` de los 3 HTML: `script-src 'self'`. Prohibido: `<script>` en línea, `onclick=""`/`onchange=""` en HTML o plantillas, `eval`. Usar listeners/delegación. Si se añade un dominio externo, añadirlo a la CSP a propósito.
- Enlaces pintados con `esc(urlSegura(url))` (solo http/https/mailto/tel).
- Siempre `esc()` al meter texto en HTML.
- Las llamadas `sb.rpc(...)`/consultas de supabase-js **no se envían si no se esperan**: usar `await` o `.then()`. (Bug real que ya pasó con el contador de visitas.)

## Supabase
- Proyecto `kdfedwcskymaitvpryvg` (región eu-west-3, París), nombre `ccoo-calsina-carre`. URL https://kdfedwcskymaitvpryvg.supabase.co. Clave publicable en `config.js`.
- RLS en todas las tablas: lectura pública de lo publicado; escritura solo `public.is_admin()` (tabla `admins` por email).
- Tablas: comunicados, eventos, convenio_secciones, actas, documentos, preguntas, plantillas, delegados, enlaces, apartados (slug, titulo, descripcion, icono, orden, visible), publicaciones (apartado_id, titulo, contenido, fecha, adjuntos, publicado, notificar/notificado), buzon (tipo, texto, dia, leido, archivado: solo admin lee; se inserta solo con la RPC), paginas (slugs: inicio, convenio, quienes, contacto, telegram, whatsapp, archivo_meses, ultima_copia, aviso_legal, privacidad), opciones, admins, config_privada (sin políticas: solo service role; VAPID, Telegram, Gemini, cron), push_subs (sin políticas), traducciones, visitas_dia.
- RPC: enviar_buzon (pública: valida tipo y largo 5–1000, rechaza emails y teléfonos, tope de 40 al día; guarda solo el día, sin hora), suscribir_push (valida y tope 5000), desuscribir_push, contar_visita, contar_suscritos, reiniciar_suscripciones (solo admin), is_admin.
- Trigger `solo_admins_registran` en `auth.users`: solo puede crear cuenta un email que esté en `admins`.
- Storage: bucket público `documentos` (20 MB); subir/borrar solo admin.
- Edge functions (código en Supabase, leer con el conector): `notificar` (push + Telegram, también para `publicaciones`; cron cada 10 min con `x-cron-secret`; resto solo admin), `traducir` (pública, solo traduce lo publicado, con caché), `generar-acta` (con JWT, Gemini).
- Avisos del linter que son intencionados: tablas con RLS sin políticas (config_privada, push_subs), RPC públicas de push/visitas/buzón, pg_net en public (lo usa el cron).
- En este entorno, las migraciones con `drop`/`revoke` juntos pueden cancelarse esperando confirmación: dividirlas en partes no destructivas. Lo mismo con `delete` en execute_sql. Para probar funciones sin dejar rastro: un bloque `do $$ … raise exception 'RESULTADO …' $$` lo deshace todo y devuelve el resultado en el error.

## Pruebas
Playwright con Chromium (sin `playwright install`), servidor local `python3 -m http.server 8765` y un mock de supabase-js que sustituye `lib/supabase.js`. Probar móvil 320–412 px y PC, claro/oscuro, letra «muy grande», y que no haya errores de consola ni de CSP.

- Desde este entorno no se llega a Supabase por HTTP (proxy). Para probar una edge function: `net.http_post(...)` por SQL y leer `net._http_response`.

## Pendiente / ideas
- Importar el historial del canal de Telegram «Tablon anuncios CCOO-Calsina Carre» (exportación JSON de Telegram Desktop) repartiéndolo por la web. Importar con `notificar = false`.
- Las 8 fases pedidas: novedades en directo, buzón anónimo, calculadoras, portada viva, estadísticas, vista previa en canales y avisos recurrentes, historial y deshacer, panel más rápido en el móvil.
- Completar en Textos > Aviso legal y Privacidad la entidad de CCOO responsable y su NIF (que lo revise el servicio jurídico de CCOO).
- Actualizar la guía del panel (Claude Docs) con capturas del diseño nuevo.
- Borrar el evento de prueba «zz prueba interna».
- Añadir un segundo administrador.
- Opcional: botón de idioma global junto a «Aa».
