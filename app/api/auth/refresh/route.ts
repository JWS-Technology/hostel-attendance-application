import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { connect } from "@/dbconfig/db";
import RefreshToken from "@/models/refreshToken";

export async function POST(req: NextRequest) {
  try {
    await connect();

    // 1. Get the refresh token from the cookie
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json({ message: "Session expired" }, { status: 401 });
    }

    // 2. Hash it to find the match in DB
    const incomingTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const matchedToken = await RefreshToken.findOne({
      tokenHash: incomingTokenHash,
      revoked: false,
    });

    // Security check: Match, expiration, and status
    if (!matchedToken || matchedToken.expiresAt < new Date()) {
      // If token is invalid or expired, clear cookies
      cookieStore.delete("accessToken");
      cookieStore.delete("refreshToken");
      return NextResponse.json({ message: "Invalid session" }, { status: 401 });
    }

    // 3. 🔁 ROTATION: Revoke the old token
    matchedToken.revoked = true;
    await matchedToken.save();

    // 4. Generate New Tokens
    const newAccessToken = jwt.sign(
      { id: matchedToken.userId }, // You can add role/profileId here if needed
      process.env.JWT_SECRET!,
      { expiresIn: "15m" },
    );

    const newRefreshToken = crypto.randomBytes(40).toString("hex");
    const newRefreshTokenHash = crypto
      .createHash("sha256")
      .update(newRefreshToken)
      .digest("hex");

    // 5. Store New Refresh Token
    await RefreshToken.create({
      userId: matchedToken.userId,
      deviceId: matchedToken.deviceId,
      tokenHash: newRefreshTokenHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 Days
    });

    // 6. Update Cookies
    cookieStore.set("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60,
      path: "/",
    });

    cookieStore.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return NextResponse.json({ message: "Token refreshed" });
  } catch (error: any) {
    console.error("Refresh Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
