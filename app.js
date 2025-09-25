require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const cookie = require("cookie-parser");
const connectDb = require("./DataBase/connectDb");
const authRoute = require("./Routes/authRoute");
const taskRoute = require("./Routes/taskRoute");
const donationsRoute = require("./Routes/donations");
const authMiddleware = require("./MiddleWare/authMiddleware");
// const eventRoutes = require("./Routes/eventRoute");
const sermonRoute = require("./Routes/sermon");
const libraryRoute = require("./Routes/christianLibrary");
const reportRoute = require("./Routes/reports");

const app = express();

//i made changes here
app.use(
  cors({
    origin: "https://afgc-adjumani-kopey.vercel.app/",
    credentials: true,
  })
);

app.use(cookie());
app.use(express.json());
app.use(express.static("files"));
app.use("/uploads", express.static("uploads"));
// app.use("/churchapp/events", eventRoutes);
app.use("/churchapp", authRoute);
app.use("/churchapp/sermon", sermonRoute);
app.use("/churchapp/library", libraryRoute);
app.use("/churchapp/report", reportRoute);
app
  .use("/churchapp/tasks", taskRoute)
  .use("/churchapp/donations", donationsRoute);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "files");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

app.post("/churchapp/upload", upload.single("file"), (req, res) => {
  res.status(200).json({
    msg: "file was uploaded successfully",
    fileName: req.file.filename,
  });
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDb(process.env.MONGODB_URI);
    app.listen(PORT, () => console.log(`App listening on port ${PORT}...`));
  } catch (error) {
    console.error("Server startup failed:", error.message);
  }
};

start();
