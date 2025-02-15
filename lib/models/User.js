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
}, {
  timestamps: true  // Added to match Income schema style
});

// Function to get or create the User model for a specific connection
export function getUserModel(connection) {
  // Check if the model is already registered to avoid recompilation
  return connection.models.User || connection.model('User', UserSchema);
}

// Don't create the model here - it will be created per tenant