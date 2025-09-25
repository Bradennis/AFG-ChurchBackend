const express = require("express");
const {
  addMember,
  getAllMembers,
  editMember,
  getAllMembersSummary,
} = require("../Controllers/tasks");
const Router = express.Router();

Router.route("/addMember").post(addMember);
Router.route("/getAllMembers").get(getAllMembers);
Router.route("/getAllMembersSummary").get(getAllMembersSummary);
Router.route("/editMember/:id").patch(editMember);

module.exports = Router;
