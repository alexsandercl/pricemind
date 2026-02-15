const mongoose = require("mongoose");

module.exports = async function connectDB() {
  try {
    const conn = await mongoose.connect(
  process.env.MONGODB_URI || process.env.MONGO_URI  // ← CORRETO (tenta ambos)
);

    console.log(
      `🍃 MongoDB connected: ${conn.connection.host}`
    );
  } catch (error) {
    console.error(
      "❌ MongoDB connection error:",
      error.message
    );
    process.exit(1);
  }
};
