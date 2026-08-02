import { parsearOrdenDePagoCarrefour } from "../parsers/carrefour";

// slug -> función de parseo. Los supermercados sin entrada acá todavía
// no tienen lectura automática configurada.
export const PARSERS = {
  carrefour: parsearOrdenDePagoCarrefour,
};

export const ESTADOS = ["Pendiente", "Generada", "Conciliada", "CC incompleta", "Enviado a compras/cpag"];
