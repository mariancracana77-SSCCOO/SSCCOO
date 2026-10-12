// Aplica tamaño de letra, contraste y tema antes de pintar (evita parpadeo)
try{var L=JSON.parse(localStorage.getItem("ccoo-lectura")||"{}"),h=document.documentElement;if(L.letra&&L.letra!=="normal")h.setAttribute("data-letra",L.letra);if(L.contraste==="alto")h.setAttribute("data-contraste","alto");if(L.tema&&L.tema!=="auto")h.setAttribute("data-theme",L.tema)}catch(e){}
// No permitir que otra web meta esta dentro de un marco (protege el panel)
if (window.top !== window.self) { try { window.top.location = window.location.href; } catch (e) { document.documentElement.style.display = "none"; } }
