const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const Message = require('./models/Message');

// Load environment variables
dotenv.config();

// Setup Express dan HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB Atlas connected successfully!');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Endpoint untuk mengambil pesan
app.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 }); // Menampilkan pesan berdasarkan timestamp
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Socket.IO untuk komunikasi real-time
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Mendengarkan pesan dari client
  socket.on('chatMessage', async (data) => {
    const { sender, message } = data;

    // Simpan pesan ke MongoDB
    const newMessage = new Message({ sender, message });
    await newMessage.save();

    // Broadcast pesan ke semua client
    io.emit('chatMessage', newMessage);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Menjalankan server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});