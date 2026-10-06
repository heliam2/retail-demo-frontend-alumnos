import { useEffect, useState } from "react";
import { Footprints, Shirt, Backpack, Headphones, Dumbbell, Sofa, Tag } from "lucide-react";
import api from "./api";

// Metadatos de presentación por categoría (ícono + bajada). La lista de
// categorías NO se define aquí: se deriva del catálogo real que devuelve la
// API. Si aparece una categoría sin entrada en META, cae a valores por defecto.
const META = {
  calzado: { label: "Calzado", blurb: "Running y uso diario.", Icon: Footprints },
  ropa: { label: "Ropa", blurb: "Prendas básicas y de temporada.", Icon: Shirt },
  accesorios: { label: "Accesorios", blurb: "Mochilas, botellas y más.", Icon: Backpack },
  tecnologia: { label: "Tecnología", blurb: "Audio, conectividad y gadgets.", Icon: Headphones },
  deportes: { label: "Deportes", blurb: "Equipamiento para entrenar.", Icon: Dumbbell },
  hogar: { label: "Hogar", blurb: "Cocina, orden y decoración.", Icon: Sofa },
};

const ORDER = Object.keys(META);

export function categoryMeta(slug) {
  const key = String(slug || "").toLowerCase();
  return META[key] || { label: slug || "", blurb: "", Icon: Tag };
}

export function categoryLabel(slug) {
  return categoryMeta(slug).label || slug;
}

// Deriva la lista de categorías (con conteo) desde los productos de la API.
export function deriveCategories(products) {
  const seen = new Map();
  for (const p of products || []) {
    const raw = p.category;
    if (!raw) continue;
    const key = raw.toLowerCase();
    if (!seen.has(key)) seen.set(key, { slug: raw, count: 0, ...categoryMeta(raw) });
    seen.get(key).count += 1;
  }
  return [...seen.values()].sort((a, b) => {
    const ia = ORDER.indexOf(a.slug.toLowerCase());
    const ib = ORDER.indexOf(b.slug.toLowerCase());
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

// Hook: trae el catálogo una vez y devuelve las categorías derivadas.
export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    api
      .getProducts()
      .then((p) => alive && setCategories(deriveCategories(p)))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return { categories, loading, error };
}
