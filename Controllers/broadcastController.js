const Users = require("../Models/Users");
const { sendSMS } = require("../Services/smsService");

const broadcastMessage = async (req, res) => {
  try {
    const { message, recipients, selectAll } = req.body;

    if (!message || (!selectAll && (!recipients || recipients.length === 0))) {
      return res
        .status(400)
        .json({ message: "Message and recipients required" });
    }

    // Fetch recipients
    let members;

    if (selectAll) {
      members = await Users.find({}, "contact otherContact fullName");
    } else {
      members = await Users.find(
        { _id: { $in: recipients } },
        "contact otherContact fullName"
      );
    }

    // Filter members who actually have a phone
    members = members.filter((m) => m.contact || m.otherContact);

    if (!members.length) {
      return res.status(400).json({ message: "No valid phone numbers found" });
    }

    let sent = 0;
    let failed = 0;
    const failedRecipients = [];

    for (const member of members) {
      const phone = member.contact || member.otherContact;
      try {
        await sendSMS(phone, message);
        sent++;
      } catch (err) {
        failed++;
        failedRecipients.push({ name: member.fullName, phone });
        console.error(`Failed to send SMS to ${phone}:`, err.message);
      }
    }

    res.status(200).json({
      message: "Broadcast completed",
      total: members.length,
      sent,
      failed,
      failedRecipients,
    });
  } catch (error) {
    console.error("Broadcast error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { broadcastMessage };
