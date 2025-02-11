import mongoose from 'mongoose';

export const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  tenantPath: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['owner', 'user'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLoginAt: {
    type: Date,
    default: Date.now,
  }
});

// Export the schema instead of the model 