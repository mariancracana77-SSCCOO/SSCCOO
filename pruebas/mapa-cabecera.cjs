// v205: el mapa (Leaflet) nunca pasa por encima de la cabecera ni de la barra de abajo al subir y bajar la pantalla.
// Mira con elementFromPoint en el borde de la cabecera y de la barra fija con el mapa justo debajo, en «Accesos y
// muelles» (mapa de clientes y el de elegir el punto) y en «Aparcamientos en mi ruta», a 320/360/412 px, claro y oscuro.
// Uso: BASE=http://localhost:8765/ NODE_PATH=$(npm root -g) node pruebas/mapa-cabecera.cjs
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(); let mal = 0; const errs = [];
  const ok = (c, t) => { console.log((c ? 'OK  ' : 'MAL ') + t); if (!c) mal++; };
  const BASE = process.env.BASE || 'http://localhost:8765/';
  const fichas = [{ id: 'm001', nombre: 'Brotte SA', truco: 'Puerta 2', nivel: 'facil', lat: 41.98, lon: 2.82 }, { id: 'm002', nombre: 'Max Plastic', truco: 'Rampa', nivel: 'dificil', lat: 42.0, lon: 2.9 }];
  for (const w of [320, 360, 412]) for (const dark of [false, true]) {
    const c = await b.newContext({ viewport: { width: w, height: 700 }, colorScheme: dark ? 'dark' : 'light', isMobile: true, hasTouch: true, deviceScaleFactor: 2.6 });
    await c.route('**/lib/supabase.js*', r => r.fulfill({ path: path.join(__dirname, 'mock-supabase.js'), contentType: 'application/javascript' }));
    await c.route('**/tile.openstreetmap.org/**', r => r.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000D4944415478DA63F8FFFF3F0005FE02FEA7D6A5A30000000049454E44AE426082', 'hex') }));
    await c.addInitScript((f) => { localStorage.setItem('ccoo-aviso-privacidad', '1'); localStorage.setItem('ccoo-bienvenida', '1'); localStorage.setItem('ccoo-muelles', JSON.stringify({ v: 1, fichas: f })); }, fichas);
    const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(BASE + '#muelles'); await p.waitForTimeout(1300);
    // ¿Qué hay encima en la franja de la cabecera y de la barra de abajo cuando el mapa pasa por debajo?
    const mira = async (sel, nom) => {
      await p.waitForSelector(sel + ' .leaflet-pane', { state: 'attached', timeout: 8000 }); await p.waitForTimeout(500);
      const r = await p.evaluate((s) => {
        const m = document.querySelector(s), out = [];
        const fijos = [...document.querySelectorAll('body *')].filter(e => { const st = getComputedStyle(e); const bb = e.getBoundingClientRect(); return (st.position === 'sticky' || st.position === 'fixed') && e.offsetHeight > 20 && bb.bottom > 0 && bb.top < innerHeight && st.pointerEvents !== 'none' && Number(st.opacity) > 0.1 && !m.contains(e) && !e.contains(m) && st.display !== 'none' && st.visibility !== 'hidden'; });
        for (const dy of [-1, 1]) {
          const mb = m.getBoundingClientRect();
          for (const f of fijos) {
            const fb = f.getBoundingClientRect(); if (fb.height > innerHeight / 2) continue;
            // Mueve la página para que el mapa quede justo debajo de este elemento fijo
            window.scrollBy(0, mb.top - fb.top + dy * 10); const m2 = m.getBoundingClientRect(), f2 = f.getBoundingClientRect();
            const y = Math.max(f2.top, m2.top) + Math.min(f2.height, m2.height, 30) / 2, x = Math.min(m2.right, f2.right) - 8;
            if (y < f2.top || y > f2.bottom || y < m2.top || y > m2.bottom) continue;
            const e = document.elementFromPoint(x, y);
            out.push({ f: f.className || f.id || f.tagName, encima: !!(e && f.contains(e)), sale: e ? (e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className) || e.tagName : '' });
          }
        }
        return out;
      }, sel);
      // Los botones + y − del mapa (Leaflet les pone z-index 1000): con el mapa a 40 px de arriba, deben quedar tapados
      const ctl = await p.evaluate((s) => {
        const m = document.querySelector(s); window.scrollBy(0, m.getBoundingClientRect().top - 40);
        const z = m.querySelector('.leaflet-control-zoom'); if (!z) return null;
        const zb = z.getBoundingClientRect(), e = document.elementFromPoint(zb.left + zb.width / 2, zb.top + zb.height / 2);
        return !!(e && !m.contains(e));
      }, sel);
      ok(ctl === true, `${w}px ${dark ? 'oscuro' : 'claro'} ${nom}: los botones + y − no salen encima de la cabecera`);
      ok(r.length > 0 && r.every(x => x.encima), `${w}px ${dark ? 'oscuro' : 'claro'} ${nom}: cabecera/barras por encima del mapa (${[...new Set(r.map(x => x.f))].join(', ')})` + r.filter(x => !x.encima).map(x => ' · tapa «' + x.f + '» con ' + x.sale).join(''));
    };
    await p.click('#mue-ver-mapa'); await mira('#mue-mapa', 'mapa de clientes');
    await p.click('#mue-cierra-mapa').catch(() => {});
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.click('#mue-nuevo'); await p.waitForTimeout(400);
    await p.click('#mue-elegir'); await p.waitForTimeout(800);
    await mira('#mue-elige-mapa', 'elegir el punto');
    await c.close();
  }
  ok(!errs.length, 'sin errores: ' + errs.slice(0, 2).join(' | '));
  await b.close(); console.log(mal ? `\n${mal} MAL` : '\nTodo bien'); process.exit(mal ? 1 : 0);
})();
