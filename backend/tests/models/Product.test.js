const { Product, sequelize } = require('../../src/models');

describe('Product Model', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Product.destroy({ where: {}, truncate: true });
  });

  test('devrait créer un produit valide', async () => {
    const product = await Product.create({
      name: 'Casque Bluetooth',
      category: 'Informatique',
      description: 'Casque sans fil',
      price: 50000,
      taxRate: 19.25,
      stock: 10,
      minStock: 5
    });

    expect(product.id).toBeDefined();
    expect(product.name).toBe('Casque Bluetooth');
    expect(product.price).toBe(50000);
    expect(product.stock).toBe(10);
    expect(product.minStock).toBe(5);
  });

  test('devrait échouer sans nom', async () => {
    await expect(Product.create({
      price: 50000
    })).rejects.toThrow();
  });

  test('devrait mettre à jour le stock', async () => {
    const product = await Product.create({
      name: 'Test Product',
      price: 10000,
      stock: 5
    });

    await product.update({ stock: 3 });
    expect(product.stock).toBe(3);
  });

  test('devrait détecter le stock bas', async () => {
    const product = await Product.create({
      name: 'Low Stock Product',
      price: 10000,
      stock: 2,
      minStock: 5
    });

    const isLowStock = product.stock < product.minStock;
    expect(isLowStock).toBe(true);
  });
});