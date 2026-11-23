// v209: buscar por parecido en la libreta de muelles y en el buscador de los mapas: sin mayúsculas, tildes, ñ ni ç;
// principio o trozo de palabra; faltas de una o dos letras; nombres en otros idiomas (Gerona, Saragossa, Lisabona…);
// orden por parecido y «¿Quisiste decir…?». Uso: BASE=http://localhost:8765/ NODE_PATH=$(npm root -g) node pruebas/muelles-v209.cjs
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(); const errs = []; let mal = 0;
  const ok = (c, t) => { console.log((c ? 'OK  ' : 'MAL ') + t); if (!c) mal++; };
  const BASE = process.env.BASE || 'http://localhost:8765/';
  const PNG = Buffer.from('89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000D4944415478DA63F8FFFF3F0005FE02FEA7D6A5A30000000049454E44AE426082', 'hex');
  const FICHAS = [
    { id: 'a', nombre: 'Mercadona Bloque', lugar: 'Lleida', truco: 'Puerta 1', nivel: 'facil', lat: 41.6, lon: 0.6 },
    { id: 'b', nombre: 'Bon Àrea', lugar: 'Guissona', truco: 'Muelle 4', nivel: 'cuidado' },
    { id: 'c', nombre: 'Carrefour', lugar: 'Girona', truco: 'Puerta 3', nivel: 'dificil' },
    { id: 'd', nombre: 'Lidl Plataforma', lugar: 'Zaragoza', truco: 'Puerta 4', nivel: 'facil' },
    { id: 'e', nombre: 'Eroski', lugar: 'Barcelona', truco: 'Puerta 5', nivel: 'facil' },
    { id: 'f', nombre: 'Logística Peña', lugar: 'A Coruña', truco: 'Puerta 6', nivel: 'facil' },
    { id: 'g', nombre: 'Mercat Lleidatà', lugar: 'Alcarràs', truco: 'Puerta 7', nivel: 'dificil' }];
  const nuevo = async (ancho, oscuro) => {
    const c = await b.newContext({ viewport: { width: ancho || 360, height: 760 }, colorScheme: oscuro ? 'dark' : 'light' });
    await c.route('**/lib/supabase.js*', r => r.fulfill({ path: path.join(__dirname, 'mock-supabase.js'), contentType: 'application/javascript' }));
    await c.route('**/tile.openstreetmap.org/**', r => r.fulfill({ body: PNG, contentType: 'image/png' }));
    await c.addInitScript((f) => { try { localStorage.setItem('ccoo-aviso-privacidad', '1'); localStorage.setItem('ccoo-bienvenida', '1'); localStorage.setItem('ccoo-muelles', JSON.stringify({ v: 1, fichas: f })); } catch (e) {} }, FICHAS);
    const p = await c.newPage(); p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', e => errs.push(e.message));
    p.on('dialog', d => { errs.push('dialogo: ' + d.message()); d.dismiss(); });
    await p.goto(BASE + '#muelles'); await p.waitForTimeout(1200);
    return { c, p };
  };
  const nombres = (p) => p.$$eval('#mue-lista .mue-ficha h3', l => l.map(x => x.textContent));
  const busca = async (p, t) => { await p.fill('#mue-q', t); await p.waitForTimeout(150); return nombres(p); };
  const res = (p, d) => p.textContent(`[data-sitio-res="${d}"]`);

  { const { c, p } = await nuevo();
    // Lo que el padre escribiría de verdad
    for (const [t, sale, que] of [
      ['lleida', 'Mercadona Bloque', 'normal'], ['LLEIDA', 'Mercadona Bloque', 'mayúsculas'], ['lléida', 'Mercadona Bloque', 'tilde de más'],
      ['lerida', 'Mercadona Bloque', 'nombre en castellano'], ['Lérida', 'Mercadona Bloque', 'castellano con tilde'], ['leida', 'Mercadona Bloque', 'letra de menos'],
      ['gerona', 'Carrefour', 'Gerona → Girona'], ['saragossa', 'Lidl Plataforma', 'Saragossa (rumano/catalán)'], ['zaragosa', 'Lidl Plataforma', 'falta: s por z'],
      ['barçelona', 'Eroski', 'ç de más'], ['barcelna', 'Eroski', 'letra de menos'], ['bacrelona', 'Eroski', 'letras cambiadas'],
      ['coruna', 'Logística Peña', 'ñ sin tilde'], ['pena', 'Logística Peña', 'Peña escrito pena'], ['logistica', 'Logística Peña', 'sin tilde'],
      ['merca', 'Mercadona Bloque', 'principio de palabra'], ['cadona', 'Mercadona Bloque', 'trozo de en medio'], ['bonarea', 'Bon Àrea', 'junto y sin tilde'],
      ['guisona', 'Bon Àrea', 'una s de menos'], ['lid', 'Lidl Plataforma', 'nombre corto'], ['muelle 4', 'Bon Àrea', 'dos palabras']]) {
      const n = await busca(p, t);
      ok(n[0] === sale && (t !== 'coruna' || n.length === 1), `«${t}» (${que}): ${n.join(', ') || 'nada'}`);
    }
    // Orden por parecido: el igual antes que el que solo lo lleva dentro
    let n = await busca(p, 'lleida');
    ok(n[0] === 'Mercadona Bloque' && n.includes('Mercat Lleidatà') && n.indexOf('Mercat Lleidatà') > 0, 'orden: primero el que se llama igual, después «Lleidatà»: ' + n.join(', '));
    n = await busca(p, 'xq');
    ok(!n.length, 'dos letras sin parecido: no saca cualquier cosa');
    // «¿Quisiste decir…?»
    n = await busca(p, 'lerdia');
    const q = await p.$$eval('#mue-lista [data-quisiste]', l => l.map(x => x.textContent));
    ok(!n.length && (await p.textContent('#mue-lista')).includes('¿Quisiste decir…?') && q.includes('Lleida') && q.length <= 5, '«lerdia»: nada, y ofrece ' + q.join(', '));
    await p.click('#mue-lista [data-quisiste="Lleida"]'); await p.waitForTimeout(200);
    ok(await p.inputValue('#mue-q') === 'Lleida' && (await nombres(p))[0] === 'Mercadona Bloque', 'al tocar «Lleida» lo busca');
    n = await busca(p, 'zzzzzz');
    ok(!n.length && !(await p.$('#mue-lista [data-quisiste]')), 'sin nada parecido: no ofrece nada');
    await busca(p, '');
    ok((await nombres(p)).length === 7, 'sin texto: salen todos');

    // Buscador del mapa: nombre de otro idioma, orden y «¿Quisiste decir…?»
    await p.click('#mue-ver-mapa'); await p.waitForSelector('#mue-mapa .leaflet-marker-icon', { timeout: 8000 });
    await p.fill('#mue-sitio-mapa', 'Gerona'); await p.press('#mue-sitio-mapa', 'Enter'); await p.waitForTimeout(500);
    ok(await p.evaluate(() => window.__BUSCADO) === 'girona', 'mapa: «Gerona» se busca como «girona»');
    await p.fill('#mue-sitio-mapa', 'Lisabona'); await p.press('#mue-sitio-mapa', 'Enter'); await p.waitForTimeout(500);
    ok(await p.evaluate(() => window.__BUSCADO) === 'lisboa', 'mapa: «Lisabona» (rumano) se busca como «lisboa»');
    await p.fill('#mue-sitio-mapa', 'Torelló'); await p.press('#mue-sitio-mapa', 'Enter'); await p.waitForTimeout(500);
    ok(await p.evaluate(() => window.__BUSCADO) === 'Torelló', 'mapa: un pueblo normal se busca tal cual');
    await p.fill('#mue-sitio-mapa', 'Barzelona'); await p.press('#mue-sitio-mapa', 'Enter'); await p.waitForTimeout(500);
    const qm = await p.$$eval('[data-sitio-res="mapa"] [data-sitio-q]', l => l.map(x => x.textContent));
    ok((await res(p, 'mapa')).includes('¿Quisiste decir…?') && qm[0] === 'Barcelona', 'mapa: «Barzelona» no sale y ofrece ' + qm.join(', '));
    await p.click('[data-sitio-res="mapa"] [data-sitio-q="Barcelona"]'); await p.waitForTimeout(500);
    ok(await p.inputValue('#mue-sitio-mapa') === 'Barcelona' && await p.evaluate(() => window.__BUSCADO) === 'Barcelona', 'al tocarlo lo busca');
    await c.close(); }

  for (const [w, osc] of [[320, false], [320, true], [412, true]]) {
    const { c, p } = await nuevo(w, osc);
    await busca(p, 'lerdia');
    const ancho = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok(ancho <= 0, `${w} px ${osc ? 'oscuro' : 'claro'}: «¿Quisiste decir…?» sin scroll lateral (${ancho})`);
    await c.close();
  }
  const real = errs.filter(e => !/ERR_FAILED|Failed to load resource/i.test(e));
  ok(!real.length, 'sin errores ni ventanas: ' + real.slice(0, 3).join(' | '));
  await b.close();
  console.log(mal ? `\n${mal} MAL` : '\nTodo bien');
  process.exit(mal ? 1 : 0);
})();
