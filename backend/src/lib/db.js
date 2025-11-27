const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is not set! Please configure it in Render dashboard.');
        }
        
        console.log('🔌 Connecting to MongoDB...');
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
        });
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error.message);
        console.error("💡 Troubleshooting:");
        console.error("   1. Check MONGODB_URI is set in Render dashboard");
        console.error("   2. Verify MongoDB Atlas allows connections from 0.0.0.0/0");
        console.error("   3. Check MongoDB cluster is running");
        process.exit(1);
    }
};

module.exports = connectDB;
