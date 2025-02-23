import mongoose from 'mongoose';

export const PatientDetailsSchema = new mongoose.Schema({
  tenantPath: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Inactive', 'Archived'],
    default: 'Active'
  },
  clinicalHistory: {
    type: String,
    trim: true
  },
  surgicalHistory: {
    type: String,
    trim: true
  },
  familyHistory: {
    type: String,
    trim: true
  },
  habits: {
    type: String,
    trim: true
  },
  allergies: {
    type: String,
    trim: true
  },
  medications: {
    type: String,
    trim: true
  },
  lastDiagnosis: {
    date: {
      type: Date,
      default: Date.now
    },
    diagnosis: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true
});

// Add compound index for tenantPath
PatientDetailsSchema.index({ tenantPath: 1 });

// Function to get or create the PatientDetails model for a specific connection
export function getPatientDetailsModel(connection) {
  return connection.models.PatientDetails || connection.model('PatientDetails', PatientDetailsSchema);
}