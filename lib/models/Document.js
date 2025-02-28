import mongoose from 'mongoose';

export const DocumentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  fileType: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  data: {
    type: Buffer,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add compound index for userId to improve query performance
DocumentSchema.index({ userId: 1 });

// Function to get or create the Document model for a specific connection
export function getDocumentModel(connection) {
  // Check if the model is already registered to avoid recompilation
  return connection.models.Document || connection.model('Document', DocumentSchema);
} 