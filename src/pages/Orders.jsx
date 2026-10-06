import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Download,
  LifeBuoy,
  Package,
  RotateCcw,
  Search,
} from "lucide-react";
import api from "../api";
import { useAuth } from "../store.jsx";
import { formatCLP } from "../components/ProductCard.jsx";
import { StoreHeader, StoreFooter } from "../components/StoreLayout.jsx";
import { Badge } from "@/components/ui/badge";

// Estados que cuentan como "pedido en curso" (aún no entregado ni cancelado).
const ACTIVE_STATUSES = ["pagado", "en preparación", "en preparacion", "en tránsito", "en transito"];

const STATUS_BADGE = {
  pagado: "success",
  "en preparación": "warning",
  "en preparacion": "warning",
  "en tránsito": "warning",
  "en transito": "warning",
  entregado: "default",
  cancelado: "danger",
};

const isActive = (status) => ACTIVE_STATUSES.includes((status || "").toLowerCase());
const authCode = (id) => `WPY-${String(id).padStart(6, "0")}`;
const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function formatPurchaseDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

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

export default function Orders() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const justPlaced = searchParams.get("justPlaced");

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("todos");
  const [query, setQuery] = useState("");

  function load() {
    setLoading(true);
    setError("");
    api
      .getOrders(token)
      .then((data) => {
        setOrders(data.slice().reverse());
      })
      .catch((err) => {
        // Sesión vencida o token inválido: volvemos al login en vez de dejar el spinner colgado.
        if (err.status === 401) {
          navigate("/login", { state: { from: location.pathname + location.search }, replace: true });
          return;
        }
        setError(err.message || "No pudimos cargar tus pedidos.");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!token) {
      navigate("/login", { state: { from: location.pathname + location.search }, replace: true });
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const activeCount = useMemo(() => orders.filter((o) => isActive(o.status)).length, [orders]);

  // Pestañas de filtro derivadas de los estados realmente presentes en los pedidos.
  const tabs = useMemo(() => {
    const counts = {};
    for (const o of orders) {
      const key = (o.status || "sin estado").toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    }
    return [
      { key: "todos", label: "Todos los pedidos", count: orders.length },
      ...Object.entries(counts).map(([key, count]) => ({ key, label: capitalize(key), count })),
    ];
  }, [orders]);

  const visibleOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (tab !== "todos" && (o.status || "").toLowerCase() !== tab) return false;
      if (!q) return true;
      return (
        String(o.id).includes(q) ||
        authCode(o.id).toLowerCase().includes(q) ||
        o.items.some((it) => it.name.toLowerCase().includes(q))
      );
    });
  }, [orders, tab, query]);

  if (loading) {
    return (
      <Chrome>
        <p className="font-body text-body-lg text-muted-foreground">Cargando pedidos...</p>
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
        <span aria-current="page" className="font-semibold text-foreground">Mis Pedidos</span>
      </nav>

      {/* Título + estado en vivo */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-display-md font-bold tracking-tight text-foreground">Mis Pedidos</h1>
          <p className="mt-1 font-body text-body-md text-muted-foreground">
            Revisa el historial, comprobantes y estado en tiempo real de tus compras.
          </p>
        </div>
        {activeCount > 0 && (
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 font-body text-label-md font-semibold text-emerald-800">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            {activeCount} {activeCount === 1 ? "pedido activo en curso" : "pedidos activos en curso"}
          </span>
        )}
      </div>

      {justPlaced && (
        <div
          className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-body text-body-md text-emerald-800"
          data-testid="order-confirmation"
        >
          <Check className="h-5 w-5 shrink-0 text-emerald-600" strokeWidth={3} />
          Pedido #{justPlaced} confirmado con éxito.
        </div>
      )}

      {orders.length === 0 ? (
        <div
          className="rounded-xl border border-border bg-surface px-6 py-16 text-center font-body text-body-lg text-muted-foreground"
          data-testid="orders-empty"
        >
          Aún no tienes pedidos.{" "}
          <Link to="/catalogo" className="font-semibold text-secondary hover:underline">
            Ir al catálogo
          </Link>
        </div>
      ) : (
        <>
          {/* Filtros + búsqueda */}
          <div className="mb-6 flex flex-col items-center justify-between gap-4 rounded-xl border border-border bg-surface p-2 shadow-sm sm:p-3 md:flex-row">
            <div className="flex w-full items-center gap-1 overflow-x-auto pb-1 sm:gap-2 md:w-auto md:pb-0">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  data-testid={`orders-tab-${t.key}`}
                  className={`whitespace-nowrap rounded-lg px-4 py-2 font-body text-label-md font-semibold transition-colors ${
                    tab === t.key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t.label} ({t.count})
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por N° o producto..."
                data-testid="orders-search"
                className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-3 font-body text-body-md text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
          </div>

          {/* Lista de pedidos */}
          <div className="space-y-6" data-testid="orders-stack">
            {visibleOrders.length === 0 && (
              <div
                className="rounded-xl border border-border bg-surface px-6 py-12 text-center font-body text-body-md text-muted-foreground"
                data-testid="orders-no-results"
              >
                No encontramos pedidos que coincidan con tu búsqueda.
              </div>
            )}

            {visibleOrders.map((order) => {
              const active = isActive(order.status);
              return (
                <article
                  key={order.id}
                  data-testid={`order-${order.id}`}
                  className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-colors hover:border-muted-foreground/30"
                >
                  {/* Cabecera de la tarjeta */}
                  <div className="border-b border-border bg-surface-muted px-6 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <h2 className="font-heading text-headline-md font-bold text-foreground">
                          Pedido #{order.id}
                        </h2>
                        <Badge variant={STATUS_BADGE[(order.status || "").toLowerCase()] || "outline"} data-testid={`order-status-${order.id}`}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-6 font-body text-label-md text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatPurchaseDate(order.createdAt)}
                        </span>
                        <span className="hidden sm:block">
                          <span className="mr-1 uppercase tracking-wider">Código:</span>
                          <span className="rounded border border-border bg-surface px-2 py-0.5 font-mono font-medium text-foreground">
                            {authCode(order.id)}
                          </span>
                        </span>
                        <span className="text-right">
                          <span className="block text-[11px] uppercase tracking-wider">Total orden</span>
                          <span className="font-heading text-title-md font-bold text-foreground">
                            {formatCLP(order.total)} CLP
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cuerpo de la tarjeta */}
                  <div className="p-6">
                    {/* Banner de seguimiento */}
                    <div className="mb-6 flex flex-col justify-between gap-4 rounded-xl border border-border bg-surface-muted p-4 md:flex-row md:items-center">
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white shadow-sm ${
                            active ? "bg-emerald-600" : "bg-muted-foreground"
                          }`}
                        >
                          <Check className="h-5 w-5" strokeWidth={2.5} />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-body text-label-md font-bold uppercase tracking-wide text-foreground">
                              Estado:
                            </span>
                            <span
                              className={`rounded px-2 py-0.5 font-body text-label-md font-semibold ${
                                active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {active ? "Pago Aprobado y Boleta Emitida" : "Pedido entregado conforme"}
                            </span>
                          </div>
                          <p className="mt-1 font-body text-label-md text-muted-foreground">
                            {active
                              ? "Preparando despacho para entrega en la dirección registrada en tu cuenta."
                              : "Gracias por tu compra. Puedes descargar la boleta o volver a comprar los productos."}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-start rounded-lg border border-border bg-surface px-3.5 py-2 font-body text-label-md text-muted-foreground md:self-auto">
                        <Clock className="h-4 w-4 text-emerald-600" />
                        <span>
                          {active ? (
                            <>Entrega estimada: <strong className="text-foreground">24 a 48 hrs hábiles</strong></>
                          ) : (
                            <>Entregado <strong className="text-foreground">conforme</strong></>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Ítems del pedido */}
                    <div className="divide-y divide-border">
                      {order.items.map((item) => (
                        <div
                          key={item.productId}
                          data-testid={`order-item-${order.id}-${item.productId}`}
                          className="flex flex-col items-start justify-between gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
                              <Package className="h-8 w-8" strokeWidth={1.5} />
                            </div>
                            <div>
                              <h3 className="font-body text-body-md font-bold text-foreground">
                                {item.quantity} x {item.name}
                              </h3>
                              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                                  SKU: {String(item.productId).padStart(4, "0")}
                                </span>
                                {order.shipping === 0 && (
                                  <span className="font-body text-label-md text-muted-foreground">
                                    • Envío gratis a domicilio
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="sm:text-right">
                            <span className="font-body text-body-md font-bold text-foreground">
                              {formatCLP(item.unitPrice * item.quantity)}
                            </span>
                            <span className="block font-body text-label-md text-muted-foreground">
                              Unitario: {formatCLP(item.unitPrice)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Acciones */}
                    <div className="mt-5 flex flex-wrap items-center justify-end gap-2.5 border-t border-border pt-5">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2 font-body text-label-md font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
                      >
                        <Download className="h-4 w-4 text-muted-foreground" />
                        Descargar Boleta (PDF)
                      </button>
                      {active ? (
                        <Link
                          to={`/pedido/${order.id}`}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-body text-label-md font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                          data-testid={`track-order-${order.id}`}
                        >
                          Seguir despacho
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <Link
                          to="/catalogo"
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-muted px-4 py-2 font-body text-label-md font-bold text-foreground transition-colors hover:bg-border"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Volver a comprar
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Banner de ayuda */}
          <section className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:flex-row">
            <div className="flex items-center gap-4 text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                <LifeBuoy className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-body text-body-md font-bold text-foreground">
                  ¿Tienes dudas o necesitas ayuda con tu compra?
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
        </>
      )}
    </Chrome>
  );
}
