# Composición de saldos — cómo conectarlo al Sheet

Los tres archivos `.js` de esta carpeta van tal cual al repo
`maguibaires-netizen/ordenes-pago`, respetando la ruta:
`api/composicion/_config.js`, `list.js`, `guardar.js`.

## Pasos

1. **Copiar los archivos** al repo, en `api/composicion/`, y hacer push. Vercel los publica solo.
2. **Compartir el libro** "SUPERMERCADOS - CCob" con el mail de servicio que ya usa
   Órdenes de pago (`GOOGLE_CLIENT_EMAIL`), con permiso de **Editor**.
   El id del libro ya viene escrito en `_config.js`
   (`1Ex3bPT3aRoU5UQrx1OIgAyOHDfFlpbqi4r2U_I13jnw`); si algún día cambia,
   se puede pisar con la variable `COMPOSICION_SHEET_ID` en Vercel.
3. **Crear la pestaña `Composicion web`** con estos encabezados en la fila 1:

   | Cuenta | Fecha | Nº factura | Vencimiento | Importe | Importe origen | Cond. pago | Observación | Comentario | Actualizado |

## Las dos pestañas tienen roles distintos

**`Composicion web` — la escribe la app.**
Se sobrescribe completa en cada importación de Excel. No conviene editarla a mano.

**`Acuerdos web` — la mantenés vos.**
La app **sólo lee**, nunca escribe. Columnas como ya están armadas:

| A | B | C | D | E | F | G | H | I | J | K | L | M | N |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Código | Cuenta | ACC | Escala crecim. | No dev | Log | Publ | Voraz | Criadores | Kongo | Aporte adicional $ | Aporte adicional % | Detalle | Acuerdos comerciales (firmados) |

El match entre las dos pestañas y la página es por **nombre de cuenta**
(COTO, CARREFOUR, MAKRO…), sin distinguir mayúsculas ni acentos.

## Cómo queda funcionando

- Al abrir la página, lee `GET /api/composicion/list`. Lo que está en el Sheet manda.
- Admin importa un Excel → `POST /api/composicion/guardar` sobrescribe `Composicion web`.
  Desde ese momento todos ven ese saldo, desde cualquier computadora.
- Los acuerdos que muestra la ficha salen de `Acuerdos web` y son de sólo lectura.
- Guardar requiere sesión de admin: usa el mismo token que el resto de la app (`x-auth-token`).
- Si la página se abre fuera de Vercel (sin API), sigue andando contra el navegador (localStorage).

## Lo que queda fijo en el código

`datos.js` guarda lo que no cambia con cada importación: cuentas, portales, códigos de
proveedor, CUIT, usuarios, contraseñas y plazos de pago.

## Próximo paso (pendiente)

La pestaña de **Acuerdos** de la app: la misma tabla de `Acuerdos web` como vista estática,
con las columnas K, L y M editables sólo cuando vos habilites la edición.
