// routes/attendanceRoute.js
const express = require("express");
const router = express.Router();
const {
  getAllAttendanceRecords,
  addMeetingRecord,
  toggleAttendanceStatus,
  saveAttendanceBulk,
  getAttendanceSummary,
  exportAttendanceByDate,
  getLowAttendanceMembers,
  getAttendanceMembers,
  getMemberAttendanceStats,
} = require("../Controllers/AttendanceController");

// router.get("/records", getAttendanceRecords);
// router.post("/save", saveAttendance);
router.get("/export", exportAttendanceByDate);

// Note base: /churchapp/attendance
router.get("/records", getAllAttendanceRecords);
router.post("/add", addMeetingRecord);
router.patch("/toggle", toggleAttendanceStatus);
router.post("/save", saveAttendanceBulk);
router.get("/summary", getAttendanceSummary);
router.get("/lowAttendance", getLowAttendanceMembers);
router.get("/members", getAttendanceMembers);
router.get("/stats/:memberId", getMemberAttendanceStats);

module.exports = router;
