/*
 * LAMINA 40 DE LA CLASE · la misma prueba, con page objects.
 *
 * Verifica EXACTAMENTE lo mismo que 02-corregida.spec.js. La diferencia no
 * esta en lo que comprueba, sino en que pasa el dia que cambie algo:
 *
 *   | si cambia el data-testid del boton | hay que buscarlo en cada archivo | se cambia en PaginaCarro |
 *   | ¿la puede revisar un analista?     | no                               | si: se lee como el negocio |
 *
 * Y ese segundo efecto es el menos obvio y el mas importante. Esta prueba se
 * lee asi: "inicia sesion, agrega al carro, aplica un cupon expirado, el total
 * no cambia". Eso lo revisa alguien que no sabe programar.
 *
 * Fijate en que NO aparece ni un data-testid, ni una URL, ni un codigo de
 * cupon literal. Cada cosa vive en su capa.
 */
import { test, expect } from '@playwright/test';
import { PaginaLogin } from './paginas/PaginaLogin.js';
import { PaginaProducto } from './paginas/PaginaProducto.js';
import { PaginaCarro } from './paginas/PaginaCarro.js';
import { resetearSistema, USUARIOS, CUPONES, PRODUCTOS } from './datos/fixtures.js';

test.beforeEach(async ({ request }) => {
  await resetearSistema(request);                                       // capa 2
});

test('un cupon expirado no cambia el total', async ({ page }) => {
  await new PaginaLogin(page).iniciarSesionComo(USUARIOS.cliente);      // capa 3
  await new PaginaProducto(page).agregarAlCarro(PRODUCTOS.sandalias);   // capa 3

  const carro = new PaginaCarro(page);
  await carro.abrir();
  const totalAntes = await carro.total();

  await carro.aplicarCupon(CUPONES.expirado);                           // capa 2 + 3

  await expect(carro.mensajeDeError()).toBeVisible();                   // capa 5
  await expect(carro.totalLocator()).toHaveText(totalAntes);
});

test('un cupon valido si cambia el total', async ({ page }) => {
  /*
   * El contrapeso del caso anterior. Si solo verificaramos que el total no
   * cambia con cupones malos, una pantalla que IGNORARA todos los cupones
   * pasaria la suite entera. Hay que comprobar tambien que el camino feliz
   * efectivamente hace algo.
   */
  await new PaginaLogin(page).iniciarSesionComo(USUARIOS.cliente);
  await new PaginaProducto(page).agregarAlCarro(PRODUCTOS.sandalias);

  const carro = new PaginaCarro(page);
  await carro.abrir();
  const totalAntes = await carro.total();

  await carro.aplicarCupon(CUPONES.valido);

  await expect(carro.mensajeDeError()).toBeHidden();
  await expect(carro.totalLocator()).not.toHaveText(totalAntes);
});

/*
 * ¿Y LA CAPA 4, LA DE ACCIONES DE NEGOCIO?
 *
 * Aqui no hace falta, y vale la pena entender por que.
 *
 * Un page object representa UNA pantalla. Los dos pasos de arriba -iniciar
 * sesion, agregar al carro- viven cada uno en una sola pantalla, asi que su
 * lugar natural es el page object correspondiente. Envolverlos en una funcion
 * aparte seria un archivo y un concepto de mas que no ahorran nada.
 *
 * La capa 4 aparece cuando un flujo CRUZA VARIAS pantallas y se repite:
 *
 *   // acciones/compra.js
 *   export async function comprarHastaElFinal(page, producto) {
 *     await new PaginaProducto(page).agregarAlCarro(producto);
 *     await new PaginaCarro(page).irACheckout();
 *     await new PaginaCheckout(page).completarYPagar(DIRECCION);
 *     return new PaginaConfirmacion(page).numeroDePedido();
 *   }
 *
 * Eso no cabe en ningun page object sin que uno tenga que saber de los otros,
 * y ahi es donde la capa 4 deja de ser ceremonia.
 *
 * La regla, entonces, no es de cantidad de capas sino de ALCANCE:
 *   una pantalla  -> metodo del page object
 *   varias        -> accion de negocio
 *
 * No empieces con la capa 4. Extraela cuando repitas por tercera vez un flujo
 * que toca varias pantallas.
 */
