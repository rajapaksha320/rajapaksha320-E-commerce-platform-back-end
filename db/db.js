const mongoose = require('mongoose');

const connectDB = async () => {
    const DB_URL = process.env.DB_URL || 'mongodb://localhost:27017/your_db_name';
  try {
    await mongoose.connect(DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1); // Exit on failure
  }
};

module.exports = connectDB;
