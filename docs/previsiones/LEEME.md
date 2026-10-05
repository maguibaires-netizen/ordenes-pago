# Previsiones y acuerdos — referencia

Esta carpeta viene del paquete que armó la dueña del proyecto con Claude Design. Es **referencia**, no código de la app.

- `PROMPT-CLAUDE-CODE.md`: especificación completa del módulo (5 subpestañas, flujo mensual, hojas del Sheet).
- `prototipo/Previsiones y acuerdos.dc.html`: pantalla de referencia. Usa su propio motor (`support.js`), no es React.
- `prototipo/previsiones-datos.js`: datos de EJEMPLO inventados, solo para ver el diseño.
- `prototipo/xlsx-writer.js`: generador de Excel del prototipo, útil como referencia para la exportación.

Ojo: en la app real el slug de Pedidos Ya es `pedidosya` (el prototipo usa `pedidos-ya`) y Libertad no está dado de alta.
Lo que ya está construido en la app (Facturación) está descrito en `CLAUDE.md`, sección "Reglas de Previsiones → Facturación".
