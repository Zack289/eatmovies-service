import { Schema, model } from "mongoose";
import { IInteraction } from "../types";

const interactionSchema = new Schema<IInteraction>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    media: { type: Schema.Types.ObjectId, ref: "Media", required: true, index: true },
    kind: {
      type: String,
      enum: ["favorite", "watched", "wishlist"],
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// A user can only have one interaction of a given kind per media item.
interactionSchema.index({ user: 1, media: 1, kind: 1 }, { unique: true });

export default model<IInteraction>("Interaction", interactionSchema);
