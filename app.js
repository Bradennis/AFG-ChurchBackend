require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const cookie = require("cookie-parser");

const connectDb = require("./DataBase/connectDb");
const createDefaultAdmin = require("./Services/createDefaultAdmin");

// Routes
const authRoute = require("./Routes/authRoute");
const taskRoute = require("./Routes/taskRoute");
const donationsRoute = require("./Routes/donations");
const sermonRoute = require("./Routes/sermon");
const libraryRoute = require("./Routes/christianLibrary");
const reportRoute = require("./Routes/reports");
const attendanceRoute = require("./Routes/Attendanceroute");
const broadcastRoute = require("./Routes/broadcastRoute");
const settingsRoute = require("./Routes/settingsRoute");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://afgc-adjumani-kopey.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// app.use(
//   cors({
//     origin: "http://localhost:5173", // your Vite dev server
//     credentials: true, // if you're using cookies/auth
//   })
// );

app.use(express.json());
app.use(cookie());

app.use(express.static("files"));
app.use("/uploads", express.static("uploads"));

app.use("/churchapp", authRoute);
app.use("/churchapp/sermon", sermonRoute);
app.use("/churchapp/library", libraryRoute);
app.use("/churchapp/report", reportRoute);
app.use("/churchapp/attendance", attendanceRoute);
app.use("/churchapp/settings", settingsRoute);
app.use("/churchapp/tasks", taskRoute);
app.use("/churchapp/donations", donationsRoute);
app.use("/churchapp/messages", broadcastRoute);

// Upload
const storage = multer.diskStorage({
  destination: "files",
  filename: (req, file, cb) =>
    cb(null, Date.now() + "_" + path.extname(file.originalname)),
});

const upload = multer({ storage });

app.post("/churchapp/upload", upload.single("file"), (req, res) => {
  res.status(200).json({
    msg: "file uploaded",
    fileName: req.file.filename,
  });
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDb(process.env.MONGODB_URI);
    await createDefaultAdmin();

    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (error) {
    console.error("Startup error:", error);
  }
};

start();
