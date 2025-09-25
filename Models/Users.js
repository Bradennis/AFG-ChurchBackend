const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bycrypt = require("bcryptjs");

const UsersSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    otherNames: { type: String },
    fullName: { type: String },
    contact: { type: String, required: true },
    otherContact: { type: String },
    role: { type: String },
    dateOfBaptism: { type: Date },
    username: {
      type: String,
    },

    email: {
      type: String,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      ],
      unique: true,
    },
    dateOfBirth: { type: Date },
    residentialAddress: { type: String },
    GPSAddress: { type: String },
    streetName: { type: String },
    gender: { type: String, enum: ["male", "female", "Other"] },
    maritalStatus: { type: String, enum: ["single", "married", "divorced"] },
    nameOfSpouse: { type: String },
    numberOfChildren: { type: Number },
    profileImage: { type: String },
    resientialAddress: {
      type: String,
    },
    password: {
      type: String,
      minLength: [6, "Password must be at least 6 characters long"],
    },
    departments: { type: [String] },
    personOfContact: { type: String },
    relationToPersonOfContact: { type: String },
    personsPhone: { type: String },
  },
  { timestamps: true }
);

UsersSchema.pre("save", async function () {
  const salt = await bycrypt.genSalt(10);
  this.password = await bycrypt.hash(this.password, salt);
});

UsersSchema.methods.createJwt = function () {
  return jwt.sign(
    { username: this.username, id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

module.exports = mongoose.model("User", UsersSchema);
