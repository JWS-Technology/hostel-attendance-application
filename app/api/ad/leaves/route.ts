import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbconfig/db";
import LeaveRequest from "@/models/LeaveRequest";
import AdAssignment from "@/models/AdAssignment";
import Student from "@/models/Student";
import { getSessionUser } from "@/lib/getSessionUser";

export async function GET(req: NextRequest) {
  try {
    await connect();

    // 1. Identify the logged-in AD using the stateless session
    const user = await getSessionUser();
    if (!user || user.role !== "AD") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch the AD's specific room allocations
    const assignment = await AdAssignment.findOne({ staffId: user.profileId });

    if (
      !assignment ||
      !assignment.allocations ||
      assignment.allocations.length === 0
    ) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    /**
     * 3. Construct the filter.
     * We need to find students who match the AD's block and room numbers.
     * roomQueries will look like: [{ block: "A", roomNo: "101" }, { block: "A", roomNo: "102" }]
     */
    const roomQueries = assignment.allocations.map((alloc: any) => ({
      block: alloc.block,
      roomNo: alloc.roomNo,
    }));

    // 4. Find students belonging to those rooms
    const managedStudentIds = await Student.find({
      $or: roomQueries,
      isActive: true,
    }).distinct("_id");

    // 5. Fetch PENDING leave requests for only those students
    const leaves = await LeaveRequest.find({
      studentId: { $in: managedStudentIds },
    })
      .populate("studentId", "name registerNo roomNo block")
      .sort({ createdAt: -1 });

    return NextResponse.json(
      {
        message: "Pending leaves retrieved",
        count: leaves.length,
        data: leaves,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("❌ AD Leave Fetch Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

/**
 * PATCH: To Approve or Reject a specific leave request
 */
export async function PATCH(req: NextRequest) {
  try {
    await connect();
    const user = await getSessionUser();
    if (!user || user.role !== "AD") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { leaveId, status } = await req.json(); // status: "APPROVED" or "REJECTED"

    // Update the leave and record which AD (User ID) performed the action
    const updatedLeave = await LeaveRequest.findByIdAndUpdate(
      leaveId,
      {
        status,
        actionBy: user.id,
      },
      { new: true },
    );

    return NextResponse.json({
      message: `Leave ${status.toLowerCase()} successfully`,
      data: updatedLeave,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
