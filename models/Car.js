const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    brand: { type: String, required: true },
    model: { type: String, required: true },
    imageUrl: { type: String, required: true },
    logoUrl: { type: String }, // Optional logo
    status: {
        type: String,
        enum: ['Available', 'Booked'],
        default: 'Booked'
    },
    price: { type: Number },
    bookingDate: { type: Date }, // Single date (legacy)
    bookedDates: [{ type: String }], // Array of dates in YYYY-MM-DD format
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Car', carSchema);
