const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now, // Secara otomatis memberikan timestamp
  },
});

module.exports = mongoose.model("Message", MessageSchema);
