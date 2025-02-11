//lib/models/Procedure.js
import mongoose from 'mongoose';

export const ProcedureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome do procedimento é obrigatório'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Categoria é obrigatória'],
    enum: [
      'Cirurgia',
      'Consulta',
      'Exame',
      'Procedimento Ambulatorial',
      'Tratamento',
      'Emergência',
      'Internação',
      'Reabilitação',
      'Diagnóstico por Imagem',
      'Outro'
    ]
  },
  date: {
    type: Date,
    required: [true, 'Data é obrigatória']
  },
  doctor: {
    type: String,
    required: [true, 'Nome do médico é obrigatório'],
    trim: true
  },
  patient: {
    type: String,
    required: [true, 'Nome do paciente é obrigatório'],
    trim: true
  }
}, {
  timestamps: true
});

// Export the schema instead of the model