const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Gestion Factures',
      version: '1.0.0',
      description: 'API de gestion de factures pour association',
      contact: {
        name: 'Support',
        email: 'support@association.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.RENDER_URL || 'http://localhost:5001',
        description: 'Serveur principal'
      },
      {
        url: 'http://localhost:5001',
        description: 'Serveur de développement'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Entrez votre token JWT'
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'Clé API pour l\'API publique'
        }
      },
      schemas: {
        Client: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Jean Dupont' },
            email: { type: 'string', example: 'jean@example.com' },
            phone: { type: 'string', example: '+237 6XX XXX XXX' },
            address: { type: 'string', example: 'Yaoundé, Cameroun' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Casque Bluetooth' },
            category: { type: 'string', example: 'Informatique' },
            price: { type: 'number', example: 50000 },
            taxRate: { type: 'number', example: 19.25 },
            stock: { type: 'integer', example: 10 }
          }
        },
        Invoice: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            number: { type: 'string', example: 'FACT-260517-0001' },
            clientId: { type: 'integer', example: 1 },
            subtotal: { type: 'number', example: 50000 },
            taxTotal: { type: 'number', example: 9625 },
            total: { type: 'number', example: 59625 },
            status: { type: 'string', enum: ['draft', 'paid', 'cancelled'], example: 'draft' }
          }
        },
        Payment: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            invoiceId: { type: 'integer', example: 1 },
            amount: { type: 'number', example: 59625 },
            method: { type: 'string', enum: ['cash', 'orange_money', 'mtn_money'], example: 'cash' },
            transactionId: { type: 'string', example: 'OM123456789' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Erreur serveur' },
            message: { type: 'string', example: 'Description de l\'erreur' }
          }
        }
      }
    },
    tags: [
      { name: 'Auth', description: 'Authentification' },
      { name: 'Clients', description: 'Gestion des clients' },
      { name: 'Produits', description: 'Gestion des produits' },
      { name: 'Factures', description: 'Gestion des factures' },
      { name: 'Paiements', description: 'Gestion des paiements' },
      { name: 'Statistiques', description: 'Statistiques et rapports' },
      { name: 'API Publique', description: 'API publique avec clé API' }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;