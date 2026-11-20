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
  ok((await p.getAttribute('.mue-ir a', 'href')) === 'https://www.google.com/maps/dir/?api=1&destination=41.9,2.8&travelmode=driving', '«Ir allí» con la posición apuntada');
  const g = await p.evaluate(() => JSON.parse(localStorage.getItem('ccoo-muelles')));
  ok(g.fichas.length === 1 && g.fichas[0].nivel === 'dificil', 'guardada en el móvil');
  await p.reload(); await p.waitForTimeout(1200);
  ok(await p.locator('.mue-ficha').count() === 1, 'sigue tras recargar');
  // v193 (petición n.º 61): las fichas salen plegadas y se abren al tocar el nombre
  ok(!(await p.locator('[data-edita]').isVisible()) && await p.locator('.mue-ficha > summary h3').isVisible(), 'la ficha sale plegada (solo el nombre)');
  await p.locator('.mue-ficha > summary').click();
  ok(await p.locator('[data-edita]').isVisible() && (await p.textContent('.mue-ficha > summary')).includes('Cerrar'), 'al tocarla se abre con los detalles');
  await p.locator('.mue-ficha > summary').click(); ok(!(await p.locator('[data-edita]').isVisible()), 'al tocarla otra vez se cierra');
  await p.locator('.mue-ficha > summary').click();
  await p.click('[data-edita]'); await p.fill('#mue-lat', 'hola'); await p.click('#mue-form button[type=submit]');
  ok((await p.textContent('#mue-gps-msg')).includes('no está bien'), 'posición mal escrita: avisa');
  await p.fill('#mue-lat', ''); await p.fill('#mue-lon', ''); await p.fill('#mue-nombre', 'Nave 2'); await p.click('#mue-form button[type=submit]'); await p.waitForTimeout(200);
  ok((await p.textContent('.mue-ficha h3')) === 'Nave 2' && await p.locator('.mue-ficha .mue-ir').count() === 0, 'cambiar ficha y quitar posición');
  const cod = await p.evaluate(() => MuellesCuentas.exporta([{ nombre: 'Otra', truco: 'Por la izquierda', nivel: 'facil' }, JSON.parse(localStorage.getItem('ccoo-muelles')).fichas[0]]));
  await p.locator('#mue-pasar summary').click(); await p.fill('#mue-texto', cod); await p.click('#mue-importa'); await p.waitForTimeout(200);
  ok(await p.locator('.mue-ficha').count() === 2 && (await p.textContent('#mue-msg')).includes('1 ya'), 'pegar libreta: añade 1 y no duplica');
  await p.click('#mue-niveles [data-nivel=facil]'); ok(await p.locator('.mue-ficha').count() === 1, 'filtro por nivel');
  await p.click('#mue-niveles [data-nivel=""]'); await p.fill('#mue-q', 'otra'); ok(await p.locator('.mue-ficha').count() === 1, 'buscar'); await p.fill('#mue-q', '');
  await p.click('#mue-niveles [data-nivel=facil]'); ok(await p.locator('.mue-ficha[open]').count() === 1, 'al buscar y salir un solo cliente, se abre solo');
  await p.locator('.mue-ficha > summary').click(); await p.click('#mue-niveles [data-nivel=""]');
  ok(await p.locator('.mue-ficha[open]').count() === 1 && (await p.textContent('.mue-ficha[open] h3')) === 'Nave 2', 'lo abierto o cerrado a mano se mantiene al filtrar y volver');
  await p.locator('[data-borra]').first().click(); await p.locator('[data-no]').click(); ok(await p.locator('.mue-ficha').count() === 2, 'borrar y decir no: no borra');
  await p.locator('[data-borra]').first().click(); await p.locator('.mue-si').click(); await p.waitForTimeout(200);
  ok(await p.locator('.mue-ficha').count() === 1 && (await p.evaluate(() => JSON.parse(localStorage.getItem('ccoo-muelles')).fichas.length)) === 1, 'borrar y decir sí');
  await c.grantPermissions(['geolocation']); await c.setGeolocation({ latitude: 41.5, longitude: 2.1 });
  await p.click('#mue-nuevo'); await p.click('#mue-gps'); await p.waitForTimeout(800);
  ok((await p.inputValue('#mue-lat')) === '41.5', 'usar mi posición');
  // v190 «Ir allí» y mapa: los cuadros del mapa se sirven con una imagen de prueba (sin salir a internet)
  await p.click('#mue-cancela');
  ok(await p.locator('#mue-mapa-caja').isHidden(), 'sin posiciones no sale el mapa');
  const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  await c.route('https://tile.openstreetmap.org/**', r => r.fulfill({ body: PNG, contentType: 'image/png' }));
  const dos = await p.evaluate(() => MuellesCuentas.exporta([{ nombre: 'Punto A', truco: 't', nivel: 'dificil', lat: 41.9, lon: 2.8 }, { nombre: 'Punto B', truco: 't', nivel: 'facil', lat: 41.95, lon: 2.85 }]));
  await p.fill('#mue-texto', dos); await p.click('#mue-importa'); await p.waitForTimeout(200);
  ok(await p.locator('#mue-mapa-caja').isVisible(), 'con posiciones sale la caja del mapa');
  ok(await p.locator('#mue-ley li').count() === 3, 'leyenda con forma y texto de los 3 niveles');
  const ir = await p.locator('.mue-ir a').evaluateAll(l => l.map(a => a.getAttribute('href')));
  ok(ir.length === 6 && ir.every(h => h.startsWith('https://')), '«Ir allí» con 3 apps por ficha, todo https');
  await p.click('#mue-ver-mapa'); await p.waitForTimeout(1200);
  ok(await p.locator('#mue-mapa .mue-pin').count() === 2 && await p.locator('#mue-mapa .mue-pin.dificil').count() === 1, 'mapa con un punto por ficha y su nivel');
  // v193 (petición n.º 61): «Pantalla completa» en el mapa de clientes
  await p.click('#mue-mapa .mue-grande-btn'); await p.waitForTimeout(300);
  const bx = await p.locator('#mue-mapa').boundingBox();
  ok(await p.locator('#mue-mapa.completa').count() === 1 && Math.round(bx.width) === 360 && Math.round(bx.height) === 740 && (await p.textContent('#mue-mapa .mue-grande-btn')).includes('Cerrar mapa'), 'pantalla completa: el mapa ocupa todo el móvil');
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  ok(await p.locator('#mue-mapa.completa').count() === 0 && (await p.textContent('#mue-mapa .mue-grande-btn')).includes('Pantalla completa'), 'Esc vuelve a como estaba');
  await p.click('#mue-mapa .mue-grande-btn'); await p.waitForTimeout(300);
  await p.click('#mue-mapa .mue-grande-btn'); await p.waitForTimeout(200);
  ok(await p.locator('#mue-mapa.completa').count() === 0, '«Cerrar mapa» vuelve a como estaba');
  // v194 (petición n.º 62): «Cerrar el mapa» debajo del mapa
  ok(await p.locator('#mue-cierra-mapa').isVisible() && !(await p.locator('#mue-ver-mapa').isVisible()), 'con el mapa abierto sale «Cerrar el mapa» y no «Ver el mapa»');
  await p.click('#mue-cierra-mapa'); await p.waitForTimeout(200);
  ok(!(await p.locator('#mue-mapa').isVisible()) && !(await p.locator('#mue-cierra-mapa').isVisible()) && await p.locator('#mue-ver-mapa').isVisible(), '«Cerrar el mapa» lo esconde y vuelve «Ver el mapa»');
  await p.click('#mue-ver-mapa'); await p.waitForTimeout(500);
  ok(await p.locator('#mue-mapa').isVisible() && await p.locator('#mue-mapa .mue-pin').count() === 2 && await p.locator('#mue-cierra-mapa').isVisible(), 'se vuelve a abrir con sus puntos');
  await p.click('#mue-mapa .mue-grande-btn'); await p.waitForTimeout(300);
  await p.fill('#mue-q', 'zzz'); await p.waitForTimeout(100);
  await p.locator('#mue-mapa .leaflet-marker-icon').first().click(); await p.waitForTimeout(700);
  ok(await p.locator('.mue-ficha.mue-resalta').count() === 1 && (await p.inputValue('#mue-q')) === '', 'tocar un punto abre su ficha (quita la búsqueda que la escondía)');
  ok(await p.locator('#mue-mapa.completa').count() === 0 && await p.locator('.mue-ficha.mue-resalta[open]').count() === 1 && await p.locator('.mue-ficha.mue-resalta [data-borra]').isVisible(), 'desde la pantalla completa, tocar un punto cierra el mapa grande y abre la ficha');
  await p.locator('.mue-ficha.mue-resalta [data-borra]').click(); await p.locator('.mue-si').click(); await p.waitForTimeout(200);
  ok(await p.locator('#mue-mapa .mue-pin').count() === 1, 'al borrar, el punto sale del mapa');
  // v192 (petición n.º 60): «Elegir en el mapa» en el formulario
  await p.click('#mue-nuevo'); await p.click('#mue-elegir'); await p.waitForTimeout(900);
  ok(await p.locator('#mue-elige').isVisible() && await p.getAttribute('#mue-elegir', 'aria-expanded') === 'true', 'elegir en el mapa: se abre dentro de la ficha');
  const caja = await p.locator('#mue-elige-mapa').boundingBox();
  await p.mouse.click(caja.x + caja.width / 2 + 40, caja.y + caja.height / 2 + 30); await p.waitForTimeout(300);
  const la = await p.inputValue('#mue-lat'), lo = await p.inputValue('#mue-lon');
  ok(la !== '' && lo !== '' && await p.locator('#mue-elige-mapa .mue-pin-puerta').count() === 1, 'tocar el mapa pone el punto y rellena latitud y longitud');
  await p.fill('#mue-lat', '41.95'); await p.fill('#mue-lon', '2.85'); await p.locator('#mue-lon').dispatchEvent('change'); await p.waitForTimeout(200);
  const pp = await p.evaluate(() => { const r = document.querySelector('#mue-elige-mapa .mue-pin-puerta').getBoundingClientRect(); return r.width > 0; });
  ok(pp, 'escribir los números a mano mueve el punto');
  await p.click('#mue-quita-punto');
  ok((await p.inputValue('#mue-lat')) === '' && await p.locator('#mue-elige-mapa .mue-pin-puerta').count() === 0, 'quitar el punto vacía la posición');
  await p.mouse.click(caja.x + caja.width / 2, caja.y + caja.height / 2); await p.waitForTimeout(200);
  await p.fill('#mue-nombre', 'Elegido en mapa'); await p.fill('#mue-truco', 'Por la puerta de atrás');
  await p.click('#mue-form button[type=submit]'); await p.waitForTimeout(300);
  const nueva = await p.evaluate(() => JSON.parse(localStorage.getItem('ccoo-muelles')).fichas.find(f => f.nombre === 'Elegido en mapa'));
  ok(nueva && typeof nueva.lat === 'number' && typeof nueva.lon === 'number' && await p.locator('#mue-elige').isHidden(), 'guardar con el punto elegido: la ficha lleva su posición y el mapa se cierra');
  const c2 = await b.newContext({ viewport: { width: 360, height: 740 } });
  await c2.route('**/lib/supabase.js*', r => r.fulfill({ path: require('path').join(__dirname, 'mock-supabase.js'), contentType: 'application/javascript' }));
  await c2.addInitScript(d => { try { localStorage.setItem('ccoo-aviso-privacidad', '1'); localStorage.setItem('ccoo-muelles', d); } catch (e) {} }, JSON.stringify({ v: 1, fichas: [{ id: 'mx1', nombre: 'X', truco: 't', nivel: 'cuidado', lat: 41.9, lon: 2.8 }] }));
  const p2 = await c2.newPage(); p2.on('pageerror', e => errs.push('sin red: ' + e.message));
  await p2.goto((process.env.BASE || 'http://localhost:8765/') + '#muelles'); await p2.waitForTimeout(1500);
  try { await p2.locator('#bienvenida').click({ timeout: 1500 }); } catch {}
  await c2.setOffline(true); await p2.click('#mue-ver-mapa'); await p2.waitForTimeout(500);
  ok((await p2.textContent('#mue-mapa-msg')).includes('Sin internet') && await p2.locator('.mue-ficha').count() === 1, 'sin internet: mensaje claro y la libreta sigue');
  await p2.click('#mue-nuevo'); await p2.click('#mue-elegir'); await p2.waitForTimeout(300);
  ok((await p2.textContent('#mue-gps-msg')).includes('Sin internet') && await p2.locator('#mue-elige').isHidden(), 'sin internet: elegir en el mapa lo dice y se pueden escribir los números');
  await c2.close();
  // v190 idiomas (orden de Lorena): por defecto español aunque el móvil esté en rumano; botón «Español» para volver
  const c3 = await b.newContext({ viewport: { width: 360, height: 740 }, locale: 'ro-RO' });
  await c3.route('**/lib/supabase.js*', r => r.fulfill({ path: require('path').join(__dirname, 'mock-supabase.js'), contentType: 'application/javascript' }));
  await c3.addInitScript(() => { try { localStorage.setItem('ccoo-aviso-privacidad', '1'); } catch (e) {} });
  const p3 = await c3.newPage(); p3.on('pageerror', e => errs.push('idioma: ' + e.message));
  await p3.goto((process.env.BASE || 'http://localhost:8765/') + '#muelles'); await p3.waitForTimeout(1500);
  try { await p3.locator('#bienvenida').click({ timeout: 1500 }); } catch {}
  const sel = p3.locator('#v-muelles .zc-idioma select');
  ok(await sel.inputValue() === '' && await p3.locator('#v-muelles .vuelve-es').isHidden() && await p3.locator('#mue-no-traduce').isHidden(), 'móvil en rumano: la herramienta sale en español');
  ok((await sel.locator('option').allTextContents()).includes('Română'), 'cada idioma con su nombre en su idioma');
  await sel.selectOption('ro'); await p3.waitForTimeout(600);
  ok(await p3.evaluate(() => localStorage.getItem('ccoo-mi-idioma')) === 'ro' && await p3.locator('#v-muelles .vuelve-es').isVisible() && await p3.locator('#mue-no-traduce').isVisible(), 'rumano: se recuerda, sale «Español» y el aviso de que la libreta no se traduce');
  await p3.selectOption('#v-muelles .zc-idioma select', 'ar'); await p3.waitForTimeout(600);
  ok(await p3.getAttribute('#v-muelles', 'dir') === 'rtl', 'árabe de derecha a izquierda');
  await p3.click('#v-muelles .vuelve-es'); await p3.waitForTimeout(600);
  ok(await p3.evaluate(() => localStorage.getItem('ccoo-mi-idioma')) === null && await sel.inputValue() === '' && await p3.locator('#v-muelles .vuelve-es').isHidden() && await p3.getAttribute('#v-muelles', 'dir') !== 'rtl', '«Español» vuelve al español y lo recuerda');
  await p3.goto((process.env.BASE || 'http://localhost:8765/') + '#descansos'); await p3.waitForTimeout(800);
  ok(await p3.locator('#v-descansos .vuelve-es').count() === 1, '«Español» también en Mis descansos');
  await c3.close();
  // v195 (petición n.º 63): foto de cada cliente, guardada solo en el móvil (IndexedDB), sin tocar «ccoo-muelles»
  const LIB = { v: 1, fichas: [{ id: 'mfa01', nombre: 'Uno', truco: 't1', nivel: 'dificil' }, { id: 'mfa02', nombre: 'Dos', truco: 't2', nivel: 'facil' }] };
  const c4 = await b.newContext({ viewport: { width: 360, height: 740 } });
  await c4.route('**/lib/supabase.js*', r => r.fulfill({ path: require('path').join(__dirname, 'mock-supabase.js'), contentType: 'application/javascript' }));
  await c4.addInitScript(d => { try { localStorage.setItem('ccoo-aviso-privacidad', '1'); if (!localStorage.getItem('ccoo-muelles')) localStorage.setItem('ccoo-muelles', d); } catch (e) {} }, JSON.stringify(LIB));
  const p4 = await c4.newPage(); p4.on('console', m => m.type() === 'error' && errs.push('foto: ' + m.text())); p4.on('pageerror', e => errs.push('foto: ' + e.message));
  await p4.goto((process.env.BASE || 'http://localhost:8765/') + '#muelles'); await p4.waitForTimeout(1500);
  try { await p4.locator('#bienvenida').click({ timeout: 1500 }); } catch {}
  const antesLS = await p4.evaluate(() => localStorage.getItem('ccoo-muelles'));
  const foto = Buffer.from(await p4.evaluate(() => { const c = document.createElement('canvas'); c.width = 2400; c.height = 1600; const x = c.getContext('2d'); x.fillStyle = '#c33'; x.fillRect(0, 0, 2400, 1600); x.fillStyle = '#33c'; x.fillRect(600, 400, 1200, 800); return c.toDataURL('image/png').split(',')[1]; }), 'base64');
  await p4.locator('.mue-ficha[data-ficha=mfa01] > summary').click();
  ok(await p4.locator('.mue-ficha[data-ficha=mfa01] [data-foto]').isVisible() && (await p4.textContent('.mue-ficha[data-ficha=mfa01] [data-foto]')).includes('Añadir una foto') && await p4.locator('.mue-ficha[data-ficha=mfa01] [data-quitafoto]').count() === 0, 'foto: botón «Añadir una foto» en la ficha abierta');
  let fc = p4.waitForEvent('filechooser'); await p4.click('.mue-ficha[data-ficha=mfa01] [data-foto]'); await (await fc).setFiles({ name: 'muelle.png', mimeType: 'image/png', buffer: foto }); await p4.waitForTimeout(900);
  ok(await p4.locator('.mue-ficha[data-ficha=mfa01] .mue-foto img[src^="blob:"]').count() === 1 && (await p4.textContent('#mue-msg')).includes('Foto guardada'), 'foto: se ve en la ficha y dice que está guardada');
  const guardada = await p4.evaluate(() => new Promise(ok => { const r = indexedDB.open('ccoo-muelles-fotos'); r.onsuccess = () => { const g = r.result.transaction('fotos').objectStore('fotos').get('mfa01'); g.onsuccess = async () => { const b = g.result; if (!b) return ok(null); const im = await createImageBitmap(b); ok({ tipo: b.type, w: im.width, h: im.height }); }; }; }));
  ok(guardada && guardada.tipo === 'image/jpeg' && guardada.w === 1280 && guardada.h === 853, 'foto: reducida a 1280 px en JPEG (sin datos de la foto) ' + JSON.stringify(guardada));
  ok(await p4.evaluate(() => localStorage.getItem('ccoo-muelles')) === antesLS, 'foto: la libreta del móvil (ccoo-muelles) no cambia nada');
  ok((await p4.textContent('.mue-ficha[data-ficha=mfa01] [data-foto]')).includes('Cambiar la foto') && await p4.locator('.mue-ficha[data-ficha=mfa01] [data-quitafoto]').isVisible(), 'foto: salen «Cambiar la foto» y «Quitar la foto»');
  // La foto pasa con la ficha a un compañero (lo pidió el padre): se copia en el texto y el otro móvil la recibe
  await c4.grantPermissions(['clipboard-read', 'clipboard-write']);
  await p4.click('.mue-ficha[data-ficha=mfa01] [data-copia]'); await p4.waitForTimeout(1200);
  const pasado = await p4.evaluate(() => navigator.clipboard.readText());
  const codP = pasado.slice(pasado.indexOf('CCOO-MUELLES:'));
  const datosP = JSON.parse(codP.slice('CCOO-MUELLES:'.length));
  ok((await p4.textContent('#mue-msg')).includes('con la foto') && /^data:image\/jpeg;base64,/.test(datosP[0].foto) && datosP[0].foto.length <= 40000, 'foto: «Copiar para un compañero» lleva la foto en pequeño (' + (datosP[0].foto || '').length + ' letras)');
  ok(await p4.evaluate(() => localStorage.getItem('ccoo-muelles')) === antesLS, 'foto: copiar no cambia la libreta');
  const c5 = await b.newContext({ viewport: { width: 360, height: 740 } });
  await c5.route('**/lib/supabase.js*', r => r.fulfill({ path: require('path').join(__dirname, 'mock-supabase.js'), contentType: 'application/javascript' }));
  await c5.addInitScript(() => { try { localStorage.setItem('ccoo-aviso-privacidad', '1'); } catch (e) {} });
  const p5 = await c5.newPage(); p5.on('console', m => m.type() === 'error' && errs.push('compañero: ' + m.text())); p5.on('pageerror', e => errs.push('compañero: ' + e.message));
  await p5.goto((process.env.BASE || 'http://localhost:8765/') + '#muelles'); await p5.waitForTimeout(1500);
  try { await p5.locator('#bienvenida').click({ timeout: 1500 }); } catch {}
  await p5.locator('#mue-pasar summary').click(); await p5.fill('#mue-texto', pasado); await p5.click('#mue-importa'); await p5.waitForTimeout(1200);
  await p5.locator('.mue-ficha > summary').first().click(); await p5.waitForTimeout(400);
  const ls5 = await p5.evaluate(() => localStorage.getItem('ccoo-muelles'));
  ok(await p5.locator('.mue-ficha .mue-foto img[src^="blob:"]').count() === 1 && (await p5.textContent('#mue-msg')).includes('Con su foto') && !ls5.includes('foto') && !ls5.includes('base64'), 'foto: el compañero la pega y su ficha llega con la foto (la libreta no guarda la foto como texto)');
  // Pegarlo otra vez cuando ya tiene el cliente pero le falta la foto: se la añade
  const idC = await p5.evaluate(() => JSON.parse(localStorage.getItem('ccoo-muelles')).fichas[0].id);
  await p5.click(`.mue-ficha[data-ficha=${idC}] [data-quitafoto]`); await p5.waitForTimeout(400);
  await p5.locator('#mue-pasar').evaluate(d => { d.open = true; }); await p5.fill('#mue-texto', pasado); await p5.click('#mue-importa'); await p5.waitForTimeout(1200);
  ok(await p5.locator('.mue-ficha').count() === 1 && await p5.locator('.mue-ficha .mue-foto img').count() === 1 && (await p5.textContent('#mue-msg')).includes('la foto que le faltaba'), 'foto: si ya tenía el cliente sin foto, se la añade sin duplicar');
  // Una «foto» falsa en lo pegado no entra
  const falso = 'CCOO-MUELLES:' + JSON.stringify([{ nombre: 'Falso', truco: 't', nivel: 'facil', foto: 'data:text/html;base64,PHNjcmlwdD4=' }, { nombre: 'Roto', truco: 't', nivel: 'facil', foto: 'data:image/jpeg;base64,AAAA' }]);
  await p5.fill('#mue-texto', falso); await p5.click('#mue-importa'); await p5.waitForTimeout(800);
  ok(await p5.locator('.mue-ficha').count() === 3 && await p5.locator('.mue-ficha[open] .mue-foto, .mue-ficha .mue-foto').count() === 1, 'foto: una foto falsa o rota no entra y la ficha sí');
  await c5.close();
  await p4.reload(); await p4.waitForTimeout(1500);
  await p4.locator('.mue-ficha[data-ficha=mfa01] > summary').click(); await p4.waitForTimeout(400);
  ok(await p4.locator('.mue-ficha[data-ficha=mfa01] .mue-foto img[src^="blob:"]').count() === 1 && await p4.locator('.mue-ficha[data-ficha=mfa02] .mue-foto').count() === 0, 'foto: sigue tras recargar y solo en su cliente');
  const w = await p4.evaluate(() => document.querySelector('.mue-ficha[data-ficha=mfa01] .mue-foto img').getBoundingClientRect().right <= document.documentElement.clientWidth && document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  ok(w, 'foto: cabe en 360 px sin scroll lateral');
  // Dos ventanas: la otra ventana también la ve; al quitarla en una, la otra la pierde al recargar
  const q4 = await c4.newPage(); q4.on('pageerror', e => errs.push('foto 2: ' + e.message));
  await q4.goto((process.env.BASE || 'http://localhost:8765/') + '#muelles'); await q4.waitForTimeout(1500);
  try { await q4.locator('#bienvenida').click({ timeout: 1500 }); } catch {}
  await q4.locator('.mue-ficha[data-ficha=mfa01] > summary').click(); await q4.waitForTimeout(400);
  ok(await q4.locator('.mue-ficha[data-ficha=mfa01] .mue-foto img[src^="blob:"]').count() === 1, 'foto: dos ventanas, la otra también la ve');
  // Cambiar la foto: se sustituye
  fc = p4.waitForEvent('filechooser'); await p4.click('.mue-ficha[data-ficha=mfa01] [data-foto]'); await (await fc).setFiles({ name: 'otra.png', mimeType: 'image/png', buffer: foto }); await p4.waitForTimeout(900);
  ok(await p4.locator('.mue-ficha[data-ficha=mfa01] .mue-foto img').count() === 1, 'foto: cambiarla deja una sola');
  // Algo que no es una foto
  fc = p4.waitForEvent('filechooser'); await p4.click('.mue-ficha[data-ficha=mfa01] [data-foto]'); await (await fc).setFiles({ name: 'x.txt', mimeType: 'text/plain', buffer: Buffer.from('hola') }); await p4.waitForTimeout(400);
  ok((await p4.textContent('#mue-msg')).includes('no es una foto') && await p4.locator('.mue-ficha[data-ficha=mfa01] .mue-foto img').count() === 1, 'foto: un archivo que no es foto no se guarda y no quita la de antes');
  await p4.click('.mue-ficha[data-ficha=mfa01] [data-quitafoto]'); await p4.waitForTimeout(400);
  ok(await p4.locator('.mue-ficha[data-ficha=mfa01] .mue-foto').count() === 0 && (await p4.textContent('.mue-ficha[data-ficha=mfa01] [data-foto]')).includes('Añadir una foto'), 'foto: «Quitar la foto» la quita');
  await q4.reload(); await q4.waitForTimeout(1500); await q4.locator('.mue-ficha[data-ficha=mfa01] > summary').click();
  ok(await q4.locator('.mue-ficha .mue-foto').count() === 0 && await q4.locator('.mue-ficha').count() === 2, 'foto: la otra ventana al recargar ya no la tiene y las fichas siguen');
  // Borrar la ficha borra su foto; la otra ficha y su foto se quedan
  fc = p4.waitForEvent('filechooser'); await p4.click('.mue-ficha[data-ficha=mfa01] [data-foto]'); await (await fc).setFiles({ name: 'm.png', mimeType: 'image/png', buffer: foto }); await p4.waitForTimeout(900);
  await p4.locator('.mue-ficha[data-ficha=mfa02] > summary').click();
  fc = p4.waitForEvent('filechooser'); await p4.click('.mue-ficha[data-ficha=mfa02] [data-foto]'); await (await fc).setFiles({ name: 'm2.png', mimeType: 'image/png', buffer: foto }); await p4.waitForTimeout(900);
  await p4.click('.mue-ficha[data-ficha=mfa01] [data-borra]'); await p4.click('.mue-si'); await p4.waitForTimeout(500);
  const claves = await p4.evaluate(() => new Promise(ok => { const r = indexedDB.open('ccoo-muelles-fotos'); r.onsuccess = () => { const g = r.result.transaction('fotos').objectStore('fotos').getAllKeys(); g.onsuccess = () => ok(g.result); }; }));
  ok(JSON.stringify(claves) === '["mfa02"]' && await p4.locator('.mue-ficha[data-ficha=mfa02] .mue-foto img').count() === 1, 'foto: borrar la ficha borra su foto y la otra se queda ' + JSON.stringify(claves));
  const ls = await p4.evaluate(() => JSON.parse(localStorage.getItem('ccoo-muelles')));
  ok(ls.v === 1 && ls.fichas.length === 1 && ls.fichas[0].id === 'mfa02' && Object.keys(ls.fichas[0]).every(k => ['id','nombre','lugar','nivel','truco','maniobra','dormir','banos','espera','epis','dibujo','lat','lon','cambiado'].includes(k)), 'foto: la libreta guarda lo mismo que antes (mismas claves)');
  await c4.close();
  ok(errs.length === 0, 'sin errores ni ventanas: ' + errs.join(' | '));
  await b.close(); process.exit(mal ? 1 : 0);
})();
