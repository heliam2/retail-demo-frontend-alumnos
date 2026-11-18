/*
 * CAPA 3: acceso al sistema · pantalla de detalle de producto.
 */
export class PaginaProducto {
  constructor(page) {
    this.page = page;
    this.detalle       = page.getByTestId('product-detail');
    this.nombre        = page.getByTestId('detail-name');
    this.precio        = page.getByTestId('detail-price');
    this.stock         = page.getByTestId('detail-stock');
    this.cantidad      = page.getByTestId('quantity-input');
    this.agregarAlCarro = page.getByTestId('add-to-cart-btn');
    this.mensaje       = page.getByTestId('add-to-cart-message');
  }

  async abrir(productoId) {
    await this.page.goto(`/products/${productoId}`);
    await this.detalle.waitFor();
  }

  async agregar(cantidad = 1) {
    if (cantidad !== 1) await this.cantidad.fill(String(cantidad));
    await this.agregarAlCarro.click();
  }

  mensajeDeConfirmacion() {
    return this.mensaje;
  }
}
