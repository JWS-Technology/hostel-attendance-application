import { Schema, model, models } from "mongoose";

const AdAssignmentSchema = new Schema(
  {
    staffId: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
      unique: true,
    },
    allocations: [
      {
        block: { type: String, required: true },
        roomNo: { type: String, required: true },
      },
    ],
  },
  { timestamps: true },
);

export default models.AdAssignment || model("AdAssignment", AdAssignmentSchema);
