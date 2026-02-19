const mongoose = require('mongoose');

const uris = [
    'mongodb://127.0.0.1:27017/car_fleet',
    'mongodb://localhost:27017/car_fleet',
    'mongodb://0.0.0.0:27017/car_fleet'
];

async function testConnection(uri) {
    console.log(`\nTesting: ${uri}`);
    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
        console.log('✅ SUCCESS! Connected to:', uri);
        await mongoose.connection.close();
        return true;
    } catch (err) {
        console.log('❌ FAILED:', err.message);
        return false;
    }
}

async function runDiagnostics() {
    console.log('Starting MongoDB Diagnostics...');
    for (const uri of uris) {
        const success = await testConnection(uri);
        if (success) {
            console.log('\nRECOMMENDATION: Update your .env file to use:', uri);
            return;
        }
    }
    console.log('\nALL CONNECTIONS FAILED. Please ensure MongoDB is running.');
}

runDiagnostics();
