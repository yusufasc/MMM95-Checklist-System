const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // .env'de MONGO_URI yoksa default olarak mmm-checklist kullan
    const mongoURI =
      process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist';

    await mongoose.connect(mongoURI);
    console.log(`MongoDB bağlantısı başarılı: ${mongoURI}`);
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
