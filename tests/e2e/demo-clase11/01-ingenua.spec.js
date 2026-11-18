/*
 * LAMINA 31-35 DE LA CLASE · la version ingenua, y por que esta incompleta.
 *
 * Esta prueba es la que se lee primero en clase. Funciona, pasa, y tiene un
 * problema que no se ve a simple vista.
 *
 * Fijate en dos cosas buenas antes de criticarla:
 *
 *   1. getByTestId. Esos identificadores YA existen en las 12 paginas del
 *      frontend: es testabilidad disenada a proposito. Un frontend sin ellos
 *      obliga a localizar por posicion o por texto visible, y entonces
 *      cualquier cambio de redaccion rompe la prueba.
 *
 *   2. No hay NI UNA espera. Nada de sleep ni de "esperar 3 segundos".
 *      Playwright, antes de cada clic, verifica solo que el elemento exista,
 *      sea visible, sea estable y este habilitado. Eso es el auto-waiting, y
 *      es la razon numero uno por la que reduce intermitencia.
 */
import { test, expect } from '@playwright/test';
import { resetearSistema, USUARIOS, CUPONES, PRODUCTOS } from './datos/fixtures.js';

test.beforeEach(async ({ request }) => {
  await resetearSistema(request);
});

test('el cupon expirado muestra error', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('email-input').fill(USUARIOS.cliente.email);
  await page.getByTestId('password-input').fill(USUARIOS.cliente.password);
  await page.getByTestId('auth-submit').click();

  /*
   * Esta espera NO aparece en la lamina: ahi el bloque se recorta para que se
   * lea proyectado. Hace falta porque el login es asincrono: si navegamos de
   * inmediato, el token todavia no esta guardado y el boton "agregar al carro"
   * nos devuelve a /login.
   *
   * Fijate en el costo: la prueba tiene que SABER como navega la aplicacion.
   * En 03-en-capas.spec.js esto desaparece, porque vive en la capa 4.
   */
  await page.waitForURL((url) => !url.pathname.startsWith('/login'));

  await page.goto(`/products/${PRODUCTOS.sandalias.id}`);
  await page.getByTestId('add-to-cart-btn').click();
  await page.getByTestId('add-to-cart-message').waitFor();

  await page.goto('/cart');
  await page.getByTestId('coupon-input').fill(CUPONES.expirado);
  await page.getByTestId('apply-coupon-btn').click();

  await expect(page.getByTestId('coupon-error')).toBeVisible();

  /*
   * LA PREGUNTA DE LA CLASE: ¿esta bien esta prueba?
   *
   * Se llama "el cupon expirado muestra error" y verifica que aparezca el
   * error. Correcto. Pero... ¿verifico que el total NO cambio?
   *
   * No. Y si manana el sistema mostrara el mensaje de error Y ADEMAS aplicara
   * el descuento, esta prueba pasaria en verde.
   *
   * Es el antipatron "The Liar": una prueba que pasa sin verificar lo que su
   * nombre promete. Es peor que no tenerla: una prueba ausente se nota, una
   * mentirosa da confianza falsa.
   *
   * La correccion esta en 02-corregida.spec.js.
   */
});
