import { Schema, model, models } from "mongoose";

const StudentSchema = new Schema(
  {
    registerNo: { type: String, required: true, unique: true },
    accountNo: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    religion: String,
    parentPhone: { type: String, required: true },
    studentPhone: { type: String, required: true },

    // ROOM ASSIGNMENT (Directly here)
    // If a student vacates, you just set these to null or move them to an "Alumni" collection
    block: { type: String, required: true }, // "A"
    roomNo: { type: String, required: true }, // "2"

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// OPTIMIZATION: Index for "Get all students in Block A"
// This makes your attendance sheet loading instant.
StudentSchema.index({ block: 1, roomNo: 1, isActive: 1 });

export default models.Student || model("Student", StudentSchema);
