const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true }, // ID atau username pengirim
  receiver: { type: String, required: true }, // ID atau username penerima
  message: { type: String, required: true }, // Isi pesan
  timestamp: { type: Date, default: Date.now }, // Waktu pengiriman pesan
});

module.exports = mongoose.model("Message", messageSchema);
