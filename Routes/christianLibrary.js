const express = require("express");
const multer = require("multer");
const Library = require("../Models/ChristianLibrary");
const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "files"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({
  storage,
}).fields([
  { name: "thumbnail", maxCount: 1 }, // Expect 1 file for 'thumbnail'
  { name: "media", maxCount: 1 }, // Expect 1 file for 'media'
]);

// Create Event
router.post("/upload", async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res
        .status(400)
        .json({ message: "File upload error: " + err.message });
    }
    try {
      const { title, author, description, type } = req.body;
      const thumbnailPath = req.files.thumbnail
        ? `${req.files.thumbnail[0].filename}`
        : null;
      const mediaPath = req.files.media
        ? `${req.files.media[0].filename}`
        : null;

      const newLibrary = new Library({
        title,
        author,
        description,
        type,
        thumbnail: thumbnailPath,
        file: mediaPath,
      });

      const savedLibrary = await newLibrary.save();
      res.status(201).json(savedLibrary);
    } catch (error) {
      console.error(error); // Log error for debugging
      res.status(500).json({ message: error.message });
    }
  });
});

// Fetch All Events
router.get("/", async (req, res) => {
  try {
    const library = await Library.find().sort({ date: -1 }); // Descending order by date
    res.status(200).json(library);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fetch Event by ID
router.get("/:id", async (req, res) => {
  try {
    const library = await Library.findById(req.params.id);
    if (!library) return res.status(404).json({ message: "Event not found" });
    res.status(200).json(library);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Event
// Update Event
router.patch("/:id", upload, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Update thumbnail if provided
    if (req.files.thumbnail) {
      updates.thumbnail = `${req.files.thumbnail[0].filename}`;
    }

    // Update media if provided
    if (req.files.media) {
      updates.file = `${req.files.media[0].filename}`;
    }

    const updatedLibrary = await Library.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!updatedLibrary) {
      return res.status(404).json({ message: "Sermon not found" });
    }

    res.status(200).json(updatedLibrary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Event
router.delete("/:id", async (req, res) => {
  try {
    const deletedLibrary = await Library.findByIdAndDelete(req.params.id);
    if (!deletedLibrary)
      return res.status(404).json({ message: "Event not found" });
    res.status(200).json({ message: "Event deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
