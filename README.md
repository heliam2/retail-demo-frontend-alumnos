# QA Retail — Frontend

Una tienda online **simulada y completamente funcional** ("ChileRetail"), construida
como campo de práctica para QA: probar, automatizar y romper una SPA de e-commerce
real sin depender de una tienda de producción. Es la mitad frontend del proyecto — el
backend vive en el repo hermano [`retail-demo-backend`](https://github.com/heliam2/retail-demo-backend-alumnos) (API +
base de datos simulada); 


## Qué se puede hacer

Como **cliente**:
- Navegar el catálogo por categoría o buscar productos, ver detalle (galería, reseñas,
  disponibilidad por tienda, cotización de envío por comuna).
- Crear cuenta / iniciar sesión, agregar productos al carro y pagar (checkout con
  validación de nombre/dirección/región/comuna, medio de pago y cupón de descuento).
- Revisar historial de pedidos y el detalle de una orden.
- Guardar productos en una **wishlist** (favoritos) con actualización optimista.
- Administrar **direcciones** guardadas (CRUD).
- Editar el **perfil** y cambiar la contraseña.

Como **admin** (usuario con rol `admin`):
- Ver todos los pedidos de la tienda y cambiar su estado (pendiente → pagado →
  enviado, etc.) desde una vista legacy separada del resto de la app.

Todo esto corre sobre datos y lógica reales del backend — es el mismo tipo de flujo
que probarías en una tienda real, pero en un entorno controlado y reseteable.

| | |
|---|---|
| Stack | React 18 + Vite + React Router 6 + Tailwind |
| Puerto | `5173` |
| Estado | Context API (`store.jsx`) + capa `api.js` |
| Persistencia local | `localStorage` (token + usuario) |
| Auth | Guarda el JWT que devuelve el backend y lo manda en cada request |
| Tests | Sin test runner configurado |

---

## Cómo levantarlo

Necesita el backend corriendo en `http://localhost:4000` (ver
[`retail-demo-backend-alumnos`](https://github.com/heliam2/retail-demo-backend-alumnos#readme)).

```bash
npm install
npm run dev     # http://localhost:5173
```

Si el backend corre en otra URL, configúralo con `VITE_API_URL` (por defecto usa
`http://localhost:4000/api`).

### Credenciales de demo

| Rol | Email | Password |
|---|---|---|
| Cliente | `cliente@demo.cl` | `Demo1234` |
| Admin | `admin@demo.cl` | `Admin1234` |

---

## Arranque

- `main.jsx` → monta `<BrowserRouter>` › `<AuthProvider>` › `<App>`. Importa dos hojas
  de estilo: `index.css` (Tailwind, diseño nuevo) y `styles.css` (estilos "legacy"
  aislados bajo `.legacy`).
- `vite.config.js` → plugin React, alias `@` → `src/`, puerto 5173.

## Estado global: `store.jsx` (`AuthProvider` + `useAuth`)

Context único que expone:
- `token` y `user` — inicializados desde `localStorage` (`qa_retail_token`,
  `qa_retail_user`).
- `login(token, user)` / `logout()` — sincronizan estado + `localStorage`.
- `cartCount` y `refreshCart()` — el badge del carrito.
- `wishlistIds`, `refreshWishlist()`, `toggleWishlist()` — favoritos con
  **actualización optimista** (cambia la UI al instante y revierte si la API falla).

## Capa de API: `api.js`

- Un único `request(path, { method, body, token })` con `fetch`, base
  `VITE_API_URL || http://localhost:4000/api`.
- Inyecta `Authorization: Bearer` cuando hay token, parsea JSON, y **lanza un `Error`
  con `.status`** cuando la respuesta no es OK (así las páginas muestran el mensaje del
  backend).
- El objeto `api` es un mapa plano de todas las llamadas (`login`, `getProducts`,
  `addToCart`, `checkout`, `getAdminOrders`, …). Es el **contrato del frontend con el
  backend** en un solo archivo.

## Enrutado y "dos diseños" (`App.jsx`)

El proyecto está **a medio migrar** de un diseño viejo a uno nuevo (design system con
Tailwind, tokens tipo `text-headline-md`, componentes Stitch):
- Rutas con **diseño nuevo** (traen su propio `StoreHeader`/`StoreFooter`): `/`,
  `/catalogo`, `/catalogo/:categoria`, `/products/:id`, `/cart`, `/login`, `/checkout`,
  `/pedido/:id`, `/orders`, `/perfil`, `/wishlist`, `/addresses`.
- Rutas **legacy** (envueltas en `<div className="legacy">` con el `Navbar` antiguo):
  `/admin/orders`.

## Componentes

- `components/StoreLayout.jsx` → `StoreHeader` (marca "ChileRetail", buscador que navega
  a `/catalogo?q=`, menú de usuario desplegable con `data-testid`, badge de carrito) y
  `StoreFooter`. Los links de categoría **se derivan del catálogo real de la API**, no
  están hardcodeados.
- `components/Navbar.jsx` → navbar legacy, muestra link "Admin pedidos" solo si
  `user.role === "admin"`.
- `ProductCard.jsx` (legacy) y `ProductTile.jsx` (nuevo) → tarjeta de producto;
  `ProductTile` maneja badge de stock (`Disponible` / `Quedan N` / `Sin stock`), oferta
  (`listPrice > price`), botón de favorito y "Agotado".
- `categories.js` → `useCategories()` trae el catálogo una vez y **deriva las categorías
  con su conteo**; `META` solo aporta ícono y descripción por categoría.
- `lib/utils.js` → helper `cn()` (clsx + tailwind-merge extendido con los tokens de
  tipografía del design system).
- `components/ui/` → primitivos shadcn-style (`button`, `badge`, `card`).

## Páginas (`src/pages/`, ~4.750 líneas)

`Home`, `Catalog` (grilla de categorías), `Products` (listado por categoría / búsqueda),
`ProductDetail` (galería, reseñas, disponibilidad por tienda, cotización de envío por
comuna), `Login` (login + registro), `Cart`, `Checkout` (formulario con validación de
nombre/dirección/región/comuna/pago + cupón vía `api.quote`), `OrderConfirmation`,
`Orders`, `Profile` (datos personales + cambio de contraseña), `Wishlist`, `Addresses`
(CRUD), `AdminOrders` (cambia estado de pedidos, solo admin).

---

## Decisiones de diseño orientadas a QA

- **`data-testid` en casi todos los elementos interactivos** — el proyecto está
  preparado para automatización (Playwright/Cypress) sin depender de selectores CSS
  frágiles.
- **Migración de diseño a medias**: dos estilos conviviendo (nuevo con Tailwind, legacy
  con CSS propio) → escenario realista de regresión visual y de rutas.
- **Actualización optimista en wishlist**: la UI cambia antes de que responda la API y
  revierte si falla — buen caso para probar condiciones de carrera en la UI.

## Herramientas y stack

| Herramienta | Para qué |
|---|---|
| React 18 + React Router 6 | UI y ruteo SPA |
| Vite | Dev server y build |
| Tailwind CSS | Estilos (design system nuevo, convive con CSS legacy) |
| Context API (`store.jsx`) | Estado global: sesión, carro, wishlist |

El frontend no tiene test runner configurado (sin Jest/Vitest, sin `*.test.js`, sin
script `test` en `package.json`).
