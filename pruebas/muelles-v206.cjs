// v206 (lo vio el padre): el archivo de WhatsApp (DOC-20261122-WA0060, sin extensión) el móvil lo convierte en un
// documento de Word («Documento (1) (4)», OneDrive) al guardarlo o abrirlo. Ahora la libreta se saca de dentro del .docx.
// Prueba: libreta real descargada de la app → metida en un .docx como lo hace Word (texto partido en trozos, comillas
// tipográficas, &quot;, un párrafo antes y otro después) → «Cargar archivo de libreta» con varios nombres.
// Uso: BASE=http://localhost:8765/ NODE_PATH=$(npm root -g) node pruebas/muelles-v206.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const JSZip = require('../lib/jszip.min.js');
(async () => {
  const b = await chromium.launch(); const errs = []; let mal = 0;
  const ok = (c, t) => { console.log((c ? 'OK  ' : 'MAL ') + t); if (!c) mal++; };
  const BASE = process.env.BASE || 'http://localhost:8765/';
  const nuevo = async (fichas) => {
    const c = await b.newContext({ viewport: { width: 360, height: 740 }, acceptDownloads: true });
    await c.route('**/lib/supabase.js*', r => r.fulfill({ path: path.join(__dirname, 'mock-supabase.js'), contentType: 'application/javascript' }));
    await c.addInitScript((f) => { try { localStorage.setItem('ccoo-aviso-privacidad', '1'); localStorage.setItem('ccoo-bienvenida', '1'); if (!localStorage.getItem('prueba-ya')) { localStorage.setItem('prueba-ya', '1'); if (f) localStorage.setItem('ccoo-muelles', JSON.stringify({ v: 1, fichas: f })); } } catch (e) {} }, fichas || null);
    const p = await c.newPage(); p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', e => errs.push(e.message));
    await p.goto(BASE + '#muelles'); await p.waitForTimeout(1300);
    await p.locator('#mue-pasar summary').click();
    return { c, p };
  };
  const guardadas = (p) => p.evaluate(() => (JSON.parse(localStorage.getItem('ccoo-muelles') || 'null') || { fichas: [] }).fichas);
  const msg = (p) => p.textContent('#mue-msg');
  const carga = async (p, files) => {
    const ch = p.waitForEvent('filechooser'); await p.click('#mue-abre-archivo'); await (await ch).setFiles(files);
    await p.waitForFunction(() => !/Leyendo/.test(document.getElementById('mue-msg').textContent), null, { timeout: 15000 }).catch(() => {});
    await p.waitForTimeout(300);
  };
  const mias = [
    { id: 'pa01', nombre: 'Brotte SA', lugar: 'Girona', truco: 'Entrar por «detrás», con cuidado', nivel: 'cuidado', hor: { b: [{ d: [1, 2, 3, 4, 5], t: [[360, 840]] }] } },
    { id: 'pa02', nombre: 'Max Plastic & Cía', truco: 'Marcha atrás <muelle 3>', nivel: 'facil' },
    { id: 'pa03', nombre: 'Frigoríficos Sur', truco: "Muelle 4, llamar antes al 'jefe'", nivel: 'dificil' }];
  // La libreta de verdad: descargada desde la app
  const { c: c0, p } = await nuevo(mias);
  const dl = p.waitForEvent('download'); await p.click('#mue-descarga'); const d1 = await dl;
  const libreta = fs.readFileSync(await d1.path(), 'utf8'); await c0.close();
  // Como lo guarda Word: texto en varios <w:t>, comillas tipográficas, entidades XML
  const xml = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const docx = async (texto, tipograficas) => {
    let t = texto;
    if (tipograficas) { let abre = true; t = t.replace(/"/g, () => (abre = !abre) ? '”' : '“'); }
    const trozos = t.match(/.{1,40}/gs).map((x, i) => `<w:r><w:rPr>${i % 3 ? '' : '<w:lang w:val="es-ES"/>'}</w:rPr><w:t xml:space="preserve">${xml(x).replace(/"/g, i % 2 ? '&quot;' : '"')}</w:t></w:r>`).join('');
    const z = new JSZip();
    z.file('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>');
    z.file('_rels/.rels', '<?xml version="1.0"?><Relationships/>');
    z.file('docProps/core.xml', '<?xml version="1.0"?><cp:coreProperties>[{"no":"es"}]</cp:coreProperties>');
    z.file('word/styles.xml', '<?xml version="1.0"?><w:styles/>');
    z.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="x"><w:body><w:p><w:r><w:t>Libreta de muelles</w:t></w:r></w:p><w:p>${trozos}</w:p><w:p><w:r><w:t>Fin</w:t></w:r></w:p></w:body></w:document>`);
    return z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  };
  const casos = [
    ['Word «Documento (1) (4).docx»', 'Documento (1) (4).docx', await docx(libreta, false)],
    ['Word con comillas tipográficas', 'Documento (1).docx', await docx(libreta, true)],
    ['Word sin extensión', 'Documento (1) (4)', await docx(libreta, true)],
    ['el archivo de WhatsApp tal cual (DOC-20261122-WA0060)', 'DOC-20261122-WA0060', Buffer.from(libreta)],
    ['.json.txt', 'libreta.json.txt', Buffer.from(libreta)],
    ['.bin', 'DOC-20261122-WA0060.bin', Buffer.from(libreta)],
  ];
  for (const [nom, n, buf] of casos) {
    const { c, p: q } = await nuevo([{ id: 'zz01', nombre: 'Mía SL', truco: 'Puerta 2', nivel: 'facil' }]);
    await carga(q, { name: n, mimeType: /docx/.test(n) ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/octet-stream', buffer: buf });
    const g = await guardadas(q);
    const brotte = g.find(f => f.nombre === 'Brotte SA');
    ok(g.length === 4 && g.find(f => f.id === 'zz01') && brotte && brotte.truco === 'Entrar por «detrás», con cuidado' && brotte.hor && g.some(f => f.nombre === 'Max Plastic & Cía'), `${nom}: ${g.length - 1} cargadas · ${(await msg(q)).slice(0, 45)}`);
    await carga(q, { name: n, mimeType: 'application/octet-stream', buffer: buf });
    ok((await guardadas(q)).length === 4, '   otra vez: no repite');
    await c.close();
  }
  // Un Word cualquiera (sin libreta): mensaje claro
  { const { c, p: q } = await nuevo();
    const z = new JSZip(); z.file('word/document.xml', '<w:document><w:body><w:p><w:r><w:t>Hola, nos vemos mañana</w:t></w:r></w:p></w:body></w:document>');
    await carga(q, { name: 'Carta.docx', mimeType: 'application/octet-stream', buffer: await z.generateAsync({ type: 'nodebuffer' }) });
    ok(/documento de Word no lleva ninguna libreta/.test(await msg(q)) && !(await guardadas(q)).length, 'un Word sin libreta: ' + (await msg(q)).slice(0, 60));
    await c.close(); }
  // El selector acepta cualquier archivo (sin «accept») y varios a la vez
  { const { c, p: q } = await nuevo();
    const at = await q.evaluate(() => { const i = document.getElementById('mue-archivo-in'); return { accept: i.getAttribute('accept'), multiple: i.multiple }; });
    ok(!at.accept && at.multiple, 'el selector acepta cualquier archivo y varios a la vez');
    await c.close(); }
  const real = errs.filter(e => !/ERR_FAILED|Failed to load resource/i.test(e));
  ok(!real.length, 'sin errores: ' + real.slice(0, 3).join(' | '));
  await b.close(); console.log(mal ? `\n${mal} MAL` : '\nTodo bien'); process.exit(mal ? 1 : 0);
})();
