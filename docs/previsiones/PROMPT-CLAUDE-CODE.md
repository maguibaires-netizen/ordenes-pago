# Prompt para Claude Code — "Previsiones y acuerdos" + exportar a Excel

> Pegá esto en Claude Code parado en el repo `maguibaires-netizen/ordenes-pago`.
> En la carpeta `prototipo/` van las pantallas de referencia (abrilas en el navegador desde esa carpeta):
> - `Previsiones y acuerdos.dc.html` + `previsiones-datos.js` (datos de ejemplo con la forma de cada estructura)
> - `Composicion de saldos v3.dc.html` + `datos.js` (ya implementada antes; acá sólo suma "Exportar Excel")
> - `xlsx-lite.js` (lector de .xlsx), `facturacion-lite.js` (parser de la hoja Facturación), `xlsx-writer.js` (genera .xlsx de varias hojas)
> - `api/composicion/` son los endpoints de Composición de saldos (si todavía no los subiste).

---

Necesito implementar en esta app (React + Vite, API serverless en `api/`, Google Sheets vía cuenta de servicio, igual que Órdenes de pago) una pestaña nueva **"Previsiones y acuerdos"**, que reemplaza a las pestañas "Acuerdos" y "Previsiones". El nav queda: **Órdenes de pago · Previsiones y acuerdos · Composición de saldos**.

Copiá el look del prototipo (`prototipo/Previsiones y acuerdos.dc.html`): Manrope + IBM Plex Mono, fondo `#f6f7f9`, tarjetas blancas radio 16, tablas con encabezado `#eef1f4`, chips de estado. Reutilizá los componentes y estilos que ya existen en `src/` (Topbar, auth, `src/lib/api.js`).

## Libro de Google Sheets
"PROVISIONES SUPERMERCADOS". Hojas involucradas:
- `Facturación` — detalle de facturación del mes (lo exporta el ERP).
- `% x APORTES` — acuerdos por supermercado.
- `SALDOS A PROVISIONAR` — la previsión calculada por el sheet.
- `Evolucion` — **hoja nueva** que tiene que crear/llenar la app (historial mensual).
- `Lista control NC/Pend` y `CONTROL previ` — NO tocar en esta etapa.

Antes de escribir código, **preguntame los índices exactos de columnas y filas de cada hoja** (yo los defino). Mientras, tomá como referencia las capturas descriptas abajo.

## Roles
Hay dos: `admin` y `vendedor` (usar el mismo mecanismo de sesión/token que ya tiene la app). Todo endpoint de escritura valida el rol del lado del servidor, no sólo en el front.

## Ciclo mensual (estado por período, ej. `2026-08`)
1. Admin carga la **facturación** del mes → queda fija todo el mes.
2. Vendedor carga **aportes adicionales** en Acuerdos → "Guardar cambios" → queda bloqueado (`enviado`).
3. Admin revisa → **Aprobar** (copia los aportes a `% x APORTES` con la cuenta de servicio) o **Devolver** (vuelve a `borrador`).
4. Admin revisa **Previsiones** → "Dar OK" → estado `enviado_a_provisionar`. El vendedor ve el cambio de "En revisión" a "Enviado a provisionar".

Guardar el estado de cada período en una hoja de control (propuesta: `Estado web` con columnas `periodo | facturacion_cargada_en | facturacion_origen | acuerdos_estado | acuerdos_guardado_por | acuerdos_aprobado_por | prevision_estado | prevision_ok_por | prevision_ok_en`). Ajustá si preferís otra cosa, pero consultame.

## Subpestaña 1 — Facturación
- **Admin**: dos formas de cargar: (a) subir el Excel del ERP, (b) botón "Leer hoja Facturación". Se carga **una vez por mes**; si ya hay datos del período, pedir confirmación para reemplazar.
- **Vendedor**: ve lo mismo, sin botones de carga.
- Columnas de `Facturación` (fila 1): Fecha · Artículo · Nombre · Cantidad Ingr. · Tipo · Número · Cantidad uni de stock · Subtotal neto moneda origen sin impuestos · Cliente consolidador · Nombre Consolidador · Comprobante · Descripción Cabecera.
- **Pendiente de definir conmigo**: mapeo de `Tipo` del ERP a Factura / NC / ND (en las capturas aparecen `FCA` y `1.3`), y cómo se obtiene la **marca** de cada artículo (hoy el prototipo la deduce del nombre; puede que convenga usar la hoja `MARCA x SPM`).
- Vista A "Artículos por super": un bloque desplegable por supermercado; adentro la tabla de líneas. Filtros: búsqueda, supermercado, marca, tipo de comprobante, rango de fechas. Orden por cualquier columna.
- **Orden de la pantalla (de arriba a abajo):**
  1. Bloque del mes: "Facturación de <mes>", cuándo y desde dónde se cargó; botones de carga (sólo admin).
  2. Selector de vista: **A · Artículos por super** / **B · Marcas por super**.
  3. Resumen (4 fichas): **Facturado neto** (facturas − NC + ND, sin impuestos) · **Facturas** (suma de líneas de factura, sin impuestos, antes de NC) · **Notas de crédito** · **Notas de débito**. Sin "unidades".
     - NC y ND son **clickeables**: abren una ventana con el detalle — fecha · super · comprobante · artículo · importe · **observación** — y el total. Respeta los filtros aplicados.
     - La observación sale de la columna **Descripción Cabecera** de `Facturación` (confirmar conmigo).
  4. Filtros en un solo bloque: buscar artículo o comprobante · supermercado · marca · tipo de comprobante · rango de fechas · "Limpiar".
  5. Listado.
- Vista A: un bloque **desplegable** por supermercado (logo, nombre, líneas, unidades, importe); al abrirlo, la tabla de líneas ordenable.
- Vista B: **también desplegable** por supermercado (mismo formato de lista, no tarjetas); al abrirlo: marca · cantidad · importe · peso de la marca dentro del super (barra + %).
- Al confirmar la carga del mes, **agregar/actualizar el período en la hoja `Evolucion`**: por supermercado → facturación total, unidades, NC del mes (y si podés, el detalle por artículo en otra hoja `Evolucion articulos`).

Endpoints propuestos:
- `GET /api/previsiones/facturacion?periodo=YYYY-MM`
- `POST /api/previsiones/facturacion` (admin) — body: filas ya parseadas del Excel o `{ fuente: "hoja" }`.

## Subpestaña 2 — Evolución
Lee `Evolucion`. Selector Facturación / Unidades / NC. Barras del total por mes + tabla supermercado × mes con Δ contra el mes anterior y mini tendencia.
- `GET /api/previsiones/evolucion`

## Subpestaña 3 — Acuerdos (hoja `% x APORTES`)
Columnas: A código · B supermercado · C ACC · D Escala crecim. · E No dev · F Log · G Publ · H Voraz · I Criadores · J Kongo · K Aporte adicional (variable) · L detalle · M Acuerdos comerciales firmados (chip de archivo de Drive).
- **C a J son FIJOS**: nadie los edita desde la app.
- **M**: traer el link del PDF (es un smart chip de Drive; leer con `includeGridData`/`chipRuns` o `hyperlink`) y mostrar un clip que abre el PDF en pestaña nueva. Si dice "sin acuerdo", mostrar eso.
- **Vendedor**: botón "+ Agregar" por supermercado → modal con filas `monto · motivo · observaciones` (se pueden cargar varias). Botón general **"Guardar cambios"** → confirma, bloquea la edición del período y pasa a control del admin.
- **Vendedor**: botón **"Nuevo"** → modal para solicitar: supermercado (existente o nuevo) + acuerdos fijos (concepto + %, varios) + acuerdos adicionales (monto + motivo, varios). Queda como solicitud pendiente.
- **Admin**: ve lo cargado; botón **"OK acuerdos del mes"** (aprueba y copia a la base) o "Devolver al vendedor". Ve las solicitudes y las aprueba/rechaza. **Aprobar escribe en `% x APORTES`** (K y L del período; si es supermercado nuevo, agrega la fila). La app NO escribe C–J salvo al aprobar una solicitud de acuerdo fijo nuevo.
- Guardar los aportes del vendedor en una hoja propia antes de aprobar (propuesta: `Aportes web`: `periodo | codigo | supermercado | monto | motivo | observaciones | cargado_por | cargado_en | estado`) y las solicitudes en `Solicitudes web`.

Endpoints propuestos:
- `GET /api/previsiones/acuerdos?periodo=`
- `POST /api/previsiones/aportes` (vendedor, sólo si el período está en `borrador`)
- `POST /api/previsiones/aportes/guardar` (vendedor → `enviado`)
- `POST /api/previsiones/aportes/aprobar` · `/devolver` (admin)
- `POST /api/previsiones/solicitudes` (vendedor) · `POST /api/previsiones/solicitudes/:id/resolver` (admin)

## Subpestaña 4 — Previsiones (hoja `SALDOS A PROVISIONAR`)
- **La app sólo lee. No calcula nada de la previsión.** Cada celda se muestra tal cual viene del sheet (incluyendo errores como `#DIV/0!`, que se marcan en rojo para que el admin los vea). Los subtotales salen de la fila de subtotales del sheet, no de sumar en el front.
- Columnas (fila 1): Sujeto Código · Sujeto Nombre · FACTURACIÓN · % Fact · ACC · NO DEV · LOG · PUBL · ESC CRECIM · VORAZ · CRIADORES · KONGO · ADICION · % sobre facturación neta acción variable · total a provisionar (la columna que sigue; confirmar conmigo).
- Lo único calculado en el front es la **comparación contra el mes anterior** (total del período vs total del período anterior, leído de un historial — propuesta: guardar una foto de la hoja en `Previsiones historial` cada vez que el admin da el OK). Resaltar filas con desvío ≥ umbral.
- **Umbral de desvío**: arranca en 25%. **El admin lo puede cambiar desde la pantalla** (campo numérico en la leyenda de Previsiones); el vendedor sólo lo ve. Guardarlo en el backend (propuesta: hoja `Config web`, clave `umbral_desvio`) para que valga para todos.
- **Orden de la pantalla (igual para admin y vendedor):**
  1. Barra de estado (En revisión / Enviado a provisionar) + botón del admin.
  2. Resumen: total a provisionar · vs mes anterior · sobre facturación · supers para revisar.
  3. Tres bloques: **A provisionar por super** (barras actual vs anterior) · **Composición por concepto** · **Para revisar antes del OK** (desvíos, errores de celda, facturación negativa).
  4. Leyenda (ocultar conceptos en cero, umbral, colores) y abajo **el cuadro detallado**.
- **Admin**: botón "Dar OK · enviar a provisionar" (habilitado sólo si los aportes del período están aprobados). "Volver a revisión" para deshacer.
- **Vendedor**: no edita. Si todavía no guardó sus aportes, ve un aviso; después ve la tabla con el estado.

Endpoints propuestos:
- `GET /api/previsiones/saldos?periodo=`
- `POST /api/previsiones/ok` (admin) · `POST /api/previsiones/reabrir` (admin)

## Subpestaña 5 — Control NC
Dejarla creada y vacía ("se configura en la próxima etapa"). Hoy vive en `Lista control NC/Pend` / `CONTROL previ` con Apps Script.

## Exportar a Excel (todas las pestañas)
Cada pestaña principal tiene un botón **"Exportar Excel"** (admin y vendedor). Si la pestaña tiene subpestañas, salen **en el mismo archivo, una hoja por subpestaña**. Encabezado en negrita con fondo, fila 1 fija, autofiltro, importes con formato `#.##0,00`. Generarlo en el front (SheetJS o el `xlsx-writer.js` del prototipo, que ya funciona).

**Previsiones y acuerdos** → `Previsiones y acuerdos - <Mes Año>.xlsx`:
- `Facturación` (respeta filtros): Fecha · Supermercado · Artículo · Nombre · Marca · Tipo · Comprobante · Cantidad · Importe · Observación
- `Marcas por super`: Supermercado · Marca · Cantidad · Importe
- `NC y ND`: Fecha · Supermercado · Tipo · Comprobante · Artículo · Importe · Observación
- `Evolución`: Supermercado · Métrica (Facturación / Unidades / NC) · un mes por columna
- `Acuerdos`: Código · Supermercado · % de C a J · Aporte adicional (sheet) · Detalle · Aportes del vendedor · Detalle vendedor · Acuerdo firmado · Estado del mes
- `Solicitudes` (sólo si hay)
- `Previsiones`: todas las columnas de SALDOS A PROVISIONAR tal cual + total mes anterior + Δ % + estado
- Control NC no se exporta mientras esté vacía.

**Composición de saldos** → `Composicion de saldos.xlsx`:
- `Resumen`: Cuenta · Saldo · Comprobantes · Vencido sin pagar · Vencido pend. de NC · Corriente · Próximo vto.
- Una hoja por cuenta: Fecha · Días emisión · Nº factura · Vencimiento · Días vencido · Importe · Importe origen · Cond. pago · Observación · Comentario
- En admin el botón va al lado de "Importar Excel"; en vendedor reemplaza al export CSV anterior.

## Reglas generales
- Nunca sobrescribir hojas que mantiene el usuario a mano. La app sólo escribe en: `Evolucion`, `Evolucion articulos`, `Estado web`, `Aportes web`, `Solicitudes web`, `Previsiones historial`, `Config web`, y en `% x APORTES` únicamente al aprobar.
- Toda escritura queda registrada con usuario y fecha.
- Si una hoja o columna esperada no existe, el endpoint devuelve un error claro (qué hoja/columna falta), no un 500 genérico.
- Al terminar, actualizá el README con las hojas nuevas y sus encabezados.

Empezá por mostrarme el plan de archivos y preguntarme los índices. No escribas en el Sheet de producción hasta que te confirme.

---

## Resumen de cambios respecto de la versión anterior de este prompt
- Facturación: nuevo orden de bloques; KPIs sin "unidades"; NC/ND clickeables con detalle + observación; vista B en lista desplegable.
- Acuerdos: el botón del admin se llama "OK acuerdos del mes".
- Previsiones: resumen y tablero arriba, cuadro detallado abajo; el umbral de desvío lo cambia el admin desde la pantalla.
- Nuevo: exportar a Excel en todas las pestañas, con una hoja por subpestaña (incluye Composición de saldos).
