import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, AlertTriangle, XCircle, Heart } from "lucide-react";
import { formatCLP } from "./ProductCard.jsx";
import { useAuth } from "../store.jsx";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function stockInfo(stock) {
  if (stock === 0) return { variant: "danger", label: "Sin stock", Icon: XCircle };
  if (stock <= 5) return { variant: "warning", label: `Quedan ${stock}`, Icon: AlertTriangle };
  return { variant: "success", label: "Disponible", Icon: CheckCircle2 };
}

export default function ProductTile({ product }) {
  const { variant, label, Icon } = stockInfo(product.stock);
  const outOfStock = product.stock === 0;
  const listPrice = Number(product.listPrice) || 0;
  const onSale = listPrice > product.price;

  const { token, wishlistIds, toggleWishlist } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const saved = wishlistIds.includes(product.id);
  const [busy, setBusy] = useState(false);

  async function handleWishlist() {
    if (!token) {
      navigate("/login", { state: { from: location.pathname + location.search } });
      return;
    }
    setBusy(true);
    try {
      await toggleWishlist(product.id);
    } catch {
      // El store ya revirtió el estado optimista; no bloqueamos la card.
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      data-testid={`product-card-${product.id}`}
      className="group flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.isNew ? (
          <span className="absolute left-3 top-3">
            <Badge variant="new">Nuevo</Badge>
          </span>
        ) : onSale ? (
          <span className="absolute left-3 top-3">
            <Badge variant="promo">Oferta</Badge>
          </span>
        ) : null}
        <button
          type="button"
          onClick={handleWishlist}
          disabled={busy}
          aria-label={saved ? "Quitar de favoritos" : "Agregar a favoritos"}
          aria-pressed={saved}
          data-testid={`toggle-wishlist-${product.id}`}
          className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-surface/80 transition-colors hover:bg-surface disabled:opacity-60 ${
            saved ? "text-rose-500 hover:text-rose-600" : "text-muted-foreground hover:text-primary"
          }`}
        >
          <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
        </button>
      </div>

      <CardContent className="flex flex-1 flex-col p-4">
        <div className="mb-1 font-body text-label-md uppercase tracking-wider text-muted-foreground">
          {product.category}
        </div>
        <CardTitle className="mb-3">{product.name}</CardTitle>

        <div className="mt-auto">
          <div className="mb-2 flex items-baseline gap-2">
            <span className="font-heading text-price-lg text-foreground" data-testid="product-price">
              {formatCLP(product.price)}
            </span>
            {onSale && (
              <span className="font-body text-body-md text-muted-foreground line-through">
                {formatCLP(listPrice)}
              </span>
            )}
          </div>

          <Badge variant={variant} className="mb-4" data-testid="stock-badge">
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Badge>

          {outOfStock ? (
            <Button variant="outline" className="w-full" disabled>
              Agotado
            </Button>
          ) : (
            <Button asChild className="w-full">
              <Link to={`/products/${product.id}`} data-testid={`view-product-${product.id}`}>
                Ver detalle
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
