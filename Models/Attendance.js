const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    meetingDate: { type: String, required: true }, // "YYYY-MM-DD"
    meetingType: { type: String, required: true }, // e.g. "Sunday Service"
    status: { type: String, enum: ["✔️", "❌", ""], default: "" }, // ✅ Updated to emoji
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
