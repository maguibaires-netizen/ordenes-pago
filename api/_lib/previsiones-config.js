// Libro "PROVISIONES SUPERMERCADOS". Hojas que la app puede tocar:
// Facturación (se sobrescribe cada mes, a pedido de la usuaria) y Evolucion
// (histórico que arma la app). El resto de las hojas del libro
// (% x APORTES, SALDOS A PROVISIONAR, Lista control NC/Pend, CONTROL previ)
// NO se tocan en esta etapa.
export const SHEET_ID = "1ZmnBs4zIAZRu3z3lEQUt6AlueM63vWakSDv06jHPtTs";

export const TABS = {
  facturacion: "Facturación",
  evolucion: "Evolucion",
};

// código de cuenta (columna A de "% x APORTES" / "Cliente consolidador" de
// Facturación) -> slug ya usado en el resto de la app (src/data/supermercados.js).
export const CODIGO_A_SLUG = {
  533: "diarco",
  1857: "carrefour",
  1578: "makro",
  739: "toledo",
  489: "nini",
  552: "alberdi",
  518: "dorinka",
  857: "cencosud",
  1884: "la-anonima",
  1741: "sodimac",
  1618: "la-esperanza",
  1623: "aiello",
  1465: "coto",
  704: "almacor",
  2019: "jumbo",
  949: "millan",
  2885: "pedidosya",
  // maycar: código todavía no confirmado (no facturó en el mes de referencia)
};

// Tipos de comprobante conocidos cuando el signo es "S" (salida) pero en
// realidad es una ND, no una factura (ver PROMPT-CLAUDE-CODE.md).
export const TIPOS_ND_EN_SALIDA = new Set(["49A"]);

// Marcas conocidas: [texto con el que empieza el Nombre, marca "canónica"].
// Van de más específicas a más generales (para separar "Kongo Gold" de
// "Kongo" aunque los dos empiecen con la misma palabra), y permiten alias
// (ej: "Maint " -> "Maintenance").
export const MARCAS_CONOCIDAS = [
  ["Kongo Gold", "Kongo Gold"],
  ["Kongo", "Kongo"],
  ["Maintenance", "Maintenance"],
  ["Maint ", "Maintenance"],
  ["Caudillos", "Caudillos"],
  ["Carnix", "Carnix"],
  ["Cereales", "Cereales"],
  ["Voraz", "Voraz"],
  ["Criadores", "Criadores"],
];
