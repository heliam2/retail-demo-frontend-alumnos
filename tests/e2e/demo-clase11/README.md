# Demo de la clase 11 · Playwright

Material **de clase**, no del laboratorio. Son los ejemplos que se leen en la
sesión *Diseño de Propuesta Conceptual de Automatización*, puestos acá para que
puedas ejecutarlos y leerlos con calma después.

---

## Cómo correrlo

Necesitas **el backend corriendo**, porque estas pruebas usan el sistema real:

```bash
# terminal 1 · en el repositorio del backend
npm run dev                 # API en http://localhost:4000

# terminal 2 · acá
npm install
npx playwright install chromium    # solo la primera vez
npm run test:e2e
```

El frontend lo levanta Playwright solo (`webServer` en la configuración). Si ya
lo tienes corriendo en el 5173, lo reutiliza.

```bash
npm run test:e2e:ui         # modo interactivo, para ver paso a paso
```

Si el backend no está arriba, la primera prueba falla con un mensaje explícito
en vez de un error críptico — eso es a propósito, y está en `datos/fixtures.js`.

---

## Qué hay acá, y en qué orden leerlo

| Archivo | Qué enseña |
|---|---|
| `01-ingenua.spec.js` | La versión que se lee primero. Pasa, y le falta la mitad |
| `02-corregida.spec.js` | Una línea más y deja de mentir |
| `03-en-capas.spec.js` | Lo mismo, repartido en capas. **Esta es la que importa** |
| `04-integracion-con-doble.spec.js` | La misma herramienta, otro nivel de prueba |

---

## La carpeta ES la arquitectura

No están repartidos así por orden: cada carpeta es una **capa** de las seis que
vimos en clase.

| Capa | Dónde vive acá | Qué cambio absorbe |
|---|---|---|
| **1 · Configuración y ambientes** | `../playwright.config.js` | Cambió la URL, el puerto, el navegador |
| **2 · Datos de prueba** | `datos/fixtures.js` | Cambió el seed, un cupón, un SKU |
| **3 · Acceso al sistema** | `paginas/*.js` | Cambió un `data-testid` o una ruta |
| **4 · Acciones de negocio** | *todavía no hace falta* — ver abajo | Cambió un flujo que cruza varias pantallas |
| **5 · Pruebas** | `*.spec.js` | Cambió **qué** queremos verificar |
| **6 · Ejecución y reporte** | `../playwright.config.js` | Cambió cuándo o cómo se corre |

### ¿Y la capa 4? No está, y es a propósito

Un page object representa **una pantalla**. Los dos pasos de `03-en-capas.spec.js`
—iniciar sesión, agregar al carro— viven cada uno en una sola pantalla, así que su
lugar natural es el page object correspondiente. Envolverlos en una función aparte
sería un archivo y un concepto de más que no ahorran nada.

La capa 4 aparece cuando un flujo **cruza varias pantallas** y se repite:

```js
// acciones/compra.js  —  toca TRES pantallas
export async function comprarHastaElFinal(page, producto) {
  await new PaginaProducto(page).agregarAlCarro(producto);
  await new PaginaCarro(page).irACheckout();
  await new PaginaCheckout(page).completarYPagar(DIRECCION);
  return new PaginaConfirmacion(page).numeroDePedido();
}
```

Eso no cabe en ningún page object sin que uno tenga que saber de los otros.

> **La regla no es de cantidad de capas, es de alcance.**
> Una pantalla → método del page object. Varias → acción de negocio.
>
> No empieces con la capa 4: extráela cuando repitas por tercera vez un flujo
> que toca varias pantallas.

---

Compruébalo: busca `data-testid` en `03-en-capas.spec.js`. **No hay ninguno.**
Busca una URL o un código de cupón literal. Tampoco. Cada cosa está en su capa,
y por eso un cambio típico toca un archivo y no cuarenta.

> **La regla:** el cambio se absorbe en la capa más baja que pueda absorberlo,
> y la capa 5 —las pruebas— no se toca casi nunca.

---

## Las tres lecciones

### 1 · El nombre de una prueba es una promesa

`01-ingenua.spec.js` se llama *"el cupón expirado muestra error"* y verifica que
aparezca el error. Correcto… y a medias: **no verifica que el total no cambió.**

Si mañana el sistema mostrara el mensaje de error *y además* aplicara el
descuento, esa prueba pasaría en verde. Es el antipatrón **The Liar**, y es peor
que no tener la prueba: una ausente se nota, una mentirosa da confianza falsa.

`02-corregida.spec.js` agrega la línea que faltaba. Y cambia el nombre: ya no
describe un síntoma de la pantalla, describe la **regla de negocio**.

### 2 · Las capas no son estética, son el ROI

`02` y `03` verifican exactamente lo mismo. La diferencia aparece el día que
algo cambie:

| | `02-corregida` | `03-en-capas` |
|---|---|---|
| Cambia el `data-testid` del botón | Buscarlo en cada archivo que lo use | Se cambia en `PaginaCarro` |
| ¿La puede revisar un analista funcional? | No | **Sí**: se lee como el negocio |

El segundo punto es el menos obvio y el más importante.

### 3 · El nivel lo decide el aislamiento, no la herramienta

`04-integracion-con-doble.spec.js` usa la misma herramienta que las anteriores y
**no es E2E**: deja la interfaz y casi toda la API reales, pero reemplaza el
servicio de despacho por un doble con `page.route()`. No todo el sistema está en
juego, así que es una prueba de **integración**.

Dos detalles de ese archivo que conviene mirar:

- El doble **respeta el contrato real** (`{ etaLabel, cost }`). Un doble que
  inventa otra forma no prueba nada: prueba una ficción.
- El doble responde algo que el sistema real **no** respondería. Si devolviera
  lo mismo, la prueba pasaría aunque la interceptación nunca hubiera ocurrido —
  otro *Liar*. Por eso hay una aserción que comprueba que el texto del sistema
  real **no** aparece.

---

## Dos cosas que están puestas a propósito

**`workers: 1`.** No es un descuido: es el techo de escalabilidad de esta
solución, por escrito. La estrategia de datos es "resetear el mundo"
(`POST /api/test/reset` sobre un `data.json` compartido), así que dos pruebas en
paralelo se pisarían. Es el mismo motivo por el que el backend corre jest con
`--runInBand`. El día que la suite tarde demasiado, eso **no** se arregla con
una máquina más grande: se arregla en la capa 2.

**`retries: 0`.** Queremos *ver* la intermitencia, no esconderla. Una suite con
reintentos automáticos oculta exactamente la métrica que la propuesta se
compromete a vigilar.

---

## Un detalle para quien compare con las láminas

La lámina de la versión ingenua muestra el bloque recortado. La versión de esta
carpeta agrega un `waitForURL` después del login, porque el login es asíncrono y
sin esa espera el botón "agregar al carro" devuelve a `/login`.

Vale la pena notar **dónde** desaparece esa espera: en `03-en-capas.spec.js` no
está, porque vive en la capa 4. Es un ejemplo pequeño y muy concreto de lo que
las capas te ahorran.
