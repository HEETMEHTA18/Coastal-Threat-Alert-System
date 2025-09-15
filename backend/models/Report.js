const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  type: { type: String, required: true },
  severity: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  peopleAffected: { type: Number, required: true },
  flags: {
    immediateRisk: { type: Boolean, default: false },
    evacuation: { type: Boolean, default: false },
    damage: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);
