---
name: pruebas-e2e
description: "Genera pruebas END TO END con Playwright sobre ChileRetail — el sistema completo a través del navegador, con page objects y fixtures. Úsala cuando el alumno quiera probar un flujo de usuario por la interfaz, escribir o ampliar un .spec.js en tests/e2e/, crear un page object, o interceptar peticiones con page.route(). No la uses para verificar reglas de cálculo o códigos de error: eso va en el repo del backend, con pruebas-de-componente o pruebas-de-integracion."
---

# Pruebas E2E con Playwright

El E2E es el nivel más caro de la suite: el más lento, el más frágil y el que
peor dice dónde está el problema cuando falla. Por eso hay que escribir
**pocos**, y solo los que no se pueden escribir más abajo.

## Paso 1 · Recorta qué le toca verificar a esta prueba

Antes de escribir nada, la pregunta:

> **Si la regla ya está verificada abajo, ¿qué le queda a esta prueba?**

La respuesta casi siempre es la misma: **que la pantalla pida bien y muestre
bien.** Nada más.

Tomá el caso del cupón expirado como molde. Son cuatro verificaciones distintas,
y solo una es E2E:

| Qué verifica | Dónde va |
|---|---|
| Que un cupón vencido se rechace (la regla pura) | unitaria, repo backend |
| Que el rechazo no deje el cupón aplicado | componente, repo backend |
| Que la API responda 400 con el mensaje correcto | integración, repo backend |
| **Que la pantalla muestre el error al usuario** | **acá** |

Si lo que te piden es verificar un cálculo, un código HTTP o una regla de
negocio, **dilo y redirige al repo del backend**. Hacerlo por el navegador
cuesta minutos en vez de milisegundos y no agrega información.

## Paso 2 · Lee lo que ya existe

- `tests/e2e/demo-clase11/03-en-capas.spec.js` — el ejemplo de clase
- `tests/e2e/demo-clase11/paginas/` — los page objects
- `tests/e2e/demo-clase11/datos/fixtures.js` — usuarios, cupones, productos y `resetearSistema`
- `tests/e2e/playwright.config.js` — baseURL y configuración

## Paso 3 · Las capas, y qué va en cada una

Una prueba bien escrita **no tiene ni un `data-testid`, ni una URL, ni un
código de cupón literal**. Si los tiene, algo está en la capa equivocada.

| Capa | Qué contiene | Dónde |
|---|---|---|
| 2 · datos | usuarios, cupones, productos, `resetearSistema` | `datos/fixtures.js` |
| 3 · acceso | selectores y acciones de **una** pantalla | `paginas/PaginaX.js` |
| 5 · prueba | el guion de negocio y las aserciones | `*.spec.js` |

### Cuándo aparece la capa 4 (acciones de negocio)

La regla es de **alcance**, no de cantidad de capas:

- el flujo toca **una** pantalla → método del page object;
- el flujo toca **varias** y se repite → acción de negocio, en `acciones/`.

No empieces con la capa 4. Extráela cuando repitas por tercera vez un flujo que
cruza pantallas (por ejemplo: agregar al carro → checkout → pagar → confirmar).

### El page object

```js
export class PaginaCarro {
  constructor(page) {
    this.page   = page;
    this.total  = page.getByTestId('summary-total');
    this.cupon  = page.getByTestId('coupon-input');
    this.error  = page.getByTestId('coupon-error');
  }

  async abrir() {
    await this.page.goto('/cart');
    await this.resumen.waitFor();     // espera por condición, no por reloj
  }
}
```

Usa `getByTestId` antes que selectores de CSS o de texto: el texto cambia con
cada ajuste de copy y el CSS con cada refactor de estilos.

## Paso 4 · Prepara el estado por API, nunca por la interfaz

```js
test.beforeEach(async ({ request }) => {
  await resetearSistema(request);
});
```

Llegar al estado inicial haciendo clics es lento y frágil: si el login se rompe,
fallan todas las pruebas y ninguna dice por qué. **Prepara por API, verifica
por interfaz.**

## Paso 5 · El contrapeso

> Si solo verificas que los cupones malos **no** cambian el total, una pantalla
> que ignorara todos los cupones pasaría la suite entera.

Por cada caso negativo, escribe el positivo que lo sostiene:

```js
test('un cupon expirado no cambia el total', ...)   // el total NO cambia
test('un cupon valido si cambia el total',   ...)   // el total SÍ cambia
```

Sin el segundo, el primero no demuestra nada.

## Paso 6 · Esperas: por condición, nunca por reloj

```js
await page.waitForTimeout(3000);              // ✗ intermitencia garantizada
await expect(carro.error).toBeVisible();      // ✓ espera por condición
await page.waitForURL('**/cart');             // ✓
```

Un tiempo fijo a veces alcanza y a veces no. Y una prueba intermitente es peor
que no tener la prueba: enseña a apretar «re-run», y después también lo aprietan
cuando la falla es verdadera.

## Paso 7 · Si necesitas doblar el backend

`page.route()` intercepta **solo lo que coincide** con el patrón; el resto sigue
yendo al servidor real.

```js
await page.route('**/api/orders/quote', route =>
  route.fulfill({ status: 500, body: '{}' })     // fulfill = doblar
);
```

`route.fetch()` llega al servidor real; `route.fulfill()` responde sin tocarlo.

> Cuando doblas la API, la prueba **deja de ser E2E**: pasa a ser una prueba de
> integración de la interfaz. Está bien hacerlo —es la forma de provocar un
> error del servidor que no sabrías cómo reproducir— pero nómbralo y ponla en
> la carpeta que corresponde. El nivel lo determina qué dejaste real.

## Paso 8 · Ejecuta, y después rómpela

```bash
npm run dev                 # frontend, en una terminal
npm run dev                 # backend, en otra (repo del backend)
npm run test:e2e            # las pruebas
npm run test:e2e:ui         # con la interfaz de Playwright, para depurar
```

Y el paso que casi nadie da:

> **Cambia una aserción a propósito y confirma que se pone roja.**

Una prueba que nunca viste fallar no sabes si verifica algo. Restaura después.

## Antes de darla por terminada

- [ ] Verifica algo que no se puede verificar más abajo
- [ ] No tiene ni un `data-testid`, ni una URL, ni un dato literal en el `.spec`
- [ ] El estado inicial se prepara por API
- [ ] Hay un caso positivo que sostiene al negativo
- [ ] Ninguna espera por tiempo fijo
- [ ] El nombre dice qué verifica, no «caso 3»
- [ ] La viste fallar
