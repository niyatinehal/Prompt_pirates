import { getDb } from "../db/initDb.js";

export default function initSocketService(io) {
  io.on("connection", (socket) => {
    console.log("🔌 New client connected:", socket.id);

    // --- Handle patient connecting ---
    socket.on("patient:connect", async (data) => {
      console.log("👤 Patient connected:", data);

      // TODO: Save patient to DB if needed
      socket.emit("assistant:message", {
        text: "Hello! I’m your AI assistant. Can I have your full name?",
      });
    });

    // --- Handle patient messages ---
    socket.on("patient:message", async (msg) => {
      console.log("💬 Patient says:", msg);

      // Example: very basic state machine
      // In production: track conversation state in DB or memory
      if (msg.toLowerCase().includes("chest pain")) {
        const db = await getDb();

        // Fetch follow-up questions from DB
        const rows = await db.all(
          `
          SELECT f.question_text, c.name as category
          FROM FollowUpQuestions f
          JOIN Categories c ON f.category_id = c.id
          WHERE f.symptom_id = (
            SELECT id FROM Symptoms WHERE name LIKE '%Chest Pain%'
          )
          ORDER BY c.name, f.id
          `
        );

        // Group by category
        const grouped = {};
        rows.forEach((row) => {
          if (!grouped[row.category]) grouped[row.category] = [];
          if (!grouped[row.category].includes(row.question_text)) {
            grouped[row.category].push(row.question_text);
          }
        });

        // Send first follow-up question back to patient
        const firstCategory = Object.keys(grouped)[0];
        const firstQuestion = grouped[firstCategory][0];

        socket.emit("assistant:message", {
          text: firstQuestion,
          category: firstCategory,
        });
      } else {
        // Fallback response
        socket.emit("assistant:message", {
          text: "Got it 👍 Can you tell me more about your symptoms?",
        });
      }
    });

    // --- Handle patient disconnect ---
    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });
}
