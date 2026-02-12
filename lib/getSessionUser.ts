// lib/getSessionUser.ts
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import { connect } from "@/dbconfig/db";

export async function getSessionUser() {
  await connect();

  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) return null;

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) return null;

    return user;
  } catch {
    return null;
  }
}
