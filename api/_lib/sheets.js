import { google } from "googleapis";

// Usa las variables de entorno GOOGLE_CLIENT_EMAIL y GOOGLE_PRIVATE_KEY
// (cargadas en Vercel → Settings → Environment Variables). Nunca hardcodear
// credenciales acá.
function auth() {
  const client_email = process.env.GOOGLE_CLIENT_EMAIL;
  const private_key = (process.env.GOOGLE_PRIVATE_KEY || "")
    .trim()
    .replace(/^"(.*)"$/, "$1")
    .replace(/\\n/g, "\n");

  if (!client_email || !private_key) {
    throw new Error(
      "Faltan las variables de entorno GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY en Vercel."
    );
  }

  return new google.auth.GoogleAuth({
    credentials: { client_email, private_key },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export function sheetsClient() {
  return google.sheets({ version: "v4", auth: auth() });
}
