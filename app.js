
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const connectDB = require('./db/db');

// Connect to MongoDB
// connectDB()

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from the API!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
