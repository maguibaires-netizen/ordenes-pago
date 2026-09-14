# Cobranzas — Portal

Portal web del sector de Créditos y Cobranzas: reportes propios y accesos directos a las planillas del equipo, todo en un solo lugar.

## Estructura

```
cobranzas-cartera/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx              ← punto de entrada, no hace falta tocarlo
    ├── index.css             ← estilos compartidos (colores, tipografía, tarjetas)
    ├── App.jsx               ← define las rutas (qué página se ve en cada URL)
    ├── components/
    │   ├── Layout.jsx        ← navbar de arriba, en todas las páginas
    │   ├── Navbar.jsx
    │   └── SheetEmbed.jsx    ← plantilla reusable para embeber un Google Sheet
    └── pages/
        ├── Home.jsx                  ← pantalla de bienvenida / selector
        ├── CarteraClientes.jsx       ← reporte de cartera (el primero que armamos)
        ├── PedidosPendientes.jsx     ← planilla + reporte, con pestañas
        ├── ChequesRechazados.jsx
        ├── PendientesConciliar.jsx
        └── Legajos.jsx               ← todavía sin desarrollar
```

## Pendiente: completar 2 IDs de Sheets

En `src/pages/ChequesRechazados.jsx` y `src/pages/PendientesConciliar.jsx` hay una línea:
```js
const SHEET_ID = "PEGAR_ID_ACA";
```
Reemplazá `PEGAR_ID_ACA` por el ID real de cada planilla (mismo procedimiento que ya hiciste antes: de la URL del Sheet, la parte entre `/d/` y `/edit`).

## 1) Probarlo en tu máquina (opcional, pero recomendado)

Necesitás [Node.js](https://nodejs.org) instalado (versión 18 o más nueva).

```bash
npm install
npm run dev
```

Te va a abrir algo como `http://localhost:5173` con la app corriendo.

## 2) Subir los cambios a GitHub

```bash
git add .
git commit -m "Portal completo con navegación"
git push
```

## 3) Vercel redeploya solo

En 1-2 minutos el link de siempre (`cobranzas-cartera.vercel.app`) ya va a mostrar el portal completo, con la pantalla de bienvenida como página principal.

## Cómo agregar una herramienta nueva más adelante

1. Creás un archivo nuevo en `src/pages/` (por ejemplo `Legajos.jsx` ya existe como placeholder — cuando la desarrollemos, se reemplaza ese archivo).
2. Si es otro Google Sheet simple, podés reusar `SheetEmbed` como hacen `ChequesRechazados.jsx` y `PendientesConciliar.jsx` — es la forma más corta de agregar una planilla nueva.
3. Agregás la ruta nueva en `src/App.jsx` (una línea `<Route path="..." element={...} />`).
4. Agregás la tarjeta correspondiente en `src/pages/Home.jsx`.

Avisame cuando quieras sumar algo y lo hacemos juntas.
