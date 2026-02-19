const express = require("express");
const router = express.Router();
const multer = require("multer");
const Car = require("../models/Car");

// Multer — store images as base64 in DB (no filesystem dependency)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  }
});

const fileToBase64 = (file) =>
  `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

/* =========================================================
   STATS — GET /api/stats?start=&end=
   Returns: { total, available, booked }
========================================================= */
router.get("/stats", async (req, res) => {
  try {
    const { start, end } = req.query;

    const total = await Car.countDocuments({ status: "Active" });

    if (!start || !end) {
      return res.json({ total, available: total, booked: 0 });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    const booked = await Car.countDocuments({
      status: "Active",
      bookings: {
        $elemMatch: {
          status: "Confirmed",
          startDate: { $lte: endDate },
          endDate: { $gte: startDate }
        }
      }
    });

    res.json({ total, available: total - booked, booked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================================================
   GET ALL CARS — GET /api/cars?start=&end=&filter=all|available|booked
   One dynamic endpoint — MongoDB filtering, no JS filtering
========================================================= */
router.get("/cars", async (req, res) => {
  try {
    const { start, end, filter = "all" } = req.query;

    // No dates → return all cars
    if (!start || !end) {
      const cars = await Car.find({ status: "Active" })
        .sort({ createdAt: -1 })
        .select("-__v");
      return res.json(cars);
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate > endDate) {
      return res.status(400).json({ message: "Start date must be before end date" });
    }

    const overlapCondition = {
      $elemMatch: {
        status: "Confirmed",
        startDate: { $lte: endDate },
        endDate: { $gte: startDate }
      }
    };

    let query = { status: "Active" };

    if (filter === "available") {
      query.bookings = { $not: overlapCondition };
    } else if (filter === "booked") {
      query.bookings = overlapCondition;
    }
    // filter === "all" → no bookings filter, return everything

    const cars = await Car.find(query)
      .sort({ createdAt: -1 })
      .select("-__v");

    res.json(cars);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================================================
   GET SINGLE CAR — GET /api/cars/:id
========================================================= */
router.get("/cars/:id", async (req, res) => {
  try {
    const car = await Car.findById(req.params.id).select("-__v");
    if (!car) return res.status(404).json({ message: "Car not found" });
    res.json(car);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================================================
   ADD CAR — POST /api/cars
========================================================= */
router.post(
  "/cars",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "logo", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { brand, model, pricePerDay, description, category, seats, transmission } = req.body;

      if (!brand || !model || !pricePerDay) {
        return res.status(400).json({ message: "Brand, model, and price are required" });
      }

      // Image: prefer file upload, fallback to URL
      let imageUrl = req.body.imageUrl || "";
      if (req.files?.image?.[0]) {
        imageUrl = fileToBase64(req.files.image[0]);
      }

      if (!imageUrl) {
        return res.status(400).json({ message: "Car image is required (file or URL)" });
      }

      let logoUrl = req.body.logoUrl || "";
      if (req.files?.logo?.[0]) {
        logoUrl = fileToBase64(req.files.logo[0]);
      }

      const car = new Car({
        brand: brand.trim(),
        model: model.trim(),
        description: description?.trim() || "",
        category: category || "Sedan",
        seats: parseInt(seats) || 5,
        transmission: transmission || "Manual",
        pricePerDay: parseFloat(pricePerDay),
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

/* =========================================================
   DELETE CAR — DELETE /api/cars/:id
========================================================= */
router.delete("/cars/:id", async (req, res) => {
  try {
    const car = await Car.findByIdAndDelete(req.params.id);
    if (!car) return res.status(404).json({ message: "Car not found" });
    res.json({ message: "Car deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================================================
   TOGGLE CAR STATUS — PUT /api/cars/:id/status
   Toggles between Active ↔ Maintenance
========================================================= */
router.put("/cars/:id/status", async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: "Car not found" });

    // Toggle between Active and Maintenance
    car.status = car.status === "Active" ? "Maintenance" : "Active";
    await car.save();

    res.json({ message: `Car marked as ${car.status}`, status: car.status, car });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================================================
   TOGGLE BOOKING STATUS — PUT /api/cars/:carId/bookings/:bookingId/toggle
   Toggles booking between Confirmed ↔ Cancelled
========================================================= */
router.put("/cars/:carId/bookings/:bookingId/toggle", async (req, res) => {
  try {
    const car = await Car.findById(req.params.carId);
    if (!car) return res.status(404).json({ message: "Car not found" });

    const booking = car.bookings.id(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = booking.status === "Confirmed" ? "Cancelled" : "Confirmed";
    await car.save();

    res.json({ message: `Booking ${booking.status}`, booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================================================
   BOOK CAR — POST /api/book/:carId
   Uses MongoDB-level conflict check, then atomic save
   pricePerDay can be passed from request body (overrides car price)
========================================================= */
router.post("/book/:carId", async (req, res) => {
  try {
    const { customerName, phone, startDate, endDate, pricePerDay: bodyPrice } = req.body;

    if (!customerName) {
      return res.status(400).json({ message: "Customer name is required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({ message: "Invalid dates provided" });
    }

    if (start > end) {
      return res.status(400).json({ message: "End date must be after start date" });
    }

    // Atomic check: find the car only if it has NO overlapping confirmed bookings
    const availableCar = await Car.findOne({
      _id: req.params.carId,
      status: "Active",
      bookings: {
        $not: {
          $elemMatch: {
            status: "Confirmed",
            startDate: { $lte: end },
            endDate: { $gte: start }
          }
        }
      }
    });

    if (!availableCar) {
      // Check if car exists at all
      const carExists = await Car.findById(req.params.carId);
      if (!carExists) {
        return res.status(404).json({ message: "Car not found" });
      }
      return res.status(409).json({
        message: "This car is already booked for the selected dates. Please choose different dates."
      });
    }

    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const effectivePrice = bodyPrice ? parseFloat(bodyPrice) : (availableCar.pricePerDay || 0);
    const totalAmount = days * effectivePrice;

    availableCar.bookings.push({
      customerName: customerName.trim(),
      phone: phone?.trim() || "",
      startDate: start,
      endDate: end,
      totalAmount
    });

    await availableCar.save();

    res.status(201).json({
      message: "Car booked successfully! 🎉",
      booking: availableCar.bookings[availableCar.bookings.length - 1],
      totalAmount,
      days
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================================================
   CANCEL BOOKING — PUT /api/cancel/:carId/:bookingId
========================================================= */
router.put("/cancel/:carId/:bookingId", async (req, res) => {
  try {
    const car = await Car.findById(req.params.carId);
    if (!car) return res.status(404).json({ message: "Car not found" });

    const booking = car.bookings.id(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.status === "Cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    booking.status = "Cancelled";
    await car.save();

    res.json({ message: "Booking cancelled successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================================================
   GET BOOKINGS FOR A CAR — GET /api/cars/:id/bookings
========================================================= */
router.get("/cars/:id/bookings", async (req, res) => {
  try {
    const car = await Car.findById(req.params.id).select("brand model bookings");
    if (!car) return res.status(404).json({ message: "Car not found" });

    const bookings = car.bookings
      .filter(b => b.status === "Confirmed")
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    res.json({ car: `${car.brand} ${car.model}`, bookings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
