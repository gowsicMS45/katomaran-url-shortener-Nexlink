const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: [true, 'Original URL is required'],
    trim: true
  },
  shortCode: {
    type: String,
    required: [true, 'Short code is required'],
    unique: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User owner is required']
  },
  expiresAt: {
    type: Date,
    default: null
  },
  clickCount: {
    type: Number,
    default: 0
  },
  // ── NexLink new fields ──────────────────────────────────────────────────────
  password: {
    type: String,
    default: null
  },
  clickLimit: {
    type: Number,
    default: null
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  isPublicStats: {
    type: Boolean,
    default: true
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  tags: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

// Hash password before save when it's modified
urlSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Helper method to verify a candidate password
urlSchema.methods.verifyPassword = async function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('Url', urlSchema);
