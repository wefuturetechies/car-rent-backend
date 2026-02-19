const mongoose = require('mongoose');
const Car = require('./models/Car');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/car_fleet')
    .then(() => console.log('MongoDB Connected for Seeding'))
    .catch(err => console.error(err));

const sampleCars = [
    {
        brand: 'Koenigsegg',
        model: 'Jesko',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Koenigsegg_Jesko_at_Goodwood_Festival_of_Speed_2019_%2848265538872%29.jpg/1200px-Koenigsegg_Jesko_at_Goodwood_Festival_of_Speed_2019_%2848265538872%29.jpg',
        status: 'Booked',
        price: 3000000
    },
    {
        brand: 'Nissan',
        model: 'GT-R',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Nissan_GT-R_2024_01.jpg',
        status: 'Booked',
        price: 115000
    },
    {
        brand: 'Rolls-Royce',
        model: 'Boat Tail',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Rolls-Royce_Boat_Tail.jpg/1200px-Rolls-Royce_Boat_Tail.jpg',
        status: 'Booked',
        price: 28000000
    },
    {
        brand: 'Toyota',
        model: 'Rush',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/2019_Toyota_Rush_1.5_S_TRD_Sportivo_F800LE_%2820190314%29.jpg/1200px-2019_Toyota_Rush_1.5_S_TRD_Sportivo_F800LE_%2820190314%29.jpg',
        status: 'Booked',
        price: 25000
    },
    {
        brand: 'Honda',
        model: 'CR-V',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/2018_Honda_CR-V_EX-L_AWD%2C_front_11.2.19.jpg/1200px-2018_Honda_CR-V_EX-L_AWD%2C_front_11.2.19.jpg',
        status: 'Booked',
        price: 32000
    },
    {
        brand: 'Daihatsu',
        model: 'Terios',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/2018_Daihatsu_Terios_1.5_R_Deluxe_F800RG_%2820180226%29.jpg/1200px-2018_Daihatsu_Terios_1.5_R_Deluxe_F800RG_%2820180226%29.jpg',
        status: 'Booked',
        price: 22000
    }
];

const seedDB = async () => {
    await Car.deleteMany({});
    await Car.insertMany(sampleCars);
    console.log('Database seeded successfully!');
    mongoose.connection.close();
};

seedDB();
