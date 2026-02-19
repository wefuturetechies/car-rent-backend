const express = require("express");
const router = express.Router();
const Car = require("../models/Car");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage });

/* ===========================================================
   GET ALL CARS (OPTIONAL STATUS FILTER)
   /api/cars?status=Booked
=========================================================== */
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;

    let filter = {};
    if (status) filter.status = status;

    const cars = await Car.find(filter).sort({ createdAt: -1 });
    res.json(cars);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ===========================================================
   GET CARS BY DATE + OPTIONAL STATUS
   /api/cars/date/2026-02-18?status=Booked
=========================================================== */
router.get("/date/:date", async (req, res) => {
  try {
    const requestedDate = req.params.date;
    const { status } = req.query;

    let filter = { bookedDates: requestedDate };
    if (status) filter.status = status;

    const cars = await Car.find(filter).sort({ createdAt: -1 });
    res.json(cars);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ===========================================================
   UPDATE CAR STATUS (BOOK / UNBOOK)
=========================================================== */
router.put("/:id", async (req, res) => {
  try {
    const { status, bookingDate } = req.body;

    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: "Car not found" });

    // BOOK CAR
    if (status === "Booked" && bookingDate) {
      const dateStr = new Date(bookingDate).toISOString().split("T")[0];

      if (!car.bookedDates.includes(dateStr)) {
        car.bookedDates.push(dateStr);
      }

      car.status = "Booked";
      car.bookingDate = dateStr;
    }

    // MAKE AVAILABLE AGAIN
    if (status === "Available") {
      car.status = "Available";
      car.bookingDate = null;
    }

    const updatedCar = await car.save();
    res.json(updatedCar);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ===========================================================
   CREATE NEW CAR (ADMIN)
=========================================================== */
router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "logo", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { brand, model } = req.body;

      let imageUrl = req.body.imageUrl;
      let logoUrl = req.body.logoUrl;

      // Convert uploaded image to base64
      if (req.files?.image?.[0]) {
        const file = req.files.image[0];
        imageUrl = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
      }

      // Convert uploaded logo to base64
      if (req.files?.logo?.[0]) {
        const file = req.files.logo[0];
        logoUrl = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
      }

      const newCar = new Car({
        brand,
        model,
        imageUrl,
        logoUrl,
        price: 0,                // default
        status: "Available",     // default
        bookingDate: null,
        bookedDates: []
      });

      const savedCar = await newCar.save();
      res.status(201).json(savedCar);

    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

module.exports = router;
