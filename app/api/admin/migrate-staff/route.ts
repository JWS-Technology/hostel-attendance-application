import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbconfig/db";
import User from "@/models/User";
import Staff from "@/models/Staff";
import AdAssignment from "@/models/AdAssignment";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connect();
    const body = await req.json();
    const legacyUsers = body.users;

    if (!Array.isArray(legacyUsers)) {
      return NextResponse.json(
        { message: "Invalid format. Expected array." },
        { status: 400 },
      );
    }

    const stats = { success: 0, failed: 0, errors: [] as string[] };

    for (const oldUser of legacyUsers) {
      try {
        // 1. SKIP IF USER ALREADY EXISTS
        const exists = await User.findOne({ username: oldUser.username });
        if (exists) {
          stats.failed++;
          stats.errors.push(`Skipped ${oldUser.username}: User already exists`);
          continue;
        }

        // 2. NORMALIZE ROLE AND CREATE STAFF PROFILE
        const randomCode = `LEGACY-${Math.floor(1000 + Math.random() * 9000)}`;
        const normalizedRole =
          oldUser.role.toUpperCase() === "ADMIN"
            ? "DIRECTOR"
            : oldUser.role.toUpperCase();

        const newStaff = await Staff.create({
          staffCode: randomCode,
          name: oldUser.username,
          phone: "0000000000",
          role: normalizedRole === "DIRECTOR" ? "DIRECTOR" : "AD",
          isActive: true,
        });

        // 3. HASH PASSWORD AND CREATE USER LOGIN
        const hashedPassword = await hashPassword(oldUser.password.toString());
        await User.create({
          username: oldUser.username,
          passwordHash: hashedPassword,
          role: normalizedRole,
          profileId: newStaff._id,
        });

        // 4. CONSOLIDATED ROOM ASSIGNMENT LOGIC
        if (normalizedRole === "AD" && oldUser.roomsIncharge) {
          const allocations: any[] = [];
          const ri = oldUser.roomsIncharge;

          // Helper to process a single range/hall object
          const processEntry = (entry: any) => {
            const block = entry.block || "A";
            // Handle numeric range (e.g., 2 to 20)
            if (entry.from && entry.to) {
              for (let i = entry.from; i <= entry.to; i++) {
                allocations.push({ block, roomNo: i.toString() });
              }
            }
            // Handle hall array (e.g., ["Xavier Hall", "Beschi Hall"])
            if (entry.hall && Array.isArray(entry.hall)) {
              entry.hall.forEach((h: string) => {
                allocations.push({ block, roomNo: h });
              });
            }
          };

          // Handle if roomsIncharge is an Array (Vimal Jerald style)
          // or a Single Object (Rex/Jovin style)
          if (Array.isArray(ri)) {
            ri.forEach(processEntry);
          } else {
            processEntry(ri);
          }

          // Save to AdAssignment using upsert to prevent "Already Exists" crashes
          if (allocations.length > 0) {
            await AdAssignment.findOneAndUpdate(
              { staffId: newStaff._id },
              { staffId: newStaff._id, allocations: allocations },
              { upsert: true, new: true },
            );
          }
        }

        stats.success++;
      } catch (err: any) {
        console.error(`Error migrating ${oldUser.username}:`, err);
        stats.failed++;
        stats.errors.push(`${oldUser.username}: ${err.message}`);
      }
    }

    return NextResponse.json({ message: "Migration complete", data: stats });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
