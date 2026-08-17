import crypto from "crypto";

// Token simple firmado (rol + firma HMAC) para no necesitar base de datos de
// usuarios. Requiere la variable de entorno SESSION_SECRET en Vercel
// (cualquier texto largo al azar que vos elijas).
function secreto() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("Falta la variable de entorno SESSION_SECRET en Vercel.");
  return s;
}

export function firmarToken(rol) {
  const firma = crypto.createHmac("sha256", secreto()).update(rol).digest("hex");
  return `${rol}.${firma}`;
}

// Devuelve el rol si el token es válido, o null si no lo es.
export function verificarToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [rol, firma] = token.split(".");
  const esperada = crypto.createHmac("sha256", secreto()).update(rol).digest("hex");
  const valido = firma?.length === esperada.length && crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(esperada));
  return valido ? rol : null;
}

// Para usar al principio de un endpoint que solo puede tocar un admin.
export function requiereAdmin(req) {
  const token = req.headers["x-auth-token"];
  return verificarToken(token) === "admin";
}
