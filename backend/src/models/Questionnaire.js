const mongoose = require('mongoose');

const questionnaireSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: {
    proximity: { type: Number, required: true }, // meters to coast
    elevation: { type: Number, required: true }, // meters above sea level
    slope: { type: String, required: true },     // flat, moderate, steep
    mangroves: { type: Boolean, default: false },
    reefs: { type: Boolean, default: false },
    dunes: { type: Boolean, default: false },
    shelterAccess: { type: Boolean, default: false },
    defenses: { type: String, required: true },  // none, seawall, breakwater, natural
    preparedness: { type: Boolean, default: false },
    floodHistory: { type: String, required: true }, // never, rare, seasonal, frequent
    erosionHistory: { type: String, required: true } // none, slow, rapid
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  riskLevel: {
    type: String,
    required: true,
    enum: ['Low', 'Moderate', 'High', 'Critical']
  },
  assessment: {
    type: String,
    required: true
  },
  recommendations: [
    {
      title: String,
      description: String,
      category: String // 'infrastructure', 'community', 'natural_barriers'
    }
  ]
}, {
  timestamps: true
});

questionnaireSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Questionnaire', questionnaireSchema);
