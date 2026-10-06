import React from "react";
import { Link } from "react-router-dom";

function formatCLP(value) {
  return value.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
}

function stockBadge(stock) {
  if (stock === 0) return <span className="badge out" data-testid="stock-badge">Sin stock</span>;
  if (stock <= 5) return <span className="badge low" data-testid="stock-badge">Quedan {stock}</span>;
  return <span className="badge in" data-testid="stock-badge">Disponible</span>;
}

export default function ProductCard({ product }) {
  return (
    <div className="card" data-testid={`product-card-${product.id}`}>
      <img src={product.imageUrl} alt={product.name} />
      <strong>{product.name}</strong>
      <span className="price" data-testid="product-price">{formatCLP(product.price)}</span>
      {stockBadge(product.stock)}
      <Link to={`/products/${product.id}`} className="btn" data-testid={`view-product-${product.id}`}>
        Ver detalle
      </Link>
    </div>
  );
}

export { formatCLP };
