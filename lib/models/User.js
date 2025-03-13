import mongoose from 'mongoose';

export const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  tenantPath: {
    type: String,
    required: true,
  },
  cellphone: {
    type: String,
    trim: true,
    // Not required
  },
  cpf: {
    type: String,
    trim: true,
    // Not required
  },
  role: {
    type: String,
    enum: ['owner', 'user', 'doctor', 'admin'],
    default: 'user'  // Mantemos o padrão como 'user'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Archived'],
    default: 'Active'
  },
  emailPreferences: {
    receiveNotifications: {
      type: Boolean,
      default: true
    },
    nextScheduledEmail: {
      type: Date,
      default: null
    },
    lastEmailSent: {
      type: Date,
      default: null
    }
  },
  medicalDetails: {
    clinicalHistory: {
      type: String,
      trim: true
    },
    surgicalHistory: {
      type: String,
      trim: true
    },
    familyHistory: {
      type: String,
      trim: true
    },
    habits: {
      type: String,
      trim: true
    },
    allergies: {
      type: String,
      trim: true
    },
    medications: {
      type: String,
      trim: true
    },
    lastDiagnosis: {
      date: {
        type: Date,
        default: Date.now
      },
      diagnosis: {
        type: String,
        trim: true
      },
      notes: {
        type: String,
        trim: true
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLoginAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

// Add compound index for tenantPath
UserSchema.index({ tenantPath: 1 });

// Hook pre-save para verificar se é o primeiro usuário
// Isso irá executar antes de cada save e verificará se é o primeiro usuário
UserSchema.pre('save', async function(next) {
  // Apenas se for um documento novo
  if (this.isNew) {
    const User = this.constructor;
    try {
      // Verifica se existem outros usuários com este tenantPath
      const count = await User.countDocuments({ tenantPath: this.tenantPath });
      
      // Se for o primeiro usuário deste tenant, defina como owner
      if (count === 0) {
        this.role = 'owner';
      }
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Function to get or create the User model for a specific connection
export function getUserModel(connection) {
  // Check if the model is already registered to avoid recompilation
  return connection.models.User || connection.model('User', UserSchema);
}
