import { google } from "googleapis";

// Los comprobantes se suben como si los subiera la persona que autorizó la
// app una vez (OAuth con "refresh token"). Se usa el permiso acotado
// drive.file: la app solo puede ver y tocar los archivos y carpetas que ella
// misma creó, nunca el resto del Drive.
//
// Variables de entorno (Vercel → Settings → Environment Variables):
//   GOOGLE_OAUTH_CLIENT_ID
//   GOOGLE_OAUTH_CLIENT_SECRET
//   GOOGLE_OAUTH_REFRESH_TOKEN
// Opcional:
//   COMPROBANTES_FOLDER_ID  → id de la carpeta raíz, si ya la creó la app antes
//                             y se quiere fijar (si no está, se busca/crea por nombre)

const REDIRECT_URI = "https://developers.google.com/oauthplayground";
const NOMBRE_RAIZ = "Comprobantes OP";
const MIME_CARPETA = "application/vnd.google-apps.folder";

function autenticar() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Faltan las variables de Google Drive en Vercel (GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET y GOOGLE_OAUTH_REFRESH_TOKEN)."
    );
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return oauth2;
}

export function driveClient() {
  return google.drive({ version: "v3", auth: autenticar() });
}

// Caché en memoria (vale mientras la función esté "caliente") para no buscar
// las carpetas en cada subida.
let cacheRaiz = null;
const cacheSubcarpetas = {};

export function olvidarCarpetas() {
  cacheRaiz = null;
  for (const k of Object.keys(cacheSubcarpetas)) delete cacheSubcarpetas[k];
}

function escapar(texto) {
  return String(texto).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function buscarCarpeta(drive, nombre, padreId) {
  let q = `name='${escapar(nombre)}' and mimeType='${MIME_CARPETA}' and trashed=false`;
  if (padreId) q += ` and '${padreId}' in parents`;
  const { data } = await drive.files.list({
    q,
    fields: "files(id,name)",
    spaces: "drive",
    pageSize: 1,
  });
  return data.files?.[0]?.id || null;
}

async function crearCarpeta(drive, nombre, padreId) {
  const { data } = await drive.files.create({
    requestBody: {
      name: nombre,
      mimeType: MIME_CARPETA,
      ...(padreId ? { parents: [padreId] } : {}),
    },
    fields: "id",
  });
  return data.id;
}

async function carpetaRaiz(drive) {
  if (process.env.COMPROBANTES_FOLDER_ID) return process.env.COMPROBANTES_FOLDER_ID;
  if (cacheRaiz) return cacheRaiz;
  cacheRaiz = (await buscarCarpeta(drive, NOMBRE_RAIZ, null)) || (await crearCarpeta(drive, NOMBRE_RAIZ, null));
  return cacheRaiz;
}

// Devuelve el id de la carpeta de un supermercado (dentro de "Comprobantes OP"),
// creándola la primera vez.
export async function carpetaDeSupermercado(drive, slug) {
  if (cacheSubcarpetas[slug]) return cacheSubcarpetas[slug];
  const raiz = await carpetaRaiz(drive);
  const id = (await buscarCarpeta(drive, slug, raiz)) || (await crearCarpeta(drive, slug, raiz));
  cacheSubcarpetas[slug] = id;
  return id;
}
