const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message = data?.error || `Error ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),

  getProfile: (token) => request("/auth/me", { token }),
  updateProfile: (token, payload) => request("/auth/me", { method: "PUT", token, body: payload }),
  changePassword: (token, payload) => request("/auth/password", { method: "PUT", token, body: payload }),

  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products${qs ? `?${qs}` : ""}`);
  },
  getProduct: (id) => request(`/products/${id}`),
  getProductAvailability: (id) => request(`/products/${id}/availability`),

  quoteShipping: (productId, comuna) =>
    request("/shipping/quote", { method: "POST", body: { productId, comuna } }),

  getCart: (token) => request("/cart", { token }),
  addToCart: (token, productId, quantity) => request("/cart/items", { method: "POST", token, body: { productId, quantity } }),
  updateCartItem: (token, productId, quantity) => request(`/cart/items/${productId}`, { method: "PUT", token, body: { quantity } }),
  removeCartItem: (token, productId) => request(`/cart/items/${productId}`, { method: "DELETE", token }),

  quote: (token, couponCode) => request("/orders/quote", { method: "POST", token, body: { couponCode } }),
  checkout: (token, couponCode) => request("/orders/checkout", { method: "POST", token, body: { couponCode } }),
  getOrders: (token) => request("/orders", { token }),
  getOrder: (token, id) => request(`/orders/${id}`, { token }),

  getReviews: (productId) => request(`/reviews/product/${productId}`),
  addReview: (token, productId, rating, comment) => request("/reviews", { method: "POST", token, body: { productId, rating, comment } }),
  deleteReview: (token, id) => request(`/reviews/${id}`, { method: "DELETE", token }),

  getWishlist: (token) => request("/wishlist", { token }),
  addToWishlist: (token, productId) => request("/wishlist/items", { method: "POST", token, body: { productId } }),
  removeFromWishlist: (token, productId) => request(`/wishlist/items/${productId}`, { method: "DELETE", token }),

  getAddresses: (token) => request("/addresses", { token }),
  addAddress: (token, payload) => request("/addresses", { method: "POST", token, body: payload }),
  updateAddress: (token, id, payload) => request(`/addresses/${id}`, { method: "PUT", token, body: payload }),
  deleteAddress: (token, id) => request(`/addresses/${id}`, { method: "DELETE", token }),

  getAdminOrders: (token) => request("/admin/orders", { token }),
  updateOrderStatus: (token, id, status) => request(`/admin/orders/${id}/status`, { method: "PUT", token, body: { status } }),
};

export default api;
