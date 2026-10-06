import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { User, ShoppingCart } from "lucide-react";
import api from "../api";
import { useAuth } from "../store.jsx";
import { Button } from "@/components/ui/button";

// Header mínimo para el flujo transaccional: solo marca + accesos a perfil y
// carro, sin buscador ni navegación de categorías.
function AuthHeader() {
  const { cartCount } = useAuth();
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface">
      <div className="mx-auto flex max-w-container-max items-center justify-between gap-4 px-margin-mobile py-4 md:px-margin-desktop">
        <Link
          to="/"
          data-testid="nav-brand"
          className="shrink-0 font-heading text-headline-lg font-bold text-primary md:text-display-lg"
        >
          ChileRetail
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <Link
            to="/login"
            aria-label="Perfil"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
          >
            <User className="h-5 w-5" />
          </Link>
          <Link
            to="/cart"
            aria-label="Carro"
            data-testid="nav-cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span
                className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground"
                data-testid="cart-count"
              >
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-3 font-body text-body-md text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary";

export default function Login() {
  const [mode, setMode] = useState("login"); // login | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const { login, refreshCart } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";
  const isLogin = mode === "login";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const data = isLogin
        ? await api.login({ email, password })
        : await api.register({ email, password, name });
      login(data.token, data.user);
      await refreshCart();
      navigate(from, { replace: true });
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-body text-foreground">
      <AuthHeader />

      <main className="flex flex-grow flex-col items-center justify-center px-margin-mobile py-12 md:px-margin-desktop">
        <div className="w-full max-w-[440px]">
          <div className="mb-stack-lg text-left md:text-center">
            <h1 className="font-heading text-headline-lg font-bold text-foreground">
              {isLogin ? "Ingresar" : "Crear cuenta"}
            </h1>
          </div>

          <div className="rounded-lg border border-border bg-surface p-stack-lg shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
            <form
              className="flex flex-col gap-stack-md"
              onSubmit={handleSubmit}
              data-testid="auth-form"
            >
              {!isLogin && (
                <input
                  className={inputClass}
                  placeholder="Nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="name-input"
                  required
                />
              )}

              <input
                className={inputClass}
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="email-input"
                required
              />

              <input
                className={inputClass}
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="password-input"
                required
              />

              {isLogin && (
                <div className="-mt-1 flex justify-end">
                  <a
                    href="#"
                    className="font-body text-body-md text-secondary transition-all hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
              )}

              {error && (
                <div
                  className="rounded-md border border-[#FECACA] bg-[#FEE2E2] px-4 py-3 font-body text-body-md text-[#991B1B]"
                  data-testid="auth-error"
                >
                  {error}
                </div>
              )}

              <div className="mt-stack-sm flex flex-col gap-stack-md">
                <Button type="submit" size="lg" className="w-full" data-testid="auth-submit">
                  {isLogin ? "Ingresar" : "Registrarme"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full border-primary text-primary hover:bg-muted"
                  onClick={() => {
                    setError("");
                    setMode(isLogin ? "register" : "login");
                  }}
                  data-testid="auth-toggle"
                >
                  {isLogin ? "Crear una cuenta nueva" : "Ya tengo cuenta"}
                </Button>
              </div>
            </form>
          </div>

          {isLogin && (
            <div className="mt-stack-lg text-center md:text-left">
              <p className="font-body text-body-md text-muted-foreground">
                Usuario demo:{" "}
                <span className="font-medium text-foreground">cliente@demo.cl / Demo1234</span>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
