import { firmarToken } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { clave } = req.body || {};
  const claveAdmin = process.env.LOGIN_ADMIN;
  const claveVendedor = process.env.LOGIN_VENDEDOR;

  if (!claveAdmin || !claveVendedor) {
    return res.status(500).json({ error: "Faltan configurar LOGIN_ADMIN / LOGIN_VENDEDOR en Vercel." });
  }

  let rol = null;
  if (clave && clave === claveAdmin) rol = "admin";
  else if (clave && clave === claveVendedor) rol = "vendedor";

  if (!rol) {
    return res.status(401).json({ error: "Clave incorrecta." });
  }

  return res.status(200).json({ rol, token: firmarToken(rol) });
}
