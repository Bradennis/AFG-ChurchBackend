const Donation = require("../Models/Donations");

const getDonations = async (req, res) => {
  try {
    const { date } = req.query;
    const query = {};

    console.log(date);

    if (date) {
      // Convert string to Date objects for range query
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const donations = await Donation.find(query).sort({ date: -1 });
    console.log("Query result:", donations);
    res.status(200).json(donations);
  } catch (error) {
    console.error("Error fetching donations:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const addDonation = async (req, res) => {
  // i realized that when adding new donations for the first time, the welfare value is always decreased by 1. i will visit this code again later and check what really could be wrong
  try {
    const { date, total, details, expenses } = req.body;

    if (!date || !total || !details) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Convert string date to a Date object
    const formattedDate = new Date(date);

    const newDonation = new Donation({
      date: formattedDate,
      total,
      details,
      expenses,
    });

    await newDonation.save();
    res
      .status(201)
      .json({ message: "Donation recorded successfully", newDonation });
  } catch (error) {
    console.error("Error recording donation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getProceedsSummary = async (req, res) => {
  try {
    // Calculate the current quarter start and end dates
    const now = new Date();
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3; // 0 for Q1, 3 for Q2, etc.
    const startOfQuarter = new Date(
      now.getFullYear(),
      quarterStartMonth,
      1,
      0,
      0,
      0,
      0
    );
    const endOfQuarter = new Date(
      now.getFullYear(),
      quarterStartMonth + 3,
      0,
      23,
      59,
      59,
      999
    ); // Last day of the quarter

    // Aggregate total proceeds for the current quarter
    const totalProceeds = await Donation.aggregate([
      { $match: { date: { $gte: startOfQuarter, $lte: endOfQuarter } } },
      { $group: { _id: null, totalAmount: { $sum: "$total" } } },
    ]);

    // Aggregate new donations for the current week (still included in this quarter logic)
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const newThisWeek = await Donation.aggregate([
      {
        $match: {
          date: { $gte: startOfWeek, $lte: endOfQuarter }, // Filter by current week and quarter
        },
      },
      { $group: { _id: null, totalAmount: { $sum: "$total" } } },
    ]);

    // Aggregate offerings summary for the current quarter
    const offeringsSummary = await Donation.aggregate([
      {
        $match: { date: { $gte: startOfQuarter, $lte: endOfQuarter } },
      },
      {
        $project: {
          firstOffering: "$details.firstOffering",
          secondOffering: "$details.secondOffering",
          seedOffering: "$details.seedOffering",
          tithe: "$details.tithes",
          welfare: "$details.welfare",
        },
      },
      {
        $group: {
          _id: null,
          totalFirstOffering: { $sum: "$firstOffering" },
          totalSecondOffering: { $sum: "$secondOffering" },
          totalSeedOffering: { $sum: "$seedOffering" },
          totalTithes: { $sum: "$tithe" },
          totalWelfare: { $sum: "$welfare" },
        },
      },
    ]);

    // Format the data
    const formattedData = {
      totalProceeds: totalProceeds[0]?.totalAmount || 0,
      newThisWeek: newThisWeek[0]?.totalAmount || 0,
      allOfferings:
        (offeringsSummary[0]?.totalFirstOffering || 0) +
        (offeringsSummary[0]?.totalSecondOffering || 0) +
        (offeringsSummary[0]?.totalSeedOffering || 0),
      tithes: offeringsSummary[0]?.totalTithes || 0,
      welfare: offeringsSummary[0]?.totalWelfare || 0,
    };

    res.status(200).json(formattedData);
  } catch (error) {
    console.error("Error fetching proceeds summary:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete Donation
const deleteDonation = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the donation by ID and delete it
    const deletedDonation = await Donation.findByIdAndDelete(id);

    if (!deletedDonation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    res
      .status(200)
      .json({ message: "Donation deleted successfully", deletedDonation });
  } catch (error) {
    console.error("Error deleting donation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update Donation
const updateDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    // Update the donation in the database
    const updatedDonation = await Donation.findByIdAndUpdate(id, updatedData, {
      new: true, // Return the updated document
      runValidators: true, // Ensure validation rules are applied
    });

    if (!updatedDonation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    res
      .status(200)
      .json({ message: "Donation updated successfully", updatedDonation });
  } catch (error) {
    console.error("Error updating donation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getDonations,
  addDonation,
  getProceedsSummary,
  deleteDonation,
  updateDonation,
};
