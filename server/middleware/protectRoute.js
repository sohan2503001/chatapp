import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ error: "Not authorized, token failed" });
    }

    // --- The Fix is on this line ---
    // We need to look for the user ID inside decoded.user.id
    const user = await User.findById(decoded.user.id).select("-password");
    
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    req.user = user;
    
    next();
  } catch (error) {
    console.error("Error in protectRoute middleware: ", error.message);
    res.status(401).json({ error: "Not authorized" });
  }
};