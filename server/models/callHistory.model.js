// server/models/callHistory.model.js
import mongoose from "mongoose";

const callHistorySchema = new mongoose.Schema(
  {
    // The person who started the call
    initiator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The person who received the call
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The type of call
    callType: {
      type: String,
      enum: ["video", "audio"],
      required: true,
      default: "video",
    },
    // The final status of the call
    status: {
      type: String,
      enum: ["completed", "missed", "declined"],
      required: true,
    },
    // When the call started (or was initiated)
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    // When the call ended
    endTime: {
      type: Date,
    },
    // Duration in seconds
    duration: {
      type: Number, // Storing in seconds
      default: 0,
    },
  },
  { timestamps: true } // Adds createdAt (for when the log was created)
);

const CallHistory = mongoose.model("CallHistory", callHistorySchema);

export default CallHistory;