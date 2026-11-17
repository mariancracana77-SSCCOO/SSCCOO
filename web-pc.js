// La web en el ordenador (dirección A «Circular», va con web-pc.css). Solo actúa en la vista web (navegador desde 1000 px).
// Pone la fecha del día en la cabecera, como en la cabecera de una publicación. En el móvil y en la app no se ve (styles.css la oculta).
(function () {
  "use strict";
  function ponFecha() {
    const fila = document.querySelector(".cab-fila");
    if (!fila) return;
    let p = fila.querySelector(".cab-fecha");
    if (!p) { p = document.createElement("p"); p.className = "cab-fecha"; fila.insertBefore(p, fila.querySelector(".cab-acciones")); }
    const t = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    p.textContent = t.charAt(0).toUpperCase() + t.slice(1);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ponFecha); else ponFecha();
  document.addEventListener("visibilitychange", () => { if (!document.hidden) ponFecha(); });
  // v189 (lo pidió Lorena): sin pantalla de bienvenida en el ordenador. web-pc.css la oculta desde el principio;
  // aquí se marca como «saltada» para que app.js la quite en cuanto cargue, sin esperar a la animación ni hacer volar el logo.
  if (matchMedia("(min-width: 1000px) and (display-mode: browser)").matches && typeof quitarBienvenida === "function") quitarBienvenida.ya = true;
})();
