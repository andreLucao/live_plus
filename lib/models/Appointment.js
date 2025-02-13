//lib/models/Appointment.js
import mongoose from 'mongoose';

export const AppointmentSchema = new mongoose.Schema({
  tenantPath: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Confirmed', 'Canceled'],
    default: 'Pending'
  },
  date: {
    type: Date,
    required: [true, 'Data é obrigatória']
  },
  professional: {
    type: String,
    required: [true, 'Profissional é obrigatório'],
    trim: true
  },
  patient: {
    type: String,
    required: [true, 'Paciente é obrigatório'],
    trim: true
  },
  service: {
    type: String,
    required: [true, 'Serviço é obrigatório'],
    trim: true
  }
}, {
  timestamps: true
});

// Add compound index for tenantPath
AppointmentSchema.index({ tenantPath: 1, date: -1 });

// Export the schema instead of the model