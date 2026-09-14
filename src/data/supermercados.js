export const supermercados = [
  { slug: "diarco", nombre: "Autoservicio Mayorista Diarco" },
  { slug: "carrefour", nombre: "Carrefour" },
  { slug: "makro", nombre: "Supermercado Mayorista Makro" },
  { slug: "toledo", nombre: "Supermercado Toledo S.A." },
  { slug: "nini", nombre: "Ricardo Nini S.A." },
  { slug: "alberdi", nombre: "Alberdi SA" },
  { slug: "dorinka", nombre: "Dorinka SRL" },
  { slug: "cencosud", nombre: "Cencosud S.A." },
  { slug: "la-anonima", nombre: "La Anonima" },
  { slug: "sodimac", nombre: "Sodimac" },
  { slug: "la-esperanza", nombre: "La Esperanza S.R.L" },
  { slug: "aiello", nombre: "Supermercado Aiello S.A" },
  { slug: "coto", nombre: "Coto Centro Integral de Comerc" },
  { slug: "almacor", nombre: "Coop. De Prov. Y Cto Almacor L" },
];

export function iniciales(nombre) {
  return nombre
    .split(" ")
    .filter((w) => w.length > 2 || /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
