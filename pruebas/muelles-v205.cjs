// v205 (arreglo urgente, lo vio Lorena: al compañero le salía «El archivo no ha llegado entero» y no se cargaba NADA).
// Prueba de punta a punta con libretas de tamaño real (5, 50 y 300 fichas, con y sin fotos) descargadas en la app y
// estropeadas como lo hacen WhatsApp, Telegram o el móvil: cortadas a 65.536 letras, recortadas al final, metidas en un
// «Exportar chat» de WhatsApp (ZIP con un .txt con fecha, nombre y más mensajes), dos libretas en el mismo chat, en
// UTF-16 o con BOM, pegadas como texto, y en partes. Lo que se puede leer se carga (sin borrar ni repetir) y lo demás
// se avisa con «Llegaron N de M». También: el archivo nuevo se lee en la versión de antes (v204, puerto 8766).
// Uso: BASE=http://localhost:8765/ VIEJA=http://localhost:8766/ NODE_PATH=$(npm root -g) node pruebas/muelles-v205.cjs
const { chromium } = require('playwright');
const path = require('path');
const JSZip = require('../lib/jszip.min.js');
(async () => {
  const b = await chromium.launch(); const errs = []; let mal = 0;
  const ok = (c, t) => { console.log((c ? 'OK  ' : 'MAL ') + t); if (!c) mal++; };
  const BASE = process.env.BASE || 'http://localhost:8765/', VIEJA = process.env.VIEJA || '';
  const nuevo = async (url, fichas) => {
    const c = await b.newContext({ viewport: { width: 360, height: 740 }, acceptDownloads: true });
    await c.route('**/lib/supabase.js*', r => r.fulfill({ path: path.join(__dirname, 'mock-supabase.js'), contentType: 'application/javascript' }));
    await c.addInitScript((f) => { try { localStorage.setItem('ccoo-aviso-privacidad', '1'); localStorage.setItem('ccoo-bienvenida', '1'); if (!localStorage.getItem('prueba-ya')) { localStorage.setItem('prueba-ya', '1'); if (f) localStorage.setItem('ccoo-muelles', JSON.stringify({ v: 1, fichas: f })); } } catch (e) {} }, fichas || null);
    const p = await c.newPage(); p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', e => errs.push(e.message));
    p.on('dialog', d => { errs.push('dialogo: ' + d.message()); d.dismiss(); });
    await p.goto((url || BASE) + '#muelles'); await p.waitForTimeout(1300);
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
  const zip = async (archivos) => { const z = new JSZip(); for (const [n, d] of archivos) z.file(n, d); return z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }); };
  const txt = (n, t) => ({ name: n, mimeType: 'text/plain', buffer: Buffer.from(t) });
  // Fichas de verdad: con horario, sitio en el mapa, notas largas
  const fichas = (n, pre) => Array.from({ length: n }, (_, i) => ({ id: pre + String(i).padStart(4, '0'), nombre: `Cliente ${pre} ${i} Logística SL`, lugar: 'Polígono Mas Xirgu, Girona', truco: 'Entrar por la puerta 2, girar a la derecha y muelle ' + (i % 9 + 1) + '. Llamar antes al encargado. Cuidado con la rampa.', nivel: ['facil', 'cuidado', 'dificil'][i % 3], epis: 'Chaleco y botas', lat: 41.9 + i / 1000, lon: 2.8 + i / 1000, hor: { b: [{ d: [1, 2, 3, 4, 5], t: [[360, 840], [900, 1200]] }] } }));
  const foto = 'data:image/jpeg;base64,' + Buffer.alloc(27000, 7).toString('base64'); // ~36 KB, como una foto pequeña

  // Libretas generadas por la app (exporta: el mismo texto que «Descargar archivo» y «Copiar»)
  const { p } = await nuevo();
  const genera = (n, conFoto) => p.evaluate(([l, fo]) => { const f = {}; if (fo) l.forEach(x => f[x.id] = fo); return MuellesCuentas.exporta(l, fo ? f : null); }, [fichas(n, 'g' + n + (conFoto ? 'f' : '')), conFoto ? foto : null]);
  const L = {};
  for (const n of [5, 50, 300]) for (const cf of [false, true]) L[n + (cf ? 'f' : '')] = await genera(n, cf);
  ok(L[300].length < 200000 && L['300f'].length > 9e6, `tamaños reales: 300 sin fotos ${Math.round(L[300].length / 1024)} KB, con fotos ${Math.round(L['300f'].length / 1048576)} MB`);
  ok(JSON.parse(L[5].slice(13))[0].total === 5, 'el archivo dice cuántas fichas lleva');

  // Descarga real desde la app con 50 fichas
  { const { c, p: q } = await nuevo(null, fichas(50, 'dl'));
    const dl = q.waitForEvent('download'); await q.click('#mue-descarga'); const d = await dl;
    const t = require('fs').readFileSync(await d.path(), 'utf8');
    ok(/^libreta-muelles-.*\.txt$/.test(d.suggestedFilename()) && JSON.parse(t.slice(13)).filter(x => x.nombre).length === 50, 'descarga real de 50 fichas: ' + d.suggestedFilename());
    L.dl = t; await c.close(); }

  const casos = [];
  const corta = (t, n) => t.slice(0, n);
  for (const k of ['5', '50', '300', '5f', '50f', '300f']) {
    casos.push([`${k}: entero`, [txt('libreta.txt', L[k])], { todas: true }]);
    if (L[k].length > 65536) casos.push([`${k}: cortado a 65.536 letras (WhatsApp)`, [txt('libreta.txt', corta(L[k], 65536))], { cortado: true }]);
    casos.push([`${k}: recortado al final`, [txt('libreta.txt', corta(L[k], L[k].length - 37))], { cortado: true }]);
  }
  const chat = (t) => `22/11/26, 20:14 - Papá: Te paso la libreta\n22/11/26, 20:15 - Papá: ${t}\n22/11/26, 20:16 - Papá: [foto] IMG-20261122-WA0003.jpg (archivo adjunto)\n22/11/26, 20:17 - Amigo: Gracias! Mira el muelle [3]\n`;
  casos.push(['«Exportar chat» de WhatsApp (ZIP) con la libreta pegada entera', [{ name: 'WhatsApp Chat - Papá.zip', mimeType: 'application/zip', buffer: await zip([['Chat de WhatsApp con Papá.txt', chat(L[50])], ['IMG-20261122-WA0003.jpg', Buffer.from([0xFF, 0xD8, 0xFF, 0])]]) }], { todas: true, n: 50 }]);
  casos.push(['«Exportar chat» con la libreta cortada por WhatsApp', [{ name: 'chat.zip', mimeType: 'application/zip', buffer: await zip([['_chat.txt', chat(corta(L['50f'], 65536))]]) }], { cortado: true }]);
  casos.push(['chat con dos libretas distintas', [txt('chat.txt', chat(L[5]) + chat(L.dl))], { todas: true, n: 55 }]);
  casos.push(['UTF-16 con BOM y cortado', [{ name: 'x.txt', mimeType: 'text/plain', buffer: Buffer.concat([Buffer.from([0xFF, 0xFE]), Buffer.from(corta(L[300], 65536), 'utf16le')]) }], { cortado: true }]);
  casos.push(['BOM y saltos de Windows', [txt('x.txt', '﻿' + L[50].replace('[', '[\r\n') + '\r\n')], { todas: true, n: 50 }]);
  casos.push(['ZIP con la libreta cortada dentro', [{ name: 'DOC-WA0004', mimeType: 'application/octet-stream', buffer: await zip([['libreta.txt', corta(L[300], 100000)]]) }], { cortado: true }]);

  for (const [nom, files, esp] of casos) {
    const { c, p: q } = await nuevo(null, [{ id: 'mia01', nombre: 'Mía SL', truco: 'Puerta 2', nivel: 'facil' }]);
    await carga(q, files);
    const g = await guardadas(q), m = await msg(q), rec = g.filter(f => f.rec === 1).length;
    const total = esp.n || Number((nom.match(/^(\d+)/) || [])[1]);
    const base = g.some(f => f.id === 'mia01' && !f.rec);
    if (esp.todas) ok(base && rec === Math.min(total, 299) && (total < 300 || /no caben/.test(m)) && !/cortado|Llegaron/.test(m), `${nom}: ${rec} cargadas · ${m.slice(0, 50)}`);
    else ok(base && rec > 0 && (!total || rec < total) && (/Llegaron \d+ de \d+/.test(m) || /cortado/.test(m)) && /Descargar archivo/.test(m), `${nom}: ${rec} recuperadas · ${m.slice(0, 80)}`);
    // otra vez lo mismo: nada repetido
    await carga(q, files);
    ok((await guardadas(q)).length === g.length, '   otra vez: no repite');
    await c.close();
  }

  // Pegado como texto en «Pasar fichas», cortado
  { const { c, p: q } = await nuevo();
    await q.fill('#mue-texto', corta(L['5f'], 65536)); await q.click('#mue-importa'); await q.waitForTimeout(300);
    const g = await guardadas(q), m = await msg(q);
    ok(g.length > 0 && g.length < 5 && /Llegaron \d+ de 5/.test(m), 'texto pegado y cortado: ' + g.length + ' · ' + m.slice(0, 70));
    await q.fill('#mue-texto', 'CCOO-MUELLES:[{"libreta":"ccoo-muelles","total":5},{"nombre":"Corta'); await q.click('#mue-importa'); await q.waitForTimeout(300);
    ok((await msg(q)).includes('no se ha podido leer ninguna ficha') && (await guardadas(q)).length === g.length, 'cortado sin ninguna ficha entera: mensaje claro y no toca nada');
    await c.close(); }

  // Partes: con fotos muy grande → varias partes, cada una se lee sola; eligiendo todas, se carga todo
  const partes = await p.evaluate(([l, fo]) => { const f = {}; l.forEach(x => f[x.id] = fo); return MuellesCuentas.trozos(l, f); }, [fichas(300, 'pt'), foto]);
  ok(partes.length >= 2 && partes.every(t => t.length <= 6.5 * 1048576), `300 con fotos: ${partes.length} partes de menos de 6 MB`);
  { const { c, p: q } = await nuevo();
    await carga(q, [txt('libreta-parte-1.txt', partes[0])]);
    ok(/Llegaron \d+ de 300/.test(await msg(q)), 'solo la parte 1: ' + (await msg(q)).slice(0, 70));
    await carga(q, partes.map((t, i) => txt(`libreta-parte-${i + 1}.txt`, t)));
    ok((await guardadas(q)).length === 300 && !/Llegaron/.test(await msg(q)), 'todas las partes a la vez: 300 fichas, sin repetir');
    await c.close(); }

  // La versión de antes (v204) lee el archivo nuevo
  if (VIEJA) {
    const { c, p: q } = await nuevo(VIEJA);
    await carga(q, [txt('libreta.txt', L.dl)]);
    ok((await guardadas(q)).length === 50, 'la v204 lee el archivo nuevo (50 fichas): ' + (await msg(q)).slice(0, 50));
    await c.close();
  }

  const real = errs.filter(e => !/ERR_FAILED|Failed to load resource/i.test(e));
  ok(!real.length, 'sin errores ni ventanas: ' + real.slice(0, 3).join(' | '));
  await b.close();
  console.log(mal ? `\n${mal} MAL` : '\nTodo bien');
  process.exit(mal ? 1 : 0);
})();
