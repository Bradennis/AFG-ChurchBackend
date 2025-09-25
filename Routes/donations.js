const express = require("express");
const {
  getDonations,
  addDonation,
  getProceedsSummary,
  deleteDonation,
  updateDonation,
} = require("../Controllers/donations");
const Router = express.Router();

Router.route("/").get(getDonations);
Router.route("/addDonation").post(addDonation);
Router.route("/proceedsSummary").get(getProceedsSummary);
Router.delete("/:id", deleteDonation);
Router.put("/:id", updateDonation);

module.exports = Router;
