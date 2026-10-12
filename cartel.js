// Código QR generado en el propio navegador (librería qrcode-generator, MIT)
const qr = (id, texto) => { const q = qrcode(0, "M"); q.addData(texto); q.make(); document.getElementById(id).innerHTML = q.createSvgTag({ cellSize: 8, margin: 0, scalable: true }); };
qr("qr-web", WEB_URL); document.getElementById("url-web").textContent = WEB_URL;
sb.from("paginas").select("contenido").eq("slug", "telegram").maybeSingle().then(({ data }) => {
  const t = (data?.contenido || "").trim();
  const url = t.startsWith("@") ? "https://t.me/" + t.slice(1) : (t.startsWith("https://t.me/") ? t : "");
  if (url) { document.getElementById("caja-tg").style.display = ""; qr("qr-tg", url); document.getElementById("url-tg").textContent = url; }
});
document.getElementById("b-imprimir").onclick = () => print();
