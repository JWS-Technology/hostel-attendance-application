import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbconfig/db";
import Staff from "@/models/Staff";
import User from "@/models/User";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connect();
    const body = await req.json();

    // 1. Create Staff Profile
    const newStaff = await Staff.create({
      staffCode: body.staffCode,
      name: body.name,
      phone: body.phone,
      role: "AD",
    });

    // 2. Create User Login
    const hashedPassword = await hashPassword(body.password); // Custom password for AD
    await User.create({
      username: body.username,
      passwordHash: hashedPassword,
      role: "AD",
      profileId: newStaff._id,
    });

    return NextResponse.json({ message: "AD Account created successfully" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
