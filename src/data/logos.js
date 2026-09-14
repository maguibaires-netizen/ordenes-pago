// Junta automáticamente cualquier logo que se agregue en src/assets/logos/{slug}.(png|svg|jpg|webp)
const archivos = import.meta.glob("../assets/logos/*.{png,svg,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});

const mapa = {};
for (const ruta in archivos) {
  const nombre = ruta.split("/").pop().replace(/\.[^.]+$/, "");
  mapa[nombre] = archivos[ruta];
}

export function logoDe(slug) {
  return mapa[slug] || null;
}

export const logoBaires = mapa["baires"] || null;
