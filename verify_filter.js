const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/cars';

async function testFilter() {
    try {
        console.log('--- Verification Started ---');

        // 1. Create a car with a specific booked date
        const testDate = '2026-05-20';
        console.log(`Step 1: Creating a test car with bookedDate: ${testDate}`);

        const carData = {
            brand: 'TestBrand',
            model: 'TestModel',
            imageUrl: 'https://via.placeholder.com/150',
            price: 5000,
            status: 'Booked',
            bookedDates: [testDate]
        };

        const createRes = await axios.post(BASE_URL, carData);
        const createdCarId = createRes.data._id;
        console.log(`✅ Created Car ID: ${createdCarId}`);

        // 2. Fetch cars for that date
        console.log(`Step 2: Fetching cars for date: ${testDate}`);
        const filterRes = await axios.get(`${BASE_URL}/date/${testDate}`);
        const cars = filterRes.data;

        const found = cars.some(c => c._id === createdCarId);
        if (found) {
            console.log('✅ Car correctly found in filtered list.');
        } else {
            console.error('❌ Car NOT found in filtered list.');
        }

        // 3. Fetch cars for a different date
        const wrongDate = '2026-05-21';
        console.log(`Step 3: Fetching cars for different date: ${wrongDate}`);
        const wrongRes = await axios.get(`${BASE_URL}/date/${wrongDate}`);
        const wrongCars = wrongRes.data;

        const notFound = !wrongCars.some(c => c._id === createdCarId);
        if (notFound) {
            console.log('✅ Car correctly NOT found in wrong date list.');
        } else {
            console.error('❌ Car UNEXPECTEDLY found in wrong date list.');
        }

        console.log('--- Verification Finished ---');

    } catch (err) {
        console.error('❌ Verification failed:', err.message);
        if (err.response) {
            console.error('Response Data:', err.response.data);
        }
    }
}

testFilter();
