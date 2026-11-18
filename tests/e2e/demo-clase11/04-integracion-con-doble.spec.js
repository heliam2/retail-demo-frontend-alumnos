/*
 * LAMINA 20 DE LA CLASE · el nivel no lo decide la herramienta.
 *
 * Las pruebas anteriores de esta carpeta son E2E: interfaz real, API real,
 * datos reales. Esta usa la MISMA herramienta y NO es E2E.
 *
 * Aqui dejamos la interfaz y casi toda la API reales, pero reemplazamos UNA
 * dependencia -el servicio de despacho- por un doble. No todo el sistema esta
 * en juego, asi que esto es una prueba de INTEGRACION, no de sistema.
 *
 *   page.route() intercepta SOLO lo que calza con el patron;
 *   todo lo demas (login, productos, carro) sale a la red normalmente.
 *
 * La leccion: el nivel de una prueba es su LIMITE DE AISLAMIENTO -que dejas
 * real y que reemplazas por un doble-, no la herramienta con que la escribiste.
 *
 * Consecuencia practica para la propuesta: cuando una prueba E2E resulte lenta
 * o intermitente, la primera pregunta no es "¿cambiamos de framework?", sino
 * "¿que parte de esto podemos reemplazar por un doble?".
 */
import { test, expect } from '@playwright/test';
import { PaginaLogin } from './paginas/PaginaLogin.js';
import { PaginaProducto } from './paginas/PaginaProducto.js';
import { resetearSistema, USUARIOS, PRODUCTOS } from './datos/fixtures.js';

test.beforeEach(async ({ request }) => {
  await resetearSistema(request);
});

test('la pantalla pinta el despacho que responde el servicio, sea cual sea', async ({ page }) => {
  await new PaginaLogin(page).iniciarSesionComo(USUARIOS.cliente);

  /*
   * EL DOBLE.
   *
   * Dos decisiones de diseno que vale la pena mirar:
   *
   * 1. Respeta el CONTRATO real del servicio: { etaLabel, cost }. Un doble
   *    que inventa otra forma no prueba nada: prueba una ficcion. Si el
   *    contrato cambia, este doble tiene que cambiar con el -por eso los
   *    dobles son codigo que tambien hay que mantener.
   *
   * 2. Responde algo que el sistema REAL no responderia. Para la comuna
   *    "Providencia" el backend de verdad dice "Llega manana" y envio gratis.
   *    Nuestro doble dice lo contrario a proposito.
   *
   *    ¿Por que? Porque si el doble devolviera lo mismo que el sistema real,
   *    esta prueba pasaria igual AUNQUE LA INTERCEPCION NUNCA HUBIERA
   *    OCURRIDO. Seria otro "Liar": verde sin verificar lo que promete.
   */
  await page.route('**/api/shipping/quote', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        etaLabel: 'Llega en 5 dias habiles',
        cost: 9990,
      }),
    });
  });

  const detalle = new PaginaProducto(page);
  await detalle.abrir(PRODUCTOS.sandalias.id);

  await detalle.cotizarEnvioA('Providencia');

  const resultado = detalle.resultadoDeEnvio();

  // Lo que respondio el doble SI aparece en pantalla...
  await expect(resultado).toBeVisible();
  await expect(resultado).toContainText('Llega en 5 dias habiles');

  // ...y lo que habria respondido el sistema real NO. Esta segunda asercion
  // es la que demuestra que la interceptacion de verdad ocurrio.
  await expect(resultado).not.toContainText('Llega ma');

  /*
   * QUE VERIFICA ESTA PRUEBA, Y QUE NO.
   *
   * Verifica la integracion entre la pantalla y el contrato del servicio:
   * que la pantalla sepa pedir y pintar lo que el servicio responde.
   *
   * NO verifica que el calculo de despacho sea correcto. Eso lo decidimos
   * nosotros al escribir el doble. Un doble responde lo que tu le dijiste que
   * respondiera -por eso una suite no puede ser solo de este nivel: el nivel
   * con piezas reales existe para comprobar que de verdad calzan.
   */
});
