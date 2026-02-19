const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalAmount: Number,
  status: {
    type: String,
    enum: ["Confirmed", "Cancelled"],
    default: "Confirmed"
  }
});

const carSchema = new mongoose.Schema(
  {
    brand: { type: String, required: true },
    model: { type: String, required: true },
    imageUrl: { type: String, required: true },
    logoUrl: { type: String },
    pricePerDay: { type: Number, required: true },

    status: {
      type: String,
      enum: ["Active", "Maintenance"],
      default: "Active"
    },

    bookings: [bookingSchema]  // 🔥 All bookings stored here
  },
  { timestamps: true }
);

module.exports = mongoose.model("Car", carSchema);
