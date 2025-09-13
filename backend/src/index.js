import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());

// Basic health check
app.get("/", (req, res) => {
  res.send("Doctor AI Backend Running");
});

// Socket.io connection
io.on("connection", (socket) => {
  console.log("Patient connected:", socket.id);
  // ...chat logic will go here...
});

// Initialize DBs and wire up chat
// import removed: initSymptomRuleDb no longer exists
import { initPatientDataDb } from "./db/patientDataDb.js";
import { setupChat } from "./routes/chatRoutes.js";
initPatientDataDb();
setupChat(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
