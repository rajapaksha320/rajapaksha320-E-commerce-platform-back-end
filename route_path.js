const authRoutes = require('./routers/auth_routes/auth_routes');
const storeRoutes = require('./routers/store_route/store_route');
const categoryRoutes = require('./routers/category_routes/category_routes');
const productRoutes = require('./routers/product_routes/product_routes');
const cartRoutes = require('./routers/cart_add_routes/cart_add_routes');

module.exports = (app) => {
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/store', storeRoutes);
  app.use('/api/v1/category', categoryRoutes);
  app.use('/api/v1/product', productRoutes);
  app.use('/api/v1/cart', cartRoutes);
  

  const setupSwaggerDocs = require('./swagger');
  setupSwaggerDocs(app);
};
