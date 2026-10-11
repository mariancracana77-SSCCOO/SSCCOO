# Web Sección Sindical CCOO Calsina Carré

## Archivos
- `index.html` — la web que ven los trabajadores (Comunicados, Convenio, Calendario, Quiénes somos, Contacto)
- `admin.html` — panel para publicar (solo entra ssccoo.calsinacarre@gmail.com)
- `styles.css`, `config.js`, `manifest.json`, `sw.js`, `logo.png`, `icon-*.png` — no hace falta tocarlos

## 1. Subirla a GitHub Pages (igual que Mochila)
1. En GitHub Desktop: File → New repository → nombre `ccoo-calsina`.
2. Copia TODOS estos archivos dentro de la carpeta del repositorio.
3. Commit → Publish repository (desmarca "Keep this code private").
4. En github.com → el repositorio → Settings → Pages → Branch: `main` / `(root)` → Save.
5. En 1-2 minutos estará en: `https://TUUSUARIO.github.io/ccoo-calsina/`

## 2. Configurar Supabase (una sola vez, 1 minuto)
En supabase.com → proyecto **ccoo-calsina-carre** → Authentication → URL Configuration:
- **Site URL:** `https://TUUSUARIO.github.io/ccoo-calsina/admin.html`
- **Redirect URLs:** añade `https://TUUSUARIO.github.io/ccoo-calsina/admin.html`

(Sirve para que los enlaces de "confirmar cuenta" y "he olvidado la contraseña" lleven al panel.)

## 3. Crear la cuenta de tu padre
1. Abre `.../admin.html`.
2. Email: ssccoo.calsinacarre@gmail.com, escribe una contraseña (mín. 8 caracteres) → **Crear cuenta**.
3. Abre el email de confirmación que llega a ese Gmail y pulsa el enlace.
4. Vuelve a `admin.html` → **Entrar**. Ya puede publicar.

Si otra persona se crea una cuenta, puede entrar pero **no puede publicar nada**: solo los emails de la tabla `admins` pueden.

## Añadir otro delegado que pueda publicar
Supabase → Table Editor → tabla `admins` → Insert row → su email.

## Difundirla
- Enlace por el email de la sección y por el canal de WhatsApp/Telegram.
- Un QR en el tablón (cualquier generador de QR gratuito con el enlace).
- En el móvil: Chrome → "Instalar app" / iPhone Safari → Compartir → "Añadir a pantalla de inicio".

## Tiempo real
Si alguien tiene la web abierta cuando se publica un comunicado, le aparece un aviso "🔔 Nuevo comunicado" sin recargar. Para notificaciones con la app cerrada, usar el canal de WhatsApp/Telegram con el enlace.

## Gratis
Plan gratuito de Supabase y GitHub Pages. Ojo: Supabase **pausa los proyectos gratuitos si pasan 7 días sin ninguna visita**; con uso normal no pasará, y si pasa se reactiva desde el panel de Supabase.
