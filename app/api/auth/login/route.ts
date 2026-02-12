import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbconfig/db";
import User from "@/models/User";
import Student from "@/models/Student";
import Staff from "@/models/Staff";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    await connect();

    const body = await req.json();
    const { username, password } = body;

    // 1. Validate Input
    if (!username || !password) {
      return NextResponse.json(
        { message: "Username and password are required" },
        { status: 400 },
      );
    }

    // 2. Find User
    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    // 3. Check Active Status
    if (!user.isActive) {
      return NextResponse.json(
        { message: "Account is disabled. Contact Admin." },
        { status: 403 },
      );
    }

    // 4. Verify Password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    // 5. Fetch Profile Details (to get the real name)
    let profileData = null;
    if (user.role === "STUDENT") {
      profileData = await Student.findById(user.profileId);
    } else if (user.role === "AD" || user.role === "DIRECTOR") {
      profileData = await Staff.findById(user.profileId);
    }

    // 6. Generate Token
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
        profileId: user.profileId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" },
    );

    // 7. Return Success
    return NextResponse.json(
      {
        message: "Login successful",
        data: {
          token,
          user: {
            id: user._id,
            username: user.username,
            role: user.role,
            name: profileData?.name || user.username,
            profileId: user.profileId,
          },
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
