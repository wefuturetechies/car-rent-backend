require('dotenv').config({ path: __dirname + '/.env', override: true });
console.log("ENV LOADED:", process.env.MONGODB_URI);
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve uploaded files



// Robust Database Connection
const connectDB = async () => {
    const uris = [
        process.env.MONGODB_URI
    ].filter(Boolean); // Create a list of URIs to try

    for (const uri of uris) {
        try {
            console.log(`Attempting to connect to: ${uri}`);
            await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
            console.log(`✅ MongoDB Connected Successfully to: ${uri}`);
            return; // Connection successful, exit function
        } catch (err) {
            console.error(`❌ Failed to connect to ${uri}: ${err.message}`);
        }
    }
    console.error('🔥 ALL CONNECTION ATTEMPTS FAILED. Is MongoDB running?');
    // We do not exit process so the server keeps running and maybe user starts DB later
};

connectDB();

// Routes
app.use('/api', require('./routes/cars'));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
