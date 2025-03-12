// lib/models/Appointment.js

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
  },
  meetingId: {
    type: String,
    trim: true
  },
  meetingUrl: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Add compound index for tenantPath
AppointmentSchema.index({ tenantPath: 1, date: -1 });

// Function to get or create the Appointment model for a specific connection
export function getAppointmentModel(connection) {
  // Check if the model is already registered to avoid recompilation
  return connection.models.Appointment || connection.model('Appointment', AppointmentSchema);
}