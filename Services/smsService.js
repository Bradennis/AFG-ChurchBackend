const axios = require("axios");

const HUBTEL_CLIENT_ID = process.env.HUBTEL_CLIENT_ID;
const HUBTEL_CLIENT_SECRET = process.env.HUBTEL_CLIENT_SECRET;
const HUBTEL_SHORTCODE = process.env.HUBTEL_SHORTCODE; // your sender ID

// Send SMS via Hubtel
const sendSMS = async (phoneNumber, message) => {
  try {
    const token = Buffer.from(
      `${HUBTEL_CLIENT_ID}:${HUBTEL_CLIENT_SECRET}`
    ).toString("base64");

    const response = await axios.post(
      "https://api.hubtel.com/v1/messages/send",
      {
        From: HUBTEL_SHORTCODE,
        To: phoneNumber,
        Content: message,
      },
      {
        headers: {
          Authorization: `Basic ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (err) {
    console.error(`Failed to send SMS to ${phoneNumber}:`, err.message);
    throw err;
  }
};

module.exports = { sendSMS };
