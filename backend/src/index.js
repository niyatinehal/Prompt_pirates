import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { initDatabase, getDb } from "./db/initDb.js";
import { setupChat } from "./routes/chatRoutes.js";
import apiRouter from "./routes/api.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());

// -------------------------
// Health check
// -------------------------
app.get("/", (req, res) => res.send("Doctor AI Backend Running 🚀"));

// -------------------------
// Database inspection APIs
// -------------------------
app.get("/db/symptoms", async (req, res) => {
  try {
    const db = await getDb();
    const symptoms = await db.all("SELECT * FROM Symptoms");
    res.json(symptoms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/db/categories", async (req, res) => {
  try {
    const db = await getDb();
    const categories = await db.all("SELECT * FROM Categories");
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/db/questions", async (req, res) => {
  try {
    const db = await getDb();
    const questions = await db.all(`
      SELECT s.name AS symptom, c.name AS category, f.question
      FROM FollowUpQuestions f
      JOIN Symptoms s ON f.symptom_id = s.id
      JOIN Categories c ON f.category_id = c.id
    `);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/db/redflags", async (req, res) => {
  try {
    const db = await getDb();
    const redFlags = await db.all(`
      SELECT s.name AS symptom, f.question, r.severity
      FROM RiskFlags r
      JOIN FollowUpQuestions f ON r.question_id = f.id
      JOIN Symptoms s ON f.symptom_id = s.id
      WHERE r.severity = 'critical'
    `);
    res.json(redFlags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// Mount Main API Router
// -------------------------
app.use("/api", apiRouter); // all routes prefixed with /api

// -------------------------
// Socket Chat Setup
// -------------------------
setupChat(io);

// -------------------------
// Start server after DB initialization
// -------------------------
async function startServer() {
  try {
    await initDatabase(); // Initialize DB first
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to initialize database:", error);
    process.exit(1);
  }
}

startServer();