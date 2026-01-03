const Attendance = require("../Models/Attendance");
const User = require("../Models/Users");

/* ================================
   MEMBER STATS
================================ */
const getMemberAttendanceStats = async (req, res) => {
  try {
    const { memberId } = req.params;
    if (!memberId) {
      return res.status(400).json({ message: "Missing memberId" });
    }

    const records = await Attendance.find({ memberId }).lean();

    let presentCount = 0;
    let absentCount = 0;
    const byMeetingType = {};

    for (const r of records) {
      const type = r.meetingType || "General";

      if (!byMeetingType[type]) byMeetingType[type] = 0;

      if (r.status === "✔️") {
        presentCount++;
        byMeetingType[type]++;
      } else {
        absentCount++;
      }
    }

    res.status(200).json({
      presentCount,
      absentCount,
      byMeetingType,
    });
  } catch (err) {
    console.error("Member Stats Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================================
   LOW ATTENDANCE MEMBERS
================================ */
const getLowAttendanceMembers = async (req, res) => {
  try {
    const lastDates = await Attendance.find()
      .sort({ meetingDate: -1 })
      .limit(5)
      .distinct("meetingDate");

    if (!lastDates.length) return res.json([]);

    const users = await User.find({}, "_id fullName contact").lean();
    const result = [];

    for (const user of users) {
      const records = await Attendance.find({
        memberId: user._id,
        meetingDate: { $in: lastDates },
      }).lean();

      let present = 0;
      records.forEach((r) => {
        if (r.status === "✔️") present++;
      });

      const total = lastDates.length;

      if (present <= 2) {
        result.push({
          id: user._id,
          fullName: user.fullName,
          contact: user.contact,
          presents: present,
          absent: total - present,
          attendanceRate: ((present / total) * 100).toFixed(2),
        });
      }
    }

    res.json(result);
  } catch (err) {
    console.error("Low Attendance Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================================
   MEMBERS LIST
================================ */
const getAttendanceMembers = async (req, res) => {
  try {
    const users = await User.find(
      {},
      "_id fullName firstName lastName contact"
    );

    const members = users.map((u) => ({
      id: u._id.toString(),
      fullName: u.fullName || `${u.firstName} ${u.lastName}`,
      contact: u.contact,
    }));

    res.json(members);
  } catch (err) {
    console.error("Attendance Members Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================================
   ALL RECORDS FOR TABLE
================================ */
const getAllAttendanceRecords = async (req, res) => {
  try {
    const records = await Attendance.find()
      .populate("memberId", "_id fullName")
      .lean();

    const attendance = {};
    const meetingMap = new Map();

    for (const rec of records) {
      if (!rec.memberId) continue;

      const memberId = rec.memberId._id.toString();

      if (!attendance[memberId]) attendance[memberId] = {};

      attendance[memberId][rec.meetingDate] = rec.status || "";

      // enforce safe meeting type
      const safeType = rec.meetingType?.trim() || "General";
      const key = `${rec.meetingDate}__${safeType}`;

      if (!meetingMap.has(key)) {
        meetingMap.set(key, {
          date: rec.meetingDate,
          type: safeType,
        });
      }
    }

    const users = await User.find({}, "_id fullName firstName lastName").lean();

    const members = users.map((u) => ({
      id: u._id.toString(),
      fullName: u.fullName || `${u.firstName} ${u.lastName}`,
    }));

    const meetings = Array.from(meetingMap.values()).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    res.status(200).json({
      members,
      meetings,
      attendance,
    });
  } catch (err) {
    console.error("Get Attendance Records Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================================
   ADD MEETING
================================ */
const addMeetingRecord = async (req, res) => {
  try {
    const { date, type } = req.body;

    if (!date || !type)
      return res.status(400).json({ message: "Missing date or type" });

    const users = await User.find({}, "_id").lean();

    await Attendance.deleteMany({ meetingDate: date, meetingType: type });

    const docs = users.map((u) => ({
      memberId: u._id,
      meetingDate: date,
      meetingType: type,
      status: "❌", // default to red cross
    }));

    if (docs.length) await Attendance.insertMany(docs);

    res.status(201).json({ date, type });
  } catch (err) {
    console.error("Add Meeting Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================================
   TOGGLE STATUS
================================ */
const toggleAttendanceStatus = async (req, res) => {
  try {
    const { memberId, meetingDate, meetingType, status } = req.body;

    if (!memberId || !meetingDate) {
      return res
        .status(400)
        .json({ message: "Missing memberId or meetingDate" });
    }

    const finalType =
      meetingType ||
      (await Attendance.findOne({ memberId, meetingDate }))?.meetingType ||
      "General";

    await Attendance.findOneAndUpdate(
      { memberId, meetingDate, meetingType: finalType },
      { status: status || "❌" },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Status updated" });
  } catch (err) {
    console.error("Toggle Attendance Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================================
   BULK SAVE
================================ */
const saveAttendanceBulk = async (req, res) => {
  try {
    const { meetingDate, meetingType, records } = req.body;

    if (!meetingDate || !meetingType || !Array.isArray(records)) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // Remove old records
    await Attendance.deleteMany({ meetingDate, meetingType });

    const docs = records
      .filter((r) => r.memberId)
      .map((r) => ({
        memberId: r.memberId,
        meetingDate,
        meetingType,
        status: r.status || "❌", // default to red cross
      }));

    if (!docs.length) {
      return res.status(400).json({
        message: "No valid attendance records to save",
      });
    }

    await Attendance.insertMany(docs);

    res.status(201).json({ message: "Saved" });
  } catch (err) {
    console.error("Save Bulk Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================================
   SUMMARY (CHART DATA)
================================ */
const getAttendanceSummary = async (req, res) => {
  try {
    const pipeline = [
      { $match: { status: "✔️" } }, // ✅ Use emoji
      {
        $project: {
          month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          meetingType: "$meetingType",
        },
      },
      {
        $group: {
          _id: { month: "$month", type: "$meetingType" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.month",
          values: { $push: { k: "$_id.type", v: "$count" } },
        },
      },
      {
        $project: {
          month: "$_id",
          data: { $arrayToObject: "$values" },
        },
      },
      { $sort: { month: 1 } },
    ];

    const result = await Attendance.aggregate(pipeline);

    res.json(result.map((r) => ({ month: r.month, ...r.data })));
  } catch (err) {
    console.error("Summary Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================================
   EXPORT CSV
================================ */
const exportAttendanceByDate = async (req, res) => {
  try {
    const { date, type } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date is required." });
    }

    let records = await Attendance.find({
      meetingDate: date,
      ...(type ? { meetingType: new RegExp(`^${type}$`, "i") } : {}),
    })
      .populate("memberId", "fullName")
      .lean();

    if (!records.length) {
      return res
        .status(404)
        .json({ message: "No attendance found for this date." });
    }

    let csv = "Member Name,Meeting Type,Status\n";

    records.forEach((r) => {
      csv += `${r.memberId.fullName},${r.meetingType},${r.status || "❌"}\n`;
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=attendance_${date}_${type || "all"}.csv`
    );
    res.setHeader("Content-Type", "text/csv");

    res.send(csv);
  } catch (err) {
    console.error("Export Attendance Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================================
   EXPORTS
================================ */
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
