const express = require("express");
const multer = require("multer");
const Sermon = require("../Models/Sermon");
const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "files"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({
  storage,
}).fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "media", maxCount: 1 },
]);

// Create Event
router.post("/createSermon", upload, async (req, res) => {
  try {
    const { title, speaker, date, description, mediaType } = req.body;
    const thumbnailPath = req.files.thumbnail
      ? `${req.files.thumbnail[0].filename}`
      : null;
    const mediaPath = req.files.media ? `${req.files.media[0].filename}` : null;

    const newSermon = new Sermon({
      title,
      speaker,
      date,
      description,
      mediaType,
      thumbnail: thumbnailPath,
      video: mediaPath,
    });

    const savedSermon = await newSermon.save();
    res.status(201).json(savedSermon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fetch All Events
router.get("/", async (req, res) => {
  try {
    const sermons = await Sermon.find().sort({ date: -1 }); // Descending order by date
    res.status(200).json(sermons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fetch Event by ID
router.get("/:id", async (req, res) => {
  try {
    const sermon = await Sermon.findById(req.params.id);
    if (!sermon) return res.status(404).json({ message: "Event not found" });
    res.status(200).json(sermon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Event
// Update Event
router.patch("/update/:id", upload, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Update thumbnail if provided
    if (req.files.thumbnail) {
      updates.thumbnail = `${req.files.thumbnail[0].filename}`;
    }

    // Update media if provided
    if (req.files.media) {
      updates.video = `${req.files.media[0].filename}`;
    }

    const updatedSermon = await Sermon.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!updatedSermon) {
      return res.status(404).json({ message: "Sermon not found" });
    }

    res.status(200).json(updatedSermon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Event
router.delete("/:id", async (req, res) => {
  try {
    const deletedSermon = await Sermon.findByIdAndDelete(req.params.id);
    if (!deletedSermon)
      return res.status(404).json({ message: "Event not found" });
    res.status(200).json({ message: "Event deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
