# Buzón de peticiones del panel

Esta rama y su pull request **no se fusionan nunca ni se cierran**.

Sirven de timbre: cuando alguien envía una petición en el panel («Pedir un cambio a Claude»), la función `timbre` de Supabase deja aquí un comentario corto («Nueva petición en el panel (n.º N)»), sin el texto de la petición. Ese comentario avisa a Claude, que lee la petición en Supabase, la prepara en la rama de trabajo y avisa a Lorena. No se publica nada sin su «publica».
