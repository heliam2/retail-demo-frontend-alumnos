/*
 * CAPA 3: acceso al sistema · pantalla de detalle de producto.
 */
export class PaginaProducto {
  constructor(page) {
    this.page = page;
    this.detalle        = page.getByTestId('product-detail');
    this.nombre         = page.getByTestId('detail-name');
    this.precio         = page.getByTestId('detail-price');
    this.stock          = page.getByTestId('detail-stock');
    this.cantidad       = page.getByTestId('quantity-input');
    this.botonAgregar   = page.getByTestId('add-to-cart-btn');
    this.mensaje        = page.getByTestId('add-to-cart-message');
    this.comuna         = page.getByTestId('shipping-comuna-input');
    this.cotizarEnvio   = page.getByTestId('shipping-quote-btn');
    this.resultadoEnvio = page.getByTestId('shipping-result');
  }

  async abrir(productoId) {
    await this.page.goto(`/products/${productoId}`);
    await this.detalle.waitFor();
  }

  /** Abre el producto, lo agrega y espera la confirmacion en pantalla. */
  async agregarAlCarro(producto, cantidad = 1) {
    await this.abrir(producto.id);
    if (cantidad !== 1) await this.cantidad.fill(String(cantidad));
    await this.botonAgregar.click();
    await this.mensaje.waitFor();
  }

  async cotizarEnvioA(comuna) {
    await this.comuna.fill(comuna);
    await this.cotizarEnvio.click();
  }

  resultadoDeEnvio() {
    return this.resultadoEnvio;
  }

  mensajeDeConfirmacion() {
    return this.mensaje;
  }
}
