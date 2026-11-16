// Multas en Europa (Zona Conductores, v182, petición n.º 49 del padre): país por país, las multas más habituales para
// un camionero (velocidad, tacógrafo, descansos, peso, alcohol, móvil, peajes, zonas de bajas emisiones, pago en el
// acto y otras). Los datos están en la tabla «multas_paises» (los corrige el padre en el panel, «Multas en Europa»):
// cada fila con su fuente, la fecha en que se comprobó y «revisar» si no se ha podido confirmar en una página oficial.
// Solo se leen las visibles. Todo con esc(), los enlaces con urlSegura() y sin estilos en línea (CSP).
// En el móvil solo se guarda el país y el tema elegidos («ccoo-multas»). La traducción: grupo «multas» de «traducir»
// (los textos de aquí y los de la tabla); zona-idioma.js la pone encima de lo pintado.
(function () {
  const $ = (i) => document.getElementById(i);
  if (!$("v-multas")) return;
  /* textos */
  const TEMAS = [
    ["velocidad", "Velocidad"], ["tacografo", "Tacógrafo"], ["descansos", "Conducción y descansos"], ["peso", "Exceso de peso"],
    ["alcohol", "Alcohol"], ["movil", "Móvil"], ["peaje", "Peajes y viñetas"], ["zbe", "Zonas de bajas emisiones"],
    ["pago", "Pago en el acto e inmovilización"], ["otros", "Otras"]
  ];
  /* fin textos */
  const Z = typeof ZonaIdioma === "function" ? ZonaIdioma("multas", "v-multas", () => pinta()) : { T: (x, v) => x.replace(/\{(\w+)\}/g, (m, k) => v && v[k] != null ? v[k] : m) };
  const T = Z.T;
  const CLAVE = "ccoo-multas";
  let filas = null, error = false, pais = "", tema = "", qv = "";
  try { const g = JSON.parse(localStorage.getItem(CLAVE) || "{}"); pais = typeof g.pais === "string" ? g.pais : ""; tema = typeof g.tema === "string" ? g.tema : ""; } catch (_) {}
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify({ pais, tema })); } catch (_) {} };
  const n = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const nomTema = (k) => T((TEMAS.find(t => t[0] === k) || [, "Otras"])[1]);
  const fecha = (d) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ""); return m ? `${+m[3]}/${+m[2]}/${m[1]}` : ""; };

  async function carga() {
    error = false;
    try {
      const { data, error: e } = await sb.from("multas_paises").select("id,pais,nombre,tema,titulo,importe,texto,en_el_acto,fuente,url,revisado,revisar,orden").eq("visible", true).order("orden").order("id");
      if (e) throw e;
      filas = data || [];
    } catch (_) { filas = null; error = true; }
    pinta();
  }

  // Países en el orden de la tabla (el de la primera fila de cada uno)
  const paises = () => { const vistos = new Map(); for (const f of filas || []) if (!vistos.has(f.pais)) vistos.set(f.pais, f.nombre); return [...vistos]; };

  function pintaPaises() {
    const ps = paises();
    if (pais && !ps.some(p => p[0] === pais)) pais = "";
    $("mu-pais").innerHTML = `<option value="">${esc(T("Todos los países"))}</option>` + ps.map(([c, nom]) => `<option value="${esc(c)}"${c === pais ? " selected" : ""}>${esc(T(nom))}</option>`).join("");
  }
  function pintaTemas() {
    const hay = new Set((filas || []).filter(f => !pais || f.pais === pais).map(f => f.tema));
    if (tema && !hay.has(tema)) tema = "";
    $("mu-temas").innerHTML = [["", T("Todo")], ...TEMAS.filter(t => hay.has(t[0])).map(t => [t[0], T(t[1])])]
      .map(([v, t]) => `<button type="button" class="zc-chip${v === tema ? " activa" : ""}" data-t="${esc(v)}" aria-pressed="${v === tema}">${esc(t)}</button>`).join("");
  }
  function tarjeta(f, conPais) {
    const url = f.url ? urlSegura(f.url) : "";
    const marcas = [f.en_el_acto ? `<span class="mu-marca mu-acto">${esc(T("Se paga en el acto"))}</span>` : "", f.revisar ? `<span class="mu-marca mu-revisar">${esc(T("Revisar: puede no estar al día"))}</span>` : ""].join("");
    return `<article class="panel mu-multa${f.revisar ? " mu-dudosa" : ""}">
      <div class="zc-cat">${conPais ? `<span>${esc(T(f.nombre))}</span> · ` : ""}<span>${esc(nomTema(f.tema))}</span></div>
      <h3 class="mu-tit">${esc(T(f.titulo))}</h3>
      ${f.importe ? `<p class="mu-importe">${esc(T(f.importe))}</p>` : ""}
      ${marcas ? `<div class="mu-marcas">${marcas}</div>` : ""}
      ${f.texto ? `<p class="mu-texto">${esc(T(f.texto))}</p>` : ""}
      <p class="mu-fuente">${url && url !== "#" ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(f.fuente || T("Fuente"))}</a>` : esc(f.fuente || "")}${f.revisado ? ` <span>· ${esc(T("Comprobado el {f}", { f: fecha(f.revisado) }))}</span>` : ""}</p>
    </article>`;
  }
  function pinta() {
    const lista = $("mu-lista"), cuenta = $("mu-cuenta");
    if (error) { cuenta.textContent = ""; lista.innerHTML = `<div class="panel zc-caja"><p>${esc(T("No se ha podido cargar la guía. Mira si tienes conexión."))}</p><button type="button" class="btn sec" id="mu-otra">${esc(T("Volver a intentarlo"))}</button></div>`; return; }
    if (!filas) { cuenta.textContent = ""; lista.innerHTML = `<p class="zc-pista">${esc(T("Cargando…"))}</p>`; return; }
    pintaPaises(); pintaTemas();
    const q = n(qv);
    const r = filas.filter(f => (!pais || f.pais === pais) && (!tema || f.tema === tema) && (!q || [f.nombre, f.titulo, f.importe, f.texto, T(f.titulo), T(f.texto || ""), T(f.nombre)].some(s => n(s).indexOf(q) >= 0)));
    cuenta.textContent = r.length === 1 ? T("1 multa") : T("{n} multas", { n: r.length });
    if (!r.length) { lista.innerHTML = `<p class="zc-vacio">${esc(filas.length ? T("No hay resultados. Prueba con otra palabra u otro país.") : T("Todavía no hay multas apuntadas."))}</p>`; return; }
    // Agrupadas por país (en un país, por tema en el orden de TEMAS)
    const orden = (f) => TEMAS.findIndex(t => t[0] === f.tema);
    const grupos = [];
    for (const f of r) { let g = grupos.find(x => x.pais === f.pais); if (!g) grupos.push(g = { pais: f.pais, nombre: f.nombre, l: [] }); g.l.push(f); }
    lista.innerHTML = grupos.map(g => {
      const l = g.l.slice().sort((a, b) => orden(a) - orden(b));
      const dudas = l.filter(f => f.revisar).length;
      return `<section class="mu-pais"><h2 class="mu-pais-tit">${esc(T(g.nombre))}</h2>${dudas ? `<p class="zc-pista">${esc(dudas === 1 ? T("1 dato marcado «Revisar»: no se ha podido confirmar en una página oficial.") : T("{n} datos marcados «Revisar»: no se han podido confirmar en una página oficial.", { n: dudas }))}</p>` : ""}${l.map(f => tarjeta(f, false)).join("")}</section>`;
    }).join("");
  }

  $("mu-pais").addEventListener("change", (e) => { pais = e.target.value; guarda(); pinta(); });
  $("mu-temas").addEventListener("click", (e) => { const b = e.target.closest(".zc-chip"); if (b) { tema = b.dataset.t; guarda(); pinta(); } });
  $("mu-q").addEventListener("input", (e) => { qv = e.target.value; pinta(); });
  $("mu-lista").addEventListener("click", (e) => { if (e.target.closest("#mu-otra")) { filas = null; pinta(); carga(); } });
  // Se carga la primera vez que se abre la herramienta (no en cada visita a la web)
  let pedido = false;
  const mira = () => { if (location.hash === "#multas" && !pedido) { pedido = true; carga(); } };
  window.addEventListener("hashchange", mira);
  mira();
  pinta();
})();
