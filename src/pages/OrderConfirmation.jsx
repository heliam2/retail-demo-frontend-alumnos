import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import {
  CheckCircle2,
  Check,
  Calendar,
  MapPin,
  CreditCard,
  Package,
  Download,
  ArrowRight,
  Info,
} from "lucide-react";
import api from "../api";
import { useAuth } from "../store.jsx";
import { formatCLP } from "../components/ProductCard.jsx";
import { StoreHeader, StoreFooter } from "../components/StoreLayout.jsx";

const PAYMENT_LABELS = {
  webpay: "Webpay Plus (Débito / Crédito)",
  transfer: "Transferencia Bancaria",
};

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

export default function OrderConfirmation() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Tras el checkout llegamos con la orden ya cargada en el state de la ruta;
  // al refrescar o entrar directo, la recuperamos por id.
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState("");

  const shipping = location.state?.shipping || null;
  const paymentMethod = location.state?.paymentMethod || "webpay";

  useEffect(() => {
    if (!token) {
      navigate("/login", { state: { from: location.pathname }, replace: true });
      return;
    }
    if (order) return;
    api
      .getOrder(token, id)
      .then((data) => setOrder(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background font-body text-foreground">
        <StoreHeader />
        <main className="mx-auto w-full max-w-4xl flex-grow px-margin-mobile py-16 md:px-margin-desktop">
          <p className="font-body text-body-md text-muted-foreground">Cargando pedido...</p>
        </main>
        <StoreFooter />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col bg-background font-body text-foreground">
        <StoreHeader />
        <main className="mx-auto w-full max-w-4xl flex-grow px-margin-mobile py-16 md:px-margin-desktop">
          <div
            className="rounded-lg border border-[#FECACA] bg-[#FEE2E2] px-4 py-3 font-body text-body-md text-[#991B1B]"
            data-testid="order-confirmation-error"
          >
            {error || "No pudimos encontrar este pedido."}
          </div>
          <Link
            to="/orders"
            className="mt-4 inline-block font-body text-body-md font-semibold text-secondary hover:underline"
          >
            Ver todos mis pedidos
          </Link>
        </main>
        <StoreFooter />
      </div>
    );
  }

  const email = user?.email || "tu correo registrado";

  return (
    <div className="flex min-h-screen flex-col bg-background font-body text-foreground">
      <StoreHeader />

      <main className="flex-grow py-8 md:py-12">
        <div className="mx-auto max-w-4xl px-margin-mobile md:px-margin-desktop">
          {/* Título de sección + estado */}
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <nav aria-label="Breadcrumb" className="mb-1 flex font-body text-label-md text-muted-foreground">
                <ol className="flex items-center gap-2">
                  <li>
                    <Link to="/orders" className="hover:text-foreground">Mi Cuenta</Link>
                  </li>
                  <li><span>/</span></li>
                  <li className="font-semibold text-foreground">Mis Pedidos</li>
                </ol>
              </nav>
              <h1 className="font-heading text-display-md font-bold tracking-tight text-foreground">
                Estado de tu Pedido
              </h1>
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-1 font-body text-label-md font-semibold text-emerald-800">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Transacción Exitosa
            </span>
          </div>

          {/* Banner de éxito */}
          <section
            className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50/90 p-5 shadow-sm sm:p-6"
            data-testid="order-confirmation"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md">
                <Check className="h-6 w-6" strokeWidth={3} />
              </div>
              <div className="flex-1">
                <h2 className="mb-0.5 font-heading text-headline-md font-bold text-emerald-950">
                  ¡Pedido #{order.id} confirmado con éxito!
                </h2>
                <p className="font-body text-body-md leading-relaxed text-emerald-800">
                  Tu pago fue procesado correctamente mediante{" "}
                  {PAYMENT_LABELS[paymentMethod] || "Webpay Plus"}. Hemos emitido tu comprobante
                  electrónico y enviado el detalle íntegro a{" "}
                  <span className="font-semibold underline decoration-emerald-400">{email}</span>.
                </p>
              </div>
            </div>
          </section>

          {/* Tarjeta del pedido */}
          <article
            className="mb-8 overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
            data-testid={`order-${order.id}`}
          >
            {/* Barra superior */}
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-surface-muted px-6 py-4 sm:px-8 sm:py-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-headline-md font-bold tracking-tight text-foreground">
                    Pedido #{order.id}
                  </h3>
                  <span
                    className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-100/90 px-2.5 py-0.5 font-body text-label-md font-semibold text-emerald-800"
                    data-testid="order-status"
                  >
                    {order.status}
                  </span>
                </div>
                <p className="flex items-center gap-1.5 font-body text-body-md text-muted-foreground">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Fecha de compra:{" "}
                    <strong className="font-semibold text-foreground">
                      {formatPurchaseDate(order.createdAt)}
                    </strong>
                  </span>
                </p>
              </div>
              <div className="text-right">
                <span className="block font-body text-label-md font-semibold uppercase tracking-wider text-muted-foreground">
                  Código Autorización
                </span>
                <span className="mt-0.5 inline-block rounded border border-border bg-surface px-2.5 py-1 font-mono text-body-md font-semibold text-foreground">
                  WPY-{String(order.id).padStart(6, "0")}
                </span>
              </div>
            </header>

            {/* Cuerpo */}
            <div className="divide-y divide-border p-6 sm:p-8">
              {/* Productos */}
              <section className="pb-6">
                <h4 className="mb-4 font-body text-label-md font-bold uppercase tracking-wider text-muted-foreground">
                  Productos adquiridos
                </h4>
                <div className="flex flex-col gap-1">
                  {order.items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between gap-4 py-3"
                      data-testid={`order-item-${item.productId}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-border bg-muted p-2 text-muted-foreground sm:h-20 sm:w-20">
                          <Package className="h-9 w-9" strokeWidth={1.5} />
                        </div>
                        <div>
                          <h5 className="font-body text-body-lg font-semibold text-foreground">
                            {item.quantity} x {item.name}
                          </h5>
                          <span className="mt-1 inline-block rounded bg-muted px-2 py-0.5 font-body text-label-md font-medium text-muted-foreground">
                            SKU: {String(item.productId).padStart(4, "0")}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="font-body text-body-lg font-bold text-foreground">
                          {formatCLP(item.unitPrice * item.quantity)}
                        </span>
                        <span className="block font-body text-label-md text-muted-foreground">
                          Unitario: {formatCLP(item.unitPrice)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Entrega y pago */}
              <section className="grid grid-cols-1 gap-6 py-6 md:grid-cols-2">
                <div className="space-y-2 rounded-xl border border-border bg-surface-muted p-4">
                  <div className="flex items-center gap-2 font-body text-body-md font-semibold text-foreground">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    <span>Dirección de Despacho</span>
                  </div>
                  <p className="font-body text-body-md leading-snug text-muted-foreground">
                    {shipping?.recipientName && (
                      <>
                        {shipping.recipientName}
                        <br />
                      </>
                    )}
                    {shipping?.address || "Dirección registrada en tu cuenta"}
                    <br />
                    {[shipping?.comuna, shipping?.region].filter(Boolean).join(", ") ||
                      "Región Metropolitana"}
                  </p>
                  <div className="flex items-center gap-1.5 pt-1 font-body text-label-md font-medium text-muted-foreground">
                    <Info className="h-3.5 w-3.5 text-blue-600" />
                    <span>Envío Express: Entrega estimada en 24 a 48 hrs hábiles.</span>
                  </div>
                </div>

                <div className="space-y-2 rounded-xl border border-border bg-surface-muted p-4">
                  <div className="flex items-center gap-2 font-body text-body-md font-semibold text-foreground">
                    <CreditCard className="h-4 w-4 text-emerald-600" />
                    <span>Método de Pago</span>
                  </div>
                  <div className="flex items-center justify-between font-body text-body-md text-muted-foreground">
                    <span>{PAYMENT_LABELS[paymentMethod] || PAYMENT_LABELS.webpay}</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1 font-body text-label-md font-medium text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Transacción aprobada</span>
                  </div>
                </div>
              </section>

              {/* Resumen de costos */}
              <section className="space-y-2.5 pt-6" data-testid="order-totals">
                <div className="flex justify-between font-body text-body-md text-muted-foreground">
                  <span>Subtotal neto</span>
                  <span>{formatCLP(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between font-body text-body-md text-emerald-700">
                    <span>Descuento{order.couponApplied ? ` (${order.couponApplied})` : ""}</span>
                    <span className="font-semibold">-{formatCLP(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-body text-body-md text-muted-foreground">
                  <span>Envío a domicilio</span>
                  <span className={order.shipping === 0 ? "font-semibold text-emerald-700" : ""}>
                    {order.shipping === 0 ? "Gratis" : formatCLP(order.shipping)}
                  </span>
                </div>
                <div className="flex justify-between font-body text-body-md text-muted-foreground">
                  <span>IVA (19%)</span>
                  <span>{formatCLP(order.tax)}</span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border pt-4">
                  <div>
                    <span className="block font-heading text-headline-md font-bold text-foreground">Total</span>
                    <span className="font-body text-label-md text-muted-foreground">
                      Boleta electrónica emitida
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className="font-heading text-display-md font-bold tracking-tight text-foreground"
                      data-testid="order-total"
                    >
                      {formatCLP(order.total)}
                    </span>
                    <span className="block font-body text-label-md font-medium text-muted-foreground">
                      CLP (Pesos Chilenos)
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </article>

          {/* Acciones post-compra */}
          <div className="flex flex-col items-stretch justify-between gap-4 pt-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-6 py-3.5 font-body text-body-md font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
            >
              <Download className="h-4 w-4 text-muted-foreground" />
              Descargar Boleta (PDF)
            </button>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/orders"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-6 py-3.5 font-body text-body-md font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
                data-testid="view-all-orders-btn"
              >
                Ver todos mis pedidos
              </Link>
              <Link
                to="/catalogo"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-body text-body-md font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary/90"
                data-testid="keep-shopping-btn"
              >
                Seguir comprando
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}
