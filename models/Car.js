const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  phone: { type: String, default: "" },
  startDate: { type: Date, required: true, index: true },
  endDate: { type: Date, required: true, index: true },
  totalAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["Confirmed", "Cancelled"],
    default: "Confirmed"
  }
}, { _id: true });

const carSchema = new mongoose.Schema(
  {
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: {
      type: String,
      enum: ["Sedan", "SUV", "Hatchback", "Luxury", "Electric", "MUV"],
      default: "Sedan"
    },
    seats: { type: Number, default: 5 },
    transmission: {
      type: String,
      enum: ["Automatic", "Manual"],
      default: "Manual"
    },
    imageUrl: { type: String, required: true },
    logoUrl: { type: String, default: "" },
    pricePerDay: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["Active", "Maintenance"],
      default: "Active",
      index: true
    },
    bookings: [bookingSchema]
  },
  { timestamps: true }
);

// Compound index for fast date-range overlap queries
carSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Car", carSchema);
