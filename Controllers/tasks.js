const Users = require("../Models/Users");
const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, message) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL, // Your email address
        pass: process.env.EMAIL_PASSWORD, // Your email password or app password
      },
    });

    const mailOptions = {
      from: process.env.EMAIL, // Sender email
      to, // Recipient email
      subject, // Email subject
      text: message, // Plain text message
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error.message);
  }
};

const addMember = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      otherNames,
      contact,
      otherContact,
      role,
      dateOfBaptism,
      email,
      profImage,
      dateOfBirth,
      residentialAddress,
      GPSAddress,
      streetName,
      gender,
      profileImage,
      maritalStatus,
      nameOfSpouse,
      numberOfChildren,
      departments,
      personOfContact,
      relationToPersonOfContact,
      personsPhone,
    } = req.body;

    const fullName = otherNames
      ? `${lastName} ${firstName} ${otherNames}`
      : `${lastName} ${firstName}`;

    const newMember = await Users.create({
      firstName,
      lastName,
      otherNames,
      fullName,
      contact,
      otherContact,
      role,
      dateOfBaptism,
      email,
      profImage,
      dateOfBirth,
      residentialAddress,
      GPSAddress,
      streetName,
      gender,
      maritalStatus,
      nameOfSpouse,
      numberOfChildren,
      departments,
      profileImage,
      personOfContact,
      relationToPersonOfContact,
      personsPhone,
      password: `${firstName}1234`,
      username: `${firstName} ${lastName}`,
    });

    // Email the login success message
    const subject = "User Credentials";
    const message = `Hi ${firstName},\n\n You are welcome to the faithflow app. Here are your credentials to log in to the site.\n\n Username: ${firstName} ${lastName} \n\n Password: ${firstName}1234.\n\nBest regards,\nThe Team`;

    await sendEmail(email, subject, message);

    res.status(201).send({
      newMember,
      message: "Member added successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

const getAllMembers = async (req, res) => {
  try {
    const { category, search } = req.query;

    let query = {};

    if (category === "adults") {
      query.dateOfBirth = {
        $lte: new Date(new Date().setFullYear(new Date().getFullYear() - 18)),
      };
    } else if (category === "under18") {
      query.dateOfBirth = {
        $gt: new Date(new Date().setFullYear(new Date().getFullYear() - 18)),
      };
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { contact: { $regex: search, $options: "i" } },
      ];
    }

    const members = await Users.find(query);
    res.status(200).send(members);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

const getAllMembersSummary = async (req, res) => {
  try {
    const now = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);

    const totalMembers = await Users.countDocuments({});
    const newThisWeek = await Users.countDocuments({
      createdAt: { $gte: weekAgo },
    });
    const adults = await Users.countDocuments({
      dateOfBirth: {
        $lte: new Date(new Date().setFullYear(new Date().getFullYear() - 18)),
      },
    });
    const under18 = totalMembers - adults;

    res.status(200).json({
      totalMembers,
      newThisWeek,
      adults,
      under18,
    });
  } catch (error) {
    console.error("Error fetching member summary:", error);
    res.status(500).send("Server Error");
  }
};

const editMember = async (req, res) => {
  try {
    const memberId = req.params.id;
    const updates = req.body;

    Object.keys(updates).forEach((key) => {
      if (updates[key] === "") {
        delete updates[key];
      }
    });

    // If any of the name fields are present in the update, construct the fullName
    const { firstName, lastName, otherNames } = updates;
    if (firstName || lastName || otherNames) {
      const existingMember = await Users.findById(memberId);
      if (!existingMember) {
        return res.status(404).send({ message: "Member not found" });
      }

      const updatedFirstName = firstName || existingMember.firstName || "";
      const updatedLastName = lastName || existingMember.lastName || "";
      const updatedOtherNames = otherNames || existingMember.otherNames || "";

      // Concatenate names to form fullName
      updates.fullName =
        `${updatedFirstName} ${updatedOtherNames} ${updatedLastName}`.trim();
    }

    // Update the member document in the database
    const updatedMember = await Users.findByIdAndUpdate(
      memberId,
      { $set: updates },
      { new: true } // Return the updated document
    );

    if (!updatedMember) {
      return res.status(404).send({ message: "Member not found" });
    }

    res.status(200).send({
      message: "Member updated successfully",
      updatedMember,
    });
  } catch (error) {
    console.error("Error updating member:", error);
    res.status(500).send("Server Error");
  }
};

module.exports = { addMember, getAllMembers, editMember, getAllMembersSummary };
