import mongoose from 'mongoose';

export const ProcedureSchema = new mongoose.Schema({
  tenantPath: {
    type: String,
    required: true,
  },
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

// Add compound index for tenantPath
ProcedureSchema.index({ tenantPath: 1, date: -1 });

// Function to get or create the Procedure model for a specific connection
export function getProcedureModel(connection) {
  // Check if the model is already registered to avoid recompilation
  return connection.models.Procedure || connection.model('Procedure', ProcedureSchema);
}