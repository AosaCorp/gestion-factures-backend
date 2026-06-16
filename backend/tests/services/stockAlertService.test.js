const { Product, sequelize } = require('../../src/models');
const stockAlertService = require('../../src/services/stockAlertService');

describe('Stock Alert Service', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Product.destroy({ where: {}, truncate: true });
  });

  test('checkLowStock - devrait retourner les produits en stock bas', async () => {
    await Product.create({
      name: 'Stock Normal',
      price: 10000,
      stock: 10,
      minStock: 5,
      type: 'product'
    });
    await Product.create({
      name: 'Stock Bas',
      price: 20000,
      stock: 2,
      minStock: 5,
      type: 'product'
    });

    const lowStock = await stockAlertService.checkLowStock();
    expect(lowStock).toHaveLength(1);
    expect(lowStock[0].name).toBe('Stock Bas');
    expect(lowStock[0].stock).toBe(2);
  });

  test('getStockAlertStats - devrait retourner les statistiques', async () => {
    await Product.create({
      name: 'Product 1',
      price: 10000,
      stock: 10,
      minStock: 5,
      type: 'product'
    });
    await Product.create({
      name: 'Product 2',
      price: 20000,
      stock: 2,
      minStock: 5,
      type: 'product'
    });
    await Product.create({
      name: 'Product 3',
      price: 30000,
      stock: 0,
      minStock: 5,
      type: 'product'
    });

    const stats = await stockAlertService.getStockAlertStats();
    expect(stats.totalProducts).toBe(3);
    expect(stats.lowStockCount).toBe(2);
    expect(stats.outOfStockCount).toBe(1);
  });

  test('updateMinStock - devrait modifier le seuil d\'alerte', async () => {
    const product = await Product.create({
      name: 'Test Product',
      price: 10000,
      stock: 10,
      minStock: 5,
      type: 'product'
    });

    const updated = await stockAlertService.updateMinStock(product.id, 3);
    expect(updated.minStock).toBe(3);
  });
});