export function nf(n, dec = 2) {
  return new Intl.NumberFormat("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n || 0);
}

export function money(n) {
  return (n < 0 ? "-" : "") + "$ " + nf(Math.abs(n));
}

export function corto(n) {
  const a = Math.abs(n);
  const s = n < 0 ? "-" : "";
  if (a >= 1e6) return s + "$" + (a / 1e6).toLocaleString("es-AR", { maximumFractionDigits: 1 }) + "M";
  if (a >= 1e3) return s + "$" + (a / 1e3).toLocaleString("es-AR", { maximumFractionDigits: 0 }) + "k";
  return a ? s + "$" + nf(a, 0) : "—";
}

export function fechaFmt(iso) {
  if (!iso) return "—";
  const p = String(iso).split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : String(iso);
}

export function dias(a, b) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

export function normalizar(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// A qué cuenta corresponde un texto (nombre de pestaña de Excel o de archivo).
export function cuentaPorTexto(cuentas, texto) {
  const n = normalizar(texto);
  if (!n) return null;
  return (
    cuentas.find((c) => normalizar(c.id) === n || normalizar(c.nombre) === n) ||
    cuentas.find((c) => normalizar(c.nombre).startsWith(n) || n.startsWith(normalizar(c.id))) ||
    cuentas.find((c) => n.includes(normalizar(c.id)) || n.includes(normalizar(c.nombre).split(" ")[0]))
  );
}

export const COLUMNAS_DETALLE = [
  { key: "fecha", label: "Fecha", align: "left", tipo: "date" },
  { key: "diasEmision", label: "Días emis.", align: "right", tipo: "int" },
  { key: "numFactura", label: "Nº factura", align: "left", tipo: "txt", mono: true },
  { key: "vencimiento", label: "Vencim.", align: "left", tipo: "date" },
  { key: "diasVencido", label: "Días venc.", align: "right", tipo: "int" },
  { key: "importe", label: "Importe", align: "right", tipo: "money" },
  { key: "importeOrigen", label: "Imp. origen", align: "right", tipo: "money" },
  { key: "observacion", label: "Observación", align: "left", tipo: "txt", mono: true },
  { key: "comentario", label: "Comentario", align: "left", tipo: "txt" },
];

export const CONCEPTOS_ACUERDO = [
  ["acc", "ACC"],
  ["escala", "Escala crecim."],
  ["noDev", "No dev"],
  ["log", "Log"],
  ["publ", "Publ"],
  ["voraz", "Voraz"],
  ["criadores", "Criadores"],
  ["kongo", "Kongo"],
];
