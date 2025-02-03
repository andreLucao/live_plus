import mongoose from 'mongoose';

const IncomeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  category: { type: String, required: true },
}, {
  timestamps: true
});

export const Income = mongoose.models.Income || mongoose.model('Income', IncomeSchema);