const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Multi-Tenant Blog API',
      version: '1.0.0',
      description: 'API documentation for the multi-tenant blog platform',
    },
    servers: [
      {
        url: 'http://localhost:8080',
        // description: 'Local server',
      },
    ],
  },
  apis: ['./routers/auth_routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwaggerDocs = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = setupSwaggerDocs;
