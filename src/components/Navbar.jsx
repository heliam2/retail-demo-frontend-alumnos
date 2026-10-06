import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store.jsx";

export default function Navbar() {
  const { user, logout, cartCount } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="navbar">
      <Link to="/" className="brand" data-testid="nav-brand">QA Retail Store</Link>
      <nav>
        <Link to="/" data-testid="nav-products">Productos</Link>
        {user && (
          <Link to="/cart" data-testid="nav-cart">
            Carro
            <span className="cart-badge" data-testid="cart-count">{cartCount}</span>
          </Link>
        )}
        {user && <Link to="/orders" data-testid="nav-orders">Mis pedidos</Link>}
        {user && <Link to="/wishlist" data-testid="nav-wishlist">Favoritos</Link>}
        {user && <Link to="/addresses" data-testid="nav-addresses">Direcciones</Link>}
        {user && user.role === "admin" && (
          <Link to="/admin/orders" data-testid="nav-admin-orders">Admin pedidos</Link>
        )}
        {user ? (
          <>
            <span data-testid="nav-username">Hola, {user.name}</span>
            <a href="#" onClick={handleLogout} data-testid="nav-logout">Salir</a>
          </>
        ) : (
          <Link to="/login" data-testid="nav-login">Ingresar</Link>
        )}
      </nav>
    </header>
  );
}
