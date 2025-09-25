const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  fileUrl: { type: String, required: true }, // URL to the uploaded file
  type: { type: String, enum: ["activity", "financial"], required: true },
  sender: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to the User model
    name: { type: String, required: true }, // Sender's name
  },
});

module.exports = mongoose.model("Report", reportSchema);
