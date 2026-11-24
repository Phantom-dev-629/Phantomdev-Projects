const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const users = new Map();

app.use(express.static("public"));

io.on("connection", (socket) => {
  socket.on("join", (name) => {
    const username = (typeof name === "string" ? name.trim() : "Guest").slice(0, 32) || "Guest";
    socket.username = username;
    users.set(socket.id, username);
    io.emit("message", { user: "System", text: `${username} joined`, timestamp: Date.now() });
    io.emit("userCount", users.size);
  });

  socket.on("message", (data) => {
    if (!socket.username) return;
    const text = (typeof data?.text === "string" ? data.text.trim() : "");
    if (!text) return;
    io.emit("message", { user: socket.username, text, timestamp: Date.now() });
  });

  socket.on("disconnect", () => {
    const username = users.get(socket.id);
    users.delete(socket.id);
    if (username) {
      io.emit("message", { user: "System", text: `${username} left`, timestamp: Date.now() });
    }
    io.emit("userCount", users.size);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running → http://localhost:${PORT}`));