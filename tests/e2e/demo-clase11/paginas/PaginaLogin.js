/*
 * CAPA 3: acceso al sistema · pantalla de inicio de sesion.
 *
 * Esta clase es el UNICO lugar del proyecto que conoce los data-testid de esta
 * pantalla. Si manana el frontend renombra 'auth-submit', se cambia aqui, en un
 * archivo, y todas las pruebas que inician sesion quedan arregladas.
 *
 * Un page object representa UNA pantalla, y expone:
 *   - como llegar a sus elementos  (los localizadores de arriba)
 *   - que se puede HACER en ella   (los metodos de abajo)
 *
 * Lo que NO lleva: aserciones. Que se verifica lo decide la prueba (capa 5).
 */
export class PaginaLogin {
  constructor(page) {
    this.page = page;
    this.formulario = page.getByTestId('auth-form');
    this.email      = page.getByTestId('email-input');
    this.password   = page.getByTestId('password-input');
    this.enviar     = page.getByTestId('auth-submit');
    this.error      = page.getByTestId('auth-error');
  }

  async abrir() {
    await this.page.goto('/login');
    await this.formulario.waitFor();
  }

  /**
   * Inicia sesion y espera a que la aplicacion haya salido de /login.
   *
   * Esa espera es necesaria: el login es asincrono, y sin ella la siguiente
   * accion se ejecuta antes de que el token este guardado.
   */
  async iniciarSesionComo(usuario) {
    await this.abrir();
    await this.email.fill(usuario.email);
    await this.password.fill(usuario.password);
    await this.enviar.click();
    await this.page.waitForURL((url) => !url.pathname.startsWith('/login'));
  }

  /** Para los casos negativos: credenciales malas y el formulario se queda. */
  async intentarSesionCon(email, password) {
    await this.abrir();
    await this.email.fill(email);
    await this.password.fill(password);
    await this.enviar.click();
  }

  mensajeDeError() {
    return this.error;
  }
}
