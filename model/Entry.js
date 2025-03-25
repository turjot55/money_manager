const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  platform: String,
  income: Number,
  incomeCurrency: String,
  fee: Number,
  feeCurrency: String,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Entry', entrySchema);
