import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connect } from "@/dbconfig/db";
import User from "@/models/User";
import Student from "@/models/Student";
import Staff from "@/models/Staff";
import RefreshToken from "@/models/refreshToken";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    await connect();
    const { username, password, deviceId } = await req.json();

    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    let profileData =
      user.role === "STUDENT"
        ? await Student.findById(user.profileId)
        : await Staff.findById(user.profileId);

    // 1. Generate Tokens
    const accessToken = jwt.sign(
      { id: user._id, role: user.role, profileId: user.profileId },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" },
    );

    const refreshToken = crypto.randomBytes(40).toString("hex");
    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    // 2. Save Refresh Token to DB
    await RefreshToken.create({
      userId: user._id,
      tokenHash: refreshTokenHash,
      deviceId: deviceId || "unknown_device",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    // 3. Set HTTP-Only Cookies
    const cookieStore = await cookies();

    // Set Access Token
    cookieStore.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60, // 15 minutes
      path: "/",
    });

    // Set Refresh Token
    cookieStore.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return NextResponse.json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        name: profileData?.name || user.username,
        profileId: user.profileId,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
