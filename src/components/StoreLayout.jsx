import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ChevronDown,
  Heart,
  LogOut,
  MapPin,
  Package,
  Search,
  ShoppingCart,
  User,
} from "lucide-react";
import { useAuth } from "../store.jsx";
import { useCategories } from "../categories.js";

function initials(name) {
  return (name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

// Menú de usuario desplegable del header (espeja el diseño de Stitch "Mi Perfil").
function UserMenu() {
  const { user, cartCount, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Cierra al cambiar de ruta.
  useEffect(() => setOpen(false), [pathname]);

  // Cierra al hacer clic fuera o presionar Escape.
  useEffect(() => {
    if (!open) return undefined;
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function handleLogout() {
    setOpen(false);
    logout();
    navigate("/");
  }

  const items = [
    { to: "/cart", label: "Carro", icon: ShoppingCart, badge: cartCount },
    { to: "/orders", label: "Mis pedidos", icon: Package },
    { to: "/wishlist", label: "Favoritos", icon: Heart, iconClass: "text-rose-500" },
    { to: "/addresses", label: "Direcciones", icon: MapPin },
    { to: "/perfil", label: "Datos personales / Mi Perfil", icon: User },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        data-testid="nav-user-menu"
        className="group flex items-center gap-2.5 rounded-full border border-border bg-muted px-2.5 py-1 text-foreground shadow-sm transition-colors hover:border-muted-foreground/30"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-heading text-[11px] font-bold text-primary-foreground">
          {initials(user.name)}
        </span>
        <span className="hidden text-left leading-tight lg:block">
          <span data-testid="nav-username" className="block font-body text-label-md font-semibold text-foreground">
            Hola, {user.name}
          </span>
          <span className="block font-body text-[10px] text-muted-foreground">Mi Cuenta</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          data-testid="nav-user-dropdown"
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl"
        >
          <div className="flex items-center gap-3 border-b border-border bg-surface-muted p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-body-md font-bold text-primary-foreground">
              {initials(user.name)}
            </span>
            <div className="overflow-hidden">
              <p className="truncate font-body text-body-md font-bold text-foreground">{user.name}</p>
              <p className="truncate font-body text-label-md text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="space-y-0.5 p-2">
            {items.map(({ to, label, icon: Icon, badge, iconClass }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between gap-2.5 rounded-lg px-3 py-2 font-body text-label-md font-medium transition-colors ${
                    active ? "bg-muted font-bold text-foreground" : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${iconClass || "text-muted-foreground"}`} />
                    {label}
                  </span>
                  {badge > 0 && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-border bg-surface-muted p-2">
            <button
              type="button"
              onClick={handleLogout}
              data-testid="nav-logout"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 font-body text-label-md font-semibold text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Salir / Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Chrome compartido del design system nuevo (mismo look que el Home).
// Se usa en todas las rutas migradas a Tailwind (Home, catálogo, detalle).
// Los enlaces de categoría se derivan del catálogo real de la API; "Ofertas"
// muestra el catálogo completo.

function SearchForm({ className, placeholder }) {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");

  function submit(e) {
    e.preventDefault();
    const q = term.trim();
    navigate(q ? `/catalogo?q=${encodeURIComponent(q)}` : "/catalogo");
  }

  return (
    <form onSubmit={submit} className={className} role="search">
      <Search className="mr-2 h-5 w-5 text-muted-foreground" />
      <input
        type="text"
        placeholder={placeholder}
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        data-testid="search-input"
        aria-label="Buscar"
        className="w-full border-none bg-transparent p-0 font-body text-body-md text-foreground outline-none placeholder:text-muted-foreground focus:ring-0"
      />
    </form>
  );
}

export function StoreHeader() {
  const { cartCount, user } = useAuth();
  const { pathname } = useLocation();

  const { categories } = useCategories();
  const onCatalog = pathname === "/catalogo" || pathname.startsWith("/catalogo/");
  const activeCategory = decodeURIComponent(pathname.replace(/^\/catalogo\/?/, "")) || null;

  const navLinks = [
    ...categories.map((c) => ({ label: c.label, to: `/catalogo/${c.slug}`, slug: c.slug })),
    { label: "Ofertas", to: "/catalogo", slug: null },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface">
      <div className="mx-auto flex max-w-container-max flex-col gap-3 px-margin-mobile py-3 md:px-margin-desktop">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/"
            data-testid="nav-brand"
            className="shrink-0 font-heading text-headline-md font-bold text-primary md:text-headline-lg"
          >
            ChileRetail
          </Link>

          <SearchForm
            placeholder="Buscar por marca, producto..."
            className="mx-auto hidden max-w-xl flex-1 items-center rounded-full border border-border bg-muted px-4 py-2 transition-colors focus-within:border-primary md:flex"
          />

          <div className="flex shrink-0 items-center gap-1">
            {user ? (
              <UserMenu />
            ) : (
              <Link
                to="/login"
                aria-label="Perfil"
                className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
              >
                <User className="h-5 w-5" />
              </Link>
            )}
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

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ label, to, slug }) => {
            const active = slug
              ? activeCategory && activeCategory.toLowerCase() === slug.toLowerCase()
              : onCatalog && !activeCategory;
            return (
              <Link
                key={label}
                to={to}
                data-testid={`nav-category-${slug || "ofertas"}`}
                className={`rounded-none border-b-2 px-3 py-2 font-heading text-body-md font-semibold transition-colors ${
                  active
                    ? "border-secondary text-secondary"
                    : "border-transparent text-secondary/60 hover:border-secondary/30 hover:text-secondary"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <SearchForm
          placeholder="Buscar..."
          className="flex w-full items-center rounded-full border border-border bg-muted px-4 py-2 md:hidden"
        />
      </div>
    </header>
  );
}

export function StoreFooter() {
  return (
    <footer className="mt-stack-lg border-t border-border bg-surface-muted">
      <div className="mx-auto grid max-w-container-max grid-cols-1 gap-gutter px-margin-mobile py-12 md:grid-cols-4 md:px-margin-desktop">
        <div className="flex flex-col gap-3">
          <span className="font-heading text-headline-md font-bold text-primary">ChileRetail</span>
          <p className="font-body text-body-md text-muted-foreground">
            Tu tienda de confianza con la mejor selección de productos.
          </p>
          <div className="mt-auto pt-4 font-body text-label-md text-muted-foreground">
            © {new Date().getFullYear()} ChileRetail. Todos los derechos reservados.
          </div>
        </div>

        {[
          {
            h: "Atención al Cliente",
            items: ["Servicio al Cliente", "Términos y Condiciones", "Seguimiento de Pedido"],
          },
          { h: "Sobre Nosotros", items: ["Tiendas", "Nuestra Historia", "Trabaja con nosotros"] },
          { h: "Medios de Pago", items: ["Webpay Plus"] },
        ].map((col) => (
          <div key={col.h} className="flex flex-col gap-3">
            <h4 className="mb-2 font-body text-label-md font-bold uppercase tracking-wider text-foreground">
              {col.h}
            </h4>
            {col.items.map((t) => (
              <a
                key={t}
                href="#"
                className="font-body text-body-md text-muted-foreground transition-colors hover:text-secondary hover:underline"
              >
                {t}
              </a>
            ))}
          </div>
        ))}
      </div>
    </footer>
  );
}
