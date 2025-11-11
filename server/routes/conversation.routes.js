import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import Conversation from '../models/conversation.model.js';
import User from '../models/user.model.js';
import Message from '../models/message.model.js';

const router = express.Router();

// --- GET /api/conversations ---
// Fetches ALL conversations (groups and 1-on-1) for the logged-in user
router.get('/', protectRoute, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const conversations = await Conversation.find({ 
      participants: loggedInUserId 
    })
    .populate({
        path: "participants",
        select: "username profilePic", // Only get username and profile pic
    })
    .populate({
        path: "groupAdmin",
        select: "_id username profilePic",
    })
    .sort({ updatedAt: -1 }); // Show most recent chats first

    res.status(200).json(conversations);

  } catch (error) {
    console.error("Error in getConversations: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- POST /api/conversations/create-group ---
// Creates a new group chat
router.post('/create-group', protectRoute, async (req, res) => {
  try {
    const { groupName, participants } = req.body; // participants is an array of user IDs
    const adminId = req.user._id;

    if (!groupName || !participants || participants.length === 0) {
      return res.status(400).json({ error: "Please provide a group name and at least one participant." });
    }

    // Add the admin (the creator) to the participants list
    const allParticipants = [...participants, adminId];

    // Create the new group conversation
    const newGroupConversation = new Conversation({
      isGroupChat: true,
      groupName,
      groupAdmin: adminId,
      participants: allParticipants,
      messages: [], // Start with no messages
    });

    await newGroupConversation.save();

    // Populate the new group with user details before sending back
    await newGroupConversation.populate([
        { path: "participants", select: "username profilePic" },
        { path: "groupAdmin", select: "username profilePic" }
    ]);

    res.status(201).json(newGroupConversation);

  } catch (error) {
    console.error("Error in createGroup: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- DELETE /api/conversations/:id ---
// Deletes a group chat. Only the admin can do this.
router.delete('/:id', protectRoute, async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const userId = req.user._id;

    // Find the conversation
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    if (!conversation.isGroupChat) {
      return res.status(400).json({ error: 'This is not a group chat.' });
    }

    // Check if the user is the group admin
    if (!conversation.groupAdmin || conversation.groupAdmin.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Only the group admin can delete the group.' });
    }

    // Delete all messages associated with this conversation
    await Message.deleteMany({ conversationId: conversationId });

    // Delete the conversation itself
    await Conversation.findByIdAndDelete(conversationId);

    res.status(200).json({ message: 'Group deleted successfully.' });

  } catch (error) {
    console.error("Error in deleteGroup: ", error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- POST /api/conversations/find-or-create ---
// Finds or creates a 1-on-1 chat with another user
router.post('/find-or-create', protectRoute, async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    if (!receiverId) {
      return res.status(400).json({ error: 'Receiver ID is required' });
    }

    // Find an existing 1-on-1 conversation
    let conversation = await Conversation.findOne({
      isGroupChat: false,
      participants: { $all: [senderId, receiverId] },
    })
    .populate("participants", "_id username profilePic")
    .populate("groupAdmin", "_id username profilePic");

    // If a conversation already exists, return it
    if (conversation) {
      return res.status(200).json(conversation);
    }

    // If not, create a new 1-on-1 conversation
    conversation = new Conversation({
      isGroupChat: false,
      participants: [senderId, receiverId],
    });

    await conversation.save();

    // Populate the new conversation before sending
    await conversation.populate([
        { path: "participants", select: "_id username profilePic" },
    ]);

    res.status(201).json(conversation);

  } catch (error) {
    console.error("Error in findOrCreateConversation: ", error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;