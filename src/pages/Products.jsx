import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import api from "../api";
import ProductTile from "../components/ProductTile.jsx";
import { useCategories, categoryLabel } from "../categories.js";
import { StoreHeader, StoreFooter } from "../components/StoreLayout.jsx";

export default function Products() {
  const { categoria } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const search = searchParams.get("q") || "";
  const { categories } = useCategories();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    const params = {};
    if (search) params.search = search;
    if (categoria) params.category = categoria;

    api
      .getProducts(params)
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search, categoria]);

  function handleCategoryChange(e) {
    const value = e.target.value;
    navigate(value ? `/catalogo/${value}` : "/catalogo");
  }

  const label = categoryLabel(categoria);

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
          <Link to="/catalogo" className="text-secondary hover:underline">
            Catálogo
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{label}</span>
        </nav>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-headline-lg font-bold text-foreground">{label}</h1>
            {search && (
              <p className="font-body text-body-md text-muted-foreground" data-testid="search-summary">
                Resultados para “{search}”
              </p>
            )}
          </div>

          <select
            value={categoria || ""}
            onChange={handleCategoryChange}
            data-testid="category-filter"
            className="rounded-md border border-border bg-surface px-3 py-2 font-body text-body-md text-foreground"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
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

        {!loading && !error && products.length === 0 && (
          <div
            className="rounded-md border border-border bg-muted px-4 py-10 text-center text-muted-foreground"
            data-testid="products-empty"
          >
            No se encontraron productos.
          </div>
        )}

        <div
          className="grid grid-cols-1 gap-gutter sm:grid-cols-2 md:grid-cols-4"
          data-testid="products-grid"
        >
          {products.map((p) => (
            <ProductTile key={p.id} product={p} />
          ))}
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}
