import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connect } from "@/dbconfig/db";
import RefreshToken from "@/models/refreshToken";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    await connect();
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (refreshToken) {
      // 1. Revoke in DB so it can never be used again
      const tokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");
      await RefreshToken.deleteOne({ tokenHash }); // Or set revoked: true
    }

    // 2. Clear the browser cookies
    cookieStore.delete("accessToken");
    cookieStore.delete("refreshToken");

    return NextResponse.json({ message: "Logged out" });
  } catch (error) {
    return NextResponse.json({ message: "Logout failed" }, { status: 500 });
  }
}
