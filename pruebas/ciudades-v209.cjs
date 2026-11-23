// v209: la lista propia de ciudades de Europa (ciudades.js + ciudades.json) encuentra las ciudades de las rutas
// escritas en varios idiomas, con o sin tildes y con faltas. Sin navegador. Uso: node pruebas/ciudades-v209.cjs
const fs = require('fs'), path = require('path');
global.window = { VERSION_WEB: '209' };
global.fetch = async () => ({ ok: true, json: async () => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'ciudades.json'), 'utf8')) });
require(path.join(__dirname, '..', 'ciudades.js'));
const C = window.Ciudades; let mal = 0;
const ok = (c, t) => { console.log((c ? 'OK  ' : 'MAL ') + t); if (!c) mal++; };
const CASOS = [
  ['Lyon', 'Lyon'], ['Lyons', 'Lyon'], ['Lión', 'Lyon'], ['LYON', 'Lyon'], ['Lyon, Francia', 'Lyon'],
  ['Milano', 'Milán'], ['Milán', 'Milán'], ['München', 'Múnich'], ['Munich', 'Múnich'], ['Múnich', 'Múnich'],
  ['Köln', 'Colonia'], ['Koln', 'Colonia'], ['Cologne', 'Colonia'], ['Wien', 'Viena'], ['Vienna', 'Viena'],
  ['Bucureşti', 'Bucarest'], ['Bucuresti', 'Bucarest'], ['Bucharest', 'Bucarest'], ['Napoli', 'Nápoles'], ['Torino', 'Turín'],
  ['Marseille', 'Marsella'], ['Paris', 'París'], ['Toulouse', 'Toulouse'], ['Bordeaux', 'Burdeos'], ['Montpellier', 'Montpellier'],
  ['Nimes', 'Nimes'], ['Perpignan', 'Perpiñán'], ['Lille', 'Lille'], ['Strasbourg', 'Estrasburgo'], ['Narbonne', 'Narbona'],
  ['Avignon', 'Aviñón'], ['Girona', 'Girona'], ['Gerona', 'Girona'], ['Lleida', 'Lleida'], ['Lérida', 'Lleida'],
  ['Zaragoza', 'Zaragoza'], ['Antwerpen', 'Amberes'], ['Anvers', 'Amberes'], ['Bruxelles', 'Bruselas'], ['Lisbon', 'Lisboa'],
  ['Porto', 'Oporto'], ['Praha', 'Praga'], ['Warszawa', 'Varsovia'], ['Timișoara', 'Timisoara'], ['Constanța', 'Constanza'],
  ['Genève', 'Ginebra'], ['Zürich', 'Zúrich'], ['London', 'Londres'], ['Padova', 'Padua'], ['La Jonquera', 'la Jonquera'],
  ['lyom', 'Lyon'], ['marsela', 'Marsella'], ['barcelna', 'Barcelona'], ['bucarets', 'Bucarest']];
(async () => {
  for (const [q, sale] of CASOS) {
    const r = await C.busca(q);
    const n = r[0] ? r[0].nombre.split(',')[0] : '';
    ok(C.plano(n) === C.plano(sale), `«${q}» → ${r.slice(0, 3).map(x => x.nombre).join(' · ') || 'nada'}`);
  }
  ok(!(await C.busca('zzzzqq')).length, 'algo sin parecido: nada');
  ok((await C.busca('Lyon'))[0].lat > 45 && (await C.busca('Lyon'))[0].lat < 46, 'Lyon con su posición');
  const d = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'ciudades.json'), 'utf8'));
  ok(/Natural Earth/.test(d.fuente) && /GeoNames/.test(d.fuente) && d.c.length > 900, `fuente y ${d.c.length} ciudades`);
  console.log(mal ? `\n${mal} MAL` : '\nTodo bien'); process.exit(mal ? 1 : 0);
})();
