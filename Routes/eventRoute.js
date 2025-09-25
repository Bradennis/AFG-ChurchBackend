// const express = require("express");
// const multer = require("multer");
// // const Event = require("../models/Events");
// const router = express.Router();

// // Configure multer for image uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, "files"),
//   filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
// });
// const upload = multer({ storage });

// // Create Event
// router.post("/createEvent", upload.single("image"), async (req, res) => {
//   try {
//     const newEvent = new Event({
//       ...req.body,
//       image: req.file ? `${req.file.filename}` : null,
//     });
//     const savedEvent = await newEvent.save();
//     res.status(201).json(savedEvent);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// // Fetch All Events
// router.get("/", async (req, res) => {
//   try {
//     const events = await Event.find().sort({ date: 1 });

//     res.status(200).json(events);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// // Fetch Event by ID
// router.get("/:id", async (req, res) => {
//   try {
//     const event = await Event.findById(req.params.id);
//     if (!event) return res.status(404).json({ message: "Event not found" });
//     res.status(200).json(event);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// // Update Event
// // Update Event
// router.patch("/:id", upload.single("image"), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updates = { ...req.body };

//     // Check if a new image is provided
//     if (req.file) {
//       updates.image = `${req.file.filename}`;
//     }

//     const updatedEvent = await Event.findByIdAndUpdate(id, updates, {
//       new: true,
//     });

//     if (!updatedEvent) {
//       return res.status(404).json({ message: "Event not found" });
//     }

//     res.status(200).json(updatedEvent);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// // Delete Event
// router.delete("/:id", async (req, res) => {
//   try {
//     const deletedEvent = await Event.findByIdAndDelete(req.params.id);
//     if (!deletedEvent)
//       return res.status(404).json({ message: "Event not found" });
//     res.status(200).json({ message: "Event deleted successfully." });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// module.exports = router;
