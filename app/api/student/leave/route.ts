import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbconfig/db";
import LeaveRequest from "@/models/LeaveRequest";
import Student from "@/models/Student";
import AdAssignment from "@/models/AdAssignment";
import SystemConfig from "@/models/SystemConfig";
import { getSessionUser } from "@/lib/getSessionUser";

export async function POST(req: NextRequest) {
  try {
    await connect();
    const user = await getSessionUser(); //
    if (!user || user.role !== "STUDENT")
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { fromDate, toDate, reason } = await req.json();
    const start = new Date(fromDate);
    const end = new Date(toDate);

    // 1. Determine if Approval is Required (Weekend Logic)
    const config = (await SystemConfig.findOne()) || {
      weekendAutoApprove: true,
    };
    const isWeekend =
      start.getDay() === 5 || start.getDay() === 6 || start.getDay() === 0; // Fri, Sat, Sun

    const autoApprove = config.weekendAutoApprove && isWeekend;

    // 2. Resolve the AD for this student to ensure the record is linked to a staff member
    const student = await Student.findById(user.profileId);
    const assignment = await AdAssignment.findOne({
      "allocations.block": student.block,
      "allocations.roomNo": student.roomNo,
    });

    // 3. Create the Request
    const leave = await LeaveRequest.create({
      studentId: user.profileId,
      fromDate: start,
      toDate: end,
      reason,
      approvalRequired: !autoApprove,
      status: autoApprove ? "APPROVED" : "PENDING",
      // If auto-approved, we can set actionBy to a system ID or leave null
    });

    return NextResponse.json({
      message: autoApprove
        ? "Leave auto-approved for weekend"
        : "Leave request sent to AD",
      data: leave,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connect();
    const user = await getSessionUser(); //

    if (!user || user.role !== "STUDENT") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Find all leaves where studentId matches the logged-in profileId
    const leaves = await LeaveRequest.find({ studentId: user.profileId }).sort({
      createdAt: -1,
    });

    return NextResponse.json({ data: leaves }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
