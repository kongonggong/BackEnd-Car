const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  telephone: { type: String, required: true },
}, { collection: 'providers' });

const Provider = mongoose.model('Provider', providerSchema);
module.exports = Provider;
