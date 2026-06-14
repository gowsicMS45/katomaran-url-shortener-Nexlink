const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  urlId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Url',
    required: [true, 'URL ID is required'],
    index: true
  },
  ipAddress: {
    type: String,
    default: 'Unknown'
  },
  userAgent: {
    type: String,
    default: 'Unknown'
  },
  browser: {
    type: String,
    default: 'Unknown'
  },
  device: {
    type: String,
    default: 'Unknown'
  },
  country: {
    type: String,
    default: 'Unknown'
  },
  countryCode: {
    type: String,
    default: 'XX'
  },
  city: {
    type: String,
    default: 'Unknown'
  },
  referrer: {
    type: String,
    default: 'Direct'
  },
  utmSource: {
    type: String,
    default: null
  },
  utmMedium: {
    type: String,
    default: null
  },
  utmCampaign: {
    type: String,
    default: null
  },
  utmContent: {
    type: String,
    default: null
  },
  utmTerm: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false // Handled manually via timestamp field
});

module.exports = mongoose.model('Visit', visitSchema);
