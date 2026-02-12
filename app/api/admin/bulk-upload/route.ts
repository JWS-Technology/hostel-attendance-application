import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbconfig/db";
import Student from "@/models/Student";
import User from "@/models/User";
import { hashPassword } from "@/lib/auth"; // Your bcrypt wrapper

export async function POST(req: NextRequest) {
  try {
    await connect();
    const body = await req.json(); // Expecting an array of students
    const studentsData = body.students;

    if (!Array.isArray(studentsData) || studentsData.length === 0) {
      return NextResponse.json(
        { message: "No data provided" },
        { status: 400 },
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // We process sequentially or in parallel.
    // For safety (to prevent partial failures messing up logs), let's loop.
    for (const row of studentsData) {
      try {
        // 1. Skip if crucial data is missing (Handle the 'null' seen in your CSV)
        if (!row.registerNo || row.registerNo === "null") {
          results.failed++;
          results.errors.push(
            `Skipped row: Missing Register No for ${row.name}`,
          );
          continue;
        }

        // 2. Check existence
        const existing = await Student.findOne({ registerNo: row.registerNo });
        if (existing) {
          results.failed++;
          results.errors.push(`Skipped ${row.registerNo}: Already exists`);
          continue;
        }

        // 3. Create Student
        const newStudent = await Student.create({
          registerNo: row.registerNo,
          accountNo: Number(row.accountNo), // Ensure number
          name: row.name,
          religion: row.religion === "null" ? undefined : row.religion,
          block: row.block,
          roomNo: row.roomNo,
          parentPhone: row.parentPhone || "0000000000",
          studentPhone: row.studentPhone || "0000000000",
          isActive: true,
        });

        // 4. Create User Login (Default Password: "password123")
        // In a real system, maybe use their DOB or Phone Number as initial password
        const hashedPassword = await hashPassword("1234");

        await User.create({
          username: row.registerNo,
          passwordHash: hashedPassword,
          role: "STUDENT",
          profileId: newStudent._id,
        });

        results.success++;
      } catch (err: any) {
        console.error(`Error processing ${row.name}:`, err);
        results.failed++;
        results.errors.push(`Failed ${row.name}: ${err.message}`);
      }
    }

    return NextResponse.json({
      message: "Bulk processing complete",
      data: results,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
