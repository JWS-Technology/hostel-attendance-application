import { Schema, model, models } from "mongoose";

const StudentSchema = new Schema(
  {
    registerNo: { type: String, required: true, unique: true },
    accountNo: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    religion: String,
    parentPhone: { type: String, required: true },
    studentPhone: { type: String, required: true },

    // snapshot fields for UI
    currentBlock: String,
    currentRoomNo: String,

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default models.Student || model("Student", StudentSchema);
