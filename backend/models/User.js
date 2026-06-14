const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String
  },
  verificationExpires: {
    type: Date
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  preferences: {
    workspaceName: { type: String, default: 'Acme Inc.' },
    defaultDomain: { type: String, default: 'nx.lk' },
    timezone: { type: String, default: 'UTC' },
    mfaPolicy: { type: String, default: 'Enabled' },
    sessionLifetime: { type: String, default: '24h' },
    ipAllowList: { type: String, default: '' },
    emailAlerts: { type: Boolean, default: true },
    slackIntegration: { type: Boolean, default: false },
    weeklyDigest: { type: Boolean, default: true },
    theme: { type: String, default: 'Dark' },
    density: { type: String, default: 'Default' },
    reducedMotion: { type: Boolean, default: false },
    plan: { type: String, default: 'Pro' },
    twoFactorEnabled: { type: Boolean, default: false },
    bruteForceLimit: { type: String, default: '5' },
    sessionIpBinding: { type: Boolean, default: false },
    pwStrengthRequirement: { type: String, default: 'Strong' },
    auditLogFrequency: { type: String, default: 'Realtime' }
  }
}, {
  timestamps: true
});

// Pre-save hook to hash passwords using bcryptjs (salt rounds = 10)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
