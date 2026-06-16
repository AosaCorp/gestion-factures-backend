const { User, sequelize } = require('../../src/models');
const bcrypt = require('bcrypt');

describe('User Model', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await User.destroy({ where: {}, truncate: true });
  });

  test('devrait créer un utilisateur valide', async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'admin'
    });

    expect(user.id).toBeDefined();
    expect(user.name).toBe('Test User');
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('admin');
  });

  test('devrait hacher le mot de passe', async () => {
    const user = await User.create({
      name: 'Test User 2',
      email: 'test2@example.com',
      password: 'secret123',
      role: 'user'
    });

    expect(user.password).not.toBe('secret123');
    expect(await bcrypt.compare('secret123', user.password)).toBe(true);
  });

  test('devrait échouer avec email dupliqué', async () => {
    await User.create({
      name: 'User 1',
      email: 'duplicate@example.com',
      password: 'pass123',
      role: 'user'
    });

    await expect(User.create({
      name: 'User 2',
      email: 'duplicate@example.com',
      password: 'pass456',
      role: 'user'
    })).rejects.toThrow();
  });
});