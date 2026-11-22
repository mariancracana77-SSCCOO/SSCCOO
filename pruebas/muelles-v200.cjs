// v200 (petición n.º 67, ampliación: «quiere que se pueda DESCARGAR, no mandar»): «Descargar archivo» y «Descargar sin
// fotos» guardan el archivo directamente; «Cargar archivo de libreta» lo vuelve a meter (en otra ventana) sin repetir ni
// borrar; la clave «ccoo-muelles» sigue igual; «Compartir» aparte y sin la palabra «Mandar».
// Necesita el servidor en el 8765. Uso: BASE=http://localhost:8765/ NODE_PATH=$(npm root -g) node pruebas/muelles-v200.cjs
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
  const fichas = [
    { id: 'dd01', nombre: 'Brotte SA', lugar: 'Girona', truco: 'Entrar por detrás', nivel: 'cuidado', cambiado: '2026-11-01' },
    { id: 'dd02', nombre: 'Max Plastic', truco: 'Marcha atrás', nivel: 'facil', hor: { h24: true } },
    { id: 'dd03', nombre: 'brotte sa ', lugar: 'girona', truco: 'ENTRAR por detrás', nivel: 'cuidado', cambiado: '2026-11-05' }];
  const { c, p } = await nuevo(fichas);
  const antesLS = await p.evaluate(() => localStorage.getItem('ccoo-muelles'));
  await p.locator('#mue-pasar summary').click();
  const txt = await p.textContent('#mue-pasar');
  ok(!/Mandar/.test(txt), 'ya no sale la palabra «Mandar»');
  ok(await p.locator('#mue-descarga').isVisible() && (await p.textContent('#mue-descarga')).includes('Descargar archivo'), 'botón «Descargar archivo»');
  ok(!(await p.locator('#mue-descarga-fotos').isVisible()), 'sin fotos en la libreta no sale «Descargar con fotos»');
  ok(await p.locator('#mue-archivo').isVisible() && (await p.textContent('#mue-archivo')).trim() === 'Compartir', 'botón aparte «Compartir»');
  ok((await p.textContent('#mue-abre-archivo')).includes('Cargar archivo de libreta'), 'botón «Cargar archivo de libreta»');
  ok(txt.includes('Guárdalo también como copia'), 'texto de la copia de seguridad (v202)');
  ok(await p.locator('#mue-tam').isVisible() && /unos \d+ KB/.test(await p.textContent('#mue-tam')), 'dice el tamaño antes: ' + await p.textContent('#mue-tam'));
  // Descargar (con la libreta que tiene 2 repetidas: no debe bloquearse)
  let dl = p.waitForEvent('download'); await p.click('#mue-descarga'); const d1 = await dl;
  const hoy = await p.evaluate(() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); });
  ok(d1.suggestedFilename() === 'libreta-muelles-' + hoy + '.txt', 'nombre del archivo: ' + d1.suggestedFilename());
  const f1 = fs.readFileSync(await d1.path(), 'utf8');
  ok(f1.startsWith('CCOO-MUELLES:') && JSON.parse(f1.slice(13)).length === 3, 'el archivo lleva las 3 fichas');
  ok((await p.textContent('#mue-msg')).includes('Descargado') && (await p.textContent('#mue-msg')).includes('Descargas'), 'mensaje al acabar: ' + (await p.textContent('#mue-msg')).slice(0, 70));
  ok(await p.evaluate(() => localStorage.getItem('ccoo-muelles')) === antesLS, 'descargar no cambia la libreta guardada');
  // Con foto: sale «Descargar con fotos» y los dos archivos se distinguen (v202: «Descargar archivo» va sin fotos)
  const foto = Buffer.from(await p.evaluate(() => { const c = document.createElement('canvas'); c.width = 800; c.height = 600; const x = c.getContext('2d'); x.fillStyle = '#c33'; x.fillRect(0, 0, 800, 600); return c.toDataURL('image/png').split(',')[1]; }), 'base64');
  await p.locator('.mue-ficha[data-ficha=dd02] > summary').click();
  const fc = p.waitForEvent('filechooser'); await p.click('.mue-ficha[data-ficha=dd02] [data-foto]'); await (await fc).setFiles({ name: 'm.png', mimeType: 'image/png', buffer: foto }); await p.waitForTimeout(1200);
  ok(await p.locator('#mue-descarga-fotos').isVisible(), 'con foto sale «Descargar con fotos»');
  ok(/con fotos \(1\)/.test(await p.textContent('#mue-tam')), 'tamaño con y sin fotos: ' + await p.textContent('#mue-tam'));
  dl = p.waitForEvent('download'); await p.click('#mue-descarga-fotos'); const d2 = await dl; const f2 = fs.readFileSync(await d2.path(), 'utf8');
  dl = p.waitForEvent('download'); await p.click('#mue-descarga'); const d3 = await dl; const f3 = fs.readFileSync(await d3.path(), 'utf8');
  ok(d2.suggestedFilename() === 'libreta-muelles-' + hoy + '-con-fotos.txt' && d3.suggestedFilename() === 'libreta-muelles-' + hoy + '.txt', 'nombres: ' + d2.suggestedFilename() + ' / ' + d3.suggestedFilename());
  ok(JSON.parse(f2.slice(13)).some(x => x.foto && x.foto.startsWith('data:image/')) && !JSON.parse(f3.slice(13)).some(x => x.foto), 'el de fotos lleva la foto y el otro no');
  ok(f2.length > f3.length, 'con fotos pesa más (' + Math.round(f2.length / 1024) + ' KB / ' + Math.round(f3.length / 1024) + ' KB)');
  // Cargar el archivo descargado en otra ventana (otro móvil) con una ficha suya
  const { c: c2, p: p2 } = await nuevo([{ id: 'zz01', nombre: 'Mía SL', truco: 'Puerta 2', nivel: 'facil' }]);
  await p2.locator('#mue-pasar summary').click();
  let ch = p2.waitForEvent('filechooser'); await p2.click('#mue-abre-archivo'); await (await ch).setFiles(await d2.path()); await p2.waitForTimeout(1500);
  let g = await p2.evaluate(() => JSON.parse(localStorage.getItem('ccoo-muelles')));
  ok(g.v === 1 && g.fichas.length === 3 && g.fichas.some(x => x.id === 'zz01'), 'cargar el archivo añade las nuevas y no borra la suya (' + g.fichas.length + ')');
  ok((await p2.textContent('#mue-msg')).includes('Se han añadido 2') && /ya los? tenías/.test(await p2.textContent('#mue-msg')), 'dice cuántas nuevas y cuántas ya estaban: ' + (await p2.textContent('#mue-msg')).slice(0, 80));
  ok(await p2.evaluate(() => new Promise(r => setTimeout(() => r(document.querySelectorAll('.mue-ficha .mue-foto img, .mue-ficha img').length), 800))) >= 1 || await p2.evaluate(() => document.querySelector('.mue-ficha[data-ficha] [data-quitafoto]') !== null), 'la foto llega con el archivo');
  ch = p2.waitForEvent('filechooser'); await p2.click('#mue-abre-archivo'); await (await ch).setFiles(await d2.path()); await p2.waitForTimeout(1000);
  g = await p2.evaluate(() => JSON.parse(localStorage.getItem('ccoo-muelles')));
  ok(g.fichas.length === 3, 'cargar el mismo archivo otra vez no repite nada');
  ch = p2.waitForEvent('filechooser'); await p2.click('#mue-abre-archivo'); await (await ch).setFiles(await d3.path()); await p2.waitForTimeout(800);
  ok((await p2.evaluate(() => JSON.parse(localStorage.getItem('ccoo-muelles')).fichas.length)) === 3, 'el de sin fotos tampoco repite');
  ok(Object.keys(await p2.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(k => [k, 1])))).filter(k => k.startsWith('ccoo-muelles')).every(k => ['ccoo-muelles', 'ccoo-muelles-copia'].includes(k)), 'solo las claves de siempre (ccoo-muelles)');
  // Compartir en un navegador sin compartir archivos: lo dice y remite a Descargar
  await p.evaluate(() => { try { Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true }); } catch (e) {} });
  await p.click('#mue-archivo'); await p.waitForTimeout(800);
  ok((await p.textContent('#mue-msg')).includes('Descargar archivo'), 'sin compartir: lo dice y ofrece «Descargar archivo»');
  // Navegador que no deja descargar
  await p.evaluate(() => { URL.createObjectURL = undefined; });
  await p.click('#mue-descarga'); await p.waitForTimeout(300);
  ok((await p.textContent('#mue-msg')).includes('no deja descargar') && (await p.textContent('#mue-msg')).includes('Compartir'), 'si no puede descargar, lo dice: ' + (await p.textContent('#mue-msg')).slice(0, 60));
  // Libreta vacía
  const { c: c3, p: p3 } = await nuevo(null);
  await p3.locator('#mue-pasar summary').click(); await p3.click('#mue-descarga'); await p3.waitForTimeout(200);
  ok((await p3.textContent('#mue-msg')).includes('vacía'), 'libreta vacía: no descarga y lo dice');
  // 320 px oscuro: sin scroll lateral
  const { c: c4, p: p4 } = await nuevo(fichas, 320);
  await p4.emulateMedia({ colorScheme: 'dark' }); await p4.locator('#mue-pasar summary').click(); await p4.waitForTimeout(200);
  ok(await p4.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'sin scroll lateral a 320 px');
  const csp = errs.filter(e => /Content Security Policy|Refused/.test(e));
  ok(!errs.length, 'sin errores ni ventanas: ' + errs.slice(0, 3).join(' | '));
  ok(!csp.length, 'sin errores de CSP');
  await b.close();
  console.log(mal ? `\n${mal} MAL` : '\nTodo bien');
  process.exit(mal ? 1 : 0);
})();
