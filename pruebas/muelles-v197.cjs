// v197: «Accesos y muelles»: aviso de fichas repetidas (quitar con copia y deshacer), copiar sin fotos y abrir un archivo.
// Necesita el servidor en el 8765. Uso: BASE=http://localhost:8765/ NODE_PATH=$(npm root -g) node pruebas/muelles-v197.cjs
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = []; let mal = 0;
  const ok = (c, t) => { console.log((c ? 'OK  ' : 'MAL ') + t); if (!c) mal++; };
  const c = await b.newContext({ viewport: { width: 360, height: 740 } });
  await c.grantPermissions(['clipboard-read', 'clipboard-write']);
  await c.route('**/lib/supabase.js*', r => r.fulfill({ path: require('path').join(__dirname, 'mock-supabase.js'), contentType: 'application/javascript' }));
  const fichas = [
    { id: 'rrr1', nombre: 'Brotte SA', truco: 'Entrar por detrás', nivel: 'cuidado', cambiado: '2026-11-01' },
    { id: 'rrr2', nombre: 'brotte sa ', truco: 'ENTRAR por detrás', nivel: 'cuidado', cambiado: '2026-11-05' },
    { id: 'rrr3', nombre: 'Max Plastic', truco: 'Marcha atrás', nivel: 'facil' }];
  await c.addInitScript((f) => { try { localStorage.setItem('ccoo-aviso-privacidad', '1'); if (!localStorage.getItem('prueba-ya')) { localStorage.setItem('prueba-ya', '1'); localStorage.setItem('ccoo-muelles', JSON.stringify({ v: 1, fichas: f })); } } catch (e) {} }, fichas);
  const p = await c.newPage(); p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', e => errs.push(e.message));
  p.on('dialog', d => { errs.push('dialogo: ' + d.message()); d.dismiss(); });
  await p.goto((process.env.BASE || 'http://localhost:8765/') + '#muelles'); await p.waitForTimeout(1500);
  try { await p.locator('#bienvenida').click({ timeout: 1500 }); } catch {}
  ok(await p.locator('#mue-repes').isVisible() && (await p.textContent('#mue-repes-t')).includes('1 ficha repetida'), 'avisa de 1 ficha repetida');
  await p.click('#mue-repes-quita'); ok(await p.locator('#mue-repes-si').isVisible(), 'pregunta antes de quitar');
  await p.click('#mue-repes-no'); ok(await p.locator('.mue-ficha').count() === 3, 'Cancelar no quita nada');
  await p.click('#mue-repes-quita'); await p.click('#mue-repes-si'); await p.waitForTimeout(300);
  const g = await p.evaluate(() => JSON.parse(localStorage.getItem('ccoo-muelles')));
  ok(g.fichas.length === 2 && g.fichas.some(x => x.id === 'rrr2') && !g.fichas.some(x => x.id === 'rrr1'), 'quita la repetida y deja la más reciente');
  ok(await p.evaluate(() => JSON.parse(localStorage.getItem('ccoo-muelles-copia')).fichas.length) === 3, 'guarda copia antes de quitar');
  ok(!(await p.locator('#mue-repes').isVisible()), 'ya no hay aviso');
  await p.click('#mue-deshacer'); await p.waitForTimeout(300);
  ok(await p.locator('.mue-ficha').count() === 3, 'Deshacer devuelve las 3');
  await p.locator('#mue-pasar summary').click();
  ok(await p.locator('#mue-exporta-sin').isVisible() && !(await p.locator('#mue-exporta').isVisible()), 'sin fotos: solo «Copiar sin fotos»');
  await p.click('#mue-exporta-sin'); await p.waitForTimeout(300);
  const cop = await p.evaluate(() => navigator.clipboard.readText().catch(() => ''));
  ok(cop.length > 20, 'copia la libreta: ' + cop.slice(0, 30));
  // Abrir un archivo con una ficha nueva
  const txt = await p.evaluate(() => MuellesCuentas.exporta([{ id: 'n1', nombre: 'Faca', truco: 'Fácil', nivel: 'facil' }]));
  const fc = p.waitForEvent('filechooser'); await p.click('#mue-abre-archivo');
  await (await fc).setFiles({ name: 'libreta.txt', mimeType: 'text/plain', buffer: Buffer.from(txt) }); await p.waitForTimeout(500);
  ok(await p.locator('.mue-ficha').count() === 4 && (await p.textContent('#mue-msg')).length > 0, 'abrir un archivo añade la ficha nueva');
  const fc2 = p.waitForEvent('filechooser'); await p.click('#mue-abre-archivo');
  await (await fc2).setFiles({ name: 'libreta.txt', mimeType: 'text/plain', buffer: Buffer.from(txt) }); await p.waitForTimeout(500);
  ok(await p.locator('.mue-ficha').count() === 4, 'abrir el mismo archivo otra vez no duplica');
  // v199 (petición n.º 67): horario
  await p.click('#mue-nuevo'); await p.fill('#mue-nombre', 'Horas SA'); await p.fill('#mue-truco', 'Por la puerta 1');
  for (const d of ['1', '2', '3', '4', '5', '6', '7']) await p.click(`#mue-hor-bloques [data-hd="${d}"]`);
  await p.fill('#mue-hor-bloques [data-ht="0"][data-hx="0"]', '00:00'); await p.fill('#mue-hor-bloques [data-ht="0"][data-hx="1"]', '23:59');
  await p.click('#mue-form button[type=submit]'); await p.waitForTimeout(300);
  const hs = await p.evaluate(() => JSON.parse(localStorage.getItem('ccoo-muelles')).fichas.find(f => f.nombre === 'Horas SA'));
  ok(hs && hs.hor && hs.hor.b[0].d.length === 7 && hs.hor.b[0].t[0][1] === 1439, 'horario guardado (todos los días)');
  ok((await p.textContent('.mue-ficha[data-ficha="' + hs.id + '"] .mue-estado')).includes('Abierto ahora'), 'la ficha dice «Abierto ahora»');
  await p.click('#mue-nuevo'); await p.fill('#mue-nombre', 'Mal SA'); await p.fill('#mue-truco', 'x');
  await p.click('#mue-hor-bloques [data-hd="1"]'); await p.click('#mue-form button[type=submit]'); await p.waitForTimeout(200);
  ok((await p.textContent('#mue-hor-msg')).includes('falta algo') && !(await p.locator('#mue-form').isHidden()), 'horario a medias: avisa y no guarda');
  await p.click('#mue-h24'); await p.click('#mue-form button[type=submit]'); await p.waitForTimeout(300);
  ok((await p.textContent('.mue-ficha.cuidado')).includes('Abierto 24 h') || (await p.content()).includes('Abierto 24 h'), '24 horas: «Abierto 24 h»');
  ok(await p.locator('#mue-abiertos').isVisible(), 'sale el filtro «Solo los abiertos ahora»');
  const antes = await p.locator('.mue-ficha').count(); await p.click('#mue-abiertos'); await p.waitForTimeout(200);
  ok(await p.locator('.mue-ficha').count() === 2 && antes > 2, 'el filtro deja solo los abiertos (2 de ' + antes + ')');
  await p.click('#mue-abiertos');
  await p.click('.mue-ficha[data-ficha="' + hs.id + '"] [data-edita]');
  ok(await p.inputValue('#mue-hor-bloques [data-ht="0"][data-hx="0"]') === '00:00' && await p.getAttribute('#mue-hor-bloques [data-hd="3"]', 'aria-pressed') === 'true', 'al cambiar la ficha vuelve su horario');
  await p.click('#mue-form button[type=submit]'); await p.waitForTimeout(200);
  // Dos ventanas: lo de una no pisa la otra al recargar
  const q = await c.newPage(); await q.goto((process.env.BASE || 'http://localhost:8765/') + '#muelles'); await q.waitForTimeout(1500);
  ok(await q.locator('.mue-ficha').count() === 6, 'la otra ventana ve las 6');
  await c.close();
  ok(errs.length === 0, 'sin errores ni ventanas: ' + errs.join(' | '));
  await b.close(); process.exit(mal ? 1 : 0);
})();
