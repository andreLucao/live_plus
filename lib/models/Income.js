import mongoose from 'mongoose';

export const IncomeSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  }, // Doctor's name
  patientName: { 
    type: String, 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  time: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    required: true 
  },
  paymentType: { 
    type: String, 
    required: true, 
    enum: ['PF', 'PJ'] 
  },
  paymentMethod: { 
    type: String, 
    required: true, 
    enum: ['pix', 'card', 'money', 'transfer'] 
  },
  // Novo campo para valor conciliado
  valorConciliado: { 
    type: Number, 
    default: 0 
  },
  // Novo campo para status de conciliação
  statusConciliacao: { 
    type: String, 
    enum: ['Conciliado', 'Pendente: PJ maior', 'Pendente: PF maior', 'Não conciliado'],
    default: 'Não conciliado'
  },
  // userId: { 
  //   type: mongoose.Schema.Types.ObjectId, 
  //   required: true, 
  //   ref: 'User' 
  // }
}, { 
  timestamps: true 
});

// Function to get or create the Income model for a specific connection
export function getIncomeModel(connection) {
  return connection.models.Income || connection.model('Income', IncomeSchema);
}