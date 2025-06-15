
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const connectDB = require('./db/db');
const setupSwaggerDocs = require('./swagger');

// Connect to MongoDB
connectDB();

app.use(express.json());

// Import all route modules
require('./route_path')(app);

app.get('/', (req, res) => {
  res.send('Hello, world!');
});


// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
