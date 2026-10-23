#!/usr/bin/env python3
"""Sube el número de versión de la web en todos los sitios a la vez.

Uso (desde la carpeta del proyecto):  python3 herramientas/version.py 64

Cambia ?v=N en index.html, admin.html y cartel.html, VERSION_WEB en config.js
y VERSION en sw.js. Al final comprueba que no ha quedado ningún número viejo:
si un archivo se queda con el ?v= antiguo, los móviles siguen usando la copia vieja.
"""
import pathlib, re, sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
HTML = ["index.html", "admin.html", "cartel.html"]

def main():
    if len(sys.argv) != 2 or not sys.argv[1].isdigit():
        sys.exit("Uso: python3 herramientas/version.py <número>   (ej.: 64)")
    nueva = sys.argv[1]
    cambios = [(f, r"\?v=\d+", "?v=" + nueva) for f in HTML] + [
        ("config.js", r'(window\.VERSION_WEB = ")\d+(")', r"\g<1>" + nueva + r"\g<2>"),
        ("sw.js", r'(const VERSION = ")\d+(")', r"\g<1>" + nueva + r"\g<2>"),
    ]
    for nombre, patron, por in cambios:
        ruta = RAIZ / nombre
        texto = ruta.read_text(encoding="utf-8")
        nuevo, n = re.subn(patron, por, texto)
        if not n:
            sys.exit(f"ERROR: no encuentro la versión en {nombre}")
        ruta.write_text(nuevo, encoding="utf-8")
        print(f"{nombre}: {n} cambio(s)")
    # Comprobación: todos los ?v= y las dos constantes deben decir lo mismo
    restos = []
    for f in HTML:
        restos += [f"{f}: ?v={v}" for v in re.findall(r"\?v=(\d+)", (RAIZ / f).read_text(encoding="utf-8")) if v != nueva]
    if f'VERSION_WEB = "{nueva}"' not in (RAIZ / "config.js").read_text(encoding="utf-8"): restos.append("config.js")
    if f'VERSION = "{nueva}"' not in (RAIZ / "sw.js").read_text(encoding="utf-8"): restos.append("sw.js")
    if restos:
        sys.exit("ERROR: han quedado versiones viejas: " + ", ".join(restos))
    print(f"Listo: todo en la versión {nueva}. Añade la línea en README.md.")

if __name__ == "__main__":
    main()
