import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'EComApp API Documentation',
    version: '1.0.0',
    description: 'API documentation for the EComApp Backend',
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    contact: {
      name: 'Hung Tran',
      email: 'hungtran30112004@gmail.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:8080/api',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      csrfToken: {
        type: 'apiKey',
        in: 'header',
        name: 'csrf-token',
        description: 'CSRF token for secure requests'
      }
    },
    schemas: {
      Product: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number' },
          category: { type: 'string', description: 'Reference to category ID' },
          fields: {
            type: 'array',
            items: { $ref: '#/components/schemas/FieldDefinition' }
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      FieldDefinition: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { 
            type: 'string',
            enum: ['String', 'Number', 'Date', 'Boolean', 'ObjectId', 'Array', 'Mixed']
          },
          required: { type: 'boolean', default: false }
        }
      },
      Category: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          fields: {
            type: 'array',
            items: { $ref: '#/components/schemas/FieldDefinition' }
          }
        }
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phoneNumber: { type: 'string' },
          address: { $ref: '#/components/schemas/Address' },
          role: { 
            type: 'string', 
            enum: ['customer', 'admin', 'anon'],
            default: 'anon'
          },
          isRegistered: { type: 'boolean', default: false },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Address: {
        type: 'object',
        properties: {
          homeNumber: { type: 'string' },
          street: { type: 'string' },
          district: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          province: { type: 'string' }
        }
      },
      Order: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/OrderItem' }
          },
          user: { type: 'string', description: 'Reference to user ID' },
          status: { 
            type: 'string',
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
            default: 'pending'
          },
          shippingAddress: { $ref: '#/components/schemas/ShippingAddress' },
          paymentDetails: { $ref: '#/components/schemas/PaymentDetails' },
          totalAmount: { type: 'number', minimum: 0 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      OrderItem: {
        type: 'object',
        properties: {
          product: { type: 'string', description: 'Reference to product ID' },
          quantity: { type: 'integer', minimum: 1 },
          voucher: { type: 'string' },
          note: { type: 'string' },
          unitPrice: { type: 'number' },
          deliveryDate: { type: 'string', format: 'date-time' },
          deliveryFee: { type: 'number' }
        }
      },
      ShippingAddress: {
        type: 'object',
        properties: {
          home: { type: 'string' },
          street: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          zip: { type: 'string' },
          country: { type: 'string' }
        }
      },
      PaymentDetails: {
        type: 'object',
        properties: {
          method: { 
            type: 'string',
            enum: ['cash', 'card', 'paypal', 'stripe', 'momo', 'zalo', 'bank']
          },
          transactionId: { type: 'string' }
        }
      },
      Cart: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/CartItem' }
          },
          user: { type: 'string', description: 'Reference to user ID' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      CartItem: {
        type: 'object',
        properties: {
          product: { type: 'string', description: 'Reference to product ID' },
          quantity: { type: 'integer', minimum: 1 }
        }
      },
      StorageItem: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          product: { type: 'string', description: 'Reference to product ID' },
          quantity: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string' }
        }
      }
    }
  },
  tags: [
    { name: 'Products', description: 'Product operations' },
    { name: 'Categories', description: 'Category operations' },
    { name: 'Orders', description: 'Order management' },
    { name: 'Cart', description: 'Shopping cart operations' },
    { name: 'Auth', description: 'Authentication operations' },
    { name: 'Users', description: 'User management' },
    { name: 'Storage', description: 'Inventory management' }
  ]
};

// Options for the swagger docs
const options = {
  swaggerDefinition,
  apis: [
    './src/modules/**/*.controller.js',
    './src/modules/**/*.route.js',
    './src/modules/**/*.js',
    './src/common/**/*.js',
    './src/config/**/*.js',
  ],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

/**
 * Sets up Swagger documentation for the Express application
 * @param {express.Application} app - Express application
 * @param {number} port - Server port number
 */
const swaggerDocs = (app, port) => {
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
    explorer: true,
    // customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none', // Collapse endpoints by default
      filter: true, // Add a search field
      tryItOutEnabled: false, // Don't enable "Try it out" by default
    },
    // IMPORTANT: Removed any custom JS that might cause conflicts
  }));

  // Route to get swagger.json
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`📚 Swagger docs available at http://localhost:${port}/api-docs`);
};

export default swaggerDocs;
