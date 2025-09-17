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

    // Attach the user to the request object
    req.user = await User.findById(decoded.userId).select("-password");
    
    next();
  } catch (error) {
    console.error("Error in protectRoute middleware: ", error.message);
    res.status(401).json({ error: "Not authorized" });
  }
};