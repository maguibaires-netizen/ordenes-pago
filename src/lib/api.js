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
