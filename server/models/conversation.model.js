// server/models/conversation.model.js
import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    // 'participants' array already supports multiple users, so this is perfect.
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: [],
      },
    ],
    
    // --- NEW FIELDS FOR GROUP CHAT ---
    isGroupChat: {
      type: Boolean,
      default: false, // false = 1-on-1 chat, true = group chat
    },
    groupName: {
      type: String,
      trim: true,
      default: "", // We'll set this if isGroupChat is true
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // This is not required, as 1-on-1 chats won't have an admin
    },
    groupAvatar: {
      type: String,
      default: "", // URL to a group picture
    },
    // --- END OF NEW FIELDS ---
  },
  { timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;