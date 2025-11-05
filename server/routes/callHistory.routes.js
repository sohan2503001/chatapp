// server/routes/callHistory.routes.js
import express from 'express';
import CallHistory from '../models/callHistory.model.js';
import { protectRoute } from '../middleware/protectRoute.js';

const router = express.Router();

// --- GET /api/callhistory ---
// Fetches the call history for the logged-in user
router.get('/', protectRoute, async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all calls where the user was either the initiator or receiver
    const callLogs = await CallHistory.find({
      $or: [{ initiator: userId }, { receiver: userId }],
    })
    .populate('initiator', 'username profilePic') // Get username and pic
    .populate('receiver', 'username profilePic') // Get username and pic
    .sort({ startTime: -1 }); // Show most recent calls first

    res.status(200).json(callLogs);

  } catch (error) {
    console.error("Error in getCallHistory: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- POST /api/callhistory/log ---
// Creates a new log entry for a call
router.post('/log', protectRoute, async (req, res) => {
  try {
    const { initiator, receiver, callType, status, startTime, endTime, duration } = req.body;
    const loggedInUserId = req.user._id;

    // Security check: Make sure the logged-in user is part of the call
    if (loggedInUserId.toString() !== initiator && loggedInUserId.toString() !== receiver) {
        return res.status(403).json({ error: "User not authorized to log this call" });
    }

    const newCallLog = new CallHistory({
      initiator,
      receiver,
      callType,
      status,
      startTime,
      endTime,
      duration,
    });

    await newCallLog.save();

    res.status(201).json(newCallLog);

  } catch (error) {
    console.error("Error in logCallHistory: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;