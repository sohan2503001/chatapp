import express from 'express';
// import { protectRoute } from '../middleware/protectRoute.js';
import Conversation from '../models/conversation.model.js';
import Message from '../models/message.model.js';
import { db } from '../firebaseAdmin.js';

const router = express.Router();

// ## GET /api/messages/:id - Get messages between two users ##
router.get('/:id', async (req, res) => {
  try {
    const { id: userToChatWithId } = req.params;
    const senderId = req.user._id;

    // Find the conversation containing both users' IDs
    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, userToChatWithId] },
    }).populate('messages'); // .populate() replaces the message IDs with the actual message documents

    // If no conversation exists, return an empty array
    if (!conversation) {
      return res.status(200).json([]);
    }

    res.status(200).json(conversation.messages);
  } catch (error) {
    console.error("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ## POST /api/messages/send/:id - Send a new message ##
router.post('/send/:id', async (req, res) => {
  try {
    const { messageType, content, url, thumbnailUrl } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id; // We get this from the protectRoute middleware

    // Validate messageType and required fields
    if (!messageType) {
       return res.status(400).json({ error: "messageType is required" });
    }
    if (messageType === 'text' && !content) {
      return res.status(400).json({ error: "Text content is required" });
    }
    if (messageType !== 'text' && !url) {
      return res.status(400).json({ error: "File URL is required" });
    }

    // Find the conversation between these two users
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    // If no conversation exists, create a new one
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    // Create the new message
    const newMessage = new Message({
      senderId,
      receiverId,
      messageType,
      content: content || '',
      url: url || '',
      thumbnailUrl: thumbnailUrl || '',
      isSeen: false,
    });

    // If the message was created, add its ID to the conversation
    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }
    
    // Save both the conversation and the new message in parallel
    await Promise.all([conversation.save(), newMessage.save()]);

    // ALSO send to Firebase Firestore for real-time updates
    try {
          // Create a new, clean object for Firebase.
          // Convert all ObjectIds to simple strings using .toString()
          const messageForFirebase = {
            senderId: newMessage.senderId.toString(),
            receiverId: newMessage.receiverId.toString(),
            messageType: newMessage.messageType,
            content: newMessage.content,
            url: newMessage.url,
            thumbnailUrl: newMessage.thumbnailUrl,
            createdAt: new Date(), // Use a native JavaScript Date
            isSeen: false,
        };

        const newFirebaseDoc = await db.collection('messages').add(messageForFirebase); // Add to 'messages' collection in Firestore

        newMessage.firebaseDocId = newFirebaseDoc.id; // Store the Firestore document ID in MongoDB

        } catch (firebaseError) {
          console.error("Error writing to Firebase:", firebaseError);
        }

        await Promise.all([conversation.save(), newMessage.save()]);
      
      // Create a notification for the receiver
    try {
          const notificationData = {
            receiverId: newMessage.receiverId.toString(),
            senderId: newMessage.senderId.toString(),
            senderName: req.user.username, // We have this from the protectRoute middleware
            type: 'NEW_MESSAGE',
            isRead: false,
            createdAt: new Date(),
          };
          // We'll create a new document in a 'notifications' collection
          await db.collection('notifications').add(notificationData);
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