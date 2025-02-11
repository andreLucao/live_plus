//lib/models/Appointment.js
import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
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

export const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);