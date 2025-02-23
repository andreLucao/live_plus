import mongoose from 'mongoose';

const patientDetailsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  clinicalHistory: [{
    type: String
  }],
  surgicalHistory: [{
    type: String
  }],
  familyHistory: [{
    type: String
  }],
  habits: [{
    type: String
  }],
  allergies: [{
    type: String
  }],
  medications: [{
    type: String
  }],
  lastDiagnoses: [{
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    diagnosis: {
      type: String,
      required: true
    },
    notes: String
  }]
}, {
  timestamps: true
});

export default mongoose.models.PatientDetails || mongoose.model('PatientDetails', patientDetailsSchema);