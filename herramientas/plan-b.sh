#!/usr/bin/env bash
# Plan B: carpeta de la web lista para subirla a mano a Netlify Drop o Cloudflare Pages (sin GitHub).
# Uso (desde la carpeta del repositorio):
#   bash herramientas/plan-b.sh                         -> con la dirección de ahora (WEB_URL de config.js)
#   bash herramientas/plan-b.sh https://otra-direccion/  -> con una dirección nueva (Netlify, Cloudflare o dominio propio)
# Sale la carpeta plan-b-web/ y el zip plan-b-web.zip (no se suben al repositorio).
# Coge lo que hay en el último commit (HEAD), no lo que esté a medias sin guardar.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
ACTUAL=$(sed -n 's/^window.WEB_URL = "\(.*\)";/\1/p' config.js)
NUEVA="${1:-$ACTUAL}"
case "$NUEVA" in https://*/) ;; *) echo "La dirección tiene que empezar por https:// y acabar en /"; exit 1;; esac
OUT=plan-b-web
rm -rf "$OUT" plan-b-web.zip && mkdir "$OUT"
# Solo lo que sirve la web: fuera lo interno (documentación, pruebas, herramientas, capturas de la guía)
git archive HEAD | tar -x -C "$OUT" --exclude=CLAUDE.md --exclude=README.md --exclude=_config.yml \
  --exclude=docs --exclude=pruebas --exclude=herramientas --exclude=capturas --exclude='.git*'
# La dirección está en un solo sitio (WEB_URL de config.js) y en la vista previa al compartir (og: de index.html)
sed -i "s|$ACTUAL|$NUEVA|g" "$OUT/config.js" "$OUT/index.html"
# 404.html: en GitHub Pages la web va en /SSCCOO/; en Netlify o Cloudflare va en la raíz de su dirección
RAIZ="/$(echo "$NUEVA" | sed -E 's|https://[^/]+/||')"
sed -i "s|/SSCCOO/|$RAIZ|g" "$OUT/404.html"
# Cabeceras para Netlify y Cloudflare: que el service worker y las páginas se revisen siempre (si no, tardan en actualizarse)
cat > "$OUT/_headers" <<'EOF'
/sw.js
  Cache-Control: no-cache
/index.html
  Cache-Control: no-cache
/admin.html
  Cache-Control: no-cache
/
  Cache-Control: no-cache
EOF
(cd "$OUT" && zip -qr ../plan-b-web.zip .)
echo "Listo: $OUT/ y plan-b-web.zip con la dirección $NUEVA ($(du -sh plan-b-web.zip | cut -f1))"
