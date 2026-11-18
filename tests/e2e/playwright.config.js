/*
 * CAPA 1 de la arquitectura de automatizacion: configuracion y ambiente.
 * CAPA 6: ejecucion y reporte.
 *
 * Este archivo es el unico lugar donde aparece una URL base o una decision
 * sobre como se ejecuta la suite. Ningun test lo repite.
 */
import { defineConfig, devices } from '@playwright/test';

const FRONTEND = process.env.BASE_URL || 'http://localhost:5173';

export default defineConfig({
  testDir: './demo-clase11',
  timeout: 30_000,
  expect: { timeout: 5_000 },

  /*
   * workers: 1 NO es un descuido, es el techo de escalabilidad de esta
   * solucion, puesto por escrito.
   *
   * La estrategia de datos de este proyecto es "resetear el mundo": el backend
   * comparte un data.json y cada prueba llama a POST /api/test/reset. Mientras
   * el estado sea compartido, dos pruebas en paralelo se pisarian entre si.
   * Es el mismo motivo por el que el backend corre jest con --runInBand.
   *
   * El dia que la suite tarde demasiado, esto NO se arregla con una maquina
   * mas grande ni con un framework mas rapido: se arregla en la capa 2,
   * cambiando la estrategia de datos para que cada prueba cree lo suyo.
   */
  workers: 1,
  fullyParallel: false,

  // En CI, fallar si alguien dejo un test.only olvidado.
  forbidOnly: !!process.env.CI,
  retries: 0,   // a proposito: queremos VER la intermitencia, no esconderla

  reporter: [['list'], ['html', { outputFolder: '../../playwright-report', open: 'never' }]],

  use: {
    baseURL: FRONTEND,
    // Evidencia automatica cuando algo falla: es lo que hace que un fallo
    // se diagnostique sin volver a reproducirlo a mano.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  /*
   * Levanta el frontend solo si no esta corriendo ya.
   * El BACKEND hay que levantarlo aparte (npm run dev en el otro repositorio):
   * si no esta, el beforeEach falla con un mensaje claro desde fixtures.js.
   */
  webServer: {
    command: 'npm run dev',
    url: FRONTEND,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
