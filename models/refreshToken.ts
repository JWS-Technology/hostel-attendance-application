import mongoose, { Schema } from "mongoose";

const RefreshTokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    deviceId: {
      type: String,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revoked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export default mongoose.models.RefreshToken ||
  mongoose.model("RefreshToken", RefreshTokenSchema);
