const Users = require("../Models/Users");
const jwt = require("jsonwebtoken");
const bycrypt = require("bcryptjs");

const login = async (req, res) => {
  const { username, password } = req.body;

  const userExists = await Users.findOne({ username: username });

  if (!userExists) {
    return res.status(200).send({ message: "user not found" });
  }

  const comparePasswords = await bycrypt.compare(password, userExists.password);
  if (!comparePasswords) {
    return res.status(200).send({ message: "Invalid password" });
  }

  const token = userExists.createJwt();
  res.cookie("token", token, { httpOnly: true });

  res.status(200).json({
    username,
    id: userExists._id,
    message: "welcome to your Dashboard😊",
    success: true,
  });
};

module.exports = login;
