const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema(
  {
    url:         { type: String, required: true, trim: true, maxlength: 2048 },
    domain:      { type: String, required: true, trim: true, index: true },
    ip:          { type: String, trim: true, default: null },
    lat:         { type: Number, default: null },
    lng:         { type: Number, default: null },
    country:     { type: String, trim: true, default: null, index: true },
    countryCode: { type: String, trim: true, uppercase: true, maxlength: 2, default: null },
    city:        { type: String, trim: true, default: null },
    region:      { type: String, trim: true, default: null },
    timezone:    { type: String, default: null },
    isp:         { type: String, default: null },
    isPrivate:   { type: Boolean, default: false },
    geoStatus:   { type: String, enum: ['resolved', 'private', 'failed'], default: 'failed', index: true },
    timestamp:   { type: Date, default: Date.now, index: true },
  },
  { timestamps: true, versionKey: false }
);

visitSchema.index({ timestamp: -1 });
visitSchema.index({ countryCode: 1, timestamp: -1 });
visitSchema.index({ lat: 1, lng: 1 });
visitSchema.index({ domain: 1, timestamp: -1 });

visitSchema.virtual('location').get(function () {
  return [this.city, this.region, this.country].filter(Boolean).join(', ') || 'Unknown';
});

module.exports = mongoose.model('Visit', visitSchema);
