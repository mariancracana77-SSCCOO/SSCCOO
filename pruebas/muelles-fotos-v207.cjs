// v207 (lo vio el padre: las fichas le volvían sin fotos). Libreta de 11 fichas con foto: «Descargar archivo» lleva las
// 11 fotos y entra entera en otro móvil por .txt, convertido en Word y sin extensión (WhatsApp). «Descargar sin fotos»
// avisa al cargarlo «11 fichas tenían foto…». Cargar encima nunca borra fotos; borrar una ficha con foto lo avisa antes.
// Uso: BASE=http://localhost:8765/ NODE_PATH=$(npm root -g) node pruebas/muelles-fotos-v207.cjs
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const JSZip = require('../lib/jszip.min.js');
(async () => {
  const BASE = process.env.BASE || 'http://localhost:8765/';
  const b = await chromium.launch(); const errs = []; let mal = 0;
  const ok = (c, t) => { console.log((c ? 'OK  ' : 'MAL ') + t); if (!c) mal++; };
  const ctx = async (f) => { const c = await b.newContext({ viewport: { width: 400, height: 900 }, acceptDownloads: true });
    await c.route('**/lib/supabase.js*', r => r.fulfill({ path: path.join(__dirname, 'mock-supabase.js'), contentType: 'application/javascript' }));
    await c.addInitScript((f) => { if (!localStorage.getItem('pp')) { localStorage.setItem('pp', '1'); localStorage.setItem('ccoo-aviso-privacidad', '1'); localStorage.setItem('ccoo-bienvenida', '1'); if (f) localStorage.setItem('ccoo-muelles', JSON.stringify({ v: 1, fichas: f })); } }, f || null);
    const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
    p.on('dialog', d => { errs.push('dialogo: ' + d.message()); d.dismiss(); });
    await p.goto(BASE + '#muelles'); await p.waitForTimeout(1200); return { c, p }; };
  const nfotos = (q) => q.evaluate(() => new Promise(ok => { const r = indexedDB.open('ccoo-muelles-fotos', 1); r.onsuccess = () => { const t = r.result.transaction('fotos').objectStore('fotos').getAllKeys(); t.onsuccess = () => ok(t.result.length); }; r.onerror = () => ok(-1); }));
  const nfichas = (q) => q.evaluate(() => JSON.parse(localStorage.getItem('ccoo-muelles') || '{"fichas":[]}').fichas.length);
  const carga = async (q, files) => { await q.evaluate(() => { document.getElementById('mue-pasar').open = true; }); const ch = q.waitForEvent('filechooser'); await q.click('#mue-abre-archivo'); await (await ch).setFiles(files); await q.waitForTimeout(2500); return q.textContent('#mue-msg'); };
  const docx = (t) => { const z = new JSZip(); z.file('[Content_Types].xml', '<Types/>'); z.file('word/document.xml', `<?xml version="1.0"?><w:document xmlns:w="x"><w:body><w:p><w:r><w:t>${t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')}</w:t></w:r></w:p></w:body></w:document>`); return z.generateAsync({ type: 'nodebuffer' }); };

  const F = Array.from({ length: 11 }, (_, i) => ({ id: 'mf' + String(i).padStart(3, '0'), nombre: 'Cliente ' + i, truco: 'Puerta ' + i, nivel: 'facil' }));
  const { c, p } = await ctx(F);
  const img = await p.screenshot({ type: 'jpeg', quality: 80 });
  for (const f of F) { await p.evaluate((id) => { document.querySelector(`.mue-ficha[data-ficha="${id}"]`).open = true; }, f.id); const ch = p.waitForEvent('filechooser'); await p.click(`[data-foto="${f.id}"]`); await (await ch).setFiles({ name: 'a.jpg', mimeType: 'image/jpeg', buffer: img }); await p.waitForTimeout(350); }
  ok(await nfotos(p) === 11, 'el móvil del padre: 11 fichas con foto');
  await p.evaluate(() => { document.getElementById('mue-pasar').open = true; });
  const baja = async (sel) => { const d = p.waitForEvent('download'); await p.click(sel); return fs.readFileSync(await (await d).path(), 'utf8'); };
  const con = await baja('#mue-descarga'), sin = await baja('#mue-descarga-sin');
  ok((con.match(/"foto":"data:image/g) || []).length === 11, `«Descargar archivo» lleva las 11 fotos (${Math.round(con.length / 1024)} KB)`);
  ok(!/"foto":/.test(sin) && (sin.match(/"tf":1/g) || []).length === 11, '«Descargar sin fotos» no las lleva pero dice qué fichas tenían foto');
  ok(/con las fotos|lleva las fichas con sus fotos/.test(await p.textContent('#mue-pasar')), 'el texto explica que «Descargar archivo» lleva las fotos');

  // Mismo móvil: cargar encima no borra ninguna foto
  const m0 = await carga(p, [{ name: 'x.txt', mimeType: 'text/plain', buffer: Buffer.from(sin) }]);
  ok(await nfotos(p) === 11 && /ya tenías/.test(m0) && !/llegan sin ella/.test(m0), 'mismo móvil, cargar el archivo sin fotos encima: siguen las 11 fotos y no avisa de nada');

  for (const [n, files] of [['.txt', [{ name: 'libreta.txt', mimeType: 'text/plain', buffer: Buffer.from(con) }]], ['convertido en Word', [{ name: 'Documento (1) (4).docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: await docx(con) }]], ['sin extensión (WhatsApp)', [{ name: 'DOC-20261122-WA0060', mimeType: 'application/octet-stream', buffer: Buffer.from(con) }]]]) {
    const o = await ctx(); const m = await carga(o.p, files);
    ok(await nfichas(o.p) === 11 && await nfotos(o.p) === 11 && /Con 11 fotos/.test(m), `otro móvil, ${n}: 11 fichas y 11 fotos`);
    await o.c.close();
  }
  { const o = await ctx(); const m = await carga(o.p, [{ name: 'x.txt', mimeType: 'text/plain', buffer: Buffer.from(sin) }]);
    ok(await nfichas(o.p) === 11 && await nfotos(o.p) === 0 && /11 fichas tenían foto en el otro móvil pero llegan sin ella/.test(m), 'otro móvil, archivo sin fotos: avisa «11 fichas tenían foto…» · ' + m.slice(0, 90));
    // y luego el que sí lleva las fotos: se las pone a las que ya tenía
    const m2 = await carga(o.p, [{ name: 'y.txt', mimeType: 'text/plain', buffer: Buffer.from(con) }]);
    ok(await nfichas(o.p) === 11 && await nfotos(o.p) === 11 && /11 fotos que te faltaban/.test(m2), 'después el archivo con fotos: pone las 11 fotos sin repetir fichas');
    await o.c.close(); }

  // Borrar una ficha con foto: el aviso lo dice
  await p.evaluate(() => { document.querySelector('.mue-ficha[data-ficha="mf000"]').open = true; });
  await p.click('[data-borra="mf000"]');
  ok((await p.textContent('.mue-conf')).includes('y su foto'), 'al borrar una ficha con foto, el aviso lo dice');
  await p.click('[data-no]');
  ok(await nfotos(p) === 11 && await nfichas(p) === 11, 'diciendo «No» no se borra nada');
  await c.close();

  const real = errs.filter(e => !/ERR_FAILED|Failed to load resource/i.test(e));
  ok(!real.length, 'sin errores ni ventanas: ' + real.slice(0, 3).join(' | '));
  await b.close();
  console.log(mal ? `\n${mal} MAL` : '\nTodo bien');
  process.exit(mal ? 1 : 0);
})();
