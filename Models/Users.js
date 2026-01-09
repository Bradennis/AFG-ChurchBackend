const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const UsersSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },

    // ===== MEMBER-ONLY FIELDS =====
    firstName: {
      type: String,
      required: function () {
        return this.role === "member";
      },
    },

    lastName: {
      type: String,
      required: function () {
        return this.role === "member";
      },
    },

    otherNames: String,

    fullName: String,

    contact: {
      type: String,
      required: function () {
        return this.role === "member";
      },
    },

    otherContact: String,

    dateOfBaptism: Date,

    email: {
      type: String,
      unique: true,
      sparse: true, // allows admins without email
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      ],
    },

    notifications: {
      email: { type: Boolean, default: true },
    },

    dateOfBirth: Date,
    residentialAddress: String,
    GPSAddress: String,
    streetName: String,

    gender: {
      type: String,
      enum: ["male", "female", "Other"],
    },

    maritalStatus: {
      type: String,
      enum: ["single", "married", "divorced"],
    },

    nameOfSpouse: String,
    numberOfChildren: Number,
    profileImage: String,

    departments: [String],
    personOfContact: String,
    relationToPersonOfContact: String,
    personsPhone: String,

    // ===== AUTH =====
    username: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },
  },
  { timestamps: true }
);

/**
 * 🔐 HASH PASSWORD ONCE
 */
UsersSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * 🔑 JWT
 */
UsersSchema.methods.createJwt = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

module.exports = mongoose.model("User", UsersSchema);
