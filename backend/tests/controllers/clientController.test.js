const request = require('supertest');
const app = require('../../src/app');
const { Client, User, sequelize } = require('../../src/models');

let token;

describe('Client Controller', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    
    // Créer un utilisateur admin
    await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    });

    // Obtenir un token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'admin123'
      });
    token = loginRes.body.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Client.destroy({ where: {}, truncate: true });
  });

  test('POST /api/clients - devrait créer un client', async () => {
    const response = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Jean Dupont',
        email: 'jean@example.com',
        phone: '690000000',
        address: 'Yaoundé'
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Jean Dupont');
    expect(response.body.email).toBe('jean@example.com');
  });

  test('GET /api/clients - devrait retourner la liste des clients', async () => {
    await Client.create({
      name: 'Client 1',
      email: 'client1@example.com'
    });
    await Client.create({
      name: 'Client 2',
      email: 'client2@example.com'
    });

    const response = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
  });

  test('GET /api/clients/:id - devrait retourner un client spécifique', async () => {
    const client = await Client.create({
      name: 'Client Test',
      email: 'test@example.com'
    });

    const response = await request(app)
      .get(`/api/clients/${client.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Client Test');
  });

  test('PUT /api/clients/:id - devrait modifier un client', async () => {
    const client = await Client.create({
      name: 'Original Name',
      email: 'original@example.com'
    });

    const response = await request(app)
      .put(`/api/clients/${client.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Name'
      });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Updated Name');
  });

  test('DELETE /api/clients/:id - devrait supprimer un client', async () => {
    const client = await Client.create({
      name: 'To Delete',
      email: 'delete@example.com'
    });

    const response = await request(app)
      .delete(`/api/clients/${client.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    
    const deleted = await Client.findByPk(client.id);
    expect(deleted).toBeNull();
  });
});