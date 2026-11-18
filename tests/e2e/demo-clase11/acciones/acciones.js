/*
 * CAPA 4: acciones de negocio.
 *
 * Aqui viven los verbos que entiende cualquier persona del equipo, aunque no
 * sepa programar: "iniciar sesion como cliente", "agregar al carro".
 *
 * Dos reglas de esta capa:
 *   1. NO hay aserciones. Una accion hace algo; verificar es de la capa 5.
 *   2. NO hay data-testid. Los localizadores son de la capa 3.
 *
 * Gracias a esto, si manana el checkout gana un paso nuevo, se arregla aqui
 * y ninguna prueba cambia.
 */
import { PaginaLogin } from '../paginas/PaginaLogin.js';
import { PaginaProducto } from '../paginas/PaginaProducto.js';
import { USUARIOS } from '../datos/fixtures.js';

export async function iniciarSesionComoCliente(page) {
  const login = new PaginaLogin(page);
  await login.abrir();
  await login.completar(USUARIOS.cliente.email, USUARIOS.cliente.password);
  await login.enviarFormulario();
  // Al autenticarse, la app navega a la ruta de origen (por defecto "/").
  await page.waitForURL((url) => !url.pathname.startsWith('/login'));
}

export async function agregarAlCarro(page, producto, cantidad = 1) {
  const detalle = new PaginaProducto(page);
  await detalle.abrir(producto.id);
  await detalle.agregar(cantidad);
  await detalle.mensajeDeConfirmacion().waitFor();
}
