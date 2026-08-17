import { parsearOrdenDePagoCarrefour } from "../parsers/carrefour";
import { parsearOrdenDePagoRemadv } from "../parsers/remadv";
import { parsearOrdenDePagoCoto } from "../parsers/coto";

// slug -> función de parseo. Los supermercados sin entrada acá todavía
// no tienen lectura automática configurada.
export const PARSERS = {
  carrefour: parsearOrdenDePagoCarrefour,
  makro: parsearOrdenDePagoRemadv,
  cencosud: parsearOrdenDePagoRemadv,
  coto: parsearOrdenDePagoCoto,
};

export const ESTADOS = ["Pendiente", "Generada", "Conciliada", "CC incompleta", "Enviado a compras/cpag"];
