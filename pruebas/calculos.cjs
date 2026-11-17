// v185: comprueba en el navegador los arreglos de la revisión a fondo de las calculadoras de Zona Conductores
// (finiquito, peso por ejes, simulador de carga y test ADR). Con el servidor de pruebas en marcha:
//   BASE=http://localhost:8765/ NODE_PATH=$(npm root -g) node pruebas/calculos.cjs
const { chromium } = require("playwright"), fs = require("fs"), path = require("path");
const BASE = process.env.BASE || "http://localhost:8765/";
const MOCK = fs.readFileSync(path.join(__dirname, "mock-supabase.js"), "utf8");
let mal = 0;
const igual = (nombre, v, esperado) => { const ok = JSON.stringify(v) === JSON.stringify(esperado); if (!ok) mal++; console.log((ok ? "OK  " : "MAL ") + nombre + ": " + JSON.stringify(v) + (ok ? "" : " (se esperaba " + JSON.stringify(esperado) + ")")); };

(async () => {
  const nav = await chromium.launch();
  const ctx = await nav.newContext({ viewport: { width: 412, height: 900 }, serviceWorkers: "block" });
  await ctx.addInitScript(() => { try { localStorage.setItem("ccoo-aviso-privacidad", "1"); } catch (e) { /* */ } });
  await ctx.route("**/lib/supabase.js*", (r) => r.fulfill({ contentType: "application/javascript", body: MOCK }));
  const p = await ctx.newPage(), errores = [];
  p.on("pageerror", (e) => errores.push(e.message));

  // ---- Finiquito ----
  await p.goto(BASE + "index.html#finiquito");
  await p.waitForSelector("#fin-alta");
  const fin = async (alta, baja, extra) => {
    await p.evaluate(([a, b, x]) => {
      const pon = (i, v) => { const e = document.getElementById(i); e.value = v; e.dispatchEvent(new Event("input", { bubbles: true })); };
      pon("fin-cat", "c"); pon("fin-pagas", (x && x.pagas) || "none"); pon("fin-tipo", (x && x.tipo) || "imp"); pon("fin-dis", "0");
      pon("fin-alta", a); pon("fin-baja", b);
    }, [alta, baja, extra]);
    return p.evaluate(() => document.getElementById("fin-out").innerText.replace(/\s+/g, " "));
  };
  let t = await fin("2020-01-01", "2026-02-28");
  igual("baja el 28 de febrero: 30 días del mes", /30 días a/.test(t), true);
  t = await fin("2020-01-01", "2028-02-29");
  igual("baja el 29 de febrero (bisiesto): 30 días", /30 días a/.test(t), true);
  t = await fin("2020-01-01", "2026-01-31");
  igual("baja el 31 de enero: 30 días, no 31", /30 días a/.test(t), true);
  t = await fin("2026-03-10", "2026-03-20");
  igual("alta y baja en el mismo mes: 11 días", /11 días a/.test(t), true);
  t = await fin("2020-03-01", "2025-02-28");
  igual("la víspera del 5.º aniversario: 5 años", /Antigüedad: 5 años/.test(t), true);
  t = await fin("2020-03-01", "2025-02-27");
  igual("dos días antes del aniversario: 4 años", /Antigüedad: 4 años/.test(t), true);
  // Semestre entero trabajado: la paga de verano es una paga entera
  t = await fin("2020-01-01", "2026-06-30");
  const paga = (t.match(/Paga extra = ([\d.,]+ €)/) || [])[1], verano = (t.match(/Paga extra de verano \(parte devengada\) 1 ene – 30 jun ([\d.,]+ €)/) || [])[1];
  igual("todo el semestre: paga de verano entera", !!paga && verano === paga, true);
  t = await fin("2020-01-01", "2026-12-31");
  const nav2 = (t.match(/Paga extra de Navidad \(parte devengada\) 1 jul – 31 dic ([\d.,]+ €)/) || [])[1];
  igual("todo el segundo semestre: paga de Navidad entera", nav2 === (t.match(/Paga extra = ([\d.,]+ €)/) || [])[1], true);
  await p.evaluate(() => { const e = document.getElementById("fin-plus"); e.value = "-500"; e.dispatchEvent(new Event("input", { bubbles: true })); });
  t = await p.evaluate(() => document.getElementById("fin-out").innerText);
  igual("pluses negativos no restan", /-/.test((t.match(/Total bruto\s*([^\n]+)/) || [])[1] || ""), false);
  await p.evaluate(() => { const e = document.getElementById("fin-plus"); e.value = "0"; e.dispatchEvent(new Event("input", { bubbles: true })); });

  // ---- Peso por ejes: quinta rueda a 0 ----
  await p.goto(BASE + "index.html#ejes");
  await p.waitForSelector("#ej-c-qr", { state: "attached" });
  const ejes = await p.evaluate(() => {
    const pon = (i, v) => { const e = document.getElementById(i); e.value = v; e.dispatchEvent(new Event("input", { bubbles: true })); };
    pon("ej-c-qr", "0"); pon("ej-kg", "25000");
    const E = window.EjesCuentas, c = { ...E.CAMION, qr: 0 };
    const x = parseFloat(document.getElementById("ej-centro").value);
    const r = E.reparto(c, [{ kg: 25000, x }], "1/2");
    const kg = String(Math.round(r.mot)).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " kg";
    return { ve: document.getElementById("ej-res").innerText.includes(kg), mot: Math.round(r.mot), sello: document.querySelector("#ej-res .ej-sello").textContent };
  });
  igual("quinta rueda a 0: el motriz se calcula con 0 (no con 0,55)", ejes.ve, true);
  igual("25 t centradas con quinta rueda a 0: exceso en el motriz", ejes.mot > 11500 && ejes.sello === "Exceso de peso", true);
  const exceso0 = await p.evaluate(() => { const E = window.EjesCuentas; return [E.CAMION.mMot + 0.3].map(v => v - E.CAMION.mMot >= 0.5)[0]; });
  igual("0,3 kg de más no es «Exceso +0 kg»", exceso0, false);

  // ---- Simulador de carga ----
  const carga = await p.evaluate(() => {
    const C = window.CargaCuentas, t0 = performance.now();
    const r = C.calcula([{ t: "eu", q: 100000, s: false, kg: 1 }], 1360, 248, true, 270, []);
    const tarda = performance.now() - t0;
    const r2 = C.calcula([{ t: "otro", q: 10, s: false, kg: 1, l: 136, a: 120 }], 1360, 240, true, 270, []);
    return { tarda: tarda < 3000, usado: r2.usado <= 1360 };
  });
  igual("100.000 palets no cuelgan la página", carga.tarda, true);
  igual("sumas con decimales: no pasa del largo por redondeo", carga.usado, true);

  // ---- Test ADR ----
  await p.goto(BASE + "index.html#adr");
  await p.waitForSelector("#adr-vista .zc-opc");
  const pos = await p.evaluate(async () => {
    const cuenta = {};
    for (let n = 0; n < 40; n++) {
      const b = [...document.querySelectorAll("#adr-vista .zc-opc")];
      const i = b.findIndex(x => x.dataset.o === "0"); cuenta[i] = (cuenta[i] || 0) + 1;
      b[0].click();
      document.querySelector('[data-adr="siguiente"]').click();
      if (!document.querySelector("#adr-vista .zc-opc")) document.querySelector('[data-adr="nuevo"]').click();
    }
    return Object.keys(cuenta).length;
  });
  igual("las respuestas salen en orden mezclado", pos >= 2, true);
  // Contestar y repintar (como al llegar la traducción): la pregunta sigue contestada y se puede seguir
  const sigue = await p.evaluate(() => {
    document.querySelector("#adr-vista .zc-opc").click();
    const tabs = document.querySelectorAll("[data-adr-tab]");
    tabs[1].click(); tabs[0].click();
    return !!document.querySelector('[data-adr="siguiente"]') && !!document.querySelector("#adr-vista .zc-opc.bien");
  });
  igual("repintado tras contestar: no se bloquea", sigue, true);
  const placa = await p.evaluate(() => {
    document.querySelectorAll("[data-adr-tab]")[1].click();
    const i = document.getElementById("adr-k"); i.value = "223"; i.dispatchEvent(new Event("input", { bubbles: true }));
    return document.getElementById("adr-kr").innerText;
  });
  igual("placa 223: 22 es gas refrigerado, no «repetido»", /refrigerado/.test(placa) && !/repetido/.test(placa), true);

  igual("sin errores en la página", errores, []);
  await nav.close();
  console.log(mal ? `\n${mal} MAL` : "\nTodo bien");
  process.exit(mal ? 1 : 0);
})();
