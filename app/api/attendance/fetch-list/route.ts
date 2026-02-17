import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbconfig/db";
import Student from "@/models/Student";
import AdAssignment from "@/models/AdAssignment";
import LeaveRequest from "@/models/LeaveRequest"; // Import your Leave model
import { getSessionUser } from "@/lib/getSessionUser";

export async function GET(req: NextRequest) {
  try {
    await connect();

    const user = await getSessionUser();
    if (!user || user.role !== "AD") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const assignment = await AdAssignment.findOne({ staffId: user.profileId });
    if (!assignment || assignment.allocations.length === 0) {
      return NextResponse.json(
        { message: "No assignments found", data: [] },
        { status: 200 },
      );
    }

    const roomQueries = assignment.allocations.map((alloc: any) => ({
      block: alloc.block,
      roomNo: alloc.roomNo,
    }));

    // 1. Fetch the students
    const students = await Student.find({
      isActive: true,
      $or: roomQueries,
    }).select("name registerNo accountNo block roomNo");

    // 2. Define "Today" (Midnight to Midnight)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 3. Find all APPROVED leaves that cover today
    const activeLeaves = await LeaveRequest.find({
      status: "APPROVED",
      studentId: { $in: students.map((s) => s._id) },
      fromDate: { $lte: todayEnd },
      toDate: { $gte: todayStart },
    }).select("studentId");

    const leaveSet = new Set(activeLeaves.map((l) => l.studentId.toString()));

    // 4. Map students and attach the auto-calculated status
    const data = students.map((student) => ({
      ...student.toObject(),
      // If student ID is in the active leaves list, they are ON_LEAVE, else PRESENT
      initialStatus: leaveSet.has(student._id.toString())
        ? "ON_LEAVE"
        : "PRESENT",
    }));

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
