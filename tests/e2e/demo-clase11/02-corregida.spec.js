/*
 * LAMINA 36 DE LA CLASE · la correccion.
 *
 * Una linea mas y la prueba deja de mentir. Fijate tambien en el nombre:
 * ya no describe un sintoma de la pantalla, describe la REGLA DE NEGOCIO.
 *
 *   antes:  "el cupon expirado muestra error"
 *   ahora:  "un cupon expirado no cambia el total"
 *
 * El nombre de una prueba es una promesa. Cuando falle a las 3 de la manana
 * en el pipeline, ese nombre es el diagnostico.
 */
import { test, expect } from '@playwright/test';
import { resetearSistema, USUARIOS, CUPONES, PRODUCTOS } from './datos/fixtures.js';

test.beforeEach(async ({ request }) => {
  await resetearSistema(request);
});

test('un cupon expirado no cambia el total', async ({ page }) => {
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

  // 1 · el total ANTES de tocar nada
  const totalAntes = (await page.getByTestId('summary-total').innerText()).trim();

  await page.getByTestId('coupon-input').fill(CUPONES.expirado);
  await page.getByTestId('apply-coupon-btn').click();

  // 2 · el sistema avisa  (la mitad visible)
  await expect(page.getByTestId('coupon-error')).toBeVisible();

  // 3 · y NO aplico el descuento  (la mitad que importa)
  await expect(page.getByTestId('summary-total')).toHaveText(totalAntes);
});
