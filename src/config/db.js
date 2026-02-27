const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/biogas';
  await mongoose.connect(mongoURI);
  console.log('Connected to MongoDB');
};

module.exports = connectDB;