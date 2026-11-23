// v207 (petición n.º 71): buscar un sitio encima de los mapas de muelles (pueblo por la función «ruta», coordenadas
// y enlaces de mapa leídos en el móvil), «Estoy aquí: marcar mi posición», el botón de la diana y «Cerca de mí (50 km)».
// Con la ubicación permitida y sin permiso. Uso: BASE=http://localhost:8765/ NODE_PATH=$(npm root -g) node pruebas/muelles-v207.cjs
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(); const errs = []; let mal = 0;
  const ok = (c, t) => { console.log((c ? 'OK  ' : 'MAL ') + t); if (!c) mal++; };
  const BASE = process.env.BASE || 'http://localhost:8765/';
  const PNG = Buffer.from('89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000D4944415478DA63F8FFFF3F0005FE02FEA7D6A5A30000000049454E44AE426082', 'hex');
  const FICHAS = [
    { id: 'ma', nombre: 'Cerca SL', truco: 'Puerta 1', nivel: 'facil', lat: 41.99, lon: 2.83 },
    { id: 'mb', nombre: 'Lejos SA', truco: 'Puerta 2', nivel: 'cuidado', lat: 41.4, lon: 2.17 },
    { id: 'mc', nombre: 'Figueres Logística', truco: 'Puerta 3', nivel: 'dificil', lat: 42.266, lon: 2.96 },
    { id: 'md', nombre: 'Sin sitio', truco: 'Puerta 4', nivel: 'facil' }];
  const nuevo = async (permiso, ancho, oscuro) => {
    const c = await b.newContext({ viewport: { width: ancho || 360, height: 760 }, colorScheme: oscuro ? 'dark' : 'light', geolocation: { latitude: 41.98, longitude: 2.82 }, permissions: permiso ? ['geolocation'] : [] });
    await c.route('**/lib/supabase.js*', r => r.fulfill({ path: path.join(__dirname, 'mock-supabase.js'), contentType: 'application/javascript' }));
    await c.route('**/tile.openstreetmap.org/**', r => r.fulfill({ body: PNG, contentType: 'image/png' }));
    await c.addInitScript((f) => { try { localStorage.setItem('ccoo-aviso-privacidad', '1'); localStorage.setItem('ccoo-bienvenida', '1'); localStorage.setItem('ccoo-muelles', JSON.stringify({ v: 1, fichas: f })); } catch (e) {} }, FICHAS);
    const p = await c.newPage(); p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', e => errs.push(e.message));
    p.on('dialog', d => { errs.push('dialogo: ' + d.message()); d.dismiss(); });
    await p.goto(BASE + '#muelles'); await p.waitForTimeout(1200);
    return { c, p };
  };
  const nombres = (p) => p.$$eval('#mue-lista .mue-ficha h3', l => l.map(x => x.textContent));
  const fic = (p, n) => p.$$eval('#mue-lista .mue-ficha', (l, n) => (l.find(x => x.querySelector('h3').textContent === n) || {}).textContent || '', n);
  const res = (p, d) => p.textContent(`[data-sitio-res="${d}"]`);

  // ---- Con permiso de ubicación ----
  { const { c, p } = await nuevo(true);
    ok(await p.isVisible('#mue-cerca'), 'sale «Cerca de mí (50 km)»');
    await p.click('#mue-cerca'); await p.waitForTimeout(500);
    const n = await nombres(p);
    ok(n.join('|') === 'Cerca SL|Figueres Logística', 'cerca de mí: solo a menos de 50 km, del más cerca al más lejos: ' + n.join(', '));
    ok((await p.textContent('#mue-cuenta')).includes('2 clientes a menos de 50 km') && /A 1,4 km de ti/.test(await fic(p, 'Cerca SL')) && /A 3\d km de ti/.test(await fic(p, 'Figueres Logística')), 'cuenta y km en cada ficha: ' + (await p.textContent('#mue-lista .mue-dist')));
    ok(await p.getAttribute('#mue-cerca', 'aria-pressed') === 'true', 'el botón queda marcado');
    await p.click('#mue-cerca'); await p.waitForTimeout(300);
    ok((await nombres(p)).length === 4 && !(await p.$('#mue-lista .mue-dist')), 'otra vez: salen todos, sin km');

    // Formulario: «Estoy aquí» y «Mover el punto en el mapa»
    await p.click('#mue-nuevo');
    ok((await p.textContent('#mue-gps')).includes('Estoy aquí: marcar mi posición') && (await p.textContent('.mue-priv')).includes('no se envía'), 'botón «Estoy aquí» y nota de privacidad');
    await p.click('#mue-gps'); await p.waitForTimeout(600);
    ok(await p.inputValue('#mue-lat') === '41.98' && await p.inputValue('#mue-lon') === '2.82' && (await p.textContent('#mue-elegir')).includes('Mover el punto en el mapa'), 'estoy aquí: pone el punto y ofrece moverlo');
    await p.click('#mue-elegir'); await p.waitForSelector('#mue-elige-mapa .leaflet-marker-icon', { timeout: 8000 });
    ok(await p.isVisible('#mue-sitio-elige') && await p.isVisible('[data-yo="elige"]'), 'el mapa de elegir trae buscador y botón de la diana');
    // Coordenadas con Enter: no guarda la ficha
    await p.fill('#mue-sitio-elige', '41.5, 2.1'); await p.press('#mue-sitio-elige', 'Enter'); await p.waitForTimeout(300);
    ok(await p.inputValue('#mue-lat') === '41.5' && await p.inputValue('#mue-lon') === '2.1' && await p.isVisible('#mue-form'), 'coordenadas pegadas + Enter: pone el punto y no guarda el formulario');
    for (const [t, la, lo] of [['41,7 2,9', '41.7', '2.9'], ['https://www.google.com/maps/place/Muelle/@41.1,1.2,17z/data=!3m1!4b1!4m5!3m4!1s0x0:0x0!8m2!3d41.2003!4d1.3004', '41.2003', '1.3004'], ['https://www.openstreetmap.org/?mlat=42.1&mlon=2.4#map=17/42.1/2.4', '42.1', '2.4'], ['https://maps.google.com/?q=41.95,2.75', '41.95', '2.75'], ['geo:41.8,2.6?z=16', '41.8', '2.6']]) {
      await p.fill('#mue-sitio-elige', t); await p.click('[data-sitio-buscar="elige"]'); await p.waitForTimeout(250);
      ok(await p.inputValue('#mue-lat') === la && await p.inputValue('#mue-lon') === lo, `lee «${t.slice(0, 40)}»: ${await p.inputValue('#mue-lat')}, ${await p.inputValue('#mue-lon')}`);
    }
    await p.fill('#mue-sitio-elige', 'https://maps.app.goo.gl/AbCdEf'); await p.click('[data-sitio-buscar="elige"]'); await p.waitForTimeout(250);
    ok((await res(p, 'elige')).includes('no lleva la posición'), 'enlace corto sin posición: lo explica');
    await p.fill('#mue-sitio-elige', 'Figueres'); await p.click('[data-sitio-buscar="elige"]'); await p.waitForTimeout(500);
    ok((await res(p, 'elige')).includes('Ya estás en Figueres') && await p.inputValue('#mue-lat') === '41.8', 'pueblo: lleva el mapa allí y no mueve el punto solo');
    await p.fill('#mue-sitio-elige', 'Fleuré'); await p.press('#mue-sitio-elige', 'Enter'); await p.waitForTimeout(500);
    const opciones = await p.$$('[data-sitio-res="elige"] [data-sitio-i]');
    ok(opciones.length === 2, 'varios pueblos con el mismo nombre: pregunta cuál (' + opciones.length + ')');
    await opciones[1].click(); await p.waitForTimeout(300);
    ok((await res(p, 'elige')).includes('Ya estás en Fleuré'), 'elegido: va allí');
    await p.click('[data-yo="elige"]'); await p.waitForTimeout(600);
    ok((await res(p, 'elige')).includes('punto azul') && await p.$('#mue-elige-mapa path.leaflet-interactive, #mue-elige-mapa svg path'), 'diana: centra en mi posición con el punto azul');
    await p.click('#mue-cancela'); await p.waitForTimeout(200);

    // Mapa de clientes: buscador y «Cerca de mí»
    await p.click('#mue-ver-mapa'); await p.waitForSelector('#mue-mapa .leaflet-marker-icon', { timeout: 8000 });
    ok(await p.isVisible('#mue-sitio-mapa') && await p.isVisible('[data-yo="mapa"]') && (await p.textContent('[data-yo="mapa"]')).includes('Cerca de mí'), 'mapa de clientes: buscador y «Cerca de mí»');
    await p.click('[data-yo="mapa"]'); await p.waitForTimeout(600);
    ok((await res(p, 'mapa')).includes('Tienes 2 clientes a menos de 50 km'), 'cerca de mí en el mapa: ' + (await res(p, 'mapa')));
    await p.fill('#mue-sitio-mapa', 'Figueres'); await p.press('#mue-sitio-mapa', 'Enter'); await p.waitForTimeout(500);
    ok((await res(p, 'mapa')).includes('Mapa en Figueres'), 'buscar un pueblo en el mapa de clientes');
    await p.click('#mue-cierra-mapa'); await p.waitForTimeout(200);
    ok(await p.isHidden('#mue-sitio-mapa-caja'), 'al cerrar el mapa se esconde su buscador');
    ok(!(await p.evaluate(() => Object.keys(localStorage).some(k => /pos|yo|ubic/i.test(k) && k.startsWith('ccoo-')))), 'la posición no se guarda en el móvil');
    await c.close(); }

  // ---- Sin permiso de ubicación ----
  { const { c, p } = await nuevo(false);
    await p.click('#mue-cerca'); await p.waitForTimeout(800);
    ok((await p.textContent('#mue-cerca-msg')).includes('permiso') && (await nombres(p)).length === 4 && await p.getAttribute('#mue-cerca', 'aria-pressed') === 'false', 'sin permiso, cerca de mí: lo dice y sigue la lista entera · ' + (await p.textContent('#mue-cerca-msg')));
    await p.click('#mue-nuevo'); await p.click('#mue-gps'); await p.waitForTimeout(800);
    ok((await p.textContent('#mue-gps-msg')).includes('Elegir en el mapa') && await p.inputValue('#mue-lat') === '', 'sin permiso, estoy aquí: dice qué hacer y no inventa nada · ' + (await p.textContent('#mue-gps-msg')));
    await p.click('#mue-cancela');
    await p.click('#mue-ver-mapa'); await p.waitForSelector('#mue-mapa .leaflet-marker-icon', { timeout: 8000 });
    await p.click('[data-yo="mapa"]'); await p.waitForTimeout(800);
    ok((await res(p, 'mapa')).includes('Busca el sitio en «Buscar»'), 'sin permiso, diana del mapa: dice que busque arriba');
    await c.close(); }

  // ---- Estrecho y oscuro: sin scroll lateral con todo abierto ----
  for (const [w, osc] of [[320, false], [320, true], [412, true]]) {
    const { c, p } = await nuevo(true, w, osc);
    await p.click('#mue-cerca'); await p.waitForTimeout(400);
    await p.click('#mue-nuevo'); await p.click('#mue-gps'); await p.waitForTimeout(400); await p.click('#mue-elegir'); await p.waitForTimeout(1200);
    await p.fill('#mue-sitio-elige', 'Fleuré'); await p.press('#mue-sitio-elige', 'Enter'); await p.waitForTimeout(500);
    const ancho = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok(ancho <= 0, `${w} px ${osc ? 'oscuro' : 'claro'}: sin scroll lateral (${ancho})`);
    await c.close();
  }

  const real = errs.filter(e => !/ERR_FAILED|Failed to load resource/i.test(e));
  ok(!real.length, 'sin errores ni ventanas: ' + real.slice(0, 3).join(' | '));
  await b.close();
  console.log(mal ? `\n${mal} MAL` : '\nTodo bien');
  process.exit(mal ? 1 : 0);
})();
