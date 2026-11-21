// Datos de «Gálibos y túneles» (petición n.º 66, v199). Lo que lleva «comp» está comprobado en esa fuente oficial;
// lo demás sale como «Sin comprobar: confirma con la señal». Al revisar un dato: ponerlo en «comp» con la fuente y la fecha.
// Base: archivo de Gemini que mandó el padre (24 túneles), corregido donde las fuentes oficiales dicen otra cosa.
window.GalibosDatos = {
 "revisado": "21/11/2026",
 "zonas": [
  {
   "id": "pirineos",
   "n": "Pirineos y España"
  },
  {
   "id": "alpes",
   "n": "Alpes"
  },
  {
   "id": "norte",
   "n": "Alemania y Benelux"
  },
  {
   "id": "canal",
   "n": "Canal de la Mancha"
  }
 ],
 "tuneles": [
  {
   "id": "somport",
   "n": "Túnel de Somport",
   "paises": "España - Francia",
   "zona": "pirineos",
   "via": "N-330 / RN134 / E7",
   "ruta": "Canfranc (Huesca) – Urdos (Pirineos Atlánticos)",
   "km": "8,6 km",
   "alto": 4.3,
   "altoNota": "",
   "adr": "A",
   "adrNota": "En el lado francés es categoría A. Pero todos los vehículos con mercancías peligrosas paran antes de entrar para declararlas y pasar un control. Con código B o C en la carta de porte pasan en convoy, con el túnel cerrado y vehículos de patrulla delante y detrás.",
   "vel": "Entre 50 y 80 km/h.",
   "dist": "150 m para camiones de más de 3,5 t.",
   "normas": [
    "Prohibido adelantar.",
    "Prohibido parar dentro, salvo emergencia (un pinchazo no lo es: sigue hasta el apartadero)."
   ],
   "alt": "Paso fronterizo de Irún / Biriatou (AP-8 / A63) para tráfico ADR y megacamiones.",
   "comp": {
    "alto": {
     "f": "el BOE (acuerdo España-Francia del Somport, 2002)",
     "d": "21/11/2026"
    },
    "adr": {
     "f": "la lista de túneles del CETU (Francia, 2024) y el BOE (reglamento del Somport, 2010)",
     "d": "21/11/2026"
    },
    "vel": {
     "f": "el BOE (acuerdo España-Francia del Somport, 2002)",
     "d": "21/11/2026"
    },
    "dist": {
     "f": "el BOE (acuerdo España-Francia del Somport, 2002)",
     "d": "21/11/2026"
    }
   }
  },
  {
   "id": "vielha",
   "n": "Túnel de Vielha (Juan Carlos I)",
   "paises": "España",
   "zona": "pirineos",
   "via": "N-230",
   "ruta": "Vilaller – Vielha / Val d’Aran (Lleida)",
   "km": "5,2 km",
   "alto": 4.2,
   "altoNota": "",
   "adr": null,
   "adrNota": "Hay días y horas en que no pueden pasar camiones con panel naranja. Algunas cargas exentas solo pueden pasar de 6 a 10 h. Además, la N-230 hacia Arán tiene restricciones para camiones de más de 7,5 t ciertos días (por ejemplo, viernes de 17 a 24 h hacia Francia). La letra de la categoría está sin comprobar: mira la señal.",
   "vel": "",
   "dist": "",
   "normas": [
    "Un carril por sentido con carril lento adicional en sentido norte (subida del 4,5%). (sin comprobar)",
    "Velocidad máxima 80 km/h. Distancia mínima de seguridad: 100 metros. (sin comprobar)",
    "Control frecuente de nieve y cadenas en boca sur y norte en invierno. (sin comprobar)"
   ],
   "alt": "Autopista AP-7 / A9 por La Jonquera – Perpiñán.",
   "comp": {
    "adr": {
     "f": "la Resolución ISP/300/2026 de Cataluña (BOE)",
     "d": "21/11/2026"
    }
   }
  },
  {
   "id": "bielsa",
   "n": "Túnel Internacional de Bielsa–Aragnouet",
   "paises": "España - Francia",
   "zona": "pirineos",
   "via": "A-138 / D173",
   "ruta": "Bielsa (Huesca) – Aragnouet / Saint-Lary (FR)",
   "km": "3,0 km",
   "alto": 4,
   "altoNota": "",
   "adr": "E",
   "adrNota": "",
   "vel": "",
   "dist": "",
   "normas": [
    "Regulado por semáforo alternativo en ambos extremos para camiones (paso en sentido único alterno). (sin comprobar)",
    "Pendiente fuerte en el lado francés (hasta 8%) con paellas cerradas y cierre nocturno ocasional en invierno por aludes. (sin comprobar)"
   ],
   "alt": "Túnel de Somport (N-330, admite hasta 4,30 m) o Irún / La Jonquera.",
   "comp": {
    "adr": {
     "f": "la lista de túneles del CETU (Francia, 2024)",
     "d": "21/11/2026"
    }
   }
  },
  {
   "id": "cadi",
   "n": "Túnel del Cadí",
   "paises": "España",
   "zona": "pirineos",
   "via": "C-16 / E9",
   "ruta": "Bagà (Berguedà) – Urús / Puigcerdà (Cerdanya)",
   "km": "5,0 km",
   "alto": 4.2,
   "altoNota": "",
   "adr": null,
   "adrNota": "Hay días y horas en que no pueden pasar camiones con panel naranja (fines de semana y festivos). Algunas cargas exentas solo pueden pasar de 23 a 6 h. La letra de la categoría está sin comprobar: mira la señal.",
   "vel": "",
   "dist": "",
   "normas": [
    "Túnel de peaje de tubo único bidireccional. Velocidad máxima 80 km/h (mínima 50 km/h). (sin comprobar)",
    "Distancia mínima entre camiones: 150 metros. Prohibido adelantar. (sin comprobar)"
   ],
   "alt": "Collada de Toses (N-260, puerto muy sinuoso) o eje C-17 / N-152 por Ripoll.",
   "comp": {
    "adr": {
     "f": "la Resolución ISP/300/2026 de Cataluña (BOE)",
     "d": "21/11/2026"
    }
   }
  },
  {
   "id": "puymorens",
   "n": "Túnel de Puymorens",
   "paises": "Francia (Acceso Andorra / Cerdanya)",
   "zona": "pirineos",
   "via": "RN20 / E9",
   "ruta": "Porté-Puymorens – L’Hospitalet-près-l’Andorre",
   "km": "4,8 km",
   "alto": 4.2,
   "altoNota": "",
   "adr": "E",
   "adrNota": "",
   "vel": "",
   "dist": "",
   "normas": [
    "Túnel de peaje que evita el puerto de montaña (Col de Puymorens, 1.915 m). (sin comprobar)",
    "Velocidad máxima 80 km/h y distancia mínima de seguridad de 100 m. (sin comprobar)"
   ],
   "alt": "Col de Puymorens (RN20/RN320, admitido ADR según horario y meteorología).",
   "comp": {
    "adr": {
     "f": "la lista de túneles del CETU (Francia, 2024)",
     "d": "21/11/2026"
    }
   }
  },
  {
   "id": "guadarrama",
   "n": "Túneles de Guadarrama (AP-6)",
   "paises": "España",
   "zona": "pirineos",
   "via": "AP-6",
   "ruta": "Guadarrama (Madrid) – San Rafael (Segovia)",
   "km": "3,3 km",
   "alto": 4.3,
   "altoNota": "",
   "adr": "C",
   "adrNota": "Prohibido explosivos grandes y gases/líquidos muy tóxicos en cisterna; permitido gasoil/gasolina (D).",
   "vel": "",
   "dist": "",
   "normas": [
    "Tres tubos independientes con peaje. Velocidad máxima 80–100 km/h según señalización variable. (sin comprobar)",
    "En episodios de nevada intensa, la DGT suele embolsar camiones en los aparcamientos previos. (sin comprobar)"
   ],
   "alt": "Puerto de Guadarrama / Alto del León (N-6, pendiente del 7–8%, gálibo sin límite en puerto abierto).",
   "comp": {}
  },
  {
   "id": "mont-blanc",
   "n": "Túnel del Mont Blanc",
   "paises": "Francia - Italia",
   "zona": "alpes",
   "via": "N205 / SS26 dir",
   "ruta": "Chamonix (FR) – Courmayeur / Aosta (IT)",
   "km": "11,6 km",
   "alto": 4.7,
   "altoNota": "",
   "adr": "E",
   "adrNota": "Además, por las rampas de acceso, están prohibidos también los n.º ONU 2919, 3077, 3082, 3291, 3331, 3359 y 3373.",
   "vel": "Mínimo 50 km/h (máximo 70 km/h: sin comprobar).",
   "dist": "150 m (sin comprobar).",
   "normas": [
    "Antes de entrar, los camiones de más de 3,5 t tienen que acreditarse en el área de control de Passy-Le Fayet (Francia) o de Aosta (Italia).",
    "Prohibido a camiones de más de 3,5 t Euro 0 a Euro 4: solo Euro 5 y Euro 6.",
    "Prohibido a vehículos que no puedan ir al menos a 50 km/h y con cadenas puestas."
   ],
   "alt": "Túnel del Fréjus (A43 / T4) para tráfico general o paso del Simplon / Gran San Bernardo según destino.",
   "comp": {
    "alto": {
     "f": "Bison Futé (Gobierno de Francia)",
     "d": "21/11/2026"
    },
    "adr": {
     "f": "Bison Futé (Gobierno de Francia)",
     "d": "21/11/2026"
    }
   }
  },
  {
   "id": "frejus",
   "n": "Túnel del Fréjus",
   "paises": "Francia - Italia",
   "zona": "alpes",
   "via": "A43 / T4 / SS335",
   "ruta": "Modane (FR) – Bardonecchia / Turín (IT)",
   "km": "12,9 km",
   "alto": 4.3,
   "altoNota": "",
   "adr": "C",
   "adrNota": "Adaptada: lo que no puede pasar por un túnel C está prohibido (salvo algunos gases de clase 2 en cisterna: 2A, 2O, 3A y 3O). Las mercancías peligrosas que sí pueden pasar van siempre acompañadas por los vehículos de patrulla del túnel.",
   "vel": "Entre 50 y 70 km/h (sin comprobar).",
   "dist": "150 m (sin comprobar).",
   "normas": [
    "Prohibido a camiones de más de 3,5 t Euro 0, Euro 1 y Euro 2.",
    "Prohibido con cadenas puestas o con la carga mal sujeta."
   ],
   "alt": "Autopista A8/A10 por Ventimiglia (costa) si se supera la altura de 4,30 m o restricción de convoy.",
   "comp": {
    "alto": {
     "f": "Bison Futé (Gobierno de Francia)",
     "d": "21/11/2026"
    },
    "adr": {
     "f": "Bison Futé (Gobierno de Francia)",
     "d": "21/11/2026"
    }
   }
  },
  {
   "id": "san-gotardo",
   "n": "Túnel de San Gotardo (Gotthard)",
   "paises": "Suiza",
   "zona": "alpes",
   "via": "A2 / E35",
   "ruta": "Göschenen (Uri) – Airolo (Ticino)",
   "km": "16,9 km",
   "alto": 4,
   "altoNota": "",
   "adr": "E",
   "adrNota": "Prohibido todo ADR con panel naranja. Control estricto de gálibo por láser antes del portal (si marcas >4,00 m salta barrera roja).",
   "vel": "",
   "dist": "",
   "normas": [
    "Velocidad máx. 80 km/h. Distancia mínima entre camiones: 150 metros obligatorios. (sin comprobar)",
    "Sistema de dosificación \"cuentagotas\" (semáforo rojo en área de espera) cuando hay alta densidad. (sin comprobar)",
    "Prohibido circular en Suiza de 22:00 a 05:00 y domingos/festivos. (sin comprobar)"
   ],
   "alt": "Túnel de San Bernardino (A13) o Paso del Simplon (A9, admite ADR según clase y hasta 4,00 m).",
   "comp": {}
  },
  {
   "id": "san-bernardino",
   "n": "Túnel de San Bernardino",
   "paises": "Suiza",
   "zona": "alpes",
   "via": "A13 / E43",
   "ruta": "Thusis (Grisones) – Bellinzona (Ticino)",
   "km": "6,6 km",
   "alto": 4,
   "altoNota": "",
   "adr": "E",
   "adrNota": "Prohibido todo transporte ADR con panel naranja. Alternativa habitual al Gotardo para carga general.",
   "vel": "",
   "dist": "",
   "normas": [
    "Un solo carril por sentido con pendiente pronunciada (hasta 5%) en los accesos. (sin comprobar)",
    "Distancia mínima de seguridad de 100–150 m. Prohibido adelantar. (sin comprobar)",
    "Sujeto a la prohibición nocturna suiza (22:00–05:00) y domingos. (sin comprobar)"
   ],
   "alt": "Paso del Simplon (A9) para mercancías peligrosas ADR autorizadas.",
   "comp": {}
  },
  {
   "id": "gran-san-bernardo",
   "n": "Túnel del Gran San Bernardo",
   "paises": "Suiza - Italia",
   "zona": "alpes",
   "via": "E27 / SS27",
   "ruta": "Martigny (Valais, CH) – Aosta (IT)",
   "km": "5,8 km",
   "alto": 4,
   "altoNota": "",
   "adr": "E",
   "adrNota": "Prohibido el tránsito de mercancías peligrosas ADR (Cat. E).",
   "vel": "",
   "dist": "",
   "normas": [
    "Velocidad máxima 80 km/h (mínima 40 km/h). Distancia mínima entre camiones: 100 m. (sin comprobar)",
    "Carretera de acceso de alta montaña con galerías cubiertas y fuertes rampas. (sin comprobar)"
   ],
   "alt": "Túnel del Fréjus (A43/T4) o Paso del Simplon.",
   "comp": {}
  },
  {
   "id": "simplon",
   "n": "Paso y Galerías del Simplon",
   "paises": "Suiza - Italia",
   "zona": "alpes",
   "via": "A9 / E62 / SS33",
   "ruta": "Brig (CH) – Domodossola (IT)",
   "km": "42 km (paso)",
   "alto": 4,
   "altoNota": "",
   "adr": "B",
   "adrNota": "Ruta principal permitida en Suiza para la mayoría de mercancías peligrosas ADR (gasoil, químicos, etc.).",
   "vel": "",
   "dist": "",
   "normas": [
    "Puerto de montaña a 2.005 m de altitud abierto todo el año, pero con hielo/nieve frecuente. (sin comprobar)",
    "Obligatorio llevar cadenas de nieve en invierno y respetar límites en galerías de protección. (sin comprobar)"
   ],
   "alt": "Tren de transporte de camiones Brig – Iselle (BLS) si hay cierre por aludes.",
   "comp": {}
  },
  {
   "id": "seelisberg",
   "n": "Túnel de Seelisberg",
   "paises": "Suiza",
   "zona": "alpes",
   "via": "A2 / E35",
   "ruta": "Beckenried – Seedorf (Acceso norte San Gotardo)",
   "km": "9,2 km",
   "alto": 4,
   "altoNota": "",
   "adr": "E",
   "adrNota": "Prohibido todo ADR con panel naranja (mismo régimen restrictivo que el eje A2 San Gotardo).",
   "vel": "",
   "dist": "",
   "normas": [
    "Doble tubo con dos carriles por sentido. Velocidad máxima 80 km/h. (sin comprobar)",
    "Prohibido adelantar para vehículos pesados de más de 3,5 t. (sin comprobar)"
   ],
   "alt": "Eje A13 San Bernardino o A9 Simplon.",
   "comp": {}
  },
  {
   "id": "brenner",
   "n": "Corredor del Brenner (Puente Europa y Túneles A13)",
   "paises": "Austria - Italia",
   "zona": "alpes",
   "via": "A13 / A22 / E45",
   "ruta": "Innsbruck (AT) – Brennero – Vipiteno / Bolzano (IT)",
   "km": "36 km (eje)",
   "alto": 4.2,
   "altoNota": "",
   "adr": "A",
   "adrNota": "Admitido ADR. Sujeto a restricciones nocturnas y sectoriales del Tirol.",
   "vel": "",
   "dist": "",
   "normas": [
    "Prohibición sectorial en Tirol (A12/A13) para ciertas mercancías (residuos, piedra, madera, acero, papel, coches) salvo tren RoLa. (sin comprobar)",
    "Prohibición nocturna (22:00–05:00) y prohibición de adelantamiento para camiones >7,5 t en todo el tramo. (sin comprobar)",
    "Dosificación en Kufstein (frontera DE/AT) en días críticos. (sin comprobar)"
   ],
   "alt": "Autopista A10 Tauern (Salzburgo – Villach) o paso de Resia (SS40, solo tráfico local/restringido).",
   "comp": {}
  },
  {
   "id": "arlberg",
   "n": "Túnel de Arlberg",
   "paises": "Austria",
   "zona": "alpes",
   "via": "S16 / E60",
   "ruta": "Langen am Arlberg (Vorarlberg) – St. Anton (Tirol)",
   "km": "13,9 km",
   "alto": 4,
   "altoNota": "",
   "adr": "D",
   "adrNota": "Prohibido transporte de explosivos, gases tóxicos y líquidos/gases altamente inflamables en cisterna.",
   "vel": "",
   "dist": "",
   "normas": [
    "Túnel de peaje especial (GO-Box) de un solo tubo bidireccional. (sin comprobar)",
    "Velocidad máxima 80 km/h y distancia mínima de seguridad de 100 m. (sin comprobar)",
    "Suele cerrar por mantenimiento en primavera/otoño durante varias semanas. (sin comprobar)"
   ],
   "alt": "Puerto de montaña Arlbergpass (B197, prohibido con remolque/articulado en invierno) o desvío por Múnich (A8/A93).",
   "comp": {}
  },
  {
   "id": "tauern",
   "n": "Túnel del Tauern y Katschberg",
   "paises": "Austria",
   "zona": "alpes",
   "via": "A10 / E55",
   "ruta": "Salzburgo – Flachau – Rennweg – Villach",
   "km": "6,5 km + 5,9 km",
   "alto": 4.2,
   "altoNota": "",
   "adr": "A",
   "adrNota": "Permitido ADR. Peaje especial de tramo en ASFINAG.",
   "vel": "",
   "dist": "",
   "normas": [
    "Doble tubo con 2 carriles por sentido. Velocidad máxima 80 km/h para camiones. (sin comprobar)",
    "Prohibido adelantar camiones en los túneles y pendientes de acceso. (sin comprobar)"
   ],
   "alt": "Eje A9 Pyhrn (Linz – Graz) hacia Eslovenia/Croacia.",
   "comp": {}
  },
  {
   "id": "pfander",
   "n": "Túnel de Pfänder",
   "paises": "Austria - Alemania",
   "zona": "alpes",
   "via": "A14 / E43",
   "ruta": "Lindau (DE) – Bregenz (AT, Lago Constanza)",
   "km": "6,7 km",
   "alto": 4.2,
   "altoNota": "",
   "adr": "A",
   "adrNota": "Permitido ADR. Obligatorio dispositivo GO-Box en Austria desde la frontera.",
   "vel": "",
   "dist": "",
   "normas": [
    "Doble tubo. Velocidad máxima 80 km/h y prohibición de adelantamiento para >3,5 t. (sin comprobar)",
    "Atención: si entras desde Alemania sin GO-Box dado de alta, multa automática por cámara. (sin comprobar)"
   ],
   "alt": "Travesía urbana por Bregenz (prohibida para tránsito pesado >3,5 t).",
   "comp": {}
  },
  {
   "id": "karawanken",
   "n": "Túnel de Karawanken",
   "paises": "Austria - Eslovenia",
   "zona": "alpes",
   "via": "A11 / A2 / E61",
   "ruta": "Villach (AT) – Jesenice / Liubliana (SI)",
   "km": "7,9 km",
   "alto": 4.2,
   "altoNota": "",
   "adr": "D",
   "adrNota": "Prohibidos explosivos, gases tóxicos y cisternas inflamables (gasolina/GLP).",
   "vel": "",
   "dist": "",
   "normas": [
    "Tubo único bidireccional con peaje en cabina. Velocidad máxima 80 km/h. (sin comprobar)",
    "Distancia mínima de seguridad de 100 m. Posibles retenciones en verano por control fronterizo. (sin comprobar)"
   ],
   "alt": "Paso por Graz – Maribor (A9 AT / A1 SI) o Tarvisio – Udine (A23 IT).",
   "comp": {}
  },
  {
   "id": "elbtunnel",
   "n": "Elbtunnel (Túnel bajo el río Elba)",
   "paises": "Alemania",
   "zona": "norte",
   "via": "A7 / E45",
   "ruta": "Hamburgo (Conexión Escandinavia / Dinamarca)",
   "km": "3,3 km",
   "alto": 4,
   "altoNota": "",
   "adr": "D",
   "adrNota": "Prohibidas cisternas de combustibles inflamables (UN 1202/1203), GLP y explosivos. Control automático de altura en pórticos.",
   "vel": "",
   "dist": "",
   "normas": [
    "4 tubos con 8 carriles en total. Si saltan los sensores de altura (>4,00 m), se cierran todos los semáforos del tubo en rojo. (sin comprobar)",
    "Los vehículos >4,00 m deben salir obligatoriamente antes del túnel y solicitar desvío/permiso especial. (sin comprobar)"
   ],
   "alt": "Autopista A1 por el este de Hamburgo (puentes sobre el Elba, sin límite de 4,00 m y apto para ADR).",
   "comp": {}
  },
  {
   "id": "liefkenshoek",
   "n": "Túnel Liefkenshoek",
   "paises": "Bélgica",
   "zona": "norte",
   "via": "R2",
   "ruta": "Puerto de Amberes (Orilla izquierda ↔ derecha)",
   "km": "1,4 km",
   "alto": 4.3,
   "altoNota": "",
   "adr": "A",
   "adrNota": "Es el túnel obligatorio para mercancías peligrosas ADR en Amberes (ya que el Kennedy está prohibido para ADR).",
   "vel": "",
   "dist": "",
   "normas": [
    "Túnel de peaje (se puede pagar con dispositivo Satellic / Viapass o tarjeta). (sin comprobar)",
    "Velocidad máxima 90 km/h. Excelente alternativa para evitar los atascos del Ring R1 de Amberes. (sin comprobar)"
   ],
   "alt": "Túnel Kennedytunnel (R1, gratuito, pero prohibido para ADR Cat. E).",
   "comp": {}
  },
  {
   "id": "kennedytunnel",
   "n": "Túnel Kennedytunnel (Ring Amberes)",
   "paises": "Bélgica",
   "zona": "norte",
   "via": "R1 / E17 / E34",
   "ruta": "Amberes Sur (Bajo el río Escalda)",
   "km": "0,69 km",
   "alto": 4.2,
   "altoNota": "",
   "adr": "E",
   "adrNota": "Prohibido todo transporte ADR con panel naranja (multa automática por cámaras ANPR).",
   "vel": "",
   "dist": "",
   "normas": [
    "Uno de los puntos con mayor tráfico pesado de Europa. Prohibido adelantar camiones. (sin comprobar)",
    "Si llevas ADR, debes desviarte por el R2 (Túnel Liefkenshoek). (sin comprobar)"
   ],
   "alt": "Túnel Liefkenshoek (R2, admite ADR Cat. A).",
   "comp": {}
  },
  {
   "id": "westerschelde",
   "n": "Túnel del Escalda Occidental (Westerscheldetunnel)",
   "paises": "Países Bajos",
   "zona": "norte",
   "via": "N62",
   "ruta": "Terneuzen – Borssele (Zelanda, NL)",
   "km": "6,6 km",
   "alto": 4.3,
   "altoNota": "",
   "adr": "C",
   "adrNota": "Prohibido explosivos grandes y tóxicos masivos; admitidos combustibles (D) y carga general.",
   "vel": "",
   "dist": "",
   "normas": [
    "Túnel de peaje (pago electrónico o tarjeta en plaza de peaje de Borssele). (sin comprobar)",
    "Velocidad máxima 100 km/h (80 km/h camiones). Pendiente del 4,5% bajo el estuario. (sin comprobar)"
   ],
   "alt": "Rodeo por Amberes (A12 / R2) hacia Gante / Brujas.",
   "comp": {}
  },
  {
   "id": "eurotunel",
   "n": "Eurotúnel (LeShuttle Freight)",
   "paises": "Francia - Reino Unido",
   "zona": "canal",
   "via": "A16 (Salida 42) ↔ M20 (J11A)",
   "ruta": "Coquelles / Calais (FR) – Folkestone (UK)",
   "km": "50,5 km (tren)",
   "alto": 4.2,
   "altoNota": "(altura máxima del camión para subir al tren)",
   "adr": "tren",
   "adrNota": "No es un túnel de carretera: el camión sube al tren (Le Shuttle Freight). Las mercancías peligrosas hay que declararlas al hacer el check-in y solo se aceptan las de su lista; con dos o más etiquetas de peligro no se aceptan, salvo la clase 2 (sin comprobar).",
   "vel": "",
   "dist": "",
   "normas": [
    "Altura máxima estricta de 4,20 m (los semis \"Double Deck\" británicos de 4,80–4,95 m NO caben y deben ir en ferry). (sin comprobar)",
    "Prohibidos vehículos propulsados por GNL / GNC / GLP. (sin comprobar)",
    "Check-in mínimo 60 min antes con GMR (GVMS) y declaración aduanera validada. (sin comprobar)"
   ],
   "alt": "Ferries Puerto de Calais – Dover (P&O, DFDS, Irish Ferries): admiten hasta 4,90 m de altura y la mayoría de cargas ADR.",
   "comp": {}
  },
  {
   "id": "dartford",
   "n": "Cruce de Dartford (Túneles Norte / Puente QEII Sur)",
   "paises": "Reino Unido",
   "zona": "canal",
   "via": "A282 / M25",
   "ruta": "Dartford (Kent) – Thurrock (Essex, Este de Londres)",
   "km": "1,4 km",
   "alto": 4.8,
   "altoNota": "(túnel oeste; el este, 5,03 m)",
   "adr": "C",
   "adrNota": "Con mercancías peligrosas hay que salir en el cruce 1a y seguir el rombo hasta la zona de escolta (sin comprobar).",
   "vel": "",
   "dist": "",
   "normas": [
    "Sentido Norte (hacia Essex) pasa por dos túneles: el túnel Oeste mide 4,80 m y el Este 5,03 m de gálibo. (sin comprobar)",
    "Peaje Dart Charge sin barreras (pago online antes de medianoche del día siguiente). (sin comprobar)",
    "Para mercancías ADR que requieran escolta en sentido Norte, debes detenerte en la zona de control previa. (sin comprobar)"
   ],
   "alt": "Arco Oeste de la M25 (Heathrow) si se transporta ADR prohibido en túneles Cat. C.",
   "comp": {}
  }
 ]
};
