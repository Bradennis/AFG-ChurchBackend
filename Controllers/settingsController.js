const Users = require("../Models/Users");
const bcrypt = require("bcryptjs");

/**
 * Update profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone } = req.body;

    const user = await Users.findByIdAndUpdate(
      userId,
      {
        username: name,
        email,
        contact: phone,
      },
      { new: true }
    );

    res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ message: "Profile update failed" });
  }
};

/**
 * Update email notification preference
 */
const updateEmailNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email } = req.body;

    await Users.findByIdAndUpdate(userId, {
      notifications: { email },
    });

    res.status(200).json({
      message: "Email notification preference updated",
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update notification settings" });
  }
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword; // let pre-save hash it
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Password update failed" });
  }
};

module.exports = {
  updateProfile,
  updateEmailNotification,
  changePassword,
};
