import { Schema, model, models } from "mongoose";

const SystemConfigSchema = new Schema({
  attendanceStartTime: { type: String, default: "20:30" },
  attendanceEndTime: { type: String, default: "22:00" },
  leaveCutoffTime: { type: String, default: "18:00" },
  weekendAutoApprove: { type: Boolean, default: true },
});

export default models.SystemConfig || model("SystemConfig", SystemConfigSchema);
