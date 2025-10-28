// server/routes/auth.routes.js
import express from 'express';
import crypto from 'crypto'; // Import the crypto module
import nodemailer from 'nodemailer'; // Import nodemailer
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import protect from '../middleware/auth.middleware.js';

const router = express.Router();

// ## POST /api/auth/register ##
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if a user with the same email OR username already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });

    if (existingUser) {
      // Check which field was the duplicate and send a specific message
      if (existingUser.username === username) {
        return res.status(400).json({ message: 'Username is already taken. Please choose another.' });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'A user with this email already exists.' });
      }
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 1. Generate a verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');

    // Create a new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      verificationToken: verificationToken, // 2. Save the token to the user
    });

    // Save the user to the database
    const savedUser = await newUser.save();

    // 3. Create the verification URL
    const verificationURL = `http://localhost:5173/verify-email/${verificationToken}`;

    const message = `Thank you for registering. Please click on the following link to verify your email address:\n\n${verificationURL}`;

    // 4. Send the email using Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log("Sending verification email...");
    const mailInfo = await transporter.sendMail({
      from: '"Chat App" <noreply@chatapp.com>',
      to: savedUser.email,
      subject: 'Verify Your Email Address',
      text: message,
    });
    
    console.log("Message sent: %s", nodemailer.getTestMessageUrl(mailInfo));
    // --- End of Email Logic ---

    res.status(201).json({ message: 'Registration successful! Please check your email to verify your account.' });

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

    // --- Add this verification check ---
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email address before logging in.' });
    }
    // --- End of check ---

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
        res.json({ token,
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
          } }); // Send the token to the client and user info
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

// ## POST /api/auth/forgot-password - Request a password reset link ##
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // If no user is found, send a generic success message for security
    if (!user) {
      return res.status(200).json({ message: 'If a user with that email exists, a password reset link has been sent.' });
    }

    // 1. Generate a random reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // 2. Save the token and its expiration date (e.g., 15 minutes) to the user
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // 3. Create the reset URL
    const resetURL = `http://localhost:5173/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) have requested the reset of a password. Please click on the following link, or paste this into your browser to complete the process:\n\n${resetURL}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.`;

    // 4. Send the email using Nodemailer and your Ethereal credentials
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // await transporter.sendMail({
    //   from: '"Chat App" <noreply@chatapp.com>',
    //   to: user.email,
    //   subject: 'Password Reset Token',
    //   text: message,
    // });
    
    // Preview the email in your browser if using Ethereal
    console.log("Message sent: %s", nodemailer.getTestMessageUrl(await transporter.sendMail({
      from: '"Chat App" <noreply@chatapp.com>',
      to: user.email,
      subject: 'Password Reset Token',
      text: message,
    })));

    res.status(200).json({ message: 'If a user with that email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// ## POST /api/auth/reset-password/:token - Reset the password ##
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // 1. Find the user by the token and check if the token has not expired
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }, // $gt means "greater than"
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }

    // 2. Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Update the user's password and clear the reset token fields
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ## GET /api/auth/verify-email/:token - Verify a user's email ##
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).send('<h1>Invalid or expired verification link.</h1>');
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    // Redirect user to the login page with a success message
    res.status(200).json({ message: 'Email verified successfully.' });

  } catch (error) {
    console.error(error);
    res.status(500).send('<h1>Server Error</h1>');
  }
});

export default router;