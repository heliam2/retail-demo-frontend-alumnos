import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Bell,
  CreditCard,
  Heart,
  LifeBuoy,
  MapPin,
  Package,
  Package2,
  ShoppingCart,
  User,
} from "lucide-react";
import api from "../api";
import { useAuth } from "../store.jsx";
import { formatCLP } from "../components/ProductCard.jsx";
import { StoreHeader, StoreFooter } from "../components/StoreLayout.jsx";

function Chrome({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-background font-body text-foreground">
      <StoreHeader />
      <main className="flex-grow py-8">
        <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">{children}</div>
      </main>
      <StoreFooter />
    </div>
  );
}

function initials(name) {
  return (name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

function loyaltyTier(points) {
  if (points >= 5000) return { label: "Nivel Oro", className: "bg-amber-100 text-amber-700" };
  if (points >= 1000) return { label: "Nivel Plata", className: "bg-slate-200 text-slate-700" };
  return { label: "Nivel Bronce", className: "bg-orange-100 text-orange-700" };
}

function discountPct(item) {
  if (!item.listPrice || item.listPrice <= item.price) return 0;
  return Math.round((1 - item.price / item.listPrice) * 100);
}

// Mismo criterio de stock que ProductCard, adaptado al design system nuevo.
function stockStatus(stock) {
  if (stock === 0) {
    return { dot: "bg-destructive", text: "Sin stock", className: "text-destructive" };
  }
  if (stock <= 5) {
    return { dot: "bg-secondary", text: `Pocas unidades (quedan ${stock})`, className: "text-secondary" };
  }
  return { dot: "bg-emerald-500", text: "Disponible", className: "text-emerald-700" };
}

const SORT_OPTIONS = [
  { value: "recientes", label: "Ordenar por: Agregados recientemente" },
  { value: "precio-asc", label: "Precio: Menor a Mayor" },
  { value: "precio-desc", label: "Precio: Mayor a Menor" },
  { value: "descuento", label: "Mayor descuento" },
];

export default function Wishlist() {
  const { token, refreshCart } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [items, setItems] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("todos");
  const [sort, setSort] = useState("recientes");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [wishlist, me] = await Promise.all([
        api.getWishlist(token),
        api.getProfile(token).catch(() => null),
      ]);
      // El backend devuelve los favoritos en orden de agregado; mostramos los recientes primero.
      setItems(wishlist.items.slice().reverse());
      setProfile(me);
    } catch (err) {
      // Sesión vencida o token inválido: volvemos al login en vez de dejar el spinner colgado.
      if (err.status === 401) {
        navigate("/login", { state: { from: location.pathname + location.search }, replace: true });
        return;
      }
      setError(err.message || "No pudimos cargar tus favoritos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) {
      navigate("/login", { state: { from: location.pathname + location.search }, replace: true });
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const counts = useMemo(
    () => ({
      todos: items.length,
      descuento: items.filter((it) => discountPct(it) > 0).length,
      stock: items.filter((it) => it.stock > 0).length,
    }),
    [items],
  );

  const tabs = [
    { key: "todos", label: `Todos (${counts.todos})` },
    { key: "descuento", label: `Con descuento (${counts.descuento})` },
    { key: "stock", label: `En stock (${counts.stock})` },
  ];

  const visibleItems = useMemo(() => {
    let list = items;
    if (tab === "descuento") list = list.filter((it) => discountPct(it) > 0);
    if (tab === "stock") list = list.filter((it) => it.stock > 0);

    const sorted = list.slice();
    if (sort === "precio-asc") sorted.sort((a, b) => a.price - b.price);
    if (sort === "precio-desc") sorted.sort((a, b) => b.price - a.price);
    if (sort === "descuento") sorted.sort((a, b) => discountPct(b) - discountPct(a));
    return sorted;
  }, [items, tab, sort]);

  const availableCount = counts.stock;
  const tier = loyaltyTier(profile?.loyaltyPoints || 0);

  function flash(message) {
    setNotice(message);
    setTimeout(() => setNotice(""), 4000);
  }

  async function remove(productId) {
    await api.removeFromWishlist(token, productId);
    setItems((prev) => prev.filter((it) => it.id !== productId));
  }

  async function addToCart(product) {
    setBusy(true);
    try {
      await api.addToCart(token, product.id, 1);
      await refreshCart();
      flash(`"${product.name}" se agregó al carro.`);
    } finally {
      setBusy(false);
    }
  }

  // "Mover disponibles al carro": agrega cada favorito con stock y lo saca de la lista.
  async function moveAvailableToCart() {
    const available = items.filter((it) => it.stock > 0);
    if (available.length === 0) return;
    setBusy(true);
    try {
      for (const it of available) {
        await api.addToCart(token, it.id, 1);
        await api.removeFromWishlist(token, it.id);
      }
      await refreshCart();
      setItems((prev) => prev.filter((it) => it.stock === 0));
      flash(
        available.length === 1
          ? "Movimos 1 producto disponible a tu carro."
          : `Movimos ${available.length} productos disponibles a tu carro.`,
      );
    } finally {
      setBusy(false);
    }
  }

  const navItems = [
    { icon: User, label: "Mi Perfil", to: "/perfil" },
    { icon: Package, label: "Mis Pedidos", to: "/orders" },
    { icon: Heart, label: "Favoritos", to: "/wishlist", active: true, badge: counts.todos },
    { icon: MapPin, label: "Direcciones Guardadas", to: "/addresses" },
    { icon: CreditCard, label: "Métodos de Pago", to: "/perfil" },
    { icon: Bell, label: "Notificaciones", to: "/perfil" },
  ];

  if (loading) {
    return (
      <Chrome>
        <p className="font-body text-body-lg text-muted-foreground">Cargando favoritos...</p>
      </Chrome>
    );
  }

  if (error) {
    return (
      <Chrome>
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-6 py-12 text-center">
          <p className="font-body text-body-lg font-semibold text-destructive">{error}</p>
          <button
            type="button"
            onClick={load}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-body text-label-md font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Reintentar
          </button>
        </div>
      </Chrome>
    );
  }

  return (
    <Chrome>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 font-body text-label-md text-muted-foreground">
        <Link to="/" className="transition-colors hover:text-foreground">Inicio</Link>
        <span className="text-border">/</span>
        <Link to="/orders" className="transition-colors hover:text-foreground">Mi Cuenta</Link>
        <span className="text-border">/</span>
        <span aria-current="page" className="font-semibold text-foreground">Favoritos</span>
      </nav>

      {/* Título + contador */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-display-md font-bold tracking-tight text-foreground">Mis Favoritos</h1>
          <p className="mt-1 font-body text-body-md text-muted-foreground">
            Guarda los productos que te interesan y revisa su disponibilidad o cambios de precio.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-muted px-3.5 py-1.5 font-body text-label-md font-semibold text-foreground">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          {counts.todos} {counts.todos === 1 ? "producto guardado" : "productos guardados"}
        </span>
      </div>

      {notice && (
        <div
          className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-body text-body-md text-emerald-800"
          data-testid="wishlist-notice"
        >
          <ShoppingCart className="h-5 w-5 shrink-0 text-emerald-600" />
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Sidebar de cuenta */}
        <aside className="space-y-4 lg:col-span-1">
          <div className="space-y-1 rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-3 rounded-xl bg-surface-muted p-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-body-md font-bold text-primary-foreground">
                {initials(profile?.name)}
              </div>
              <div className="overflow-hidden">
                <p className="truncate font-body text-body-md font-bold text-foreground">{profile?.name || "Mi cuenta"}</p>
                <p className="truncate font-body text-label-md text-muted-foreground">{profile?.email}</p>
              </div>
            </div>
            {navItems.map(({ icon: Icon, label, to, active, badge }) => (
              <Link
                key={label}
                to={to}
                className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 font-body text-label-md font-semibold transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${active ? "text-rose-400" : ""}`} />
                  <span>{label}</span>
                </span>
                {badge > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      active ? "bg-rose-500 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Puntos Retail */}
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm" data-testid="loyalty-card">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-body text-label-md font-bold uppercase tracking-wide text-foreground">
                Puntos Retail
              </span>
              <span className={`rounded px-2 py-0.5 font-body text-label-md font-bold ${tier.className}`}>
                {tier.label}
              </span>
            </div>
            <p className="font-heading text-headline-lg font-bold text-foreground">
              {(profile?.loyaltyPoints || 0).toLocaleString("es-CL")}{" "}
              <span className="font-body text-label-md font-normal text-muted-foreground">pts</span>
            </p>
            <p className="mt-1 font-body text-label-md text-muted-foreground">
              Equivalentes a {formatCLP((profile?.loyaltyPoints || 0) * 10)} de descuento en tu próxima compra.
            </p>
          </div>
        </aside>

        {/* Contenido */}
        <div className="space-y-6 lg:col-span-3">
          {items.length === 0 ? (
            <div
              className="rounded-2xl border border-border bg-surface px-6 py-16 text-center font-body text-body-lg text-muted-foreground"
              data-testid="wishlist-empty"
            >
              No tienes productos favoritos.{" "}
              <Link to="/catalogo" className="font-semibold text-secondary hover:underline">
                Ir al catálogo
              </Link>
            </div>
          ) : (
            <>
              {/* Barra de filtros y acciones */}
              <div className="flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm md:flex-row md:items-center">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                  {tabs.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTab(t.key)}
                      data-testid={`wishlist-tab-${t.key}`}
                      className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 font-body text-label-md font-bold transition-colors ${
                        tab === t.key
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 justify-between md:justify-end">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    data-testid="wishlist-sort"
                    className="rounded-lg border border-border bg-background py-1.5 pl-3 pr-8 font-body text-label-md font-semibold text-foreground outline-none transition-colors focus:border-primary"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={moveAvailableToCart}
                    disabled={busy || availableCount === 0}
                    data-testid="wishlist-move-available"
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-muted px-3.5 py-1.5 font-body text-label-md font-bold text-foreground transition-colors hover:bg-border disabled:opacity-50"
                  >
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    <span>Mover disponibles al carro</span>
                  </button>
                </div>
              </div>

              {/* Lista de favoritos */}
              <div className="space-y-4" data-testid="wishlist-grid">
                {visibleItems.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-surface px-6 py-12 text-center font-body text-body-md text-muted-foreground">
                    Ningún favorito coincide con este filtro.
                  </div>
                ) : (
                  visibleItems.map((product) => {
                    const pct = discountPct(product);
                    const status = stockStatus(product.stock);
                    return (
                      <article
                        key={product.id}
                        data-testid={`wishlist-item-${product.id}`}
                        className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-border bg-surface p-4 shadow-sm transition-colors hover:border-muted-foreground/30 sm:flex-row sm:items-center sm:p-5"
                      >
                        <div className="flex flex-1 items-start gap-4 sm:items-center">
                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                <Package2 className="h-9 w-9" strokeWidth={1.5} />
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {product.category && (
                                <span className="font-body text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  {product.category}
                                </span>
                              )}
                              {pct > 0 && (
                                <span className="rounded-full bg-orange-100 px-2 py-0.5 font-body text-[10px] font-bold text-orange-700">
                                  -{pct}% DCTO
                                </span>
                              )}
                            </div>
                            <h3 className="font-body text-body-md font-bold text-foreground">{product.name}</h3>
                            {product.brand && (
                              <p className="font-body text-label-md text-muted-foreground">{product.brand}</p>
                            )}
                            <div className="flex items-center gap-2 pt-0.5">
                              <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                              <span className={`font-body text-label-md font-semibold ${status.className}`}>
                                {status.text}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex w-full items-center justify-between gap-3 border-t border-border pt-3 sm:w-auto sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
                          <div className="text-left sm:text-right">
                            <div className="flex items-center gap-2 sm:justify-end">
                              {pct > 0 && (
                                <span className="font-body text-label-md text-muted-foreground line-through">
                                  {formatCLP(product.listPrice)}
                                </span>
                              )}
                              <span
                                className="font-heading text-title-md font-bold text-foreground"
                                data-testid={`wishlist-price-${product.id}`}
                              >
                                {formatCLP(product.price)}
                              </span>
                            </div>
                            <span className="block font-body text-[10px] text-muted-foreground">
                              Precio con todo medio de pago
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => remove(product.id)}
                              title="Quitar de favoritos"
                              aria-label={`Quitar ${product.name} de favoritos`}
                              data-testid={`remove-wishlist-${product.id}`}
                              className="rounded-lg border border-border p-2 text-rose-500 transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Heart className="h-4 w-4 fill-current" />
                            </button>
                            <button
                              type="button"
                              onClick={() => addToCart(product)}
                              disabled={busy || product.stock === 0}
                              data-testid={`add-cart-wishlist-${product.id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-body text-label-md font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                            >
                              <ShoppingCart className="h-4 w-4" />
                              <span>Agregar al carro</span>
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Banner de ayuda */}
      <section className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:flex-row">
        <div className="flex items-center gap-4 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
            <LifeBuoy className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-body text-body-md font-bold text-foreground">
              ¿Necesitas ayuda con tus favoritos o compras?
            </h4>
            <p className="mt-0.5 font-body text-label-md text-muted-foreground">
              Nuestro equipo de soporte está disponible de lunes a domingo de 08:00 a 20:00 hrs.
            </p>
          </div>
        </div>
        <a
          href="#"
          className="whitespace-nowrap rounded-lg border border-border px-4 py-2 font-body text-label-md font-semibold text-foreground transition-colors hover:bg-muted"
        >
          Ir al Centro de Ayuda
        </a>
      </section>
    </Chrome>
  );
}
