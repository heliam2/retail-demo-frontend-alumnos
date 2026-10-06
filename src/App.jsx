import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Catalog from "./pages/Catalog.jsx";
import Products from "./pages/Products.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Login from "./pages/Login.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import OrderConfirmation from "./pages/OrderConfirmation.jsx";
import Orders from "./pages/Orders.jsx";
import Profile from "./pages/Profile.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import Addresses from "./pages/Addresses.jsx";
import AdminOrders from "./pages/AdminOrders.jsx";

export default function App() {
  const { pathname } = useLocation();
  // Home, catálogo y detalle de producto ya usan Tailwind / design system y
  // traen su propio chrome (StoreHeader/StoreFooter). El resto de las rutas
  // usan los estilos legacy, aislados bajo `.legacy` con el Navbar antiguo.
  const usesNewDesign =
    pathname === "/" ||
    pathname === "/catalogo" ||
    pathname.startsWith("/catalogo/") ||
    pathname === "/cart" ||
    pathname === "/login" ||
    pathname === "/checkout" ||
    pathname === "/orders" ||
    pathname === "/perfil" ||
    pathname === "/wishlist" ||
    pathname === "/addresses" ||
    /^\/pedido\/[^/]+$/.test(pathname) ||
    /^\/products\/[^/]+$/.test(pathname);

  if (usesNewDesign) {
    return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalogo" element={<Catalog />} />
        <Route path="/catalogo/:categoria" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/pedido/:id" element={<OrderConfirmation />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/addresses" element={<Addresses />} />
      </Routes>
    );
  }

  return (
    <div className="legacy">
      <Navbar />
      <Routes>
        <Route path="/admin/orders" element={<AdminOrders />} />
      </Routes>
    </div>
  );
}
