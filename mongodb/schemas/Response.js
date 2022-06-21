const mongoose = require("mongoose");

const responseSchema = new mongoose.Schema({
  id: { type: String, required: true },
  creator: { type: String, required: true },
  response: { type: String, required: true },
  prompt: { type: String, max: 50, required: true },
  tokenGroup: { type: String, max: 15, required: true, index: true },
  token: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Response", responseSchema);
