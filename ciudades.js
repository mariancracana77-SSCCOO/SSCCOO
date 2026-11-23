// v209: lista propia de ciudades de Europa (ciudades.json: Natural Earth, dominio público, y GeoNames, CC BY 4.0, por
// Open-Meteo) para buscar sitios sin depender de nadie: se usa cuando la función «ruta» no encuentra el sitio o no
// contesta (desde el 23/11/2026 los buscadores gratis le bloquean el servidor), y también sin internet.
// Cada ciudad: [nombre, país, lat, lon, habitantes, [otros nombres sin tildes]]. Se carga solo al buscar.
(function () {
  "use strict";
  const plano = (s) => String(s || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const lev = (a, b, max) => {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let ante = null, ant = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const fila = [i]; let menor = i;
      for (let j = 1; j <= b.length; j++) {
        let v = Math.min(ant[j] + 1, fila[j - 1] + 1, ant[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (ante && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, ante[j - 2] + 1);
        fila.push(v); if (v < menor) menor = v;
      }
      if (menor > max) return max + 1;
      ante = ant; ant = fila;
    }
    return ant[b.length];
  };
  let LISTA = null, CARGANDO = null;
  function carga() {
    if (LISTA) return Promise.resolve(LISTA);
    if (!CARGANDO) CARGANDO = fetch("ciudades.json?v=" + encodeURIComponent(window.VERSION_WEB || ""))
      .then(r => r.ok ? r.json() : { c: [] })
      .then(d => (LISTA = (Array.isArray(d.c) ? d.c : []).map(c => ({ nombre: c[0], pais: c[1], lat: c[2], lon: c[3], hab: c[4], nombres: [...new Set([plano(c[0]), ...(c[5] || []).map(plano)])] }))))
      .catch(() => { CARGANDO = null; return []; });
    return CARGANDO;
  }
  // Lo que se parece lo escrito a una ciudad: 3 igual, 2 empieza así, 1 con una o dos faltas; 0 nada
  function nota(q, c) {
    let m = 0;
    for (const n of c.nombres) {
      if (n === q) return 3;
      if (q.length >= 3 && n.startsWith(q)) m = Math.max(m, 2);
      else {
        const t = q.length >= 8 ? 2 : q.length >= 4 ? 1 : 0;
        if (t && lev(q, n, t) <= t) m = Math.max(m, 1);
      }
    }
    return m;
  }
  const sinPais = (q) => q.replace(/ (espana|francia|france|italia|italy|alemania|germany|deutschland|portugal|belgica|belgium|suiza|austria|polonia|rumania|romania|holanda|paises bajos)$/, "");
  // Las ciudades que se parecen a lo escrito, de la que más a la que menos (y las grandes antes), en el formato de «ruta»
  async function busca(texto, n = 5) {
    const q = sinPais(plano(texto)); if (q.length < 2) return [];
    const l = await carga();
    return l.map(c => [c, nota(q, c)]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1] || b[0].hab - a[0].hab).slice(0, n)
      .map(([c, s]) => ({ nombre: c.nombre + ", " + c.pais, detalle: c.pais, lat: c.lat, lon: c.lon, exacta: s === 3 }));
  }
  window.Ciudades = { carga, busca, plano, lev };
})();
