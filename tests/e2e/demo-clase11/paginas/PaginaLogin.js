/*
 * CAPA 3: acceso al sistema.
 *
 * Esta clase es el UNICO lugar del proyecto que conoce los data-testid de la
 * pantalla de login. Si manana el frontend renombra 'auth-submit', se cambia
 * aqui, en un archivo, y todas las pruebas que inician sesion quedan arregladas.
 *
 * Regla de la capa 3: aqui NO hay aserciones. Solo se expone como llegar a los
 * elementos y como operarlos. Que se verifica es decision de la capa 5.
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

  async completar(email, password) {
    await this.email.fill(email);
    await this.password.fill(password);
  }

  async enviarFormulario() {
    await this.enviar.click();
  }

  mensajeDeError() {
    return this.error;
  }
}
