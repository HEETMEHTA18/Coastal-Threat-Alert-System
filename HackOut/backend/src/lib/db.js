const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        // Extract hostname from MongoDB URI for logging
        const uri = process.env.MONGODB_URI;
        const hostMatch = uri ? uri.match(/@([^/:]+)/) : null;
        const host = hostMatch ? hostMatch[1] : 'unknown-host';
        console.log(`✅ MongoDB connected: ${host}`);
    } catch (error) {
        console.error("❌ MongoDB error:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
