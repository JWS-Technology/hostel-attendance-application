import { Schema, model, models } from "mongoose";

const AttendanceRecordSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    accountNo: { type: Number, required: true },
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ["PRESENT", "ABSENT", "ON_LEAVE"],
      required: true,
    },
    remarks: String,
  },
  { _id: false },
);

const AttendanceSessionSchema = new Schema(
  {
    date: { type: Date, required: true },
    block: { type: String, required: true },
    markedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    records: [AttendanceRecordSchema],
  },
  { timestamps: true },
);

// One sheet per block per day
AttendanceSessionSchema.index({ date: 1, block: 1 }, { unique: true });

export default models.AttendanceSession ||
  model("AttendanceSession", AttendanceSessionSchema);
