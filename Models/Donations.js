const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  title: { type: String },
  amount: { type: Number },
  description: { type: String },
});

const donationSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, unique: true },
    total: { type: Number },
    details: {
      tithes: { type: Number },
      firstOffering: { type: Number },
      secondOffering: { type: Number },
      seedOffering: { type: Number },
      specialAppeal: { type: Number },
      welfare: { type: Number },
    },
    expenses: [expenseSchema],
  },
  { timestamps: true }
);

const Donation = mongoose.model("Donation", donationSchema);

module.exports = Donation;
