import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { connect } from "@/dbconfig/db";
import User from "@/models/User";
import Staff from "@/models/Staff";
import Student from "@/models/Student";
import RefreshToken from "@/models/refreshToken";

export async function GET(req: NextRequest) {
  try {
    await connect();

    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "No session found" },
        { status: 401 },
      );
    }

    // 1. Verify the Access Token exists and is cryptographically valid
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    // 2. THE CRITICAL CHANGE: Check the DB for an active session
    // If you delete the refresh token from the DB, this query will fail
    const activeSession = await RefreshToken.findOne({
      userId: decoded.id,
      revoked: false,
      expiresAt: { $gt: new Date() }, // Must not be expired
    });

    if (!activeSession) {
      // If no matching active session in DB, clear the "lying" cookies
      cookieStore.delete("accessToken");
      cookieStore.delete("refreshToken");
      return NextResponse.json(
        { message: "Session revoked or expired" },
        { status: 401 },
      );
    }

    // 3. Proceed only if the DB session is valid
    const user = await User.findById(decoded.id).select("-passwordHash");
    if (!user)
      return NextResponse.json({ message: "User not found" }, { status: 404 });

    let profileData =
      user.role === "STUDENT"
        ? await Student.findById(user.profileId)
        : await Staff.findById(user.profileId);

    return NextResponse.json(
      {
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          name: profileData?.name || user.username,
          profileId: user.profileId,
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ message: "Invalid session" }, { status: 401 });
  }
}
