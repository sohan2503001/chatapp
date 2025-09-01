// server/models/user.model.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // ... username, email, password fields
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  // Add these two new fields
  passwordResetToken: String,
  passwordResetExpires: Date,

  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: String,
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);

export default User;