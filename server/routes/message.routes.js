import express from 'express';
// import { protectRoute } from '../middleware/protectRoute.js';
import Conversation from '../models/conversation.model.js';
import Message from '../models/message.model.js';
import { db } from '../firebaseAdmin.js';

const router = express.Router();

// ## GET /api/messages/:id - Get messages between two users ##
router.get('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const senderId = req.user._id;

    // Find the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: { $in: [senderId] }, // Make sure user is in this conversation
    }).populate('messages'); // Get all the message documents

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found or you're not a member" });
    }

    res.status(200).json(conversation.messages);

  } catch (error) {
    console.error("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ## POST /api/messages/send/:id - Send a new message ##
router.post('/send/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const senderId = req.user._id;
    const { messageType, content, url, thumbnailUrl } = req.body;

    // --- 1. Find the conversation ---
    let conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // --- 2. Check if the sender is actually a participant ---
    if (!conversation.participants.includes(senderId)) {
      return res.status(403).json({ error: "You are not a member of this conversation" });
    }

    // --- 3. Create the new message ---
    const newMessage = new Message({
      senderId,
      conversationId,
      messageType,
      content: content || '',
      url: url || '',
      thumbnailUrl: thumbnailUrl || '',
      isSeen: false,
      // Note: We don't set receiverId for group chats
    });

    // --- 4. Add message to conversation ---
    conversation.messages.push(newMessage._id);
    
    // --- 5. Save to Firebase (with conversationId) ---
    try {
      const messageForFirebase = {
        senderId: newMessage.senderId.toString(),
        conversationId: newMessage.conversationId.toString(), // Add this
        messageType: newMessage.messageType,
        content: newMessage.content,
        url: newMessage.url,
        thumbnailUrl: newMessage.thumbnailUrl,
        createdAt: new Date(),
        isSeen: false,
      };
      
      const newFirebaseDoc = await db.collection('messages').add(messageForFirebase);
      newMessage.firebaseDocId = newFirebaseDoc.id; // Save Firebase ID

    } catch (firebaseError) {
      console.error("Error writing to Firebase:", firebaseError);
    }
    
    // --- 6. Save to MongoDB ---
    await Promise.all([conversation.save(), newMessage.save()]);
    
    // --- 7. Notification Logic (unchanged) ---
    try {
      // We need to send a notification to every participant *except* the sender
      
      const notificationPromises = conversation.participants
        .filter(participantId => participantId.toString() !== senderId.toString())
        .map(receiverId => {
          
          // Create a notification for each person
          const notificationData = {
            receiverId: receiverId.toString(), // The ID of the person to notify
            senderId: senderId.toString(),
            senderName: req.user.username,
            type: 'NEW_MESSAGE',
            messageContent: messageType === 'text' ? (content.substring(0, 30) + '...') : 'Sent a file',
            conversationId: conversationId, // So we can navigate to the chat
            isRead: false,
            createdAt: new Date(),
          };
          return db.collection('notifications').add(notificationData);
        });

      // Wait for all notifications to be created
      await Promise.all(notificationPromises);

    } catch (notificationError) {
        console.error("Error writing to Firebase 'notifications':", notificationError);
    }
    
    res.status(201).json(newMessage);

  } catch (error) {
    console.error("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;