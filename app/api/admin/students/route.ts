import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbconfig/db";
import Student from "@/models/Student";
import User from "@/models/User";
import { hashPassword } from "@/lib/auth"; // Assumes you made this helper

export async function POST(req: NextRequest) {
  try {
    await connect();
    const body = await req.json();

    // 1. Check if already exists
    const existing = await Student.findOne({ registerNo: body.registerNo });
    if (existing) throw new Error(`Student ${body.registerNo} already exists`);

    // 2. Create Student Profile
    const newStudent = await Student.create({
      registerNo: body.registerNo,
      accountNo: body.accountNo,
      name: body.name,
      religion: body.religion,
      parentPhone: body.parentPhone,
      studentPhone: body.studentPhone,
      block: body.block,
      roomNo: body.roomNo,
      isActive: true,
    });

    // 3. AUTOMATICALLY Create User Login
    const hashedPassword = await hashPassword("password123"); // Default Password
    await User.create({
      username: body.registerNo, // User logs in with RegNo
      passwordHash: hashedPassword,
      role: "STUDENT",
      profileId: newStudent._id,
    });

    return NextResponse.json({
      message: "Student and Login created successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
