const express = require("express");
const router = express.Router();
const multer = require("multer");
const Car = require("../models/Car");

const storage = multer.memoryStorage();
const upload = multer({ storage });

/* =====================================================
   BOOK CAR
===================================================== */
router.post("/book/:carId", async (req, res) => {
  try {
    const { customerName, startDate, endDate } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({
        message: "End date must be after start date"
      });
    }

    const car = await Car.findById(req.params.carId);

    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    const conflict = car.bookings.some(booking =>
      booking.status === "Confirmed" &&
      booking.startDate <= end &&
      booking.endDate >= start
    );

    if (conflict) {
      return res.status(400).json({
        message: "Car already booked for this range"
      });
    }

    const days =
      Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const totalAmount = days * car.pricePerDay;

    car.bookings.push({
      customerName,
      startDate: start,
      endDate: end,
      totalAmount
    });

    await car.save();

    res.status(201).json({
      message: "Car booked successfully",
      car
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =====================================================
   GET AVAILABLE CARS
   /api/available?start=2026-02-20&end=2026-02-22
===================================================== */
router.get("/available", async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        message: "Start and End dates are required"
      });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    const cars = await Car.find({ status: "Active" });

    const availableCars = cars.filter(car => {
      const overlap = car.bookings.some(booking =>
        booking.status === "Confirmed" &&
        booking.startDate <= endDate &&
        booking.endDate >= startDate
      );

      return !overlap;
    });

    res.json(availableCars);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =====================================================
   ADD CAR
===================================================== */
router.post(
  "/cars",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "logo", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { brand, model, pricePerDay } = req.body;

      let imageUrl;
      let logoUrl;

      if (req.files?.image?.[0]) {
        const file = req.files.image[0];
        imageUrl = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
      }

      if (req.files?.logo?.[0]) {
        const file = req.files.logo[0];
        logoUrl = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
      }

      const car = new Car({
        brand,
        model,
        pricePerDay,
        imageUrl,
        logoUrl,
        bookings: []
      });

      await car.save();

      res.status(201).json(car);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

/* =====================================================
   GET ALL CARS
===================================================== */
router.get("/cars", async (req, res) => {
  try {
    const { start, end, filter } = req.query;

    let query = { status: "Active" };

    // If no date filter → return all cars
    if (!start || !end) {
      const cars = await Car.find().sort({ createdAt: -1 });
      return res.json(cars);
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    // Available Cars Filter
    if (filter === "available" || !filter) {
      query.bookings = {
        $not: {
          $elemMatch: {
            status: "Confirmed",
            startDate: { $lte: endDate },
            endDate: { $gte: startDate }
          }
        }
      };
    }

    // Booked Cars Filter
    if (filter === "booked") {
      query.bookings = {
        $elemMatch: {
          status: "Confirmed",
          startDate: { $lte: endDate },
          endDate: { $gte: startDate }
        }
      };
    }

    const cars = await Car.find(query).sort({ createdAt: -1 });

    res.json(cars);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =====================================================
   GET AVAILABLE CARS BY DATE RANGE
===================================================== */
router.get("/available", async (req, res) => {
  try {
    const { start, end } = req.query;

    const startDate = new Date(start);
    const endDate = new Date(end);

    const cars = await Car.find({ status: "Active" });

    const availableCars = cars.filter(car => {
      const hasOverlap = car.bookings.some(booking =>
        booking.status === "Confirmed" &&
        booking.startDate <= endDate &&
        booking.endDate >= startDate
      );

      return !hasOverlap;
    });

    res.json(availableCars);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =====================================================
   BOOK CAR (Range Based)
===================================================== */
router.post("/book/:carId", async (req, res) => {
  try {
    const { customerName, startDate, endDate } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({
        message: "End date must be after start date"
      });
    }

    const car = await Car.findById(req.params.carId);

    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    // Check overlapping
    const conflict = car.bookings.some(booking =>
      booking.status === "Confirmed" &&
      booking.startDate <= end &&
      booking.endDate >= start
    );

    if (conflict) {
      return res.status(400).json({
        message: "Car already booked in this date range"
      });
    }

    const days =
      Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const totalAmount = days * car.pricePerDay;

    car.bookings.push({
      customerName,
      startDate: start,
      endDate: end,
      totalAmount
    });

    await car.save();

    res.status(201).json({
      message: "Car booked successfully",
      car
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =====================================================
   CANCEL BOOKING
===================================================== */
router.put("/cancel/:carId/:bookingId", async (req, res) => {
  try {
    const car = await Car.findById(req.params.carId);

    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    const booking = car.bookings.id(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.status = "Cancelled";

    await car.save();

    res.json({ message: "Booking cancelled" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
