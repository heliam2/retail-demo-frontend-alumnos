import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Lock, Shield, CreditCard } from "lucide-react";
import api from "../api";
import { useAuth } from "../store.jsx";
import { formatCLP } from "../components/ProductCard.jsx";

const REGIONES = [
  "Región Metropolitana",
  "Valparaíso",
  "Biobío",
  "La Araucanía",
  "Los Lagos",
  "Coquimbo",
  "O'Higgins",
  "Maule",
];

const COMUNAS = {
  "Región Metropolitana": ["Providencia", "Santiago", "Las Condes", "Ñuñoa", "Maipú", "La Florida", "Vitacura", "Peñalolén"],
  "Valparaíso": ["Valparaíso", "Viña del Mar", "Quilpué", "Villa Alemana"],
  "Biobío": ["Concepción", "Talcahuano", "Chillán", "Los Ángeles"],
  "La Araucanía": ["Temuco", "Villarrica", "Pucón", "Angol"],
  "Los Lagos": ["Puerto Montt", "Osorno", "Castro", "Puerto Varas"],
  "Coquimbo": ["La Serena", "Coquimbo", "Ovalle"],
  "O'Higgins": ["Rancagua", "San Fernando", "Santa Cruz"],
  "Maule": ["Talca", "Curicó", "Linares"],
};

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2.5 font-body text-body-md text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary";

const selectClass =
  "w-full rounded-md border border-border bg-background px-3 py-2.5 font-body text-body-md text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary";

// Marca el campo en rojo cuando tiene un error de validación.
const withError = (base, hasError) =>
  hasError
    ? `${base} border-destructive focus:border-destructive focus:ring-destructive`
    : base;

const NAME_RE = /^[\p{L}\s.'-]+$/u;

export default function Checkout() {
  const { token, refreshCart } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [couponCode, setCouponCode] = useState(location.state?.couponCode || "");
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  const [recipientName, setRecipientName] = useState("");
  const [address, setAddress] = useState("");
  const [region, setRegion] = useState("Región Metropolitana");
  const [comuna, setComuna] = useState("Providencia");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  function clearFieldError(...fields) {
    setFieldErrors((prev) => {
      if (!fields.some((f) => prev[f])) return prev;
      const next = { ...prev };
      fields.forEach((f) => delete next[f]);
      return next;
    });
  }

  function validateCheckout() {
    const errors = {};

    const name = recipientName.trim();
    if (!name) errors.recipientName = "Ingresa el nombre del destinatario.";
    else if (name.length < 3) errors.recipientName = "El nombre debe tener al menos 3 caracteres.";
    else if (!NAME_RE.test(name)) errors.recipientName = "El nombre solo puede contener letras.";

    const addr = address.trim();
    if (!addr) errors.address = "Ingresa la dirección de entrega.";
    else if (addr.length < 5) errors.address = "La dirección es demasiado corta.";
    else if (!/\d/.test(addr)) errors.address = "Incluye el número de la calle.";

    if (!REGIONES.includes(region)) errors.region = "Selecciona una región.";
    if (!comuna || !(COMUNAS[region] || []).includes(comuna))
      errors.comuna = "Selecciona una comuna válida.";

    if (!["webpay", "transfer"].includes(paymentMethod))
      errors.paymentMethod = "Selecciona un método de pago.";

    return errors;
  }

  async function fetchQuote(code) {
    setError("");
    try {
      const data = await api.quote(token, code || undefined);
      setQuote(data);
    } catch (e) {
      setError(e.message);
      setQuote(null);
    }
  }

  useEffect(() => {
    if (!token) {
      navigate("/login", { state: { from: location.pathname + location.search }, replace: true });
      return;
    }
    fetchQuote(location.state?.couponCode || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function applyCoupon(e) {
    e.preventDefault();
    await fetchQuote(couponCode);
  }

  async function confirmPurchase() {
    const errors = validateCheckout();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("Revisa la información marcada antes de finalizar la compra.");
      const selectors = {
        recipientName: '[data-testid="recipient-name-input"]',
        address: '[data-testid="address-input"]',
        region: '[data-testid="region-select"]',
        comuna: '[data-testid="comuna-select"]',
        paymentMethod: '[data-testid="payment-webpay"]',
      };
      const firstKey = ["recipientName", "address", "region", "comuna", "paymentMethod"].find(
        (k) => errors[k]
      );
      document.querySelector(selectors[firstKey])?.focus();
      return;
    }

    setProcessing(true);
    setError("");
    try {
      const order = await api.checkout(token, couponCode || undefined);
      await refreshCart();
      navigate(`/pedido/${order.id}`, {
        state: {
          order,
          paymentMethod,
          shipping: { recipientName, address, region, comuna },
        },
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setProcessing(false);
    }
  }

  function handleRegionChange(e) {
    const r = e.target.value;
    setRegion(r);
    setComuna(COMUNAS[r]?.[0] || "");
    clearFieldError("region", "comuna");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-body text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-surface">
        <div className="mx-auto flex max-w-container-max items-center justify-between px-margin-mobile py-4 md:px-margin-desktop">
          <Link
            to="/"
            className="font-heading text-headline-lg font-bold text-primary"
          >
            ChileRetail
          </Link>
          <div className="flex items-center gap-2 font-body text-label-md font-semibold uppercase tracking-wider text-muted-foreground">
            <Lock className="h-4 w-4" />
            Pago Seguro
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-container-max flex-grow px-margin-mobile py-10 md:px-margin-desktop">
        <h1 className="mb-8 font-heading text-display-md font-bold text-foreground">Checkout</h1>

        {error && (
          <div
            className="mb-6 rounded-md border border-[#FECACA] bg-[#FEE2E2] px-4 py-3 font-body text-body-md text-[#991B1B]"
            data-testid="checkout-error"
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
          {/* Left column — steps */}
          <div className="flex flex-col gap-6">
            {/* Step 1: Shipping info */}
            <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
              <div className="border-l-4 border-l-primary p-6">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-body text-label-md font-bold text-white">
                    1
                  </span>
                  <h2 className="font-heading text-headline-md font-semibold text-foreground">
                    Información de Envío
                  </h2>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="mb-1 block font-body text-label-md text-muted-foreground">
                      Nombre del destinatario
                    </label>
                    <input
                      className={withError(inputClass, fieldErrors.recipientName)}
                      placeholder="Ej: Juan Pérez"
                      value={recipientName}
                      onChange={(e) => {
                        setRecipientName(e.target.value);
                        clearFieldError("recipientName");
                      }}
                      aria-invalid={!!fieldErrors.recipientName}
                      data-testid="recipient-name-input"
                    />
                    {fieldErrors.recipientName && (
                      <p
                        className="mt-1 font-body text-label-md text-destructive"
                        data-testid="recipient-name-error"
                      >
                        {fieldErrors.recipientName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block font-body text-label-md text-muted-foreground">
                      Dirección de entrega
                    </label>
                    <input
                      className={withError(inputClass, fieldErrors.address)}
                      placeholder="Calle, número, depto"
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        clearFieldError("address");
                      }}
                      aria-invalid={!!fieldErrors.address}
                      data-testid="address-input"
                    />
                    {fieldErrors.address && (
                      <p
                        className="mt-1 font-body text-label-md text-destructive"
                        data-testid="address-error"
                      >
                        {fieldErrors.address}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block font-body text-label-md text-muted-foreground">
                        Región
                      </label>
                      <select
                        className={withError(selectClass, fieldErrors.region)}
                        value={region}
                        onChange={handleRegionChange}
                        aria-invalid={!!fieldErrors.region}
                        data-testid="region-select"
                      >
                        {REGIONES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      {fieldErrors.region && (
                        <p
                          className="mt-1 font-body text-label-md text-destructive"
                          data-testid="region-error"
                        >
                          {fieldErrors.region}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block font-body text-label-md text-muted-foreground">
                        Comuna
                      </label>
                      <select
                        className={withError(selectClass, fieldErrors.comuna)}
                        value={comuna}
                        onChange={(e) => {
                          setComuna(e.target.value);
                          clearFieldError("comuna");
                        }}
                        aria-invalid={!!fieldErrors.comuna}
                        data-testid="comuna-select"
                      >
                        {(COMUNAS[region] || []).map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      {fieldErrors.comuna && (
                        <p
                          className="mt-1 font-body text-label-md text-destructive"
                          data-testid="comuna-error"
                        >
                          {fieldErrors.comuna}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Payment method */}
            <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
              <div className="border-l-4 border-l-primary p-6">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-body text-label-md font-bold text-white">
                    2
                  </span>
                  <h2 className="font-heading text-headline-md font-semibold text-foreground">
                    Método de Pago
                  </h2>
                </div>

                <div className="flex flex-col gap-3">
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                      paymentMethod === "webpay"
                        ? "border-primary bg-primary/5"
                        : fieldErrors.paymentMethod
                        ? "border-destructive bg-background hover:bg-muted"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="webpay"
                      checked={paymentMethod === "webpay"}
                      onChange={() => {
                        setPaymentMethod("webpay");
                        clearFieldError("paymentMethod");
                      }}
                      className="mt-0.5 accent-[#0F172A]"
                      data-testid="payment-webpay"
                    />
                    <div>
                      <p className="font-body text-body-md font-semibold text-foreground">Webpay Plus</p>
                      <p className="mt-0.5 font-body text-label-md text-muted-foreground">
                        Tarjetas de crédito y débito bancarias
                      </p>
                      <div className="mt-2 flex gap-2">
                        {["VISA", "Mastercard", "Redcompra"].map((card) => (
                          <span
                            key={card}
                            className="rounded border border-border bg-surface px-2 py-0.5 font-body text-label-md text-muted-foreground"
                          >
                            {card}
                          </span>
                        ))}
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                      paymentMethod === "transfer"
                        ? "border-primary bg-primary/5"
                        : fieldErrors.paymentMethod
                        ? "border-destructive bg-background hover:bg-muted"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="transfer"
                      checked={paymentMethod === "transfer"}
                      onChange={() => {
                        setPaymentMethod("transfer");
                        clearFieldError("paymentMethod");
                      }}
                      className="mt-0.5 accent-[#0F172A]"
                      data-testid="payment-transfer"
                    />
                    <div>
                      <p className="font-body text-body-md font-semibold text-foreground">
                        Transferencia Bancaria
                      </p>
                      <p className="mt-0.5 font-body text-label-md text-muted-foreground">
                        Transfiere directamente desde tu banco. (Demora 24hrs en confirmar)
                      </p>
                    </div>
                  </label>

                  {fieldErrors.paymentMethod && (
                    <p
                      className="font-body text-label-md text-destructive"
                      data-testid="payment-error"
                    >
                      {fieldErrors.paymentMethod}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right column — order summary */}
          <div>
            <div
              className="sticky top-24 rounded-lg border border-border bg-surface p-6 shadow-sm"
              data-testid="order-summary"
            >
              <h2 className="mb-4 font-heading text-headline-md font-semibold text-foreground">
                Resumen del pedido
              </h2>

              {/* Coupon */}
              <form onSubmit={applyCoupon} className="mb-5 flex gap-2">
                <input
                  placeholder="Código de cupón (opcional)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 font-body text-body-md text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                  data-testid="coupon-input"
                />
                <button
                  type="submit"
                  className="rounded-md border border-border bg-surface px-4 py-2 font-body text-body-md font-medium text-foreground transition-colors hover:bg-muted"
                  data-testid="apply-coupon-btn"
                >
                  Aplicar
                </button>
              </form>

              {/* Totals */}
              {quote ? (
                <>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between font-body text-body-md text-foreground">
                      <span>Subtotal</span>
                      <span>{formatCLP(quote.subtotal)}</span>
                    </div>

                    {quote.discount > 0 && (
                      <div
                        className="flex justify-between font-body text-body-md text-secondary"
                        data-testid="summary-discount"
                      >
                        <span>Descuento ({quote.couponApplied})</span>
                        <span>-{formatCLP(quote.discount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between font-body text-body-md text-foreground">
                      <span>IVA (19%)</span>
                      <span>{formatCLP(quote.tax)}</span>
                    </div>

                    <div className="flex justify-between font-body text-body-md text-foreground">
                      <span>Envío</span>
                      <span className="font-medium">
                        {quote.shipping === 0 ? "Gratis" : formatCLP(quote.shipping)}
                      </span>
                    </div>

                    <div
                      className="mt-1 flex justify-between border-t border-border pt-3 font-heading text-headline-md font-bold text-foreground"
                      data-testid="summary-total"
                    >
                      <span>Total</span>
                      <span>{formatCLP(quote.total)}</span>
                    </div>
                  </div>

                  <button
                    onClick={confirmPurchase}
                    disabled={processing}
                    className="mt-5 w-full rounded-lg bg-secondary py-3.5 font-heading text-body-md font-bold text-secondary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                    data-testid="confirm-purchase-btn"
                  >
                    {processing ? "Procesando..." : "Finalizar Compra"}
                  </button>

                  <div className="mt-4 flex flex-col items-center gap-1.5">
                    <div className="flex gap-4 text-muted-foreground">
                      <Shield className="h-5 w-5" />
                      <Lock className="h-5 w-5" />
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <p className="font-body text-label-md text-muted-foreground">
                      Transacción 100% segura
                    </p>
                  </div>
                </>
              ) : (
                <p className="font-body text-body-md text-muted-foreground">Cargando resumen...</p>
              )}
            </div>

            {/* Bank transfer details */}
            {paymentMethod === "transfer" && (
              <div className="mt-4 rounded-lg border border-border bg-[#FFFBEB] p-5" data-testid="transfer-details">
                <h3 className="mb-3 font-heading text-title-md font-semibold text-foreground">
                  Datos para la transferencia
                </h3>
                <div className="flex flex-col gap-2">
                  {[
                    ["Banco", "Banco de Chile"],
                    ["Tipo de cuenta", "Cuenta Corriente"],
                    ["Número de cuenta", "00-123-45678-9"],
                    ["Titular", "ChileRetail SpA"],
                    ["RUT", "76.123.456-7"],
                    ["Email", "ventas@chileretail.cl"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <span className="font-body text-label-md text-muted-foreground">{label}</span>
                      <span className="font-body text-body-md font-medium text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 rounded-md bg-[#FEF3C7] px-3 py-2.5 font-body text-label-md text-[#92400E]">
                  Una vez realizada la transferencia, envía el comprobante a{" "}
                  <span className="font-semibold">ventas@chileretail.cl</span> indicando tu número de
                  pedido. Tu orden será confirmada dentro de 24 horas hábiles.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-container-max flex-wrap items-center justify-between gap-4 px-margin-mobile py-6 md:px-margin-desktop">
          <span className="font-heading text-headline-md font-bold text-primary">ChileRetail</span>
          <div className="flex gap-6 font-body text-body-md text-muted-foreground">
            <a href="#" className="transition-colors hover:text-foreground">Privacidad</a>
            <a href="#" className="transition-colors hover:text-foreground">Términos y Condiciones</a>
            <a href="#" className="transition-colors hover:text-foreground">Ayuda</a>
          </div>
          <p className="font-body text-label-md text-muted-foreground">
            © 2024 ChileRetail. Todos los derechos reservados. Transacciones seguras vía Webpay.
          </p>
        </div>
      </footer>
    </div>
  );
}
