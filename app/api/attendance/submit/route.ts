import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbconfig/db";
import AttendanceSession from "@/models/Attendance";
import { getSessionUser } from "@/lib/getSessionUser";
import SystemConfig from "@/models/SystemConfig";
import AdAssignment from "@/models/AdAssignment";

export async function POST(req: NextRequest) {
  try {
    await connect();

    const user = await getSessionUser();
    if (!user || user.role !== "AD") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { records } = await req.json();
    if (!records || records.length === 0) {
      return NextResponse.json({ message: "No records" }, { status: 400 });
    }

    // ─────────────────────────────────────────────
    // 1. Load or auto-create SystemConfig
    // ─────────────────────────────────────────────
    let config = await SystemConfig.findOne();

    if (!config) {
      config = await SystemConfig.create({
        attendanceStartTime: "20:30",
        attendanceEndTime: "22:00",
        leaveCutoffTime: "18:00",
        weekendAutoApprove: true,
      });
    }

    // ─────────────────────────────────────────────
    // 2. Attendance window check
    // ─────────────────────────────────────────────
    const now = new Date();

    const [sh, sm] = config.attendanceStartTime.split(":").map(Number);
    const [eh, em] = config.attendanceEndTime.split(":").map(Number);

    const start = new Date(now);
    start.setHours(sh, sm, 0, 0);

    const end = new Date(now);
    end.setHours(eh, em, 0, 0);

    if (now < start || now > end) {
      return NextResponse.json(
        { message: "Attendance window closed" },
        { status: 403 },
      );
    }

    // ─────────────────────────────────────────────
    // 3. Resolve AD assignment
    // ─────────────────────────────────────────────
    const assignment = await AdAssignment.findOne({
      staffId: user.profileId,
    });

    if (!assignment || assignment.allocations.length === 0) {
      return NextResponse.json(
        { message: "No room assignment" },
        { status: 403 },
      );
    }

    const block = assignment.allocations[0].block;

    // Normalize date to UTC midnight
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // ─────────────────────────────────────────────
    // 4. Prevent double submission
    // ─────────────────────────────────────────────
    const existing = await AttendanceSession.findOne({ date: today, block });
    if (existing) {
      return NextResponse.json(
        { message: "Attendance already submitted" },
        { status: 409 },
      );
    }

    // ─────────────────────────────────────────────
    // 5. Create attendance session
    // ─────────────────────────────────────────────
    const session = await AttendanceSession.create({
      date: today,
      block,
      markedBy: user._id,
      records,
    });

    return NextResponse.json({
      message: "Attendance submitted successfully",
      count: records.length,
      data: session,
    });
  } catch (error: unknown) {
    console.error("❌ Attendance Submit Error:", error);

    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
