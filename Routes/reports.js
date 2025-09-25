const express = require("express");
const router = express.Router();
const multer = require("multer");
const Report = require("../Models/Report");

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "files"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// Fetch reports by date or type
router.get("/", async (req, res) => {
  const { date, username, type } = req.query;

  try {
    const query = {};
    if (date) {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999); // Set the end of the day
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }
    if (username) query["sender.name"] = { $regex: new RegExp(username, "i") }; // Case-insensitive match
    if (type) query.type = type;

    const reports = await Report.find(query).sort({ date: -1 });
    console.log("Query received:", query);
    console.log("Reports fetched:", reports);

    res.status(200).send(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ message: "Error fetching reports", error });
  }
});

// Upload a new report
router.post("/upload", upload.single("file"), async (req, res) => {
  console.log(req.file); // Log file details
  console.log(req.body); // Log body data
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  const { title, date, type, username, userId } = req.body;
  const fileUrl = req.file.path;

  try {
    const newReport = new Report({
      title,
      date,
      type,
      fileUrl,
      sender: {
        id: userId,
        name: username,
      },
    });
    await newReport.save();
    res
      .status(201)
      .json({ message: "Report uploaded successfully", newReport });
  } catch (error) {
    console.error(error); // Log error for debugging
    res.status(500).json({ message: "Error uploading report", error });
  }
});

// Download a specific report by ID
router.get("/download/:id", async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    res.download(report.fileUrl); // Sends the file to the client
  } catch (error) {
    res.status(500).json({ message: "Error downloading report", error });
  }
});

module.exports = router;
