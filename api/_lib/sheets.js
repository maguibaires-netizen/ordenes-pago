import { google } from "googleapis";

// Usa las variables de entorno GOOGLE_CLIENT_EMAIL y GOOGLE_PRIVATE_KEY
// (cargadas en Vercel → Settings → Environment Variables). Nunca hardcodear
// credenciales acá.
function auth() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const key = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (!email || !key) {
    throw new Error(
      "Faltan las variables de entorno GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY en Vercel."
    );
  }

  return new google.auth.JWT(email, null, key, ["https://www.googleapis.com/auth/spreadsheets"]);
}

export function sheetsClient() {
  return google.sheets({ version: "v4", auth: auth() });
}
