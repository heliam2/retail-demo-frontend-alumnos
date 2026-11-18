/*
 * CAPA 3: acceso al sistema · pantalla del carro.
 *
 * El metodo total() devuelve el texto tal cual lo muestra la pantalla.
 * Es a proposito: la prueba que compara "el total no cambio" no necesita
 * parsear el numero, solo comparar la cadena consigo misma. Menos codigo,
 * menos cosas que se pueden romper.
 */
export class PaginaCarro {
  constructor(page) {
    this.page = page;
    this.tabla        = page.getByTestId('cart-table');
    this.vacio        = page.getByTestId('cart-empty');
    this.resumen      = page.getByTestId('order-summary');
    this.subtotal     = page.getByTestId('cart-subtotal');
    this.descuento    = page.getByTestId('summary-discount');
    this.totalTxt     = page.getByTestId('summary-total');
    this.cupon        = page.getByTestId('coupon-input');
    this.aplicarCupon_ = page.getByTestId('apply-coupon-btn');
    this.errorCupon   = page.getByTestId('coupon-error');
    this.irACheckout  = page.getByTestId('go-to-checkout');
  }

  async abrir() {
    await this.page.goto('/cart');
    await this.resumen.waitFor();
  }

  async total() {
    return (await this.totalTxt.innerText()).trim();
  }

  async aplicarCupon(codigo) {
    await this.cupon.fill(codigo);
    await this.aplicarCupon_.click();
  }

  mensajeDeError() {
    return this.errorCupon;
  }

  totalLocator() {
    return this.totalTxt;
  }
}
