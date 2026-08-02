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

export async function actualizarEstado(slug, rowIndex, estado) {
  const res = await fetch("/api/ordenes/update-estado", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, rowIndex, estado }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al actualizar");
  return data;
}
