import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import api from "../api";
import ProductTile from "../components/ProductTile.jsx";
import { StoreHeader, StoreFooter } from "../components/StoreLayout.jsx";
import { Button } from "@/components/ui/button";

// Imágenes de vitrina del mockup original (CDN de Google). Si alguna caduca,
// queda el color de fondo (`bg-primary`) debajo.
const HERO_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCxWEOToy8JSRtyzJJdl7YGS3W11IGwBVkjF8NUZllLnTwrrKM0xqMHBWjmCh9G0doX2obF0L6lKHpBBBY8d3FRpZWOKyU0onQAARA2X9z1KmYH6Zw4uLAiDGo3MNhRnxd_DlBwU09XSeJSLiNcJj-WUJnMqYFVA-fVdSj_BYu6VooNLsuDgQREAgEG02OkGgCbsJhdE8nAizHReM31C2p3aFpFwnXKb6I8tzCxtHQrYKynNhZCzg-q9A";
const ELECTRO_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCHe_1Lp20EJDf8_OqIdnNW7U5Cn_5t_bgXlnp9DWnYM0Y5YuEmwLiUITTS3unolEarR-G1_dWBnhPhbXg_xF_o8FZCvVBZ4rFaa_glsmgOBp3NW1bLhYPPAFdani3QNFTSG4ptMvdCBT0ikcPL7U9oj1gMo7hR6I0CaCemfX4hg3L_ivll7K4bHOrwyfY_4H7ViS8zrelnkSmRsiTdsuuxtjzIlCEXyPcAPyMKXulWNVPDLpUuQYFpiw";
const HOGAR_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDEmEP95PyMnzF4s_hPn5vEo8Qs8IsIwy6AWNbM3AYRJD8ts0-5TybFaOynhoJEjv5dKTH1ewKy2s6jEtRv-7MZRZ6iC-86y-T6RPgJzJXMCPQHlqeUEpa97vM5tJAQavSg4rIfkh94vSmAovG9pKAwl6IOioN7sTlBpKRHSHnU0I_KM_C7Ve89ph1-RuEpgeyM3MqBGLwC5tamOCUhD8fWA3TTXbqzZPl49YHDJjc2RBoMD07KW2mesA";

const CATEGORY_TILES = [
  {
    testid: "home-category-electro",
    label: "Electro y Tecnología",
    to: "/catalogo/Tecnologia",
    img: ELECTRO_IMG,
    span: "md:col-span-2",
  },
  {
    testid: "home-category-hogar",
    label: "Hogar y Muebles",
    to: "/catalogo/Hogar",
    img: HOGAR_IMG,
    span: "",
  },
];

export default function Home() {
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

  const featured = useMemo(() => products.slice(0, 4), [products]);

  return (
    <div className="flex min-h-screen flex-col bg-background font-body text-foreground">
      <StoreHeader />

      <main className="mx-auto flex w-full max-w-container-max flex-grow flex-col gap-12 px-margin-mobile py-8 md:px-margin-desktop">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-xl bg-primary text-primary-foreground">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-60"
            style={{ backgroundImage: `url("${HERO_IMG}")` }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary via-primary/85 to-primary/30"
          />
          <div className="relative z-10 max-w-2xl p-8 md:p-12">
            <span className="mb-4 inline-block rounded-full bg-secondary px-3 py-1 font-body text-label-md uppercase tracking-widest text-secondary-foreground">
              Cyber Sale
            </span>
            <h1 className="mb-4 font-heading text-display-md font-bold text-white md:text-display-lg">
              Renueva tu espacio con hasta 40% dcto.
            </h1>
            <p className="mb-8 font-body text-body-lg text-slate-300">
              Descubre ofertas exclusivas en tecnología y hogar solo por esta semana.
            </p>
            <Button asChild variant="accent" size="lg">
              <Link to="/catalogo" data-testid="hero-cta">Ver todas las ofertas</Link>
            </Button>
          </div>
        </section>

        {/* Categorías */}
        <section className="flex flex-col gap-stack-lg" data-testid="home-categories">
          <h2 className="font-heading text-headline-lg font-bold text-foreground">Categorías Destacadas</h2>
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
            {CATEGORY_TILES.map(({ testid, label, to, img, span }) => (
              <Link
                key={label}
                to={to}
                data-testid={testid}
                className={`group relative flex h-64 flex-col justify-end overflow-hidden rounded-xl bg-primary p-6 text-left text-white transition-shadow duration-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.18)] ${span}`}
              >
                <img
                  src={img}
                  alt={label}
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"
                />
                <div className="relative z-10">
                  <h3 className="mb-2 font-heading text-headline-md font-bold">{label}</h3>
                  <span className="inline-flex items-center font-body text-label-md uppercase tracking-wider text-white">
                    Explorar <ArrowRight className="ml-1 h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Más vendidos */}
        <section className="mt-4 flex flex-col gap-stack-lg" data-testid="home-featured">
          <div className="flex items-end justify-between">
            <h2 className="font-heading text-headline-lg font-bold text-foreground">Más Vendidos</h2>
            <Link
              to="/catalogo"
              className="font-body text-body-md font-semibold text-secondary hover:underline"
            >
              Ver todos
            </Link>
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
            <p className="text-muted-foreground" data-testid="featured-loading">
              Cargando...
            </p>
          )}

          <div
            className="grid grid-cols-1 gap-gutter sm:grid-cols-2 md:grid-cols-4"
            data-testid="featured-grid"
          >
            {featured.map((p) => (
              <ProductTile key={p.id} product={p} />
            ))}
          </div>
        </section>
      </main>

      <StoreFooter />
    </div>
  );
}
