import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import {
  ChevronRight,
  Star,
  CreditCard,
  Truck,
  Store,
  ShieldCheck,
  RotateCcw,
  Headphones,
  Minus,
  Plus,
  Heart,
  Play,
} from "lucide-react";
import api from "../api";
import { useAuth } from "../store.jsx";
import { formatCLP } from "../components/ProductCard.jsx";
import { StoreHeader, StoreFooter } from "../components/StoreLayout.jsx";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Fallback: si un producto no trae `listPrice`, se deriva con esta tasa.
const FALLBACK_DISCOUNT_RATE = 0.3;
const FALLBACK_INSTALLMENTS = 12;

function Stars({ value = 0 }) {
  return (
    <span className="inline-flex items-center" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className="relative inline-block h-4 w-4">
            <Star className="absolute inset-0 h-4 w-4 text-border" fill="currentColor" />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star className="h-4 w-4 text-secondary" fill="currentColor" />
            </span>
          </span>
        );
      })}
    </span>
  );
}

function alertClasses(type) {
  return type === "success"
    ? "bg-[#DCFCE7] text-[#166534]"
    : "bg-[#FEE2E2] text-[#991B1B]";
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, refreshCart, refreshWishlist } = useAuth();

  // Ruta actual, para volver aquí tras iniciar sesión.
  const here = location.pathname + location.search;
  const reviewDraftKey = `reviewDraft:${id}`;

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState(null);
  const [activeImg, setActiveImg] = useState(0);

  // Disponibilidad por tienda y cotización de despacho (endpoints nuevos).
  const [availability, setAvailability] = useState([]);
  const [comuna, setComuna] = useState("");
  const [shipping, setShipping] = useState(null);
  const [shippingState, setShippingState] = useState({ loading: false, error: "" });

  const [reviews, setReviews] = useState({ reviews: [], average: null, count: 0 });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewMessage, setReviewMessage] = useState(null);
  const [wishlistMessage, setWishlistMessage] = useState(null);

  useEffect(() => {
    api.getProduct(id).then(setProduct).catch(() => setProduct(null));
    api.getProductAvailability(id).then(setAvailability).catch(() => setAvailability([]));
    setActiveImg(0);
    setShipping(null);
    setShippingState({ loading: false, error: "" });
    loadReviews();
    // Rehidratar el borrador de reseña si el usuario venía de iniciar sesión.
    try {
      const saved = JSON.parse(sessionStorage.getItem(reviewDraftKey) || "null");
      if (saved) {
        if (saved.rating) setRating(saved.rating);
        if (saved.comment) setComment(saved.comment);
        sessionStorage.removeItem(reviewDraftKey);
      }
    } catch {
      // ignorar borrador corrupto
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function loadReviews() {
    api.getReviews(id).then(setReviews).catch(() => {});
  }

  async function handleQuoteShipping(e) {
    e.preventDefault();
    const c = comuna.trim();
    if (!c) return;
    setShippingState({ loading: true, error: "" });
    setShipping(null);
    try {
      const quote = await api.quoteShipping(Number(id), c);
      setShipping(quote);
      setShippingState({ loading: false, error: "" });
    } catch (err) {
      setShippingState({ loading: false, error: err.message });
    }
  }

  function changeQty(delta) {
    const current = Number(quantity) || 1;
    const max = product?.stock || 1;
    setQuantity(String(Math.max(1, Math.min(max, current + delta))));
  }

  async function handleSubmitReview(e) {
    e.preventDefault();
    if (!token) {
      // Guardar el borrador y volver a esta página tras el login.
      try {
        sessionStorage.setItem(reviewDraftKey, JSON.stringify({ rating, comment }));
      } catch {
        // sessionStorage no disponible: se pierde el borrador, no el flujo
      }
      navigate("/login", { state: { from: here } });
      return;
    }
    setReviewMessage(null);
    try {
      await api.addReview(token, Number(id), Number(rating), comment);
      setComment("");
      loadReviews();
      setReviewMessage({ type: "success", text: "Reseña publicada" });
    } catch (e) {
      setReviewMessage({ type: "error", text: e.message });
    }
  }

  async function handleAddToWishlist() {
    if (!token) {
      navigate("/login", { state: { from: here } });
      return;
    }
    setWishlistMessage(null);
    try {
      await api.addToWishlist(token, product.id);
      await refreshWishlist();
      setWishlistMessage({ type: "success", text: "Agregado a favoritos" });
    } catch (e) {
      setWishlistMessage({ type: "error", text: e.message });
    }
  }

  async function handleAddToCart() {
    if (!token) {
      navigate("/login", { state: { from: here } });
      return;
    }
    setMessage(null);
    try {
      await api.addToCart(token, product.id, Number(quantity));
      await refreshCart();
      setMessage({ type: "success", text: "Producto agregado al carro" });
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    }
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col bg-background font-body text-foreground">
        <StoreHeader />
        <main className="mx-auto w-full max-w-container-max flex-grow px-margin-mobile py-16 md:px-margin-desktop">
          <p className="font-body text-body-lg text-muted-foreground">Producto no encontrado.</p>
          <Link
            to="/"
            className="mt-4 inline-block font-body text-body-md font-semibold text-secondary hover:underline"
          >
            &larr; Volver al inicio
          </Link>
        </main>
        <StoreFooter />
      </div>
    );
  }

  const listPrice =
    Number(product.listPrice) > product.price
      ? Number(product.listPrice)
      : Math.round(product.price / (1 - FALLBACK_DISCOUNT_RATE) / 10) * 10;
  const onSale = listPrice > product.price;
  const discountPct = onSale ? Math.round((1 - product.price / listPrice) * 100) : 0;
  const installmentCount = product.installments?.count || FALLBACK_INSTALLMENTS;
  const installmentInterestFree = product.installments?.interestFree ?? true;
  const installment = Math.round(product.price / installmentCount);
  const avg = reviews.average ?? 0;
  const count = reviews.count ?? 0;
  const images =
    Array.isArray(product.images) && product.images.length
      ? product.images
      : [product.imageUrl];
  const inStores = availability.filter((s) => s.qty > 0);

  return (
    <div className="flex min-h-screen flex-col bg-background font-body text-foreground">
      <StoreHeader />

      <main className="mx-auto flex w-full max-w-container-max flex-grow flex-col gap-6 px-margin-mobile py-6 md:px-margin-desktop">
        {/* Breadcrumbs */}
        <nav
          aria-label="Miga de pan"
          className="flex flex-wrap items-center gap-1 font-body text-body-md text-muted-foreground"
        >
          <Link to="/" className="text-secondary hover:underline">
            Inicio
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link to={`/catalogo/${product.category}`} className="text-secondary hover:underline">
            {product.category}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div
          className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]"
          data-testid="product-detail"
        >
          {/* Galería */}
          <div className="flex gap-4">
            <div className="hidden flex-col gap-3 sm:flex">
              {images.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  aria-label={`Ver imagen ${i + 1}`}
                  className={`h-16 w-16 overflow-hidden rounded-md border bg-surface p-1 transition-colors ${
                    activeImg === i
                      ? "border-primary"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-contain" />
                </button>
              ))}
              {product.videoUrl && (
                <span className="grid h-16 w-16 place-items-center rounded-md border border-border bg-surface text-muted-foreground">
                  <Play className="h-5 w-5" />
                </span>
              )}
            </div>

            <div className="relative flex flex-1 items-center justify-center rounded-lg border border-border bg-surface p-6">
              {product.isNew ? (
                <span className="absolute left-4 top-4">
                  <Badge variant="new">Nuevo</Badge>
                </span>
              ) : onSale ? (
                <span className="absolute left-4 top-4">
                  <Badge variant="promo">Oferta</Badge>
                </span>
              ) : null}
              <img
                src={images[activeImg] || product.imageUrl}
                alt={product.name}
                className="max-h-[420px] w-auto object-contain"
              />
            </div>
          </div>

          {/* Columna de compra */}
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <span className="font-body text-label-md uppercase tracking-wider text-muted-foreground">
                {product.category}
              </span>
              <h1
                className="font-heading text-headline-lg font-bold text-foreground"
                data-testid="detail-name"
              >
                {product.name}
              </h1>
              <div className="flex items-center gap-2">
                <Stars value={avg} />
                <span className="font-body text-body-md text-muted-foreground">
                  ({count} {count === 1 ? "reseña" : "reseñas"})
                </span>
              </div>
              {product.description && (
                <p className="font-body text-body-md text-muted-foreground">
                  {product.description}
                </p>
              )}
            </div>

            {/* Tarjeta de precio / compra */}
            <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5">
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className="font-heading text-display-md font-bold text-foreground"
                    data-testid="detail-price"
                  >
                    {formatCLP(product.price)}
                  </span>
                  {onSale && (
                    <>
                      <span className="font-body text-body-md text-muted-foreground line-through">
                        {formatCLP(listPrice)}
                      </span>
                      <Badge className="bg-secondary text-white">-{discountPct}%</Badge>
                    </>
                  )}
                </div>
                <p className="flex items-center gap-2 font-body text-body-md text-secondary">
                  <CreditCard className="h-4 w-4" />
                  Hasta {installmentCount} cuotas{installmentInterestFree ? " sin interés" : ""} de {formatCLP(installment)}
                </p>
              </div>

              <hr className="border-border" />

              <div className="flex flex-col gap-4">
                <div className="flex gap-3">
                  <Truck className="h-5 w-5 shrink-0 text-foreground" />
                  <div className="flex-1 font-body text-body-md">
                    <p className="font-semibold text-foreground">Despacho a domicilio</p>
                    <form onSubmit={handleQuoteShipping} className="mt-1.5 flex gap-2">
                      <input
                        type="text"
                        value={comuna}
                        onChange={(e) => setComuna(e.target.value)}
                        placeholder="Tu comuna"
                        aria-label="Comuna"
                        data-testid="shipping-comuna-input"
                        className="min-w-0 flex-1 rounded-md border border-border bg-surface px-3 py-2 text-body-md text-foreground outline-none focus:border-primary"
                      />
                      <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        disabled={shippingState.loading || !comuna.trim()}
                        data-testid="shipping-quote-btn"
                      >
                        {shippingState.loading ? "..." : "Calcular"}
                      </Button>
                    </form>
                    {shipping && (
                      <p className="mt-1.5 text-muted-foreground" data-testid="shipping-result">
                        <span className="font-semibold text-foreground">{shipping.etaLabel}</span>
                        {" · "}
                        {shipping.cost === 0 ? "envío gratis" : formatCLP(shipping.cost)}
                      </p>
                    )}
                    {shippingState.error && (
                      <p className="mt-1.5 text-[#991B1B]" data-testid="shipping-error">
                        {shippingState.error}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Store className="h-5 w-5 shrink-0 text-foreground" />
                  <div className="font-body text-body-md" data-testid="store-availability">
                    <p className="font-semibold text-foreground">Retiro en tienda</p>
                    {inStores.length > 0 ? (
                      <ul className="mt-1 flex flex-col gap-1">
                        {inStores.map((s) => (
                          <li key={s.storeId} className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="inline-block h-2 w-2 rounded-full bg-success" />
                            {s.storeName}
                            <span className="text-foreground">({s.qty})</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                        <span className="inline-block h-2 w-2 rounded-full bg-border" />
                        Sin stock en tiendas
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <hr className="border-border" />

              <span
                className="font-body text-body-md text-muted-foreground"
                data-testid="detail-stock"
              >
                {product.stock > 0 ? `${product.stock} disponibles` : "Sin stock"}
              </span>

              {message && (
                <div
                  className={`rounded-md px-3 py-2 font-body text-body-md ${alertClasses(message.type)}`}
                  data-testid="add-to-cart-message"
                >
                  {message.text}
                </div>
              )}

              <div className="flex gap-3">
                <div className="flex items-center rounded-md border border-border">
                  <button
                    type="button"
                    aria-label="Disminuir cantidad"
                    onClick={() => changeQty(-1)}
                    disabled={Number(quantity) <= 1}
                    className="grid h-11 w-11 place-items-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={product.stock}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    data-testid="quantity-input"
                    className="h-11 w-12 border-x border-border bg-transparent text-center font-body text-body-md text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    aria-label="Aumentar cantidad"
                    onClick={() => changeQty(1)}
                    disabled={Number(quantity) >= product.stock}
                    className="grid h-11 w-11 place-items-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  data-testid="add-to-cart-btn"
                  variant="accent"
                  size="lg"
                  className="flex-1"
                >
                  {product.stock === 0 ? "Sin stock" : "Comprar"}
                </Button>
              </div>

              <Button
                onClick={handleAddToWishlist}
                data-testid="add-to-wishlist-btn"
                variant="outline"
                className="w-full"
              >
                <Heart className="h-4 w-4" />
                Agregar a favoritos
              </Button>
              {wishlistMessage && (
                <div
                  className={`rounded-md px-3 py-2 font-body text-body-md ${alertClasses(wishlistMessage.type)}`}
                  data-testid="wishlist-message"
                >
                  {wishlistMessage.text}
                </div>
              )}
            </div>

            {/* Garantía / Devolución / Soporte */}
            <div className="grid grid-cols-3 divide-x divide-border rounded-lg border border-border bg-surface text-center">
              {[
                {
                  Icon: ShieldCheck,
                  t: "Garantía",
                  s: product.warrantyMonths
                    ? `${product.warrantyMonths} meses`
                    : "1 año",
                },
                {
                  Icon: RotateCcw,
                  t: "Devolución",
                  s: `${product.returnDays || 30} días`,
                },
                { Icon: Headphones, t: "Soporte", s: "24/7" },
              ].map(({ Icon, t, s }) => (
                <div key={t} className="flex flex-col items-center gap-1 px-2 py-4">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-body text-body-md font-semibold text-foreground">{t}</span>
                  <span className="font-body text-body-md text-muted-foreground">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reseñas */}
        <section
          className="flex max-w-3xl flex-col gap-4 rounded-lg border border-border bg-surface p-6"
          data-testid="reviews-section"
        >
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-heading text-headline-md font-bold text-foreground">Reseñas</h2>
            {reviews.average != null && (
              <span className="flex items-center gap-2 font-body text-body-md text-muted-foreground">
                <Stars value={reviews.average} />
                <span data-testid="reviews-average">
                  — {reviews.average.toFixed(1)} / 5 ({reviews.count})
                </span>
              </span>
            )}
          </div>

          {reviews.reviews.length === 0 && (
            <p
              className="font-body text-body-md text-muted-foreground"
              data-testid="reviews-empty"
            >
              Aún no hay reseñas para este producto.
            </p>
          )}

          <ul className="flex flex-col gap-3" data-testid="reviews-list">
            {reviews.reviews.map((r) => (
              <li
                key={r.id}
                data-testid={`review-${r.id}`}
                className="border-b border-border pb-3 font-body text-body-md text-foreground last:border-none last:pb-0"
              >
                <span className="font-semibold">{r.rating}/5</span> — {r.userName}
                {r.comment ? `: ${r.comment}` : ""}
              </li>
            ))}
          </ul>

          <form
            onSubmit={handleSubmitReview}
            className="flex flex-col gap-3 border-t border-border pt-4"
          >
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              data-testid="review-rating-select"
              className="w-full max-w-xs rounded-md border border-border bg-surface px-3 py-2 font-body text-body-md text-foreground"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} estrella{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
            <input
              placeholder="Comentario (opcional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              data-testid="review-comment-input"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 font-body text-body-md text-foreground outline-none focus:border-primary"
            />
            {reviewMessage && (
              <div
                className={`rounded-md px-3 py-2 font-body text-body-md ${alertClasses(reviewMessage.type)}`}
                data-testid="review-message"
              >
                {reviewMessage.text}
              </div>
            )}
            <Button type="submit" data-testid="submit-review-btn" className="w-fit">
              Publicar reseña
            </Button>
          </form>
        </section>
      </main>

      <StoreFooter />
    </div>
  );
}
