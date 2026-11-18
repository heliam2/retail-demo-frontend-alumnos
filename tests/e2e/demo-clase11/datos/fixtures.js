/*
 * CAPA 2 de la arquitectura de automatizacion: datos de prueba.
 *
 * Ningun test de esta carpeta escribe un codigo de cupon, un email o un id de
 * producto directamente. Todos los piden aca. Si manana cambia el seed del
 * backend, se toca este archivo y ninguno mas.
 *
 * La estrategia de datos de este proyecto es "resetear el mundo": el backend
 * expone POST /api/test/reset y cada prueba parte del seed conocido.
 * Funciona y es simple, pero tiene un costo que conviene tener presente:
 * mientras el estado sea compartido, la suite NO puede correr en paralelo.
 * Ese es el techo de escalabilidad de esta solucion, y esta declarado a
 * proposito en playwright.config.js con workers: 1.
 */

export const API = process.env.API_URL || 'http://localhost:4000/api';

export const USUARIOS = {
  cliente: { email: 'cliente@demo.cl', password: 'Demo1234' },
  admin:   { email: 'admin@demo.cl',   password: 'Admin1234' },
};

/*
 * Los cuatro cupones del seed no son cuatro cualesquiera: son las cuatro
 * clases de equivalencia de la validacion.
 */
export const CUPONES = {
  valido:      'BIENVENIDO10',   // 10%, sin monto minimo
  conMinimo:   'VERANO20',       // 20%, exige subtotal >= 30.000
  expirado:    'EXPIRADO',       // vencio en 2020
  inactivo:    'INACTIVO',       // existe pero esta desactivado
  inexistente: 'NO_EXISTE_123',
};

export const PRODUCTOS = {
  // $18.990: queda bajo el minimo de VERANO20 y bajo el umbral de envio gratis.
  sandalias: { id: 9, sku: 'SKU-009', nombre: 'Sandalias Sport Flex', precio: 18990 },
  // $45.990: supera los dos umbrales.
  zapatillas: { id: 1, sku: 'SKU-001', nombre: 'Zapatillas Urban Runner', precio: 45990 },
};

export const REGLAS = {
  iva: 0.19,
  envio: 3000,
  umbralEnvioGratis: 30000,
};

/**
 * Devuelve el sistema al seed conocido.
 * Se llama en un beforeEach: es lo que hace que cada prueba sea independiente
 * y que el orden de ejecucion no importe.
 */
export async function resetearSistema(request) {
  const res = await request.post(`${API}/test/reset`);
  if (!res.ok()) {
    throw new Error(
      `No se pudo resetear el sistema (${res.status()}). ` +
      `Verifica que el backend este corriendo en ${API}.`
    );
  }
  return res.json();
}
