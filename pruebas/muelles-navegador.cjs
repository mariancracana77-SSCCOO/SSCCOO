// v190 (petición n.º 58): «Accesos y muelles» usado de verdad en el navegador: añadir, cambiar, borrar (con «No» y «Sí»),
// pegar una libreta, filtrar, buscar, «Usar mi posición» y que lo escrito no se inyecta. Necesita el servidor en el 8765.
// Uso: NODE_PATH=$(npm root -g) node pruebas/muelles-navegador.cjs
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = []; let mal = 0;
  const ok = (c, t) => { console.log((c ? 'OK  ' : 'MAL ') + t); if (!c) mal++; };
  const c = await b.newContext({ viewport: { width: 360, height: 740 } });
  await c.route('**/lib/supabase.js*', r => r.fulfill({ path: require('path').join(__dirname, 'mock-supabase.js'), contentType: 'application/javascript' }));
  await c.addInitScript(() => { try { localStorage.setItem('ccoo-aviso-privacidad', '1'); } catch (e) {} });
  const p = await c.newPage(); p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', e => errs.push(e.message));
  p.on('dialog', d => { errs.push('dialogo: ' + d.message()); d.dismiss(); });
  await p.goto((process.env.BASE || 'http://localhost:8765/') + '#muelles'); await p.waitForTimeout(1500);
  try { await p.locator('#bienvenida').click({ timeout: 1500 }); } catch {}
  ok(await p.locator('.mue-vacio').isVisible(), 'vacía al empezar');
  await p.click('#mue-nuevo'); await p.click('#mue-form button[type=submit]');
  ok((await p.textContent('#mue-msg')).includes('Falta'), 'sin datos no guarda y lo dice');
  await p.fill('#mue-nombre', '<img src=x onerror=alert(1)>Nave'); await p.fill('#mue-truco', 'Entra <script>alert(2)</script> por detrás');
  await p.selectOption('#mue-nivel', 'dificil'); await p.selectOption('#mue-dibujo', 'atras'); await p.fill('#mue-lat', '41,9'); await p.fill('#mue-lon', '2.8');
  await p.click('#mue-form button[type=submit]'); await p.waitForTimeout(300);
  ok(await p.locator('.mue-ficha').count() === 1, 'ficha añadida');
  ok(await p.locator('.mue-ficha img').count() === 0 && (await p.textContent('.mue-ficha h3')).includes('<img'), 'el texto escrito sale como texto (sin inyectar)');
  ok((await p.getAttribute('.mue-ficha a[target=_blank]', 'href')) === 'https://www.google.com/maps/search/?api=1&query=41.9,2.8', 'enlace del mapa');
  const g = await p.evaluate(() => JSON.parse(localStorage.getItem('ccoo-muelles')));
  ok(g.fichas.length === 1 && g.fichas[0].nivel === 'dificil', 'guardada en el móvil');
  await p.reload(); await p.waitForTimeout(1200);
  ok(await p.locator('.mue-ficha').count() === 1, 'sigue tras recargar');
  await p.click('[data-edita]'); await p.fill('#mue-lat', 'hola'); await p.click('#mue-form button[type=submit]');
  ok((await p.textContent('#mue-gps-msg')).includes('no está bien'), 'posición mal escrita: avisa');
  await p.fill('#mue-lat', ''); await p.fill('#mue-lon', ''); await p.fill('#mue-nombre', 'Nave 2'); await p.click('#mue-form button[type=submit]'); await p.waitForTimeout(200);
  ok((await p.textContent('.mue-ficha h3')) === 'Nave 2' && await p.locator('.mue-ficha a[target=_blank]').count() === 0, 'cambiar ficha y quitar posición');
  const cod = await p.evaluate(() => MuellesCuentas.exporta([{ nombre: 'Otra', truco: 'Por la izquierda', nivel: 'facil' }, JSON.parse(localStorage.getItem('ccoo-muelles')).fichas[0]]));
  await p.locator('#mue-pasar summary').click(); await p.fill('#mue-texto', cod); await p.click('#mue-importa'); await p.waitForTimeout(200);
  ok(await p.locator('.mue-ficha').count() === 2 && (await p.textContent('#mue-msg')).includes('1 ya'), 'pegar libreta: añade 1 y no duplica');
  await p.click('#mue-niveles [data-nivel=facil]'); ok(await p.locator('.mue-ficha').count() === 1, 'filtro por nivel');
  await p.click('#mue-niveles [data-nivel=""]'); await p.fill('#mue-q', 'otra'); ok(await p.locator('.mue-ficha').count() === 1, 'buscar'); await p.fill('#mue-q', '');
  await p.locator('[data-borra]').first().click(); await p.locator('[data-no]').click(); ok(await p.locator('.mue-ficha').count() === 2, 'borrar y decir no: no borra');
  await p.locator('[data-borra]').first().click(); await p.locator('.mue-si').click(); await p.waitForTimeout(200);
  ok(await p.locator('.mue-ficha').count() === 1 && (await p.evaluate(() => JSON.parse(localStorage.getItem('ccoo-muelles')).fichas.length)) === 1, 'borrar y decir sí');
  await c.grantPermissions(['geolocation']); await c.setGeolocation({ latitude: 41.5, longitude: 2.1 });
  await p.click('#mue-nuevo'); await p.click('#mue-gps'); await p.waitForTimeout(800);
  ok((await p.inputValue('#mue-lat')) === '41.5', 'usar mi posición');
  ok(errs.length === 0, 'sin errores ni ventanas: ' + errs.join(' | '));
  await b.close(); process.exit(mal ? 1 : 0);
})();
