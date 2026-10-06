import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("qa_retail_token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("qa_retail_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [cartCount, setCartCount] = useState(0);
  const [wishlistIds, setWishlistIds] = useState([]);

  const refreshCart = useCallback(async () => {
    if (!token) {
      setCartCount(0);
      return;
    }
    try {
      const data = await api.getCart(token);
      setCartCount(data.items.reduce((sum, i) => sum + i.quantity, 0));
    } catch {
      setCartCount(0);
    }
  }, [token]);

  const refreshWishlist = useCallback(async () => {
    if (!token) {
      setWishlistIds([]);
      return;
    }
    try {
      const data = await api.getWishlist(token);
      setWishlistIds(data.items.map((p) => p.id));
    } catch {
      setWishlistIds([]);
    }
  }, [token]);

  // Alterna un producto en favoritos de forma optimista y revierte si la API falla.
  const toggleWishlist = useCallback(
    async (productId) => {
      if (!token) return false;
      const wasSaved = wishlistIds.includes(productId);
      setWishlistIds((prev) =>
        wasSaved ? prev.filter((id) => id !== productId) : [...prev, productId],
      );
      try {
        if (wasSaved) {
          await api.removeFromWishlist(token, productId);
        } else {
          await api.addToWishlist(token, productId);
        }
        return !wasSaved;
      } catch (err) {
        setWishlistIds((prev) =>
          wasSaved ? [...prev, productId] : prev.filter((id) => id !== productId),
        );
        throw err;
      }
    },
    [token, wishlistIds],
  );

  useEffect(() => {
    refreshCart();
    refreshWishlist();
  }, [refreshCart, refreshWishlist]);

  function login(nextToken, nextUser) {
    localStorage.setItem("qa_retail_token", nextToken);
    localStorage.setItem("qa_retail_user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }

  function logout() {
    localStorage.removeItem("qa_retail_token");
    localStorage.removeItem("qa_retail_user");
    setToken(null);
    setUser(null);
    setCartCount(0);
    setWishlistIds([]);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        cartCount,
        refreshCart,
        wishlistIds,
        refreshWishlist,
        toggleWishlist,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
