import mongoose from 'mongoose';

const BillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  category: { type: String, required: true },
}, {
  timestamps: true
});

export const Bill = mongoose.models.Bill || mongoose.model('Bill', BillSchema);