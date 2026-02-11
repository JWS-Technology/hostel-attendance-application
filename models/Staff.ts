import { Schema, model, models } from "mongoose";

const StaffSchema = new Schema(
  {
    staffCode: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, enum: ["AD", "DIRECTOR"], required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default models.Staff || model("Staff", StaffSchema);
