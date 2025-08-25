// import mongoose from "mongoose";
const mongoose = require("mongoose");




const connectDb = async () => {
  const MONGODB_URI =
    process.env.MONGODB_URI ||
    "mongodb+srv://your-username:your-password@cluster0.mongodb.net/library-management?retryWrites=true&w=majority";
  const JWT_SECRET =
    process.env.JWT_SECRET ||
    "your-super-secret-jwt-key-change-this-in-production";

  mongoose
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000
    })

    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((error) => console.error("❌ MongoDB connection error:", error));
    
}
  

// export default connectDb
module.exports = connectDb;