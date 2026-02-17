import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbconfig/db";
import AttendanceSession from "@/models/Attendance";
import { getSessionUser } from "@/lib/getSessionUser";

export async function GET(req: NextRequest) {
  try {
    await connect();

    // 1. Identify the logged-in student using the stateless session
    const user = await getSessionUser();
    if (!user || user.role !== "STUDENT") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    /**
     * 2. Query Logic:
     * We look for AttendanceSessions where the 'records' array contains
     * an object with the student's ID.
     */
    const history = await AttendanceSession.find({
      "records.studentId": user.profileId,
    })
      .select("date block records") // Get relevant fields
      .sort({ date: -1 }); // Show most recent attendance first

    // 3. Format the data for the frontend
    // We only want to return the specific record for THIS student, not the whole block's list.
    const formattedHistory = history.map((session) => {
      const myRecord = session.records.find(
        (r: any) => r.studentId.toString() === user.profileId.toString(),
      );

      return {
        date: session.date,
        block: session.block,
        status: myRecord?.status || "NOT_MARKED",
        remarks: myRecord?.remarks || "",
      };
    });

    return NextResponse.json(
      {
        message: "Attendance history retrieved",
        count: formattedHistory.length,
        data: formattedHistory,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("❌ Student Attendance Fetch Error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
