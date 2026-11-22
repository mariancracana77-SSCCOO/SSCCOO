// v202 (arreglo urgente pedido por el padre: «cuando lo pasa a los compañeros y ellos lo quieren subir, no se sube»):
// el móvil que RECIBE tiene que poder cargar el archivo aunque WhatsApp, Telegram o el correo le cambien el nombre, el
// tipo o la forma (sin extensión, .bin, «.json.txt», BOM, UTF-16, saltos de Windows, comillas tipográficas, texto de más),
// y nunca quedarse en silencio. Además: marca «Recibida de un compañero», «Ver las recibidas», quitar la marca, elegir
// qué fichas pasar, archivos de versiones anteriores y libreta vacía (2 toques desde la lista vacía).
// Necesita el servidor en el 8765. Uso: BASE=http://localhost:8765/ NODE_PATH=$(npm root -g) node pruebas/muelles-v202.cjs
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const errs = []; let mal = 0;
  const ok = (c, t) => { console.log((c ? 'OK  ' : 'MAL ') + t); if (!c) mal++; };
  const BASE = process.env.BASE || 'http://localhost:8765/';
  const nuevo = async (fichas, ancho = 360) => {
    const c = await b.newContext({ viewport: { width: ancho, height: 740 }, acceptDownloads: true });
    await c.route('**/lib/supabase.js*', r => r.fulfill({ path: require('path').join(__dirname, 'mock-supabase.js'), contentType: 'application/javascript' }));
    await c.addInitScript((f) => { try { localStorage.setItem('ccoo-aviso-privacidad', '1'); localStorage.setItem('ccoo-bienvenida', '1'); if (!localStorage.getItem('prueba-ya')) { localStorage.setItem('prueba-ya', '1'); if (f) localStorage.setItem('ccoo-muelles', JSON.stringify({ v: 1, fichas: f })); } } catch (e) {} }, fichas);
    const p = await c.newPage(); p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', e => errs.push(e.message));
    p.on('dialog', d => { errs.push('dialogo: ' + d.message()); d.dismiss(); });
    await p.goto(BASE + '#muelles'); await p.waitForTimeout(1500);
    try { await p.locator('#bienvenida').click({ timeout: 1000 }); } catch {}
    return { c, p };
  };
  const guardadas = (p) => p.evaluate(() => (JSON.parse(localStorage.getItem('ccoo-muelles') || 'null') || { fichas: [] }).fichas);
  const msg = (p) => p.textContent('#mue-msg');
  const carga = async (p, file) => { const ch = p.waitForEvent('filechooser'); await p.click('#mue-abre-archivo'); await (await ch).setFiles(file); await p.waitForTimeout(700); };
  const mias = [
    { id: 'pa01', nombre: 'Brotte SA', lugar: 'Girona', truco: 'Entrar por detrás', nivel: 'cuidado' },
    { id: 'pa02', nombre: 'Max Plastic', truco: 'Marcha atrás', nivel: 'facil', hor: { h24: true } },
    { id: 'pa03', nombre: 'Frigoríficos Sur', truco: 'Muelle 4, llamar antes', nivel: 'dificil' }];

  // 1. El padre descarga su libreta (sin fotos por defecto)
  const { p } = await nuevo(mias);
  await p.locator('#mue-pasar summary').click();
  ok(await p.getAttribute('#mue-archivo-in', 'accept') === null, 'el selector acepta cualquier archivo (sin «accept»)');
  ok((await p.textContent('#mue-pasar')).includes('Para pasárselas a un compañero'), 'texto de ayuda para pasarlo a un compañero');
  let dl = p.waitForEvent('download'); await p.click('#mue-descarga'); const d1 = await dl;
  const archivo = fs.readFileSync(await d1.path(), 'utf8');
  ok(archivo.startsWith('CCOO-MUELLES:') && JSON.parse(archivo.slice(13)).filter(x => x.nombre).length === 3 && !archivo.includes('"rec"'), 'archivo con las 3 fichas y sin marcas');

  // 2. El compañero, con la libreta vacía: 2 toques desde la lista vacía
  const { p: q } = await nuevo(null);
  ok(await q.locator('#mue-lista [data-cargar]').isVisible(), 'libreta vacía: botón «Cargar archivo de libreta» a la vista');
  let ch = q.waitForEvent('filechooser'); await q.click('#mue-lista [data-cargar]'); await (await ch).setFiles({ name: 'libreta-muelles.txt', mimeType: 'text/plain', buffer: Buffer.from(archivo) }); await q.waitForTimeout(700);
  let g = await guardadas(q);
  ok(g.length === 3 && g.every(f => f.rec === 1), 'se añaden las 3 marcadas como recibidas');
  ok((await msg(q)).includes('Se han añadido 3 clientes nuevos') && (await msg(q)).includes('Recibida de un compañero'), 'mensaje claro: ' + (await msg(q)).slice(0, 70));
  ok(await q.locator('.mue-ficha .mue-rec').count() === 3, 'las fichas enseñan «Recibida de un compañero»');

  // 3. Formas en que llega el archivo por WhatsApp / Telegram / correo (otro compañero con una ficha suya)
  const { p: r } = await nuevo([{ id: 'zz01', nombre: 'Mía SL', truco: 'Puerta 2', nivel: 'facil' }]);
  await r.locator('#mue-pasar summary').click();
  const casos = [
    ['sin extensión', { name: 'libreta-muelles', mimeType: 'application/octet-stream', buffer: Buffer.from(archivo) }],
    ['.bin', { name: 'documento.bin', mimeType: 'application/octet-stream', buffer: Buffer.from(archivo) }],
    ['.json.txt', { name: 'libreta-muelles.json.txt', mimeType: 'text/plain', buffer: Buffer.from(archivo) }],
    ['«(1)» y con BOM', { name: 'libreta-muelles (1).txt', mimeType: 'text/plain', buffer: Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from(archivo)]) }],
    ['saltos de Windows y texto de más', { name: 'x.txt', mimeType: 'text/plain', buffer: Buffer.from('Te paso mi libreta\r\n\r\n' + archivo + '\r\n\r\nEnviado desde mi móvil') }],
    ['UTF-16', { name: 'x.txt', mimeType: 'text/plain', buffer: Buffer.concat([Buffer.from([0xFF, 0xFE]), Buffer.from(archivo, 'utf16le')]) }],
    ['comillas tipográficas', { name: 'x.txt', mimeType: 'text/plain', buffer: Buffer.from(archivo.replace(/"/g, '”')) }],
    ['prefijo en minúsculas', { name: 'x.txt', mimeType: 'text/plain', buffer: Buffer.from('ccoo-muelles:' + archivo.slice(13)) }],
  ];
  for (const [i, [nom, f]] of casos.entries()) {
    await carga(r, f);
    g = await guardadas(r);
    const m = await msg(r);
    ok(g.length === 4 && g.some(x => x.id === 'zz01') && m.length > 10, nom + ': ' + (i ? 'no repite' : 'añade 3') + ' y lo dice (' + g.length + ') ' + m.slice(0, 50));
  }
  ok(!(await guardadas(r)).find(x => x.id === 'zz01').rec, 'la ficha propia no sale como recibida');

  // 4. Archivos malos: siempre un mensaje con la razón, y nada cambia
  const antes = JSON.stringify(await guardadas(r));
  const png = Buffer.from('89504E470D0A1A0A0000000D4948445200000001', 'hex');
  const malos = [
    ['vacío', { name: 'x.txt', mimeType: 'text/plain', buffer: Buffer.from('') }, 'vacío'],
    ['una foto', { name: 'IMG-2026.jpg', mimeType: 'image/png', buffer: png }, 'foto'],
    ['un PDF', { name: 'x.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 hola') }, 'PDF'],
    ['un ZIP estropeado', { name: 'x.zip', mimeType: 'application/zip', buffer: Buffer.from([0x50, 0x4B, 3, 4, 0, 0]) }, 'estropeado'],
    ['cortado', { name: 'x.txt', mimeType: 'text/plain', buffer: Buffer.from(archivo.slice(0, Math.floor(archivo.length / 2))) }, 'cortado'],
    ['otro texto', { name: 'x.txt', mimeType: 'text/plain', buffer: Buffer.from('Hola, ¿qué tal?') }, 'no es una libreta'],
  ];
  for (const [nom, f, palabra] of malos) {
    await carga(r, f);
    const m = await msg(r);
    ok(m.includes(palabra) && JSON.stringify(await guardadas(r)) === antes && await r.getAttribute('#mue-msg', 'class') === 'zc-aviso', nom + ': ' + m.slice(0, 70));
  }

  // 5. Archivos de versiones anteriores (v190–v199: mismo prefijo, fichas sin horario ni fecha) y una ficha suelta copiada
  const viejo = 'CCOO-MUELLES:' + JSON.stringify([{ id: 'v190a', nombre: 'Antiguo SL', lugar: '', truco: 'Por la rampa', espera: '', epis: 'Chaleco', nivel: 'dificil', maniobra: 'atras', dormir: '', banos: '', dibujo: 'atras', lat: 41.98, lon: 2.82 }]);
  await carga(r, { name: 'libreta-muelles-2026-11-10.txt', mimeType: 'text/plain', buffer: Buffer.from(viejo) });
  g = await guardadas(r);
  ok(g.length === 5 && g.some(x => x.nombre === 'Antiguo SL' && x.epis === 'Chaleco' && x.lat === 41.98), 'archivo de una versión anterior: se lee entero');
  const suelta = 'Antiguo 2\nNivel: Fácil\nCómo entrar y maniobrar: Recto\n\nApuntado por un conductor, sin comprobar. Para meterlo en tu libreta de la web de CCOO:\nCCOO-MUELLES:' + JSON.stringify([{ id: 'sue01', nombre: 'Antiguo 2', truco: 'Recto', nivel: 'facil' }]);
  await r.fill('#mue-texto', suelta); await r.click('#mue-importa'); await r.waitForTimeout(300);
  ok((await guardadas(r)).length === 6 && (await msg(r)).includes('Se ha añadido 1 cliente nuevo'), 'pegar una ficha suelta de WhatsApp: ' + (await msg(r)).slice(0, 50));
  await r.fill('#mue-texto', ''); await r.click('#mue-importa'); await r.waitForTimeout(200);
  ok((await msg(r)).includes('No has pegado nada'), 'pegar vacío: lo dice');

  // 6. Revisar las recibidas y quitar la marca
  await r.click('#mue-ver-rec').catch(() => {});
  await r.fill('#mue-texto', 'CCOO-MUELLES:' + JSON.stringify([{ id: 'otra1', nombre: 'Otra más', truco: 'x', nivel: 'facil' }])); await r.click('#mue-importa'); await r.waitForTimeout(300);
  await r.click('#mue-ver-rec'); await r.waitForTimeout(300);
  ok(await r.locator('.mue-ficha').count() === 6 && await r.locator('#mue-niveles [data-nivel=rec].activa').count() === 1, '«Ver las recibidas» enseña solo las 6 recibidas');
  const una = r.locator('.mue-ficha').first(); await una.locator('summary.mue-cab').click(); await una.locator('[data-quitarec]').click(); await r.waitForTimeout(200);
  ok((await guardadas(r)).filter(x => x.rec).length === 5 && (await msg(r)).includes('ya no sale como recibida'), 'quitar la marca de una');

  // 7. Elegir qué fichas pasar: solo las marcadas, en un archivo pequeño
  await p.click('#mue-pasa-quien [data-pasa-todas="0"]'); await p.waitForTimeout(100);
  await p.click('#mue-pasa-ninguna'); await p.click('#mue-descarga'); await p.waitForTimeout(200);
  ok((await msg(p)).includes('No has elegido ninguna'), 'sin elegir ninguna: lo dice y no descarga');
  await p.check('#mue-pasa-lista [data-pasa=pa03]');
  ok((await p.textContent('#mue-pasa-n')).includes('1 de 3'), 'dice cuántas vas a pasar: ' + await p.textContent('#mue-pasa-n'));
  dl = p.waitForEvent('download'); await p.click('#mue-descarga'); const d2 = await dl;
  const solo = JSON.parse(fs.readFileSync(await d2.path(), 'utf8').slice(13)).filter(x => x.nombre);
  ok(solo.length === 1 && solo[0].nombre === 'Frigoríficos Sur' && /-1-ficha\.txt$/.test(d2.suggestedFilename()), 'solo la elegida: ' + d2.suggestedFilename());
  ok(JSON.stringify(await guardadas(p)) === JSON.stringify(mias.map(f => f.id)) || (await guardadas(p)).length === 3, 'pasar no cambia la libreta de quien pasa');

  // 8. 320 px oscuro con la libreta y elegir abierto: sin scroll lateral
  const { p: s } = await nuevo(mias, 320);
  await s.emulateMedia({ colorScheme: 'dark' }); await s.locator('#mue-pasar summary').click(); await s.click('#mue-pasa-quien [data-pasa-todas="0"]'); await s.waitForTimeout(200);
  ok(await s.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'sin scroll lateral a 320 px (oscuro, eligiendo)');
  ok(Object.keys(await r.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(k => [k, 1])))).filter(k => k.startsWith('ccoo-muelles')).every(k => ['ccoo-muelles', 'ccoo-muelles-copia'].includes(k)), 'solo las claves de siempre (ccoo-muelles)');
  const csp = errs.filter(e => /Content Security Policy|Refused/.test(e));
  ok(!errs.length, 'sin errores ni ventanas: ' + errs.slice(0, 3).join(' | '));
  ok(!csp.length, 'sin errores de CSP');
  await b.close();
  console.log(mal ? `\n${mal} MAL` : '\nTodo bien');
  process.exit(mal ? 1 : 0);
})();
