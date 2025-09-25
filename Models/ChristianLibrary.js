const mongoose = require("mongoose");

const christianLirabry = new mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, required: true },
    thumbnail: { type: String, required: true }, // URL or path
    file: { type: String, required: true }, // URL or path
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChristianLirabry", christianLirabry);
