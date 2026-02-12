import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbconfig/db";
import AttendanceSession from "@/models/Attendance"; // Note: This is your session model

export async function POST(req: NextRequest) {
  try {
    // 1. Establish connection
    await connect();

    // 2. Parse request
    // Expected Body: { date: "2026-02-12", block: "A", markedBy: "...", records: [...] }
    const { date, block, markedBy, records } = await req.json();

    if (!date || !block || !markedBy || !records || records.length === 0) {
      return NextResponse.json(
        {
          message: "Invalid payload. Missing required fields or empty records.",
        },
        { status: 400 },
      );
    }

    // 3. Normalize Date (Strip time to ensure consistency)
    // We treat everything as UTC midnight to avoid timezone headaches
    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    // 4. Perform the "Upsert" Operation
    // logic: Find a sheet for this Block + Date. If found, update it. If not, create it.
    const session = await AttendanceSession.findOneAndUpdate(
      {
        date: attendanceDate,
        block: block,
      },
      {
        $set: {
          markedBy: markedBy,
          records: records, // Replaces the array with the latest version
        },
      },
      {
        new: true, // Return the new document
        upsert: true, // Create if doesn't exist
        runValidators: true,
      },
    );

    // 5. Return Success
    return NextResponse.json(
      {
        message: "Attendance operative manifest submitted successfully",
        count: records.length,
        data: session,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("❌ Attendance Submit Error:", error);

    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Internal Server Anomaly" },
      { status: 500 },
    );
  }
}
