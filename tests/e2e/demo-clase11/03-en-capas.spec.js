/*
 * LAMINAS 38-39 DE LA CLASE · la misma prueba, en capas.
 *
 * Verifica EXACTAMENTE lo mismo que 02-corregida.spec.js. La diferencia no
 * esta en lo que comprueba, sino en que pasa el dia que cambie algo:
 *
 *   | si cambia el data-testid del boton | hay que buscarlo en cada archivo | se cambia en PaginaCarro |
 *   | ¿la puede revisar un analista?     | no                               | si: se lee como el negocio |
 *
 * Y ese segundo efecto es el menos obvio y el mas importante. Esta prueba se
 * lee asi: "inicia sesion, agrega al carro, aplica un cupon expirado, el total
 * no cambia". Eso lo revisa alguien que no sabe programar. La version anterior,
 * no.
 *
 * Fijate en que NO aparece ni un data-testid, ni una URL, ni un codigo de
 * cupon literal. Cada cosa vive en su capa.
 */
import { test, expect } from '@playwright/test';
import { iniciarSesionComoCliente, agregarAlCarro } from './acciones/acciones.js';
import { PaginaCarro } from './paginas/PaginaCarro.js';
import { resetearSistema, CUPONES, PRODUCTOS } from './datos/fixtures.js';

test.beforeEach(async ({ request }) => {
  await resetearSistema(request);                      // capa 2
});

test('un cupon expirado no cambia el total', async ({ page }) => {
  await iniciarSesionComoCliente(page);                // capa 4
  await agregarAlCarro(page, PRODUCTOS.sandalias);     // capa 4

  const carro = new PaginaCarro(page);                 // capa 3
  await carro.abrir();
  const totalAntes = await carro.total();

  await carro.aplicarCupon(CUPONES.expirado);          // capa 2 + capa 3

  await expect(carro.mensajeDeError()).toBeVisible();  // capa 5
  await expect(carro.totalLocator()).toHaveText(totalAntes);
});

test('un cupon valido si cambia el total', async ({ page }) => {
  /*
   * El contrapeso del caso anterior. Si solo verificaramos que el total no
   * cambia con cupones malos, una pantalla que IGNORARA todos los cupones
   * pasaria la suite entera. Hay que comprobar tambien que el camino feliz
   * efectivamente hace algo.
   */
  await iniciarSesionComoCliente(page);
  await agregarAlCarro(page, PRODUCTOS.sandalias);

  const carro = new PaginaCarro(page);
  await carro.abrir();
  const totalAntes = await carro.total();

  await carro.aplicarCupon(CUPONES.valido);

  await expect(carro.mensajeDeError()).toBeHidden();
  await expect(carro.totalLocator()).not.toHaveText(totalAntes);
});
