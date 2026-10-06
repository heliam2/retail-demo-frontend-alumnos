import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ArrowRight } from "lucide-react";
import api from "../api";
import { deriveCategories } from "../categories.js";
import { StoreHeader, StoreFooter } from "../components/StoreLayout.jsx";

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getProducts()
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => deriveCategories(products), [products]);

  return (
    <div className="flex min-h-screen flex-col bg-background font-body text-foreground">
      <StoreHeader />

      <main className="mx-auto flex w-full max-w-container-max flex-grow flex-col gap-6 px-margin-mobile py-8 md:px-margin-desktop">
        <nav
          aria-label="Miga de pan"
          className="flex flex-wrap items-center gap-1 font-body text-body-md text-muted-foreground"
        >
          <Link to="/" className="text-secondary hover:underline">
            Inicio
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Catálogo</span>
        </nav>

        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-headline-lg font-bold text-foreground">Catálogo</h1>
          <p className="font-body text-body-md text-muted-foreground">
            Elige una categoría para ver sus productos.
          </p>
        </div>

        {error && (
          <div
            className="rounded-md border border-[#FECACA] bg-[#FEE2E2] px-4 py-3 text-[#991B1B]"
            data-testid="products-error"
          >
            {error}
          </div>
        )}
        {loading && (
          <p className="text-muted-foreground" data-testid="products-loading">
            Cargando...
          </p>
        )}

        <div
          className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-3"
          data-testid="categories-grid"
        >
          {categories.map(({ slug, label, blurb, count, Icon }) => (
            <Link
              key={slug}
              to={`/catalogo/${slug}`}
              data-testid={`category-card-${slug}`}
              className="group relative flex h-52 flex-col justify-end overflow-hidden rounded-xl bg-primary p-6 text-left text-white ring-1 ring-white/5 transition-shadow duration-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.18)]"
            >
              <Icon
                strokeWidth={1.25}
                className="pointer-events-none absolute -bottom-6 -right-4 h-36 w-36 text-white/10 transition-transform duration-500 group-hover:scale-105"
              />
              <div className="relative z-10">
                <h3 className="mb-1 font-heading text-headline-md font-bold">{label}</h3>
                <p className="mb-3 max-w-[26ch] font-body text-body-md text-slate-300">{blurb}</p>
                <span className="inline-flex items-center font-body text-label-md uppercase tracking-wider text-secondary">
                  Ver {count} {count === 1 ? "producto" : "productos"}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}
