import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Bell,
  Building2,
  Check,
  CreditCard,
  Heart,
  Home,
  LifeBuoy,
  MapPin,
  Package,
  Pencil,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import api from "../api";
import { useAuth } from "../store.jsx";
import { formatCLP } from "../components/ProductCard.jsx";
import { StoreHeader, StoreFooter } from "../components/StoreLayout.jsx";

const emptyForm = {
  label: "",
  receptor: "",
  phone: "",
  street: "",
  apartment: "",
  region: "Región Metropolitana",
  city: "",
  isDefault: false,
};

// Regiones de Chile para el selector del formulario (espeja el diseño de Stitch).
const REGIONS = [
  "Región Metropolitana",
  "Región de Valparaíso",
  "Región del Biobío",
  "Región de Coquimbo",
  "Región de Los Lagos",
  "Región de La Araucanía",
  "Región del Maule",
  "Región de O'Higgins",
  "Región de Antofagasta",
  "Región de Atacama",
  "Región de Tarapacá",
  "Región de Arica y Parinacota",
  "Región de Ñuble",
  "Región de Los Ríos",
  "Región de Aysén",
  "Región de Magallanes",
];

const COMUNAS = [
  "Providencia",
  "Las Condes",
  "Santiago Centro",
  "Ñuñoa",
  "Vitacura",
  "La Reina",
  "Lo Barnechea",
  "Maipú",
  "La Florida",
  "Puente Alto",
  "Viña del Mar",
  "Valparaíso",
  "Concepción",
  "Temuco",
  "Antofagasta",
];

function Chrome({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-background font-body text-foreground">
      <StoreHeader />
      <main className="flex-grow py-8">
        <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">{children}</div>
      </main>
      <StoreFooter />
    </div>
  );
}

function initials(name) {
  return (name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

function loyaltyTier(points) {
  if (points >= 5000) return { label: "Nivel Oro", className: "bg-amber-100 text-amber-700" };
  if (points >= 1000) return { label: "Nivel Plata", className: "bg-orange-100 text-orange-700" };
  return { label: "Nivel Bronce", className: "bg-orange-100 text-orange-700" };
}

// Campo del formulario: label arriba + input/select redondeado (estilo Stitch).
function FormField({ label, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block font-body text-label-md font-semibold text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 font-body text-body-md text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30";

// Tarjeta individual de dirección guardada.
function AddressCard({ address, receptor, onEdit, onDelete, onSetDefault }) {
  const isDefault = Boolean(address.isDefault);
  const Icon = isDefault ? Home : Building2;

  return (
    <article
      data-testid={`address-${address.id}`}
      className={`rounded-2xl bg-surface p-6 shadow-sm ${
        isDefault ? "border-2 border-primary/10" : "border border-border"
      }`}
    >
      <div className="flex flex-col justify-between gap-3 border-b border-border pb-4 lg:flex-row lg:items-start">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              isDefault ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="whitespace-nowrap font-body text-body-md font-bold text-foreground">{address.label}</span>
              {isDefault ? (
                <span
                  data-testid={`default-badge-${address.id}`}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-body text-label-md font-semibold text-emerald-700"
                >
                  Predeterminada
                </span>
              ) : (
                <span className="rounded-full bg-muted px-2 py-0.5 font-body text-label-md font-medium text-muted-foreground">
                  Secundaria
                </span>
              )}
            </div>
            {receptor && <p className="mt-0.5 font-body text-label-md text-muted-foreground">{receptor}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end lg:self-auto">
          {!isDefault && (
            <button
              type="button"
              onClick={() => onSetDefault(address)}
              data-testid={`set-default-${address.id}`}
              className="whitespace-nowrap rounded-lg bg-muted px-3 py-1.5 font-body text-label-md font-semibold tracking-normal text-foreground transition-colors hover:bg-border"
            >
              Establecer como predeterminada
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(address)}
            data-testid={`edit-address-${address.id}`}
            className="rounded-lg border border-border px-3 py-1.5 font-body text-label-md font-semibold tracking-normal text-foreground transition-colors hover:bg-muted"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => onDelete(address.id)}
            data-testid={`remove-address-${address.id}`}
            className="rounded-lg border border-border px-3 py-1.5 font-body text-label-md font-semibold tracking-normal text-destructive transition-colors hover:bg-destructive/5"
          >
            Eliminar
          </button>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-3 pt-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <p className="font-body text-body-md font-semibold text-foreground">{address.street}</p>
          <p className="font-body text-label-md text-muted-foreground">
            {address.city}, {address.region}
            {address.postalCode ? ` (Código Postal: ${address.postalCode})` : ""}
          </p>
        </div>
        {isDefault && (
          <span className="inline-flex items-center gap-1.5 self-start rounded-lg border border-emerald-200/80 bg-emerald-50/70 px-2.5 py-1 font-body text-label-md font-medium text-emerald-700 sm:self-auto">
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            Dirección principal de entrega
          </span>
        )}
      </div>
    </article>
  );
}

export default function Addresses() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [addresses, setAddresses] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const formRef = useRef(null);

  async function load() {
    const [list, me] = await Promise.all([
      api.getAddresses(token),
      api.getProfile(token).catch(() => null),
    ]);
    setAddresses(Array.isArray(list) ? list : []);
    if (me) setProfile(me);
    return me;
  }

  useEffect(() => {
    if (!token) {
      navigate("/login", { state: { from: location.pathname + location.search }, replace: true });
      return;
    }
    load()
      .then((me) => {
        const src = me || user || {};
        setForm((f) => ({ ...f, receptor: src.name || "", phone: src.phone || "" }));
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const displayUser = profile || user || {};
  const tier = useMemo(() => loyaltyTier(profile?.loyaltyPoints || 0), [profile]);
  const receptorLine = useMemo(
    () => [displayUser.name, displayUser.phone].filter(Boolean).join(" • "),
    [displayUser.name, displayUser.phone]
  );

  const navItems = [
    { icon: User, label: "Mi Perfil", to: "/perfil" },
    { icon: Package, label: "Mis Pedidos", to: "/orders" },
    { icon: Heart, label: "Favoritos", to: "/wishlist" },
    { icon: MapPin, label: "Direcciones Guardadas", to: "/addresses", active: true },
    { icon: CreditCard, label: "Métodos de Pago", to: "/perfil" },
    { icon: Bell, label: "Notificaciones", to: "/perfil" },
  ];

  function flashNotice(msg) {
    setNotice(msg);
    setTimeout(() => setNotice(""), 4000);
  }

  function scrollToForm() {
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      receptor: displayUser.name || "",
      phone: displayUser.phone || "",
    });
    setError("");
  }

  function startCreate() {
    resetForm();
    scrollToForm();
  }

  function startEdit(address) {
    setEditingId(address.id);
    setForm({
      label: address.label || "",
      receptor: address.receptor || displayUser.name || "",
      phone: address.phone || displayUser.phone || "",
      street: address.street || "",
      apartment: address.apartment || "",
      region: address.region || "Región Metropolitana",
      city: address.city || "",
      isDefault: Boolean(address.isDefault),
    });
    setError("");
    scrollToForm();
  }

  // El backend no desmarca la anterior predeterminada: lo hacemos desde el cliente.
  async function clearOtherDefaults(exceptId) {
    const stale = addresses.filter((a) => a.isDefault && a.id !== exceptId);
    await Promise.all(stale.map((a) => api.updateAddress(token, a.id, { isDefault: false })));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const street = [form.street.trim(), form.apartment.trim()].filter(Boolean).join(", ");
      const payload = {
        label: form.label.trim(),
        street,
        city: form.city.trim(),
        region: form.region.trim(),
        isDefault: form.isDefault,
      };
      let saved;
      if (editingId) {
        saved = await api.updateAddress(token, editingId, payload);
      } else {
        saved = await api.addAddress(token, payload);
      }
      if (payload.isDefault) await clearOtherDefaults(saved?.id ?? editingId);
      await load();
      const wasEditing = Boolean(editingId);
      resetForm();
      flashNotice(wasEditing ? "Dirección actualizada correctamente." : "Dirección guardada correctamente.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function setDefault(address) {
    try {
      await api.updateAddress(token, address.id, { isDefault: true });
      await clearOtherDefaults(address.id);
      await load();
      flashNotice(`"${address.label}" es tu nueva dirección predeterminada.`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (editingId === id) resetForm();
    await api.deleteAddress(token, id);
    await load();
  }

  if (loading) {
    return (
      <Chrome>
        <p className="font-body text-body-lg text-muted-foreground">Cargando direcciones...</p>
      </Chrome>
    );
  }

  return (
    <Chrome>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 font-body text-label-md text-muted-foreground">
        <Link to="/" className="transition-colors hover:text-foreground">Inicio</Link>
        <span className="text-border">/</span>
        <Link to="/perfil" className="transition-colors hover:text-foreground">Mi Cuenta</Link>
        <span className="text-border">/</span>
        <span aria-current="page" className="font-semibold text-foreground">Direcciones Guardadas</span>
      </nav>

      {/* Título + acción */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-display-md font-bold tracking-tight text-foreground">Direcciones Guardadas</h1>
          <p className="mt-1 font-body text-body-md text-muted-foreground">
            Administra tus direcciones de entrega para agilizar tus compras.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          data-testid="add-address-btn"
          className="inline-flex items-center gap-2 self-start rounded-xl bg-primary px-4 py-2.5 font-body text-label-md font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 md:self-auto"
        >
          <Plus className="h-4 w-4" />
          Agregar nueva dirección
        </button>
      </div>

      {notice && (
        <div
          className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-body text-body-md text-emerald-800"
          data-testid="address-notice"
        >
          <Check className="h-5 w-5 shrink-0 text-emerald-600" strokeWidth={3} />
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Sidebar de cuenta */}
        <aside className="space-y-4 lg:col-span-1">
          <div className="space-y-1 rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-3 rounded-xl bg-surface-muted p-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-body-md font-bold text-primary-foreground">
                {initials(displayUser.name)}
              </div>
              <div className="overflow-hidden">
                <p className="truncate font-body text-body-md font-bold text-foreground">{displayUser.name}</p>
                <p className="truncate font-body text-label-md text-muted-foreground">{displayUser.email}</p>
              </div>
            </div>
            {navItems.map(({ icon: Icon, label, to, active }) => (
              <Link
                key={label}
                to={to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-body text-label-md font-semibold transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {/* Puntos Retail */}
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm" data-testid="loyalty-card">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-body text-label-md font-bold uppercase tracking-wide text-foreground">
                Puntos Retail
              </span>
              <span className={`rounded px-2 py-0.5 font-body text-label-md font-bold ${tier.className}`}>
                {tier.label}
              </span>
            </div>
            <p className="font-heading text-headline-lg font-bold text-foreground">
              {(profile?.loyaltyPoints || 0).toLocaleString("es-CL")}{" "}
              <span className="font-body text-label-md font-normal text-muted-foreground">pts</span>
            </p>
            <p className="mt-1 font-body text-label-md text-muted-foreground">
              Equivalentes a {formatCLP((profile?.loyaltyPoints || 0) * 10)} de descuento en tu próxima compra.
            </p>
          </div>
        </aside>

        {/* Contenido */}
        <div className="space-y-6 lg:col-span-3">
          <div className="space-y-4" data-testid="addresses-list">
            {addresses.length === 0 && (
              <div
                className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center font-body text-body-md text-muted-foreground"
                data-testid="addresses-empty"
              >
                No tienes direcciones guardadas. Agrega tu primera dirección con el formulario de abajo.
              </div>
            )}

            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                receptor={receptorLine}
                onEdit={startEdit}
                onDelete={remove}
                onSetDefault={setDefault}
              />
            ))}
          </div>

          {/* Formulario agregar / editar (siempre visible) */}
          <article
            ref={formRef}
            className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm scroll-mt-24"
          >
            <div className="border-b border-border bg-surface-muted px-6 py-4">
              <h2 className="font-heading text-title-md font-bold text-foreground">
                {editingId ? "Editar dirección" : "Agregar nueva dirección"}
              </h2>
              <p className="font-body text-label-md text-muted-foreground">
                Ingresa los datos del domicilio para tus próximos despachos.
              </p>
            </div>

            <form className="space-y-5 p-6" onSubmit={handleSubmit} data-testid="address-form">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <FormField label="Etiqueta de la dirección" htmlFor="address-label">
                  <input
                    id="address-label"
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    placeholder="Ej: Casa, Trabajo, Casa de Playa"
                    data-testid="address-label"
                    required
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Nombre del receptor" htmlFor="address-receptor">
                  <input
                    id="address-receptor"
                    value={form.receptor}
                    onChange={(e) => setForm({ ...form, receptor: e.target.value })}
                    data-testid="address-receptor"
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Teléfono de contacto" htmlFor="address-phone">
                  <input
                    id="address-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+56 9 1234 5678"
                    data-testid="address-phone"
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Calle y número" htmlFor="address-street">
                  <input
                    id="address-street"
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                    placeholder="Ej: Av. Las Condes 1234"
                    data-testid="address-street"
                    required
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Depto / Casa / Oficina (Opcional)" htmlFor="address-apartment">
                  <input
                    id="address-apartment"
                    value={form.apartment}
                    onChange={(e) => setForm({ ...form, apartment: e.target.value })}
                    placeholder="Ej: Depto 402, Torre B"
                    data-testid="address-apartment"
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Región" htmlFor="address-region">
                  <select
                    id="address-region"
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    data-testid="address-region"
                    required
                    className={inputClass}
                  >
                    {form.region && !REGIONS.includes(form.region) && (
                      <option value={form.region}>{form.region}</option>
                    )}
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </FormField>
                <div className="md:col-span-2">
                  <FormField label="Comuna" htmlFor="address-city">
                    <select
                      id="address-city"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      data-testid="address-city"
                      required
                      className={inputClass}
                    >
                      <option value="" disabled>
                        Selecciona una comuna
                      </option>
                      {form.city && !COMUNAS.includes(form.city) && (
                        <option value={form.city}>{form.city}</option>
                      )}
                      {COMUNAS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  data-testid="address-default-checkbox"
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="font-body text-label-md font-medium text-muted-foreground">
                  Usar como dirección predeterminada para compras y despachos
                </span>
              </label>

              {error && (
                <div
                  className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 font-body text-body-md text-destructive"
                  data-testid="address-error"
                >
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-border px-4 py-2.5 font-body text-label-md font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  data-testid="save-address-btn"
                  className="rounded-xl bg-primary px-6 py-2.5 font-body text-label-md font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving ? "Guardando..." : "Guardar dirección"}
                </button>
              </div>
            </form>
          </article>
        </div>
      </div>

      {/* Banner de ayuda */}
      <section className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:flex-row">
        <div className="flex items-center gap-4 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
            <LifeBuoy className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-body text-body-md font-bold text-foreground">
              ¿Necesitas ayuda con tus direcciones o despachos?
            </h4>
            <p className="mt-0.5 font-body text-label-md text-muted-foreground">
              Nuestro equipo de soporte está disponible de lunes a domingo de 08:00 a 20:00 hrs.
            </p>
          </div>
        </div>
        <a
          href="#"
          className="whitespace-nowrap rounded-lg border border-border px-4 py-2 font-body text-label-md font-semibold text-foreground transition-colors hover:bg-muted"
        >
          Ir al Centro de Ayuda
        </a>
      </section>
    </Chrome>
  );
}
