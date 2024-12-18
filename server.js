const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const Message = require("./models/Message");

// Load environment variables
dotenv.config();

// Setup Express dan HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB Atlas connected successfully!");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Endpoint untuk mengambil pesan
app.get("/messages/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    }).sort({ timestamp: 1 }); // Urutkan berdasarkan waktu

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Socket.IO untuk komunikasi real-time
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Simpan ID user yang terhubung (bisa berupa username atau ID lain)
  socket.on("register", (userId) => {
    socket.userId = userId; // Assign userId ke socket
    console.log(`User registered: ${userId}`);
  });

  // Mendengarkan pesan dari client
  socket.on("privateMessage", async (data) => {
    const { sender, receiver, message } = data;

    // Simpan pesan ke MongoDB
    const newMessage = new Message({ sender, receiver, message });
    await newMessage.save();

    // Kirim pesan hanya ke penerima tertentu
    const receiverSocket = [...io.sockets.sockets.values()].find(
      (s) => s.userId === receiver
    );

    if (receiverSocket) {
      receiverSocket.emit("privateMessage", newMessage); // Kirim pesan ke penerima
    }

    // Kirim pesan kembali ke pengirim untuk konfirmasi
    socket.emit("privateMessage", newMessage);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Menjalankan server
const PORT = process.env.PORT || 2121;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
