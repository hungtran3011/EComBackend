import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import path from 'path';

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'EComApp API',
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
        name: 'x-csrf-token',
        description: 'CSRF token required for requests that modify data',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

// Options for the swagger docs
const options = {
  definition: swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: [
    path.join(__dirname, './routes/*.js'),
    path.join(__dirname, './controllers/*.js'),
    path.join(__dirname, './schemas/*.js'),
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
  // Add custom CSS for CSRF button
  const customCss = `
    .swagger-ui .topbar { display: none }
    .swagger-ui .auth-wrapper .authorize { margin-right: 10px; }
    .csrf-button {
      background-color: #49cc90;
      color: white;
      border: none;
      font-size: 14px;
      padding: 5px 23px;
      border-radius: 4px;
      margin-left: 10px;
      cursor: pointer;
      font-family: sans-serif;
    }
    .csrf-button:hover {
      background-color: #3eb383;
    }
  `;
  
  // Add custom initialization script for adding the CSRF button
  const customJs = `
    window.addEventListener('load', function() {
      // Wait for Swagger UI to fully initialize
      setTimeout(function() {
        const authBtnContainer = document.querySelector('.auth-wrapper .authorize');
        if (authBtnContainer) {
          const csrfBtn = document.createElement('button');
          csrfBtn.className = 'csrf-button';
          csrfBtn.textContent = 'Get CSRF Token';
          csrfBtn.addEventListener('click', async function() {
            try {
              const response = await fetch('/auth/csrf-token', { credentials: 'include' });
              const data = await response.json();
              if (data && data.csrfToken) {
                // Set token in Swagger UI
                const csrfAuth = document.querySelector('.auth-container input[data-name="csrfToken"]');
                if (csrfAuth) {
                  csrfAuth.value = data.csrfToken;
                  // Trigger input event to update the UI
                  csrfAuth.dispatchEvent(new Event('input'));
                }
                alert('CSRF token fetched successfully: ' + data.csrfToken);
              }
            } catch (error) {
              console.error('Error fetching CSRF token:', error);
              alert('Failed to fetch CSRF token');
            }
          });
          
          // Insert button after authorize button
          authBtnContainer.parentNode.insertBefore(csrfBtn, authBtnContainer.nextSibling);
        }
      }, 1000);
    });
  `;

  // Setup Swagger UI with customizations
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: customCss,
    customJs: customJs,
    swaggerOptions: {
      persistAuthorization: true
    }
  }));

  // Route to get swagger.json
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`📚 Swagger docs available at http://localhost:${port}/api-docs`);
};

export default swaggerDocs;
