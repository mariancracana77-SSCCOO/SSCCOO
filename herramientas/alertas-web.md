# Buzón de alertas de la web (rama `alertas-web`, NUNCA fusionar ni cerrar)

Lo pidió Lorena (5/11/2026): «modo alerta», si la web publicada se rompe, que despierte a Claude para arreglarlo al momento.

- Supabase vigila la web gratis cada 5 min (tarea `vigila-web` → `privado.web_vigila()`): pide la portada, el panel, `sw.js` y los archivos con la versión que pide la portada.
- Si falla dos rondas seguidas (~10 min), la edge function `alerta-web` deja un comentario «ALERTA» en esta PR (despierta a la sesión «Lorena-web») y en la PR buzón n.º 2 (despierta a «Timbres»). Cuando vuelve a ir bien, comenta «Resuelto».
- Arregla quien llegue primero, cogiendo antes el turno `ajustes/publicando` de la app de Lorena: rama `respaldo-vN`, `git revert` de la última publicación como versión nueva, sin --force, comprobar y avisar a Lorena.
- Los comentarios no llevan datos: solo qué archivo falla.
