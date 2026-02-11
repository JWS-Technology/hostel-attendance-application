import { Schema, model, models } from "mongoose";

const LeaveRequestSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    reason: { type: String, required: true },
    approvalRequired: { type: Boolean, required: true },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    actionBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export default models.LeaveRequest || model("LeaveRequest", LeaveRequestSchema);
