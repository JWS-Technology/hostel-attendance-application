import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbconfig/db";
import Student from "@/models/Student";
import AdAssignment from "@/models/AdAssignment";

export async function GET(req: NextRequest) {
  try {
    await connect();

    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get("staffId");
    console.log(staffId);
    if (!staffId) {
      return NextResponse.json(
        { message: "Staff ID is required" },
        { status: 400 },
      );
    }

    // 1. Fetch the AD's specific room assignments
    const assignment = await AdAssignment.findOne({ staffId: staffId });

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
