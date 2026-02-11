import { Schema, model, models } from "mongoose";

const HostelAllocationSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    block: { type: String, required: true },
    roomNo: { type: String, required: true },
    bedNo: String,
    fromDate: { type: Date, required: true },
    toDate: Date,
    isCurrent: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Who is currently in a room?
HostelAllocationSchema.index({ block: 1, roomNo: 1, isCurrent: 1 });

export default models.HostelAllocation ||
  model("HostelAllocation", HostelAllocationSchema);
