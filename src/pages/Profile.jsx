import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Bell,
  Check,
  CreditCard,
  Heart,
  KeyRound,
  LifeBuoy,
  MapPin,
  Package,
  Pencil,
  Smartphone,
  User,
  X,
} from "lucide-react";
import api from "../api";
import { useAuth } from "../store.jsx";
import { formatCLP } from "../components/ProductCard.jsx";
import { StoreHeader, StoreFooter } from "../components/StoreLayout.jsx";

// Mismo formato de teléfono chileno que valida el backend (auth.routes.js).
const PHONE_REGEX = /^\+?56\s?9\s?\d{4}\s?\d{4}$/;

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
  if (points >= 1000) return { label: "Nivel Plata", className: "bg-slate-200 text-slate-700" };
  return { label: "Nivel Bronce", className: "bg-orange-100 text-orange-700" };
}

function formatBirthDate(iso) {
  if (!iso) return "No informada";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatMemberSince(iso) {
  if (!iso) return "";
  const s = new Date(iso).toLocaleDateString("es-CL", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Fila de solo lectura / editable dentro de la tarjeta Información Personal.
function Field({ label, value, editing, name, form, errors, onChange, type = "text", disabled, badge }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label htmlFor={name} className="block font-body text-label-md font-semibold text-muted-foreground">
          {label}
        </label>
        {badge}
      </div>
      {editing && !disabled ? (
        <>
          <input
            id={name}
            name={name}
            type={type}
            value={form[name] ?? ""}
            onChange={(e) => onChange(name, e.target.value)}
            data-testid={`profile-input-${name}`}
            className={`w-full rounded-lg border bg-surface px-3 py-2.5 font-body text-body-md text-foreground outline-none transition-colors focus:ring-2 ${
              errors[name]
                ? "border-destructive focus:ring-destructive/40"
                : "border-border focus:border-primary focus:ring-primary/30"
            }`}
          />
          {errors[name] && (
            <p className="mt-1 font-body text-label-md text-destructive" data-testid={`profile-error-${name}`}>
              {errors[name]}
            </p>
          )}
        </>
      ) : (
        <div
          className={`rounded-lg border border-border bg-surface-muted px-3 py-2.5 font-body text-body-md font-medium ${
            disabled && editing ? "text-muted-foreground" : "text-foreground"
          }`}
          data-testid={`profile-value-${name}`}
        >
          {value || "No informado"}
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const { token, user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [profile, setProfile] = useState(null);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login", { state: { from: location.pathname }, replace: true });
      return;
    }
    Promise.all([api.getProfile(token), api.getAddresses(token).catch(() => [])])
      .then(([me, addresses]) => {
        setProfile(me);
        const list = Array.isArray(addresses) ? addresses : [];
        setDefaultAddress(list.find((a) => a.isDefault) || list[0] || null);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const tier = useMemo(() => loyaltyTier(profile?.loyaltyPoints || 0), [profile]);

  function startEdit() {
    setForm({
      name: profile.name || "",
      phone: profile.phone || "",
      rut: profile.rut || "",
      birthDate: profile.birthDate || "",
    });
    setErrors({});
    setSaveError("");
    setSaved(false);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setErrors({});
    setSaveError("");
  }

  function onChange(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate() {
    const next = {};
    if (!form.name?.trim()) next.name = "El nombre no puede estar vacío.";
    if (form.phone && !PHONE_REGEX.test(form.phone.trim())) {
      next.phone = "Formato inválido. Usa +56 9 XXXX XXXX.";
    }
    if (form.birthDate) {
      const d = new Date(`${form.birthDate}T00:00:00`);
      if (Number.isNaN(d.getTime()) || d > new Date()) {
        next.birthDate = "Fecha de nacimiento inválida.";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await api.updateProfile(token, {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        rut: form.rut.trim() || null,
        birthDate: form.birthDate || null,
      });
      setProfile(res);
      if (user && res.name !== user.name) {
        login(token, { ...user, name: res.name });
      }
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function submitPassword(e) {
    e.preventDefault();
    setPwError("");
    if (pwForm.newPassword.length < 6) {
      setPwError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwError("La confirmación no coincide con la nueva contraseña.");
      return;
    }
    setPwSaving(true);
    try {
      await api.changePassword(token, {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
      setPwOpen(false);
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 4000);
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwSaving(false);
    }
  }

  if (loading) {
    return (
      <Chrome>
        <p className="font-body text-body-lg text-muted-foreground">Cargando perfil...</p>
      </Chrome>
    );
  }

  if (!profile) {
    return (
      <Chrome>
        <p className="font-body text-body-lg text-muted-foreground">No pudimos cargar tu perfil.</p>
      </Chrome>
    );
  }

  const navItems = [
    { icon: User, label: "Mi Perfil", to: "/perfil", active: true },
    { icon: Package, label: "Mis Pedidos", to: "/orders" },
    { icon: Heart, label: "Favoritos", to: "/wishlist" },
    { icon: MapPin, label: "Direcciones Guardadas", to: "/addresses" },
    { icon: CreditCard, label: "Métodos de Pago", to: "/perfil" },
    { icon: Bell, label: "Notificaciones", to: "/perfil" },
  ];

  return (
    <Chrome>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 font-body text-label-md text-muted-foreground">
        <Link to="/" className="transition-colors hover:text-foreground">Inicio</Link>
        <span className="text-border">/</span>
        <Link to="/orders" className="transition-colors hover:text-foreground">Mi Cuenta</Link>
        <span className="text-border">/</span>
        <span aria-current="page" className="font-semibold text-foreground">Perfil y Seguridad</span>
      </nav>

      {/* Título + estado */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-display-md font-bold tracking-tight text-foreground">Mi Perfil</h1>
          <p className="mt-1 font-body text-body-md text-muted-foreground">
            Administra tu información personal, direcciones y preferencias de cuenta.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 font-body text-label-md font-semibold text-emerald-800">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          Cuenta Verificada
        </span>
      </div>

      {saved && (
        <div
          className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-body text-body-md text-emerald-800"
          data-testid="profile-saved"
        >
          <Check className="h-5 w-5 shrink-0 text-emerald-600" strokeWidth={3} />
          Tus datos se actualizaron correctamente.
        </div>
      )}
      {pwSaved && (
        <div
          className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-body text-body-md text-emerald-800"
          data-testid="password-saved"
        >
          <Check className="h-5 w-5 shrink-0 text-emerald-600" strokeWidth={3} />
          Tu contraseña se actualizó correctamente.
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Sidebar */}
        <aside className="space-y-4 lg:col-span-1">
          <div className="space-y-1 rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-3 rounded-xl bg-surface-muted p-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-body-md font-bold text-primary-foreground">
                {initials(profile.name)}
              </div>
              <div className="overflow-hidden">
                <p className="truncate font-body text-body-md font-bold text-foreground">{profile.name}</p>
                <p className="truncate font-body text-label-md text-muted-foreground">{profile.email}</p>
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
              {(profile.loyaltyPoints || 0).toLocaleString("es-CL")}{" "}
              <span className="font-body text-label-md font-normal text-muted-foreground">pts</span>
            </p>
            <p className="mt-1 font-body text-label-md text-muted-foreground">
              Equivalentes a {formatCLP((profile.loyaltyPoints || 0) * 10)} de descuento en tu próxima compra.
            </p>
          </div>
        </aside>

        {/* Contenido */}
        <div className="space-y-6 lg:col-span-3">
          {/* Información Personal */}
          <article className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <div className="flex items-center justify-between border-b border-border bg-surface-muted px-6 py-4">
              <div>
                <h2 className="font-heading text-title-md font-bold text-foreground">Información Personal</h2>
                <p className="font-body text-label-md text-muted-foreground">
                  Datos básicos de tu cuenta para envíos y facturación.
                </p>
              </div>
              {!editing && (
                <button
                  type="button"
                  onClick={startEdit}
                  data-testid="profile-edit-btn"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-1.5 font-body text-label-md font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  Editar datos
                </button>
              )}
            </div>

            <div className="p-6">
              {saveError && (
                <div
                  className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 font-body text-body-md text-destructive"
                  data-testid="profile-save-error"
                >
                  {saveError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field
                  label="Nombre completo"
                  name="name"
                  value={profile.name}
                  editing={editing}
                  form={form}
                  errors={errors}
                  onChange={onChange}
                />
                <Field
                  label="Correo electrónico"
                  name="email"
                  value={profile.email}
                  editing={editing}
                  form={form}
                  errors={errors}
                  onChange={onChange}
                  disabled
                  badge={
                    <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-body text-[10px] font-semibold text-emerald-700">
                      Verificado
                    </span>
                  }
                />
                <Field
                  label="Teléfono de contacto"
                  name="phone"
                  value={profile.phone}
                  editing={editing}
                  form={form}
                  errors={errors}
                  onChange={onChange}
                />
                <Field
                  label="RUT"
                  name="rut"
                  value={profile.rut}
                  editing={editing}
                  form={form}
                  errors={errors}
                  onChange={onChange}
                />
                <Field
                  label="Fecha de nacimiento"
                  name="birthDate"
                  type="date"
                  value={formatBirthDate(profile.birthDate)}
                  editing={editing}
                  form={form}
                  errors={errors}
                  onChange={onChange}
                />
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
                <p className="font-body text-label-md text-muted-foreground">
                  Miembro desde <span className="font-semibold text-foreground">{formatMemberSince(profile.createdAt)}</span>
                </p>
                {editing && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      data-testid="profile-cancel-btn"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 font-body text-label-md font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={save}
                      disabled={saving}
                      data-testid="profile-save-btn"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 font-body text-label-md font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
                    >
                      {saving ? "Guardando..." : "Guardar cambios"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </article>

          {/* Dirección de Despacho Principal */}
          <article className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <div className="flex items-center justify-between border-b border-border bg-surface-muted px-6 py-4">
              <div>
                <h2 className="font-heading text-title-md font-bold text-foreground">Dirección de Despacho Principal</h2>
                <p className="font-body text-label-md text-muted-foreground">
                  Lugar predeterminado para la entrega de tus compras online.
                </p>
              </div>
              <Link
                to="/addresses"
                className="inline-flex items-center rounded-lg border border-border bg-surface px-3.5 py-1.5 font-body text-label-md font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
              >
                Gestionar direcciones
              </Link>
            </div>
            <div className="p-6">
              {defaultAddress ? (
                <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-surface-muted p-4 md:flex-row md:items-center">
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-body text-label-md font-bold text-foreground">{defaultAddress.label}</span>
                        {defaultAddress.isDefault && (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-body text-[10px] font-semibold text-emerald-700">
                            Predeterminada
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-body text-label-md font-medium text-foreground">{defaultAddress.street}</p>
                      <p className="font-body text-label-md text-muted-foreground">
                        {defaultAddress.city}, {defaultAddress.region}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/addresses"
                    className="self-start rounded-lg border border-border px-3 py-1.5 font-body text-label-md font-medium text-foreground transition-colors hover:bg-muted md:self-auto"
                  >
                    Modificar
                  </Link>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-surface-muted px-4 py-8 text-center font-body text-body-md text-muted-foreground">
                  Aún no tienes una dirección guardada.{" "}
                  <Link to="/addresses" className="font-semibold text-secondary hover:underline">
                    Agregar dirección
                  </Link>
                </div>
              )}
            </div>
          </article>

          {/* Seguridad y Acceso */}
          <article className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <div className="border-b border-border bg-surface-muted px-6 py-4">
              <h2 className="font-heading text-title-md font-bold text-foreground">Seguridad y Acceso</h2>
              <p className="font-body text-label-md text-muted-foreground">
                Protege tu cuenta con contraseñas seguras y verificación en dos pasos.
              </p>
            </div>
            <div className="divide-y divide-border p-6">
              <div className="py-3 first:pt-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <KeyRound className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-body text-label-md font-bold text-foreground">Contraseña de acceso</p>
                      <p className="font-body text-label-md text-muted-foreground">
                        Te recomendamos cambiarla periódicamente.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPwOpen((o) => !o);
                      setPwError("");
                    }}
                    data-testid="password-toggle-btn"
                    className="shrink-0 rounded-lg border border-border bg-surface px-3.5 py-1.5 font-body text-label-md font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    {pwOpen ? "Cerrar" : "Cambiar contraseña"}
                  </button>
                </div>

                {pwOpen && (
                  <form onSubmit={submitPassword} data-testid="password-form" className="mt-4 grid gap-3 sm:max-w-md">
                    <input
                      type="password"
                      autoComplete="current-password"
                      placeholder="Contraseña actual"
                      value={pwForm.currentPassword}
                      onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
                      data-testid="password-current"
                      required
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 font-body text-body-md text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
                    />
                    <input
                      type="password"
                      autoComplete="new-password"
                      placeholder="Nueva contraseña (mín. 6 caracteres)"
                      value={pwForm.newPassword}
                      onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                      data-testid="password-new"
                      required
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 font-body text-body-md text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
                    />
                    <input
                      type="password"
                      autoComplete="new-password"
                      placeholder="Repite la nueva contraseña"
                      value={pwForm.confirm}
                      onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                      data-testid="password-confirm"
                      required
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 font-body text-body-md text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
                    />
                    {pwError && (
                      <p className="font-body text-label-md text-destructive" data-testid="password-error">
                        {pwError}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={pwSaving}
                      data-testid="password-submit"
                      className="justify-self-start rounded-lg bg-primary px-5 py-2 font-body text-label-md font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
                    >
                      {pwSaving ? "Guardando..." : "Actualizar contraseña"}
                    </button>
                  </form>
                )}
              </div>

              <div className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-start gap-3">
                  <Smartphone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-body text-label-md font-bold text-foreground">Verificación en dos pasos (2FA)</p>
                    <p className="font-body text-label-md font-medium text-emerald-700">
                      Activada mediante SMS al +56 9 **** 5678
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-lg border border-border bg-surface px-3.5 py-1.5 font-body text-label-md font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  Configurar
                </button>
              </div>
            </div>
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
              ¿Necesitas ayuda con tu perfil o seguridad?
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
