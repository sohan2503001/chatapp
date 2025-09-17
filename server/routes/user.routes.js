import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import User from '../models/user.model.js';

const router = express.Router();

// ## GET /api/users - Get all users for the sidebar ##
router.get('/', async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Find all users except the one who is currently logged in
    // The '-password' means we exclude the password field from the result
    const allUsers = await User.find({ _id: { $ne: loggedInUserId } }).select('-password');

    res.status(200).json(allUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;