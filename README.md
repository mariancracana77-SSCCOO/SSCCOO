# Web Sección Sindical CCOO Calsina Carré

- Web para los trabajadores: https://mariancracana77-ssccoo.github.io/SSCCOO/
- Panel para publicar: https://mariancracana77-ssccoo.github.io/SSCCOO/admin.html

## Qué tiene la web
- **Inicio**: el aviso más importante (urgente o fijado), últimos avisos, próximas fechas y accesos rápidos.
- **Avisos**: todos los comunicados, con buscador y filtro por categoría. Los urgentes salen en rojo y los fijados arriba.
- **Calendario**: vista de mes con un color por tipo (asamblea, reunión, negociación, elecciones, festivo). Al tocar un día se ve lo que hay.
- **Convenio**: apartados que se abren al tocarlos, con buscador y filtro, y la lista de documentos PDF al lado.
- **Actas**: agrupadas por año, con resumen, acuerdos y el PDF del acta completa.
- **Nosotros**: quiénes somos y contacto.

Si alguien tiene la web abierta cuando se publica un aviso, le aparece un mensaje al momento.

## Cómo publica tu padre
Entra en `admin.html`. Arriba hay una pestaña por sección: Avisos, Calendario, Convenio, Actas, Documentos y Textos.
En cada una: rellena el formulario y pulsa **Publicar**. En la lista de la derecha (abajo en el móvil) puede **editar** o **borrar** lo que ya está publicado.

Para dar formato al texto:
- Línea en blanco entre párrafos.
- Empezar una línea con `- ` para hacer una lista.
- `**así**` para poner negrita.

## Archivos (no hace falta tocarlos)
`index.html`, `app.js` (web) · `admin.html`, `admin.js` (panel) · `styles.css` · `config.js` (conexión con Supabase) · `iconos.js` · `manifest.json`, `sw.js` (para instalarla como app) · `logo.png`, `icon-*.png` · `.nojekyll`

## Ajustes (todo desde el panel, sin tocar código)
En la pestaña **Ajustes** del panel se pueden añadir, renombrar, ordenar, cambiar de color y quitar las categorías y tipos de todas las secciones (filtros de avisos, tipos de acta, tipos del calendario, categorías del convenio y de documentos).

También se añade o se quita a otros delegados que puedan publicar. La persona añadida entra en `admin.html` y pulsa «Primera vez: crear la cuenta».

## Gratis
Supabase (plan gratuito) y GitHub Pages. Supabase pausa los proyectos gratuitos si pasan 7 días sin ninguna visita; si pasa, se reactiva desde el panel de Supabase.

## Asistente de actas (gratis)
En el panel, pestaña **Actas**: pega las notas de la reunión y pulsa **Generar acta**. Rellena título, tipo, fecha, resumen y acuerdos; se revisa y se pulsa **Publicar**. Nunca publica solo.

Usa la IA gratuita de Google (Gemini). La clave se crea gratis en https://aistudio.google.com (botón «Get API key») y se guarda en Supabase → Edge Functions → Secrets con el nombre `GEMINI_API_KEY`.
Ojo: en el plan gratuito Google puede usar lo que se le envía para mejorar sus productos, así que no conviene poner nombres ni datos personales ni información confidencial de la empresa. Tiene un límite de usos diario, de sobra para unas cuantas actas.
