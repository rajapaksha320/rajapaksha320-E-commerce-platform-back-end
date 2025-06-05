
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const connectDB = require('./db/db');
const setupSwaggerDocs = require('./swagger');

// Import routes
const authRoutes = require('./routers/auth_routes/auth_routes');

// Connect to MongoDB
connectDB();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

// Use routes
app.use('/api/v1/auth', authRoutes);

// Swagger
setupSwaggerDocs(app);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
