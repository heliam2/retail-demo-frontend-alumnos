import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Trash2, Lock } from "lucide-react";
import api from "../api";
import { useAuth } from "../store.jsx";
import { formatCLP } from "../components/ProductCard.jsx";
import { StoreHeader, StoreFooter } from "../components/StoreLayout.jsx";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function Chrome({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-background font-body text-foreground">
      <StoreHeader />
      <main className="mx-auto flex w-full max-w-container-max flex-grow flex-col gap-6 px-margin-mobile py-8 md:px-margin-desktop">
        {children}
      </main>
      <StoreFooter />
    </div>
  );
}

export default function Cart() {
  const { token, refreshCart } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [quote, setQuote] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getCart(token);
      setItems(data.items);
      await refreshQuote(data.items, "");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Previsualiza los totales (subtotal, envío, IVA, descuento) reutilizando la
  // lógica de pricing del backend. Si el cupón no es válido, mantiene el
  // resumen visible recotizando sin código.
  async function refreshQuote(currentItems, code) {
    if (!currentItems || currentItems.length === 0) {
      setQuote(null);
      return;
    }
    try {
      const q = await api.quote(token, code || undefined);
      setQuote(q);
      setCouponError("");
    } catch (e) {
      setCouponError(e.message);
      try {
        setQuote(await api.quote(token, undefined));
      } catch {
        setQuote(null);
      }
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

  async function updateQty(productId, quantity) {
    setError("");
    try {
      const data = await api.updateCartItem(token, productId, Number(quantity));
      setItems(data.items);
      await refreshCart();
      refreshQuote(data.items, couponCode);
    } catch (e) {
      setError(e.message);
    }
  }

  function stepQty(item, delta) {
    const max = item.product?.stock || 1;
    const next = Math.max(1, Math.min(max, item.quantity + delta));
    if (next !== item.quantity) updateQty(item.productId, next);
  }

  async function remove(productId) {
    setError("");
    try {
      const data = await api.removeCartItem(token, productId);
      setItems(data.items);
      refreshQuote(data.items, couponCode);
    } catch (e) {
      setError(e.message);
    }
  }

  async function applyCoupon(e) {
    e.preventDefault();
    await refreshQuote(items, couponCode);
  }

  const subtotal = quote ? quote.subtotal : items.reduce((sum, i) => sum + i.lineTotal, 0);
  const discount = quote ? quote.discount : 0;
  const tax = quote ? quote.tax : 0;
  const shipping = quote ? quote.shipping : 0;
  const total = quote ? quote.total : subtotal;
  const unitCount = items.reduce((sum, i) => sum + i.quantity, 0);

  if (loading) {
    return (
      <Chrome>
        <p className="font-body text-body-lg text-muted-foreground">Cargando carro...</p>
      </Chrome>
    );
  }

  return (
    <Chrome>
      <h1 className="font-heading text-headline-lg font-bold text-foreground">Tu Carrito</h1>

      {error && (
        <div
          className="rounded-md border border-[#FECACA] bg-[#FEE2E2] px-4 py-3 font-body text-body-md text-[#991B1B]"
          data-testid="cart-error"
        >
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div
          className="rounded-lg border border-border bg-surface px-6 py-12 text-center font-body text-body-lg text-muted-foreground"
          data-testid="cart-empty"
        >
          Tu carro está vacío.{" "}
          <Link to="/catalogo" className="font-semibold text-secondary hover:underline">
            Ir al catálogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Columna izquierda: ítems */}
          <div className="flex flex-col gap-4">
            <div
              className="overflow-hidden rounded-lg border border-border bg-surface"
              data-testid="cart-table"
            >
              {items.map((item, i) => {
                const inStock = (item.product?.stock || 0) > 0;
                return (
                  <div
                    key={item.productId}
                    data-testid={`cart-row-${item.productId}`}
                    className={`flex gap-4 p-4 md:p-5 ${
                      i > 0 ? "border-t border-border" : ""
                    }`}
                  >
                    <img
                      src={item.product?.imageUrl}
                      alt={item.product?.name || ""}
                      className="h-20 w-20 shrink-0 rounded-md border border-border bg-surface-muted object-contain p-1"
                    />

                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-heading text-title-md font-bold text-foreground">
                          {item.product?.name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => remove(item.productId)}
                          aria-label={`Quitar ${item.product?.name || "producto"} del carro`}
                          data-testid={`remove-item-${item.productId}`}
                          className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>

                      <p className="font-body text-body-md text-muted-foreground">
                        Marca: {item.product?.brand || "—"}
                        {item.product?.sku ? ` · Modelo: ${item.product.sku}` : ""}
                      </p>

                      <span>
                        <Badge variant={inStock ? "success" : "danger"}>
                          {inStock ? "Disponible para despacho" : "Sin stock en bodega"}
                        </Badge>
                      </span>

                      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                        <div className="flex items-center rounded-md border border-border">
                          <button
                            type="button"
                            aria-label="Disminuir cantidad"
                            onClick={() => stepQty(item, -1)}
                            disabled={item.quantity <= 1}
                            className="grid h-9 w-9 place-items-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={item.product?.stock}
                            value={item.quantity}
                            onChange={(e) => updateQty(item.productId, e.target.value)}
                            data-testid={`qty-input-${item.productId}`}
                            className="h-9 w-12 border-x border-border bg-transparent text-center font-body text-body-md text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            aria-label="Aumentar cantidad"
                            onClick={() => stepQty(item, 1)}
                            disabled={item.quantity >= (item.product?.stock || 1)}
                            className="grid h-9 w-9 place-items-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <span className="font-heading text-title-md font-bold text-foreground">
                          {formatCLP(item.lineTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Link
              to="/catalogo"
              className="inline-flex w-fit items-center gap-2 font-body text-body-md font-semibold text-secondary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Seguir Comprando
            </Link>
          </div>

          {/* Columna derecha: resumen */}
          <aside
            className="h-fit rounded-lg border border-border bg-surface p-6 lg:sticky lg:top-24"
            data-testid="order-summary"
          >
            <h2 className="font-heading text-headline-md font-bold text-foreground">
              Resumen de Compra
            </h2>

            <form onSubmit={applyCoupon} className="mt-4 flex flex-col gap-2">
              <label
                htmlFor="coupon-input"
                className="font-body text-label-md uppercase tracking-wider text-muted-foreground"
              >
                Código de descuento
              </label>
              <div className="flex gap-2">
                <input
                  id="coupon-input"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Ingresa tu código"
                  data-testid="coupon-input"
                  className="min-w-0 flex-1 rounded-md border border-border bg-surface px-3 py-2 font-body text-body-md text-foreground outline-none focus:border-primary"
                />
                <Button type="submit" variant="outline" data-testid="apply-coupon-btn">
                  Aplicar
                </Button>
              </div>
              {couponError && (
                <p className="font-body text-body-md text-[#991B1B]" data-testid="coupon-error">
                  {couponError}
                </p>
              )}
            </form>

            <hr className="my-4 border-border" />

            <div className="flex flex-col gap-2 font-body text-body-md">
              <div className="flex justify-between" data-testid="cart-subtotal">
                <span className="text-muted-foreground">
                  Subtotal ({unitCount} {unitCount === 1 ? "producto" : "productos"})
                </span>
                <span className="text-foreground">{formatCLP(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Costo de Envío Estimado</span>
                <span className={shipping === 0 ? "font-semibold text-success" : "text-foreground"}>
                  {shipping === 0 ? "Gratis" : formatCLP(shipping)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA (19%)</span>
                <span className="text-foreground">{formatCLP(tax)}</span>
              </div>
              <div className="flex justify-between text-secondary" data-testid="summary-discount">
                <span>Descuento aplicado</span>
                <span>-{formatCLP(discount)}</span>
              </div>
            </div>

            <hr className="my-4 border-border" />

            <div className="flex items-center justify-between">
              <span className="font-heading text-headline-md font-bold text-foreground">Total</span>
              <span
                className="font-heading text-headline-md font-bold text-foreground"
                data-testid="summary-total"
              >
                {formatCLP(total)}
              </span>
            </div>

            <Button
              variant="accent"
              size="lg"
              className="mt-4 w-full"
              onClick={() =>
                navigate("/checkout", {
                  state: { couponCode: quote?.couponApplied || couponCode || undefined },
                })
              }
              data-testid="go-to-checkout"
            >
              <Lock className="h-4 w-4" />
              Ir a Pagar
            </Button>

            <p className="mt-2 text-center font-body text-body-md text-muted-foreground">
              Transacción 100% segura
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              {["Webpay", "Visa", "Mastercard"].map((p) => (
                <span
                  key={p}
                  className="rounded border border-border px-2 py-1 font-body text-label-md font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {p}
                </span>
              ))}
            </div>
          </aside>
        </div>
      )}
    </Chrome>
  );
}
