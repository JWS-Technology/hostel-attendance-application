import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbconfig/db";
import Student from "@/models/Student";
import AdAssignment from "@/models/AdAssignment";
import { getSessionUser } from "@/lib/getSessionUser";

export async function GET(req: NextRequest) {
  try {
    await connect();

    const user = await getSessionUser();
    if (!user || user.role !== "AD") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const assignment = await AdAssignment.findOne({
      staffId: user.profileId,
    });

    if (!assignment || assignment.allocations.length === 0) {
      return NextResponse.json(
        { message: "You are not assigned to any rooms." },
        { status: 403 },
      );
    }

    // 2. Build a precise query for EXACTLY the rooms this AD manages
    // This creates an array like: [{ block: "A", roomNo: "129" }, { block: "A", roomNo: "130" }]
    const roomQueries = assignment.allocations.map((alloc: any) => ({
      block: alloc.block,
      roomNo: alloc.roomNo,
    }));

    // 3. Fetch students matching those exact Block + Room combinations
    const students = await Student.find({
      isActive: true,
      $or: roomQueries, // Matches ANY of the specific block/room pairs
    })
      .select("name registerNo accountNo block roomNo") // Added 'block' in case AD manages multiple
      .sort({ block: 1, roomNo: 1 }); // Sort by Block, then Room
    console.log(students.length);
    return NextResponse.json(
      {
        message: "Operative manifest retrieved",
        count: students.length,
        data: students,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("❌ Fetch Students Error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { message: "Internal Server Anomaly" },
      { status: 500 },
    );
  }
}
