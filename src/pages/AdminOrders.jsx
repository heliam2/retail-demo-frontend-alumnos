import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api";
import { useAuth } from "../store.jsx";
import { formatCLP } from "../components/ProductCard.jsx";

const STATUS_OPTIONS = ["pagado", "enviado", "entregado", "cancelado"];

export default function AdminOrders() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api.getAdminOrders(token);
      setOrders(data.slice().reverse());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
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

  async function changeStatus(id, status) {
    setError("");
    try {
      await api.updateOrderStatus(token, id, status);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  if (user && user.role !== "admin") {
    return (
      <div className="container">
        <div className="alert error" data-testid="admin-forbidden">Esta seccion es solo para administradores.</div>
      </div>
    );
  }

  if (loading) return <div className="container"><p>Cargando pedidos...</p></div>;

  return (
    <div className="container">
      <h1 className="page-title">Administracion de pedidos</h1>
      {error && <div className="alert error" data-testid="admin-orders-error">{error}</div>}

      <table data-testid="admin-orders-table">
        <thead>
          <tr><th>ID</th><th>Usuario</th><th>Total</th><th>Estado</th><th>Cambiar estado</th></tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} data-testid={`admin-order-row-${o.id}`}>
              <td>{o.id}</td>
              <td>{o.userId}</td>
              <td>{formatCLP(o.total)}</td>
              <td data-testid={`admin-order-status-${o.id}`}>{o.status}</td>
              <td>
                <select
                  defaultValue=""
                  onChange={(e) => e.target.value && changeStatus(o.id, e.target.value)}
                  data-testid={`admin-status-select-${o.id}`}
                >
                  <option value="" disabled>Cambiar a...</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
