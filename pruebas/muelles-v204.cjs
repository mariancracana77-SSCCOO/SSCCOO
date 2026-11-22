// v204 (arreglo urgente, lo vio el padre): lo que llega por WhatsApp puede venir comprimido (ZIP) y la app lo rechazaba
// («Ábrelo antes…»). Ahora se abre solo. Prueba el flujo real: descargar en la app → comprimir y renombrar como hacen
// WhatsApp/Android → «Cargar archivo de libreta» en otro móvil. ZIP con la libreta dentro, en subcarpeta, varios, ZIP dentro
// de ZIP, vacío, estropeado y demasiado grande. Nunca borra ni repite y siempre dice qué pasa.
// Necesita el servidor en el 8765. Uso: BASE=http://localhost:8765/ NODE_PATH=$(npm root -g) node pruebas/muelles-v204.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const JSZip = require('../lib/jszip.min.js');
(async () => {
  const b = await chromium.launch(); const errs = []; let mal = 0;
  const ok = (c, t) => { console.log((c ? 'OK  ' : 'MAL ') + t); if (!c) mal++; };
  const BASE = process.env.BASE || 'http://localhost:8765/';
  const nuevo = async (fichas, sinSW) => {
    const c = await b.newContext({ viewport: { width: 360, height: 740 }, acceptDownloads: true, serviceWorkers: sinSW ? 'block' : 'allow' });
    await c.route('**/lib/supabase.js*', r => r.fulfill({ path: path.join(__dirname, 'mock-supabase.js'), contentType: 'application/javascript' }));
    await c.addInitScript((f) => { try { localStorage.setItem('ccoo-aviso-privacidad', '1'); localStorage.setItem('ccoo-bienvenida', '1'); if (!localStorage.getItem('prueba-ya')) { localStorage.setItem('prueba-ya', '1'); if (f) localStorage.setItem('ccoo-muelles', JSON.stringify({ v: 1, fichas: f })); } } catch (e) {} }, fichas);
    const p = await c.newPage(); p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', e => errs.push(e.message));
    p.on('dialog', d => { errs.push('dialogo: ' + d.message()); d.dismiss(); });
    await p.goto(BASE + '#muelles'); await p.waitForTimeout(1500);
    await p.locator('#mue-pasar summary').click();
    return { c, p };
  };
  const guardadas = (p) => p.evaluate(() => (JSON.parse(localStorage.getItem('ccoo-muelles') || 'null') || { fichas: [] }).fichas);
  const msg = (p) => p.textContent('#mue-msg');
  const carga = async (p, file) => {
    const ch = p.waitForEvent('filechooser'); await p.click('#mue-abre-archivo'); await (await ch).setFiles(file);
    await p.waitForFunction(() => !/Leyendo/.test(document.getElementById('mue-msg').textContent), null, { timeout: 8000 }).catch(() => {});
    await p.waitForTimeout(300);
  };
  const zip = async (archivos) => { const z = new JSZip(); for (const [n, d] of archivos) z.file(n, d); return z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }); };
  const mias = [
    { id: 'pa01', nombre: 'Brotte SA', lugar: 'Girona', truco: 'Entrar por detrás', nivel: 'cuidado' },
    { id: 'pa02', nombre: 'Max Plastic', truco: 'Marcha atrás', nivel: 'facil', hor: { h24: true } },
    { id: 'pa03', nombre: 'Frigoríficos Sur', truco: 'Muelle 4, llamar antes', nivel: 'dificil' }];

  // 1. El padre descarga su libreta en la app (archivo de verdad)
  const { p } = await nuevo(mias);
  const dl = p.waitForEvent('download'); await p.click('#mue-descarga'); const d1 = await dl;
  const nombre = d1.suggestedFilename(); const archivo = fs.readFileSync(await d1.path());
  ok(/^libreta-muelles-.*\.txt$/.test(nombre) && archivo.toString().startsWith('CCOO-MUELLES:'), 'descarga de la app: ' + nombre + ' (texto, no ZIP)');
  ok(!(await p.textContent('#mue-pasar')).includes('Ábrelo antes'), 'ya no se pide abrir el ZIP');
  ok((await p.textContent('#mue-pasar')).includes('no hace falta abrir ni descomprimir nada'), 'ayuda: no hace falta descomprimir');

  // 2. El compañero lo recibe comprimido por WhatsApp, con varios nombres
  const z1 = await zip([[nombre, archivo]]);
  const casos = [['.zip', 'libreta-muelles.zip', 'application/zip'], ['sin extensión', 'DOC-20261122-WA0003', 'application/octet-stream'], ['«.zip.bin»', 'libreta.zip.bin', 'application/octet-stream'], ['«(1).zip»', 'libreta-muelles (1).zip', 'application/zip']];
  for (const [i, [nom, n, t]] of casos.entries()) {
    const { p: q } = await nuevo(i % 2 ? [{ id: 'zz01', nombre: 'Mía SL', truco: 'Puerta 2', nivel: 'facil' }] : null);
    await carga(q, { name: n, mimeType: t, buffer: z1 });
    const g = await guardadas(q);
    ok(g.filter(f => f.rec === 1).length === 3 && (await msg(q)).includes('Se han añadido 3 clientes nuevos'), 'ZIP ' + nom + ': ' + (await msg(q)).slice(0, 45));
    if (i % 2) ok(g.length === 4 && !g.find(f => f.id === 'zz01').rec, '  con datos previos: no borra la suya');
    await carga(q, { name: n, mimeType: t, buffer: z1 });
    ok((await guardadas(q)).length === g.length && (await msg(q)).includes('No había nada nuevo'), '  otra vez: no repite');
    await q.context().close();
  }

  // 3. Formas de ZIP
  const { p: r } = await nuevo(null);
  const otra = 'CCOO-MUELLES:' + JSON.stringify([{ id: 'ot01', nombre: 'Otra SA', truco: 'Rampa', nivel: 'facil' }]);
  const viejo = 'CCOO-MUELLES:' + JSON.stringify([{ id: 'v190a', nombre: 'Antiguo SL', truco: 'Por la rampa', epis: 'Chaleco', nivel: 'dificil', dibujo: 'atras' }]);
  await carga(r, { name: 'a.zip', mimeType: 'application/zip', buffer: await zip([['WhatsApp Documents/sub/' + nombre, archivo], ['otra.json', otra], ['nota.txt', 'Hola, te paso las fichas'], ['foto.jpg', Buffer.from([0xFF, 0xD8, 0xFF, 0, 1])]]) });
  ok((await guardadas(r)).length === 4 && (await msg(r)).includes('Se han añadido 4'), 'ZIP con subcarpeta, varias libretas, una nota y una foto: carga las dos libretas (4)');
  const dentro = await zip([['libreta-muelles-2026-11-10.txt', viejo]]);
  await carga(r, { name: 'b.zip', mimeType: 'application/zip', buffer: await zip([['dentro.zip', dentro]]) });
  ok((await guardadas(r)).some(f => f.nombre === 'Antiguo SL' && f.epis === 'Chaleco'), 'ZIP dentro de ZIP con un archivo de la v190: se lee');
  const utf16 = await zip([['x.txt', Buffer.concat([Buffer.from([0xFF, 0xFE]), Buffer.from(otra.replace('Otra SA', 'Utf Dieciséis').replace('ot01', 'u16'), 'utf16le')])]]);
  await carga(r, { name: 'c.zip', mimeType: 'application/zip', buffer: utf16 });
  ok((await guardadas(r)).some(f => f.nombre === 'Utf Dieciséis'), 'ZIP con libreta en UTF-16: se lee');
  const antes = JSON.stringify(await guardadas(r));
  const malos = [
    ['ZIP sin libreta', await zip([['foto.jpg', Buffer.from([0xFF, 0xD8, 0xFF, 0])], ['nota.txt', 'Hola']]), 'no hay ninguna libreta'],
    ['ZIP vacío', await zip([]), 'no hay ninguna libreta'],
    ['ZIP estropeado', Buffer.concat([Buffer.from([0x50, 0x4B, 3, 4]), Buffer.alloc(200, 7)]), 'estropeado'],
  ];
  for (const [nom, buf, palabra] of malos) {
    await carga(r, { name: 'x.zip', mimeType: 'application/zip', buffer: buf });
    const m = await msg(r);
    ok(m.includes(palabra) && JSON.stringify(await guardadas(r)) === antes && !/descomprim|Ábrelo/.test(m), nom + ': ' + m.slice(0, 70));
  }
  // Muy grande: 30 MB de datos dentro (más de lo que cabe en una libreta)
  const enorme = await zip([['grande.txt', Buffer.alloc(30 * 1024 * 1024, 32)]]);
  await carga(r, { name: 'g.zip', mimeType: 'application/zip', buffer: enorme });
  ok((await msg(r)).includes('demasiado grande') && JSON.stringify(await guardadas(r)) === antes, 'ZIP demasiado grande: ' + (await msg(r)).slice(0, 60));
  // El texto suelto sigue igual
  await carga(r, { name: 'libreta-muelles.json.txt', mimeType: 'text/plain', buffer: Buffer.from('﻿' + otra.replace('Otra SA', 'Texto Suelto').replace('ot01', 'ts1')) });
  ok((await guardadas(r)).some(f => f.nombre === 'Texto Suelto'), 'archivo de texto (sin ZIP) sigue valiendo');

  // 4. Sin conexión no se puede cargar la librería del ZIP: lo dice
  const { c: cs, p: s } = await nuevo(null, true); // sin service worker: si no, la librería sale de su caché
  await cs.route('**/lib/jszip.min.js*', rr => rr.abort());
  await carga(s, { name: 'a.zip', mimeType: 'application/zip', buffer: z1 });
  ok((await msg(s)).includes('sin conexión') && (await guardadas(s)).length === 0, 'sin la librería del ZIP: mensaje claro');
  await cs.unroute('**/lib/jszip.min.js*');
  await carga(s, { name: 'a.zip', mimeType: 'application/zip', buffer: z1 });
  ok((await guardadas(s)).length === 3, 'al volver la conexión, sí lo carga');
  ok(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8').includes('"lib/jszip.min.js"'), 'la librería del ZIP está en la caché del service worker');

  const real = errs.filter(e => !/jszip|ERR_FAILED|Failed to load resource/i.test(e));
  ok(!real.length, 'sin errores ni ventanas: ' + real.slice(0, 3).join(' | '));
  await b.close();
  console.log(mal ? `\n${mal} MAL` : '\nTodo bien');
  process.exit(mal ? 1 : 0);
})();
