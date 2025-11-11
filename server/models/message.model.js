// server/models/message.model.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    
    messageType: {
      type: String,
      enum: ["text", "image", "video", "audio"],
      required: true,
      default: "text",
    },
    content: {
      type: String, // Will store the text message
      default: "",
    },
    url: {
      type: String, // For original image/video/audio
      default: "",
    },
    thumbnailUrl: {
      type: String, // For image/video thumbnails
      default: "",
    },
    isSeen: {
      type: Boolean,
      default: false,
    },
    firebaseDocId: {
      type: String,
      default: "",
    },
    
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;