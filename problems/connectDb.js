const mongoose = require("mongoose");

module.exports = async function connectDb() {
  const mongoUri = process.env.MONGO_URI;
  await mongoose.connect(mongoUri);

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured");
  
  };
  console.log("MongoDB connected");
};
