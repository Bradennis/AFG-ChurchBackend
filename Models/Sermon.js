const mongoose = require("mongoose");

const sermonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  speaker: { type: String, required: true },
  date: { type: Date, required: true },
  description: { type: String, required: true },
  thumbnail: { type: String, required: true }, // URL or path
  video: { type: String, required: true }, // URL or path
  mediaType: { type: String, required: true },
});

module.exports = mongoose.model("Sermon", sermonSchema);
