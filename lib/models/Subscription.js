import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema({
  planType: {
    type: String,
    enum: ['starter', 'plus'],
    required: true
  },
  userCount: {
    type: Number,
    required: true,
    min: 1
  },
  pricePerUser: {
    type: Number,
    required: true
  },
  stripeSubscriptionId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['active', 'canceled', 'past_due', 'unpaid'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  currentPeriodEnd: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Export a function to get the model to ensure it's only created once per connection
export function getSubscriptionModel(connection) {
  return connection.models.Subscription || connection.model('Subscription', SubscriptionSchema);
}

export { SubscriptionSchema }; 