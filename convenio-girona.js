// Tablas del convenio de Girona 2026-2027 que usan «Mi finiquito» (finiquito.js) y «Mi hora ordinaria» (hora.js).
// Un solo sitio para las dos (v174, lo pidió el Coordinador): si cambia una cifra, se cambia aquí y sale igual en las dos.
// Las cifras son las de las calculadoras del padre, sin cambiar nada (BOP 160, 20/08/2026; sin comprobar con el BOP:
// en internet solo se encontró el de 2025). No guarda nada en el móvil.
// TAB: clave → [nombre, [base 2026, plus convenio 2026, hora extra 2026], [base 2027, plus convenio 2027, hora extra 2027]]
const CONVENIO_GIRONA = Object.freeze({
  // v177 (petición n.º 45): los nombres de entre /* textos */ y /* fin textos */ los traduce la función «traducir» (zona-idioma.js)
  /* textos */
  TAB: Object.freeze({
    cm: ["Conductor mecánico", [1188.56, 191.66, 13.06], [1230.16, 198.37, 13.52]],
    c: ["Conductor", [1082.40, 184.58, 11.83], [1120.28, 191.04, 12.24]],
    cf: ["Conductor de moto y furgoneta", [1008.08, 179.64, 11.02], [1043.36, 185.93, 11.41]],
    aj: ["Ayudante", [976.22, 177.51, 11.02], [1010.39, 183.72, 11.41]],
    me: ["Mozo especializado / carretillero", [953.66, 192.16, 10.29], [987.04, 198.88, 10.65]],
    mc: ["Mozo de carga, descarga y repartidor", [941.24, 204.58, 9.90], [974.18, 211.74, 10.25]],
    ct: ["Jefe de tráfico de 3ª", [1236.33, 194.85, 13.39], [1279.60, 201.67, 13.86]],
    a1: ["Oficial 1ª administrativo", [1292.03, 198.56, 13.82], [1337.25, 205.51, 14.30]],
    a2: ["Oficial 2ª administrativo", [1127.50, 187.60, 12.15], [1166.96, 194.17, 12.58]]
  }),
  /* fin textos */
  // Antigüedad: % del salario base según los años en la empresa (sube a los 4, 9, 14, 19 y 24 años)
  pctAntiguedad: (anios) => anios >= 24 ? 50 : anios >= 19 ? 40 : anios >= 14 ? 30 : anios >= 9 ? 20 : anios >= 4 ? 10 : 0
});
