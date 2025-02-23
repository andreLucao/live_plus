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
    enum: ['owner', 'user', 'doctor', 'admin'],
    default: 'user'
  },
  emailPreferences: {
    receiveNotifications: {
      type: Boolean,
      default: true
    },
    nextScheduledEmail: {
      type: Date,
      default: null
    },
    lastEmailSent: {
      type: Date,
      default: null
    }
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

// Add a static method to find users who should receive emails on a specific date
UserSchema.statics.findUsersForEmailsOn = async function(date) {
  return this.find({
    'emailPreferences.receiveNotifications': true,
    'emailPreferences.nextScheduledEmail': {
      $lte: date
    }
  });
};

// Function to get or create the User model for a specific connection
export function getUserModel(connection) {
  // Check if the model is already registered to avoid recompilation
  return connection.models.User || connection.model('User', UserSchema);
}

// Don't create the model here - it will be created per tenant