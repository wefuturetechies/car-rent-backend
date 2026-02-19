const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/car_fleet';
console.log('Testing connection to:', uri);

mongoose.connect(uri)
    .then(async () => {
        console.log('MongoDB Connected Successfully');

        // Define a schema that matches what we expect, but loose to allow flexibility
        const carSchema = new mongoose.Schema({
            brand: String,
            model: String,
            price: Number,
            imageUrl: String,
            status: String
        }, { strict: false }); // strict: false allows us to see fields not in schema

        const Car = mongoose.model('Car', carSchema);

        const count = await Car.countDocuments();
        console.log(`Found ${count} cars in database.`);

        const cars = await Car.find({});
        console.log('Cars:', JSON.stringify(cars, null, 2));

        mongoose.connection.close();
    })
    .catch(err => {
        console.error('Connection Failed:', err);
    });
