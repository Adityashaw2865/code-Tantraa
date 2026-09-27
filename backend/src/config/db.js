const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set in .env');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri);

  console.log(`[db] MongoDB connected -> ${mongoose.connection.name}`);

  mongoose.connection.on('error', (err) => {
    console.error('[db] connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[db] disconnected');
  });
}

module.exports = { connectDB };
