// GET /churchapp/attendance/stats/:memberId
// Returns attendance stats for a specific member
const getMemberAttendanceStats = async (req, res) => {
  try {
    const { memberId } = req.params;
    if (!memberId) return res.status(400).json({ message: "Missing memberId" });
    const records = await Attendance.find({ memberId }).lean();
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    // Optionally, add more stats (e.g., by meeting type, recent attendance, etc.)
    res.json({ total, present, absent });
  } catch (err) {
    console.error("Member Stats Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// GET /churchapp/attendance/lowAttendance
// Returns members with low attendance in the last 5 meetings
const getLowAttendanceMembers = async (req, res) => {
  try {
    // Get last 5 meeting dates
    const lastMeetings = await Attendance.find()
      .sort({ meetingDate: -1 })
      .limit(5)
      .distinct("meetingDate");
    if (!lastMeetings.length) return res.json([]);

    // For each member, count presents in last 5 meetings
    const users = await User.find({}, "_id fullName contact").lean();
    const lowAttendanceList = [];
    for (const user of users) {
      const presentCount = await Attendance.countDocuments({
        memberId: user._id,
        meetingDate: { $in: lastMeetings },
        status: "present",
      });
      if (presentCount <= 2) {
        lowAttendanceList.push({
          id: user._id,
          fullName: user.fullName,
          contact: user.contact,
          presents: presentCount,
        });
      }
    }
    res.json(lowAttendanceList);
  } catch (err) {
    console.error("Low Attendance Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /churchapp/attendance/members
// Returns all members for attendance analytics
const getAttendanceMembers = async (req, res) => {
  try {
    const users = await User.find(
      {},
      "_id fullName firstName lastName contact"
    ).lean();
    const members = users.map((u) => ({
      _id: u._id,
      fullName: u.fullName || `${u.firstName} ${u.lastName}`,
      contact: u.contact,
    }));
    res.json(members);
  } catch (err) {
    console.error("Attendance Members Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// controllers/attendanceController.js
const Attendance = require("../Models/Attendance");
const User = require("../Models/Users"); // adjust path if your case is different

// GET /churchapp/attendance/records
// Returns: { members: [{ _id, fullName }], meetings: [{ date, type }], attendance: { memberId: { date: "present"/"absent" } } }
const getAllAttendanceRecords = async (req, res) => {
  try {
    // fetch attendance records with member populated
    const records = await Attendance.find()
      .populate("memberId", "_id fullName")
      .lean();

    const attendanceByMember = {};
    const meetingSet = new Set();

    records.forEach((rec) => {
      const member = rec.memberId;
      if (!member) return;
      const memberId = member._id.toString();
      if (!attendanceByMember[memberId])
        attendanceByMember[memberId] = { fullName: member.fullName, dates: {} };
      attendanceByMember[memberId].dates[rec.meetingDate] = rec.status; // 'present' | 'absent'
      meetingSet.add(
        JSON.stringify({ date: rec.meetingDate, type: rec.meetingType })
      );
    });

    // get all members even if they have no attendance yet
    const allUsers = await User.find({}, "_id fullName").lean();
    const members = allUsers.map((u) => ({
      id: u._id.toString(),
      fullName: u.fullName || `${u.firstName} ${u.lastName}`,
    }));

    // build final attendance map keyed by id strings
    const attendance = {};
    members.forEach((m) => {
      attendance[m.id] =
        (attendanceByMember[m.id] && attendanceByMember[m.id].dates) || {};
    });

    const meetings = Array.from(meetingSet).map((s) => JSON.parse(s));

    res.status(200).json({ members, meetings, attendance });
  } catch (err) {
    console.error("Get Attendance Records Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /churchapp/attendance/add
// body: { date, type } -> creates meeting meta (no DB table for meetings; meetings are just derived from attendance records)
// To make a visible header we insert blank attendance records for all members (optional) OR return the new meeting object to frontend.
const addMeetingRecord = async (req, res) => {
  try {
    const { date, type } = req.body;
    if (!date || !type)
      return res.status(400).json({ message: "Missing date or type" });

    // To create a meeting header without creating attendance rows in DB we simply return { date, type }.
    // But if you want to pre-create blank attendance rows for all members (so meetings show up in /records), do that:
    const users = await User.find({}, "_id").lean();

    const docs = users.map((u) => ({
      memberId: u._id,
      meetingDate: date,
      meetingType: type,
      status: "", // blank initially
    }));

    // insertMany may create duplicates if same meeting already exists; remove existing same meeting entries first:
    await Attendance.deleteMany({ meetingDate: date, meetingType: type });

    if (docs.length) await Attendance.insertMany(docs);

    res.status(201).json({ date, type });
  } catch (err) {
    console.error("Add Meeting Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// PATCH /churchapp/attendance/toggle
// body: { memberId, meetingDate, meetingType (optional), status } status = "present"|"absent"|""
const toggleAttendanceStatus = async (req, res) => {
  try {
    const { memberId, meetingDate, meetingType, status } = req.body;
    if (!memberId || !meetingDate)
      return res
        .status(400)
        .json({ message: "Missing memberId or meetingDate" });

    // If meetingType is not passed, try to find existing meetingType for that date for the member or default to empty
    let mType = meetingType;
    if (!mType) {
      const existing = await Attendance.findOne({
        memberId,
        meetingDate,
      }).lean();
      mType = existing ? existing.meetingType : "General";
    }

    // upsert the attendance row
    await Attendance.findOneAndUpdate(
      { memberId, meetingDate, meetingType: mType },
      { $set: { status: status || "" } },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Status updated" });
  } catch (err) {
    console.error("Toggle Attendance Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /churchapp/attendance/save
// body: { meetingDate, meetingType, records: [{ memberId, status }] }
const saveAttendanceBulk = async (req, res) => {
  try {
    const { meetingDate, meetingType, records } = req.body;
    if (!meetingDate || !meetingType || !Array.isArray(records))
      return res.status(400).json({ message: "Missing fields" });

    // remove previous rows for this meeting to avoid duplicates
    await Attendance.deleteMany({ meetingDate, meetingType });

    const docs = records.map((r) => ({
      memberId: r.memberId,
      meetingDate,
      meetingType,
      status: r.status || "",
    }));

    await Attendance.insertMany(docs);

    res.status(201).json({ message: "Saved" });
  } catch (err) {
    console.error("Save Bulk Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /churchapp/attendance/summary
const getAttendanceSummary = async (req, res) => {
  try {
    // sample aggregate: group by month and meetingType, count presents
    const pipeline = [
      {
        $match: { status: "present" },
      },
      {
        $project: {
          month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          meetingType: "$meetingType",
        },
      },
      {
        $group: {
          _id: { month: "$month", meetingType: "$meetingType" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.month",
          types: {
            $push: { k: "$_id.meetingType", v: "$count" },
          },
        },
      },
      {
        $project: {
          month: "$_id",
          data: { $arrayToObject: "$types" },
        },
      },
      { $sort: { month: 1 } },
    ];

    const agg = await Attendance.aggregate(pipeline);
    // transform to chart-friendly rows: { month: '2024-06', 'Sunday Service': 10, ... }
    const rows = agg.map((r) => ({ month: r.month, ...r.data }));
    res.status(200).json(rows);
  } catch (err) {
    console.error("Summary Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// inside attendanceController.js
const exportAttendanceByDate = async (req, res) => {
  try {
    const { date, type } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date is required." });
    }

    console.log("Export Query:", { date, type });

    let records = [];

    if (type) {
      // Try strict type match first
      records = await Attendance.find({
        meetingDate: date.trim(),
        meetingType: new RegExp(`^${type.trim()}$`, "i"),
      })
        .populate("memberId", "fullName")
        .lean();
    }

    // ✅ Fallback: if no records found with type, return all for that date
    if (!records.length) {
      console.log("No records for date+type. Falling back to date only...");
      records = await Attendance.find({ meetingDate: date.trim() })
        .populate("memberId", "fullName")
        .lean();
    }

    if (!records.length) {
      return res
        .status(404)
        .json({ message: "No attendance found for this date." });
    }

    // Build CSV

    let csv = "Member Name,Meeting Type,Status\n";
    records.forEach((rec) => {
      let statusText = "Not marked";
      if (rec.status === "present") statusText = "present";
      else if (rec.status === "absent") statusText = "absent";

      csv += `${rec.memberId.fullName},${
        rec.meetingType || ""
      },${statusText}\n`;
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=attendance_${date}_${
        type ? type.replace(/\s+/g, "_") : "all"
      }.csv`
    );
    res.setHeader("Content-Type", "text/csv");
    res.send(csv);
  } catch (error) {
    console.error("Export Attendance Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  getAllAttendanceRecords,
  addMeetingRecord,
  toggleAttendanceStatus,
  saveAttendanceBulk,
  getAttendanceSummary,
  exportAttendanceByDate,
  getLowAttendanceMembers,
  getAttendanceMembers,
  getMemberAttendanceStats,
};
