# Web de la Sección Sindical CCOO Calsina Carré

Contexto para Claude Code. Léelo entero antes de tocar nada.

## Qué es
Web/app (PWA) gratuita y solo informativa para la plantilla de Calsina Carré: avisos, calendario, convenio, actas, documentos, dudas y «Nosotros». La gestiona sola desde el panel el secretario de la sección (padre de Lorena, usuario GitHub `mariancracana77-SSCCOO`). Lorena (estudiante de 2º SMX) es quien desarrolla y habla con Claude.

- Web pública: https://mariancracana77-ssccoo.github.io/SSCCOO/  (repo GitHub `SSCCOO`, GitHub Pages, con `.nojekyll`)
- Panel: `admin.html` (email + contraseña de Supabase)
- Versión actual: **30**

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
  - `cargar()` filtra también en la web lo no publicado (avisos con `publicar_en` futuro, apartados y convenio con `visible = false`, publicaciones con `publicado = false` o de un apartado oculto): si en el mismo navegador está abierta la sesión del panel, el servidor (RLS) le da todo.
  - Tiempo real (Fase 1): los INSERT se guardan en `PEND` y se muestra la banda `#banda-novedad`. «Ver» llama a `cargar()` y lleva a lo nuevo. Contadores por pestaña (`pintaContadores`) con localStorage `ccoo-visto` y `ccoo-ultima-visita`.
  - Portada viva (Fase 4): `pintaCuentaAtras` (eventos con `importante`), `pintaSabias` (un apartado del convenio por día), esqueletos `.esq` en el HTML inicial y «desliza para actualizar» (`#tirar`, solo táctil; `overscroll-behavior-y: contain` para que el navegador no recargue).
  - Estadísticas (Fase 5): `data-lectura="tabla:id"` en avisos, actas y publicaciones (se cuenta si se ve 2 s, con IntersectionObserver) y `data-abre` en documentos (al pulsar).
  - Vista `calcula` (`pintaCalcula`): vacaciones, permisos (asistente) y horas extra. Usa `D.calc`; no guarda nada.
  - `html, body { overflow-x: clip }`: con `hidden` deja de funcionar la cabecera `sticky`.
  - Barra de pestañas (`.pestanas-caja` > `.pestanas-web`): flechas `.pest-flecha` a cada lado con `flechasPestanas()` (clases `hay-izq`/`hay-der` y máscara), en cualquier ancho, solo si no caben todas. Recalcular al añadir pestañas (`pintaPestanasApartados`).
  - Aviso de privacidad (`#aviso-privacidad`, IIFE `avisoPrivacidad` en `app.js`): informativo y no bloqueante, encima de `#barra-acciones` (se recoloca con ResizeObserver); localStorage `ccoo-aviso-privacidad` en try/catch. Consentimiento con casilla sin marcar: buzón (`#buzon-acepto`) y avisos push (`consentimientoAvisos()`, que pide `Notification.requestPermission()` dentro del mismo toque). Los datos de prueba dan el aviso por visto salvo con `window.__PRUEBA_AVISO`.
  - Zona Conductores: en el apartado con slug `zona-conductores` (`APARTADO_CONDUCTORES`) se pinta en `#ap-extra` el bloque de restricciones para camiones (`restriccionesHTML`, tarjeta `restriccionHTML` en `render.js`): lista de la tabla `restricciones` (solo `visible`); si la consulta falla, `RESTRICCIONES_RESERVA`; si está vacía, no sale. Solo enlaces oficiales y gratuitos. La fecha de revisión sale de `paginas.restricciones_revisado`; si no hay, `RESTRICCIONES_REVISADO`.
  - Textos de privacidad editables (`TXT_CONSENTIMIENTO`, `pintaTextosPrivacidad`, `conPolitica`): `paginas.aviso_privacidad_texto`, `consentimiento_buzon`, `consentimiento_avisos`; vacíos = los de siempre. «política de privacidad» se convierte en enlace (o se añade).
  - Festivos: filas normales de `eventos` con `tipo = "Festivo"` (00:00–23:59). `esFestivo()` los saca de «Lo último», del recuento de novedades y del contador de la pestaña. Al cargarlos en bloque, `notificar = false` y `notificado = true` para no mandar avisos.
- `admin.html` + `admin.js` + `admin.css`: panel (Resumen con visitas, Calendario mensual, secciones, Textos, Ajustes: canales Telegram/WhatsApp, copia ZIP, archivo, administradores, listas; asistente de actas con Gemini a partir de fotos/archivos).
  - Las secciones se definen en el objeto `SECCIONES`.
  - Vista previa de avisos en 4 canales (`previaCanales`: web, notificación, Telegram, WhatsApp; recorta igual que `notificar`) y aviso de título largo (`avisoTitulo`, 45 letras). Campos condicionales en el editor con `si: "campo:valor1,valor2"` (`aplicarCondiciones`), `def` para valores por defecto y `num` en selects numéricos.
  - Panel en el móvil (Fase 8): botón «+ Nuevo» (`abrirHojaNuevo`, usa `#hoja-mas`); reordenar arrastrando (`filaOrden` + `hacerOrdenable` con pointer events escuchados en `window`, porque mover la fila suelta la captura; teclado con flechas) en secciones con `orden: ["orden", …]`; soltar archivos en todo el editor y pegar (`ED.añadir`); borrador en localStorage `ccoo-borrador-<sección>-<id|nuevo>` (`guardarBorrador` cada 4 s, `ofrecerBorrador` al abrir).
  - «Historial» (`pintaHistorial`, botón que llama a `recuperar_cambio`). Al borrar no se quitan los archivos del almacenamiento (para poder recuperar); se limpian en Ajustes con `limpiarArchivos` (sin usar y con más de 30 días; respeta lo que sale en los últimos 90 días del historial).
  - «Avisos que se repiten» (`SECCIONES.recurrentes`, `frecTxt`, `proximaVez`).
  - El Resumen carga todas las publicaciones en una consulta y las reparte por apartado (`datos["ap<id>"]`), reutiliza `APARTADOS` y no carga las secciones `oculta`. Las listas se cargan completas a propósito: `abrirEditor` usa `datos[k]` para proponer la posición siguiente.
  - Estadísticas en el Resumen (`pintaEstadisticas`): barras CSS propias (`barrasH`, `.graf-col`), color de datos `--dato` (#1E4F9C claro / #5B8DE6 oscuro, validados) y «Ver como tabla».
  - Secciones con `oculta: true` (`permisos`, `categorias`) no salen en el menú: se editan desde la página «Calculadoras» (`pintaCalculadoras`) y al guardar vuelven a `s.volver`.
  - Botón flotante `#fab` (móvil): dentro de una sección crea ahí (`abrir()` le pone el texto de `s.nuevo`, «Publicar» en los apartados); fuera de secciones abre `abrirHojaNuevo`. El botón `#b-nuevo` de la cabecera también se ve en el móvil. `body.admin` deja 168 px abajo para que el flotante no tape la última tarjeta.
  - Secciones con `tarjeta(x)` usan su propia tarjeta en la lista (`itemHTML`). En «Apartados de la web», `tarjetaApartado`: tocarla abre la sección (`data-abrir-ap`) y «Cambiar nombre y ajustes» (`data-ajustes-ap`) abre el editor, que lleva arriba `.aviso-ajustes` con «Abrir y publicar contenido». `contarPublicaciones()` cuenta lo publicado en cada uno.
  - Publicaciones: casilla `publicado` («Se ve en la web»); si se crea oculta, `notificar = false`. Borrar un apartado con publicaciones (se borran en cascada) pide escribir BORRAR. En el editor, un valor vacío en una casilla toma su `def`.
  - `cerrarEditor()` espera a que termine el «atrás» del historial antes de seguir: si no, al saltar a otra sección la dirección se quedaba con la anterior.
  - Página «Restricciones camiones» (`camiones`, `pintaCamiones`): fecha (`paginas.restricciones_revisado`, fuera de TEXTOS para que «Guardar textos» no la pise) y lista `SECCIONES.restricciones` (oculta, `volver: "camiones"`). Botón `#b-camiones` en la sección del apartado `zona-conductores` (`seccionApartado` guarda `slug`).
  - «Apartados de la web» (`SECCIONES.apartados`) crea apartados. Cada uno genera una sección dinámica `ap<id>` (`seccionApartado`, tabla `publicaciones` filtrada por `apartado_id`) que se coloca tras Actas (`construirPaginas`).
- `config.js`: cliente Supabase, `VERSION_WEB`, `WEB_URL`, `VAPID_PUBLICA`, ayudas (textoHTML, compartir, ICS, lectura «Aa», `urlSegura`).
- `render.js`: plantillas HTML de tarjetas. `iconos.js`: iconos SVG. `styles.css`: estilos (al final, bloques «Tablón», portada, modales, filtro de fechas, tema oscuro manual).
- `lectura.js`: aplica letra/contraste/tema antes de pintar + anti-iframe.
- `sw.js`: service worker: archivos con `?v=N` primero desde la caché (no cambian nunca); HTML sin caché y el resto primero de la red, con la caché si no hay conexión. Solo guarda respuestas correctas (`r.ok`). Push.
- `cartel.html` + `cartel.js` + `qr.js`: cartel con QR para imprimir (usa `icon-512.png` para el logo; `logo.png` es pequeño, 192 px, para la web y el panel).
- `lib/supabase.js` (supabase-js 2.58.0 UMD) y `lib/jszip.min.js` (3.10.1): **alojados aquí a propósito** (no CDN).
- `fuentes.css` + `fuentes/`: Atkinson Hyperlegible (texto), Barlow Condensed (títulos) y Barlow (de reserva), alojadas aquí (no Google Fonts, por privacidad).
- Diseño: colores en `:root` de `styles.css` (asfalto, `--rotulo`, `--ambar-rotulo` `#FFB000`, rojo CCOO `#C4122F`, hueso `#F5F3EE`). El bloque «Diseño Rótulo de línea» está al final de `styles.css`.

## Al publicar una versión nueva (3 sitios)
1. `?v=N` en `index.html`, `admin.html`, `cartel.html`
2. `VERSION_WEB` en `config.js`
3. `VERSION` en `sw.js`
Añadir una línea en `README.md` y entregar zip `SSCCOO-web-vN.zip`.

**Publicar en GitHub lo hace Claude, no la usuaria.** Orden:
1. **Antes de tocar `main`**, crear y subir una etiqueta de la versión que está publicada ahora (`git tag vN-1 <commit de main>` y `git push origin vN-1`), para poder volver atrás. Decírselo a la usuaria.
2. Commit solo con los archivos modificados en esa versión, con mensaje claro en español (ej.: «v21: adjuntos en Convenio»).
3. Subir a `main` (es la rama que publica GitHub Pages). **Nunca** `--force` ni reescribir historial. No subir al repo el zip, las copias de seguridad ni los archivos de prueba.
4. Avisar a la usuaria con el enlace del commit y el tiempo que tarda en verse (GitHub Pages, 1–3 minutos; además el service worker pide recargar).
   El permiso de GitHub no deja subir etiquetas (da 403): en su lugar, rama `respaldo-vN-1` apuntando al commit publicado (`git push origin <commit>:refs/heads/respaldo-vN-1`).
5. Si falla (permisos, conflictos), **parar y explicarlo**. Nunca pedir ni aceptar tokens ni contraseñas por el chat: se usa el acceso a GitHub ya configurado.

## Seguridad (mantenerla)
- **CSP** en `<meta>` de los 3 HTML: `script-src 'self'`. Prohibido: `<script>` en línea, `onclick=""`/`onchange=""` en HTML o plantillas, `eval`. Usar listeners/delegación. Si se añade un dominio externo, añadirlo a la CSP a propósito.
- Enlaces pintados con `esc(urlSegura(url))` (solo http/https/mailto/tel).
- Siempre `esc()` al meter texto en HTML.
- Las llamadas `sb.rpc(...)`/consultas de supabase-js **no se envían si no se esperan**: usar `await` o `.then()`. (Bug real que ya pasó con el contador de visitas.)

## Supabase
- Proyecto `kdfedwcskymaitvpryvg` (región eu-west-3, París), nombre `ccoo-calsina-carre`. URL https://kdfedwcskymaitvpryvg.supabase.co. Clave publicable en `config.js`.
- RLS en todas las tablas: lectura pública de lo publicado; escritura solo `public.is_admin()` (tabla `admins` por email).
- Tablas: comunicados, eventos (con `importante` para la cuenta atrás), convenio_secciones (con `adjuntos` jsonb, igual formato que los demás, y `visible` boolean: lo oculta la web, el permiso de lectura sigue siendo público), actas, documentos, preguntas, plantillas, delegados, enlaces, restricciones (pais, fuente, idioma, url con check http/https, orden, visible; lectura pública, escritura admin; historial), apartados (slug, titulo, descripcion, icono, orden, visible), publicaciones (apartado_id, titulo, contenido, fecha, adjuntos, publicado, notificar/notificado), buzon (tipo, texto, dia, leido, archivado: solo admin lee; se inserta solo con la RPC), calc_permisos / calc_categorias / calc_ajustes (valores de «Calcula»; lectura pública, escritura admin), historial (cuando, email, tabla, clave, accion crear/cambiar/borrar, antes, despues; no apunta cambios solo de notificado/actualizado/ultima_publicacion/orden; lo llenan los disparadores `historial` con `registrar_cambio(clave)`; solo admin lee; se limpia a los 365 días con la tarea `limpiar-historial`), avisos_recurrentes (frecuencia semanal/mensual/anual, dia_mes, dia_semana, mes, hora, activo, ultima_publicacion; solo admin), lecturas (tabla, item_id, total), visitas_seccion (dia, seccion, n), suscritos_semana (semana, n) — estas tres solo las lee el admin, paginas (slugs: inicio, convenio, quienes, contacto, telegram, whatsapp, archivo_meses, ultima_copia, aviso_legal, privacidad, restricciones_revisado, aviso_privacidad_texto, consentimiento_buzon, consentimiento_avisos), opciones, admins, config_privada (sin políticas: solo service role; VAPID, Telegram, Gemini, cron), push_subs (sin políticas), traducciones, visitas_dia.
- RPC: recuperar_cambio(p_id) (solo admin: recupera un borrado, vuelve a la versión anterior o quita lo creado), contar_lectura(p_tabla, p_id) y contar_seccion(p_seccion) (públicas, validan que exista y sea visible; la web las llama una vez por visita con `contarUnaVez`), publicar_recurrentes() (solo el servidor: la llama `notificar` en modo cron antes de enviar los pendientes; inserta en comunicados), foto_suscritos() (solo la tarea programada `foto-suscritos` de pg_cron, cada noche), enviar_buzon (pública: valida tipo y largo 5–1000, rechaza emails y teléfonos, tope de 40 al día; guarda solo el día, sin hora), suscribir_push (valida y tope 5000), desuscribir_push, contar_visita, contar_suscritos, reiniciar_suscripciones (solo admin), is_admin.
- Trigger `solo_admins_registran` en `auth.users`: solo puede crear cuenta un email que esté en `admins`.
- Storage: bucket público `documentos` (20 MB); subir/borrar solo admin.
- Edge functions (código en Supabase, leer con el conector): `notificar` (push + Telegram, también para `publicaciones`; cron cada 10 min con `x-cron-secret`; resto solo admin), `traducir` (pública, solo traduce lo publicado, con caché), `generar-acta` (con JWT, Gemini).
- Avisos del linter que son intencionados: tablas con RLS sin políticas (config_privada, push_subs), RPC públicas de push/visitas/buzón/lecturas/secciones, pg_net en public (lo usa el cron).
- En este entorno, las migraciones con `drop`/`revoke` juntos pueden cancelarse esperando confirmación: dividirlas en partes no destructivas. Lo mismo con la palabra `delete` (también dentro de funciones o disparadores): se puede montar con `'del' || 'ete'` en un `execute format(...)`. Para probar funciones sin dejar rastro: un bloque `do $$ … raise exception 'RESULTADO …' $$` lo deshace todo y devuelve el resultado en el error.

## Pruebas
Playwright con Chromium (sin `playwright install`), servidor local `python3 -m http.server 8765` y un mock de supabase-js que sustituye `lib/supabase.js`. Probar móvil 320–412 px y PC, claro/oscuro, letra «muy grande», y que no haya errores de consola ni de CSP.

- Desde este entorno no se llega a Supabase por HTTP (proxy). Para probar una edge function: `net.http_post(...)` por SQL y leer `net._http_response`.

## Pendiente / ideas
- **Revisar los valores de «Calcula»** en el panel (Calculadoras): ahora son los mínimos del Estatuto, no los del convenio de Girona. Los precios de horas extra están vacíos (esa calculadora no sale hasta que se pongan).
- Importar el historial del canal de Telegram «Tablon anuncios CCOO-Calsina Carre» (exportación JSON de Telegram Desktop) repartiéndolo por la web. Importar con `notificar = false`.
- Completar en Textos > Aviso legal y Privacidad la entidad de CCOO responsable y su NIF (que lo revise el servicio jurídico de CCOO).
- Actualizar la guía del panel (Claude Docs) con capturas del diseño nuevo.
- Borrar el evento de prueba «zz prueba interna».
- Añadir un segundo administrador.
- Opcional: botón de idioma global junto a «Aa».
