function tokenActual() {
  try {
    const sesion = JSON.parse(localStorage.getItem("bo-sesion") || "null");
    return sesion?.token || "";
  } catch {
    return "";
  }
}

function headersConAuth() {
  return { "Content-Type": "application/json", "x-auth-token": tokenActual() };
}

export async function guardarOrdenes(slug, filas) {
  const res = await fetch("/api/ordenes/append", {
    method: "POST",
    headers: headersConAuth(),
    body: JSON.stringify({ slug, filas }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al guardar");
  return data;
}

export async function listarOrdenes(slug) {
  const res = await fetch(`/api/ordenes/list?slug=${encodeURIComponent(slug)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al leer");
  return data.filas;
}

export async function obtenerResumenPendientes() {
  const res = await fetch("/api/ordenes/resumen");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al leer el resumen");
  return data.supermercados;
}

export async function obtenerFacturacion() {
  const res = await fetch("/api/previsiones/facturacion");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al leer Facturación");
  return data;
}

export async function guardarFacturacion({ aoa, fuente }) {
  const res = await fetch("/api/previsiones/facturacion", {
    method: "POST",
    headers: headersConAuth(),
    body: JSON.stringify(fuente === "hoja" ? { fuente } : { aoa }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al guardar Facturación");
  return data;
}

export async function obtenerComposicion() {
  const res = await fetch("/api/composicion/list");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al leer la composición de saldos");
  return data;
}

export async function guardarComposicion(comprobantes) {
  const res = await fetch("/api/composicion/guardar", {
    method: "POST",
    headers: headersConAuth(),
    body: JSON.stringify({ comprobantes }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al guardar la composición de saldos");
  return data;
}

export async function eliminarBloque(slug, filas) {
  const res = await fetch("/api/ordenes/eliminar-bloque", {
    method: "POST",
    headers: headersConAuth(),
    body: JSON.stringify({ slug, filas }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al borrar");
  return data;
}
export async function actualizarCelda(slug, rowIndex, campo, valor) {
  const res = await fetch("/api/ordenes/actualizar-celda", {
    method: "POST",
    headers: headersConAuth(),
    body: JSON.stringify({ slug, rowIndex, campo, valor }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al actualizar");
  return data;
}

function archivoABase64(file) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result).split(",")[1] || "");
    lector.onerror = () => reject(new Error("No se pudo leer el archivo."));
    lector.readAsDataURL(file);
  });
}

// Sube un PDF a Drive y lo vincula a la fila indicada del Sheet.
export async function subirComprobante(slug, rowIndex, file) {
  const contenidoBase64 = await archivoABase64(file);
  const res = await fetch("/api/comprobantes/subir", {
    method: "POST",
    headers: headersConAuth(),
    body: JSON.stringify({ slug, rowIndex, nombre: file.name, contenidoBase64 }),
  });
  let data = {};
  try {
    data = await res.json();
  } catch {
    // Vercel corta con un error que no es JSON si el cuerpo es demasiado grande
    if (res.status === 413) throw new Error("El PDF es demasiado grande para subirlo.");
  }
  if (!res.ok) throw new Error(data.error || "Error al subir el comprobante");
  return data;
}

// Abre un comprobante en una pestaña nueva. Como el archivo es privado, se pide
// con la sesión (no alcanza con un link) y se muestra desde el navegador.
export async function abrirComprobante(fileId) {
  const ventana = window.open("", "_blank");
  try {
    const res = await fetch(`/api/comprobantes/ver?id=${encodeURIComponent(fileId)}`, {
      headers: { "x-auth-token": tokenActual() },
    });
    if (!res.ok) {
      let mensaje = "No se pudo abrir el comprobante";
      try {
        mensaje = (await res.json()).error || mensaje;
      } catch {
        /* sin detalle */
      }
      throw new Error(mensaje);
    }
    const url = URL.createObjectURL(await res.blob());
    if (ventana) ventana.location.href = url;
    else window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (err) {
    ventana?.close();
    throw err;
  }
}
