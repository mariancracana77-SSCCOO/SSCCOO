// Aplica tamaño de letra, contraste y tema antes de pintar (evita parpadeo)
try{var L=JSON.parse(localStorage.getItem("ccoo-lectura")||"{}"),h=document.documentElement;if(L.letra&&L.letra!=="normal")h.setAttribute("data-letra",L.letra);if(L.contraste==="alto")h.setAttribute("data-contraste","alto");if(L.tema&&L.tema!=="auto")h.setAttribute("data-theme",L.tema)}catch(e){}
// Bienvenida corta si salió entera hace menos de BV_HORAS horas (12, igual que en app.js): se decide aquí, antes de pintar, para que no asome el camión de la larga
try{var B=Number(localStorage.getItem("ccoo-bienvenida")),P=Date.now()-B;if(B>0&&P>=0&&P<12*36e5)document.documentElement.classList.add("bv-corta")}catch(e){}
// No permitir que otra web meta esta dentro de un marco (protege el panel)
if (window.top !== window.self) { try { window.top.location = window.location.href; } catch (e) { document.documentElement.style.display = "none"; } }
