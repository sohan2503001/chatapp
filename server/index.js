import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import messageRoutes from './routes/message.routes.js';
import userRoutes from './routes/user.routes.js';
import { protectRoute } from './middleware/protectRoute.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:5173', // Your frontend's URL
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/messages', protectRoute, messageRoutes);
app.use('/api/users', protectRoute, userRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

// --- Add this database connection logic ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chatapp';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Start listening for requests only after the DB connection is successful
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
  });