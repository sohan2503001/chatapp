// server/routes/auth.routes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import protect from '../middleware/auth.middleware.js';

const router = express.Router();

// ## POST /api/auth/register ##
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    // Save the user to the database
    const savedUser = await newUser.save();

    res.status(201).json({ message: 'User registered successfully!', userId: savedUser._id });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ## POST /api/auth/login ##
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // If credentials are correct, create a JWT
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' }, // Token expires in 1 hour
      (err, token) => {
        if (err) throw err;
        res.json({ token }); // 4. Send the token to the client
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// ## POST /api/auth/logout ##
router.post('/logout', (req, res) => {
  // In a stateless JWT setup, the primary logout logic is on the client-side.
  // The client should delete the stored token.
  // This endpoint is here to provide a formal logout mechanism.
  res.status(200).json({ message: 'Logged out successfully.' });
});


// ## GET /api/auth/profile - Get user profile (Protected) ##
router.get('/profile', protect, async (req, res) => {
  try {
    // The user's ID is attached to req.user by the 'protect' middleware
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ## PUT /api/auth/profile - Update user profile (Protected) ##
router.put('/profile', protect, async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if they are provided in the request
    if (username) user.username = username;
    if (email) user.email = email;

    const updatedUser = await user.save();

    res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
    });
  } catch (error) {
    // Handle potential duplicate email error
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email is already in use.' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ## DELETE /api/auth/profile - Delete user account (Protected) ##
router.delete('/profile', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User account deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;