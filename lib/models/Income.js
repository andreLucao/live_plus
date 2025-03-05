import mongoose from 'mongoose';

export const IncomeSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Doctor's name
  patientName: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  category: { type: String, required: true },
  paymentType: { type: String, required: true, enum: ['PF', 'PJ'] },
  paymentMethod: { type: String, required: true, enum: ['pix', 'card', 'money', 'transfer'] },
  //userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' }
}, {
  timestamps: true
});

// Function to get or create the Income model for a specific connection
export function getIncomeModel(connection) {
  // Check if the model is already registered to avoid recompilation
  return connection.models.Income || connection.model('Income', IncomeSchema);
}

// Don't create the model here - it will be created per tenant