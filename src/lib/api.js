export async function guardarOrdenes(slug, filas) {
  const res = await fetch("/api/ordenes/append", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
export async function actualizarCelda(slug, rowIndex, campo, valor) {
  const res = await fetch("/api/ordenes/actualizar-celda", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, rowIndex, campo, valor }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al actualizar");
  return data;
}
