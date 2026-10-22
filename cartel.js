// Código QR generado en el propio navegador (librería qrcode-generator, MIT).
// Nivel H (aguanta un 30 % tapado): así se puede poner el logo en el centro y sigue leyéndose.
const qr = (id, texto, nivel = "H") => { const q = qrcode(0, nivel); q.addData(texto); q.make(); document.getElementById(id).innerHTML = q.createSvgTag({ cellSize: 8, margin: 0, scalable: true }); };
qr("qr-web", WEB_URL); document.getElementById("url-web").textContent = WEB_URL.replace(/^https:\/\//, "");
sb.from("paginas").select("contenido").eq("slug", "telegram").maybeSingle().then(({ data }) => {
  const t = (data?.contenido || "").trim();
  const url = t.startsWith("@") ? "https://t.me/" + t.slice(1) : (t.startsWith("https://t.me/") ? t : "");
  if (url) { document.getElementById("caja-tg").style.display = ""; document.querySelector(".hoja").classList.add("con-tg"); qr("qr-tg", url, "M"); document.getElementById("url-tg").textContent = url.replace(/^https:\/\//, ""); }
});
document.getElementById("b-imprimir").onclick = () => print();
