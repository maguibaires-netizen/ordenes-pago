# Órdenes de pago · Baires — contexto del proyecto

Leé este archivo entero al empezar cada sesión. Es la memoria del proyecto.

## Cómo trabajar con la dueña del proyecto (importante)

- Hablale en **español rioplatense**, con frases cortas y claras. No des por sabida la jerga técnica: explicala en una línea.
- **No cambies funcionalidad ni diseño sin preguntar antes.** Si ves algo mejorable, proponelo y esperá el visto bueno.
- Trabajá **de a un paso**. Para cada cambio: explicá en una línea qué cambia y esperá su confirmación antes de seguir. Si le toca hacer algo a ella, guiala con clics concretos.
- Usa Windows y GitHub Desktop. Evitá pedirle comandos de terminal si hay una alternativa por clics.
- **Pedí confirmación explícita** antes de: borrar archivos o ramas, hacer push, tocar variables de entorno, borrar o recrear proyectos de Vercel, y escribir en Google Sheets de producción.
- Al final de cada respuesta, marcá en **una línea** las faltas de ortografía de su último mensaje (casi siempre son tildes). Lo pidió ella para prestar más atención.
- **Nunca** muestres, pegues ni subas a git contraseñas, claves o tokens. Las variables de entorno viven en Vercel; localmente, en `.env.local` (ya ignorado por `*.local`).

## Qué es

Portal interno del área de créditos y cobranzas de **Agro Industrias Baires**. Tiene varias herramientas en una sola app:

1. **Órdenes de pago**: por cada supermercado/cliente se sube el archivo de la orden de pago (Excel, CSV o PDF, cada uno con su formato), la app lo lee, lo muestra para revisar y lo guarda en un Google Sheet. También se ven, filtran y editan las OP ya cargadas.
2. **Pendientes por resolver** (Home): junta lo pendiente de todos los supermercados.
3. **Composición de saldos**: tabla por cuenta con los comprobantes que forman el saldo.
4. **Previsiones y acuerdos**: en construcción (hoy solo la subpestaña Facturación).
5. **Comprobantes adjuntos**: subir los PDF de cada comprobante a Drive y abrirlos desde la tabla (código escrito, falta validarlo en producción).

Usuarios: **admin** (2 personas, todo) y **vendedor** (2 personas, solo lectura + exportar).

## Stack y estructura

- React 19 + Vite + react-router-dom + lucide-react. Librerías: `xlsx` (SheetJS), `papaparse`, `pdfjs-dist`, `googleapis`.
- Backend: funciones serverless de Vercel en `/api` (Node, ESM: `"type": "module"`). No hay base de datos: **todo se guarda en Google Sheets**.
- Deploy: Vercel conectado a GitHub (rama `main`). Cada push redeploya solo. `vercel.json` redirige todo a `index.html` (SPA con rutas del lado del cliente).
- URL original del proyecto de Vercel: `ordenes-pago-cvzc.vercel.app`.
- Comandos: `npm run dev`, `npm run build` (verifica que compile), `npm run lint`.

```
api/
  auth/login.js              login (compara la clave con LOGIN_ADMIN / LOGIN_VENDEDOR)
  ordenes/                   list, resumen, append, actualizar-celda, eliminar-bloque
  comprobantes/              subir (a Drive) y ver (entrega el PDF con sesión)
  composicion/               list, guardar, _config  (+ LEEME.md)
  previsiones/facturacion.js lee y reemplaza la hoja Facturación + actualiza Evolucion
  _lib/                      auth, sheets, drive, config, numero, previsiones-config
src/
  pages/        Home, Login, Supermercado (Subir OP / Ver OP), ComposicionSaldos, Previsiones
  components/   Topbar, PendientesPanel, SupermercadosGrid, Dropzone, AdjuntarComprobantes
  parsers/      un lector por formato de orden de pago + registro.js (slug → lector)
  lib/          api.js (llamadas al backend), adjuntos, previsiones-parse, composicion-helpers…
  data/         supermercados.js (14+ cuentas), logos.js, composicion-fichas.js
  context/      AuthContext (sesión en localStorage "bo-sesion")
docs/previsiones/   especificación y prototipo del módulo Previsiones (hecho en Claude Design)
```

Cuentas (slug): diarco, carrefour, makro, toledo, nini, alberdi, dorinka, cencosud, la-anonima, sodimac, la-esperanza, aiello, coto, almacor, jumbo, millan, pedidosya, maycar.

## Seguridad y sesión

- Login con **una sola clave**; el servidor detecta el rol según cuál coincide. Devuelve un token firmado (HMAC con `SESSION_SECRET`) que se guarda en el navegador y viaja en el header `x-auth-token`.
- En `api/_lib/auth.js`: `requiereAdmin(req)` y `requiereSesion(req)`. Todos los endpoints que **escriben** exigen admin.
- Limitación conocida: los endpoints de lectura de órdenes (`ordenes/list`, `ordenes/resumen`) y `composicion/list` **no exigen sesión**; hoy solo los protege que la URL no es pública. Evaluar cerrarlos.
- `src/data/composicion-fichas.js` contiene usuarios y claves de portales de clientes, visibles para admin y vendedor **detrás del login**. Fue decisión de la dueña. No copiar ese contenido a otros archivos, docs ni prompts.

## Variables de entorno (solo nombres; los valores están en Vercel)

| Variable | Para qué |
|---|---|
| `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY` | Cuenta de servicio de Google para leer/escribir Sheets (`api/_lib/sheets.js`, usa `GoogleAuth`) |
| `LOGIN_ADMIN`, `LOGIN_VENDEDOR`, `SESSION_SECRET` | Login y firma de sesión |
| `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN` | Subir comprobantes a Drive con permiso `drive.file` (`api/_lib/drive.js`) |
| `COMPROBANTES_FOLDER_ID` (opcional) | Fijar la carpeta raíz de Drive |
| `COMPOSICION_SHEET_ID` (opcional) | Pisa el id del Sheet de composición |

Cuenta de servicio: `ordenes-de-pago-spm@cedar-turbine-504318-e5.iam.gserviceaccount.com`. **Cada Sheet que use la app tiene que estar compartido con ese email como Editor.**
`GOOGLE_PRIVATE_KEY` está marcada *Sensitive* en Vercel: no se puede leer ni bajar con `vercel env pull`. Para probar contra Google en local hay que cargarla a mano en `.env.local`. Los cambios de variables necesitan un redeploy para aplicar.

## Google Sheets que usa la app

1. **Un Sheet por supermercado**, pestaña **"Cargadas web"** (el nombre distingue mayúsculas). Ids en `api/_lib/config.js`. Conectados hoy: carrefour, cencosud, makro, coto, dorinka, jumbo. Columnas A–G: `Nº aviso | Comprobante | Categoría | Estado | Fecha doc | Importe neto | Notas`; **H = Adjunto** (id del archivo en Drive). Las filas se identifican por número de fila (`rowIndex`).
2. **"SUPERMERCADOS - CCob"**: pestañas `Composicion web` (la app la sobrescribe en cada importación) y `Acuerdos web` (la mantienen a mano; la app solo la lee). Ver `api/composicion/LEEME.md`.
3. **"PROVISIONES SUPERMERCADOS"** (`api/_lib/previsiones-config.js`): la app solo puede tocar `Facturación` (se reemplaza cada mes) y `Evolucion`. El resto de las hojas del libro, **no**.

## Reglas de negocio de las órdenes de pago

**Convención general.** Cada OP se convierte en filas con `{comprobante, categoria, fecha, importe, estado, notas}`: una fila "Orden de pago" (el cheque, importe **negativo**), las retenciones/descuentos (**negativos**) y los comprobantes con su signo natural. **La suma de todas las filas tiene que dar $0** (se muestra como control al pie de la tabla de revisión). Si algo no encaja en ninguna regla, la categoría es `Revisar`; nunca adivinar. Antes de confirmar, la persona revisa y puede editar todo.

| Formato | Lector | Reglas |
|---|---|---|
| **Carrefour** (3 Excel del portal: Orden de Pago, Retenciones, Comprobantes; el Nº de aviso se tipea) | `carrefour.js` | Tipo+prefijo del Número+signo: `8F`+`00026A`+positivo → Factura; `8C`+`00026A`+negativo → ND; `K0` sin `00026A` negativo → SNC; `K8` sin `00026A` positivo → SNC ("aforo"); `FS`+`4444A`+negativo → "FC por servicios". Retenciones: categoría = Tipo cortado a 16 caracteres. |
| **Makro, Cencosud, Jumbo** (1 Excel "REMADV", todo en una hoja) | `remadv.js` | Código del comprobante: FR, OK → Factura por servicios; OM, RC → Factura; WJ, WK, WN → SNC. "Medios de pago" = retenciones. Nº de aviso, fecha y total salen del archivo. |
| **Coto** (CSV) | `coto.js` | "Retencion…" → misma etiqueta, forzada a negativo; "Venta por punt. y publicidad" → SNC Servicios; "Factura A" y "Factura A de Crédito E" → Factura; "Nota de Debito No Fiscal" → SNC. No trae fecha (campo manual) ni importe del cheque (se calcula por diferencia). |
| **Dorinka** (PDF) | `dorinka.js` | `RH A` → Factura; `4N I` → NC; `RET_*` → etiqueta con espacios, negativa; "Descuento por Volumen" → NC. Cheque = "TOTAL A PAGAR". |
| **Nini** (PDF) | `nini.js` | Nota de Crédito → NC; Factura y FCE → Factura; retenciones negativas; Cheque → Orden de pago. Se descartan líneas de comprobante repetidas exactas. El "-" va al final del número. |

El lector de PDF (`pdf-lineas.js`) reconstruye líneas por posición del texto.

## Reglas de Composición de saldos

- El importe de cada línea sale de **Debe − Haber**. La columna "Saldo" del ERP es un acumulado corriendo: **no usarla**.
- "Debe" = importe positivo (Facturas, ND). Los KPIs "Vencido s/ pagar" y "Vencido pend. de NC" cuentan solo Debe; las NC nunca.
- Amarillo suave en Importe/Imp. origen: comprobante del Debe con importe distinto del importe de origen (diferencia mayor a $1).
- La importación reconoce la cuenta por el nombre de la pestaña o, si hay una sola hoja, por el **nombre del archivo** (`coto.xlsx`, `carrefour.xlsx`…).
- Los comentarios/observaciones editados en la tabla se guardan solo en el navegador (`localStorage`), no en el Sheet. Es una limitación heredada del diseño original.

## Reglas de Previsiones → Facturación

Especificación completa y prototipo: `docs/previsiones/PROMPT-CLAUDE-CODE.md`. Decisiones tomadas con la dueña:

- Excel del ERP de 76 columnas, encabezados en la fila 3. Columna de cálculo: **"Subtotal neto moneda origen sin impuestos"**.
- Categoría por **Signo (E/S)**: `S` → Factura; `S` con Tipo `49A` (u otro código de ND) → ND; `E` → NC (cualquier código).
- Cuenta por **"Cliente consolidador"** (código → slug en `previsiones-config.js`). Maycar y Libertad sin código confirmado.
- Marca: se busca el nombre contra una lista conocida (`Kongo Gold` antes que `Kongo`, `Maint ` = `Maintenance`); si no está, primera palabra.
- Subir el Excel **reemplaza** la hoja `Facturación`; el histórico se acumula en `Evolucion`.
- Pendiente de confirmar: "unidades" en Evolucion hoy es la suma de cantidad de las líneas Factura.
- Diferencia con el prototipo: la app usa el slug `pedidosya` (el prototipo usa `pedidos-ya`).

## Trampas que ya nos pasaron

- Google Sheets devuelve los números **como texto formateado** (por ejemplo `-$12,503,231.60`). Usar `numeroDesdeCelda` (`api/_lib/numero.js` y `src/parsers/numero.js`), que detecta solo cuál es el separador decimal.
- El nombre de la pestaña es sensible a mayúsculas: `Cargadas web`.
- Los PDF subidos a Drive pesan hasta 3 MB (límite de cuerpo de Vercel + base64).
- Si una función serverless da 404 en una ruta directa, falta el rewrite de `vercel.json`.
- Al editar con reemplazos de texto, revisar que no se borre por error una función vecina (ya pasó con `parseFecha`).
- Desde un entorno sin salida a internet no se puede probar contra Google. Probar los parsers con archivos reales de `/uploads` y verificar siempre la suma $0.

## Estado actual

**Hecho:** Home con pendientes en vivo, Subir/Ver OP (carrefour, cencosud, makro, coto, dorinka, jumbo conectados; nini con lector listo), edición en línea, borrar OP, filtros, login con roles, Composición de saldos, Facturación (primera subpestaña de Previsiones).

**Pendiente (orden sugerido, siempre confirmando antes):**
1. Verificar que el despliegue en Vercel esté ordenado (había dos proyectos duplicados).
2. Validar en producción: Facturación y comprobantes adjuntos (requieren configurar Drive en Google Cloud).
3. Nini: conectar su Sheet. La Anónima: lector (PDF de varias páginas; usar la columna "Neto"). Hay que decidir si detectar automáticamente los pares ND/NC que se cancelan (mismo importe, signo contrario) y llamarlos "Anula ND".
4. Previsiones: subpestañas Acuerdos, Evolución, Previsiones y Control NC (vacía por ahora), según `docs/previsiones/`. Exportar a Excel en todas las pestañas.
5. Sheets de los demás supermercados (alberdi, sodimac, etc.).
6. Fichas de jumbo, millan, pedidosya y maycar en `composicion-fichas.js` (están vacías).
