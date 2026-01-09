const Users = require("../Models/Users");

const createDefaultAdmin = async () => {
  const adminExists = await Users.findOne({ username: "admin" });

  if (adminExists) {
    console.log("✅ Default admin already exists");
    return;
  }

  await Users.create({
    username: process.env.DEFAULT_ADMIN_USERNAME,
    password: process.env.DEFAULT_ADMIN_PASSWORD,
    role: "admin",
  });

  console.log("✅ Default admin created");
};

module.exports = createDefaultAdmin;
