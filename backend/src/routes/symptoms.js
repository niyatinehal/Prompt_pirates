import express from "express";
import { getDb } from "../db/initDb.js";

const router = express.Router();

/**
 * GET /api/symptoms/:id/questions
 * Returns all follow-up questions grouped by category for a given symptom
 * Ensures no duplicate questions are returned
 */
router.get("/:id/questions", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    // Get symptom name
    const symptom = await db.get(`SELECT name FROM Symptoms WHERE id = ?`, [id]);
    if (!symptom) {
      return res.status(404).json({ error: "Symptom not found" });
    }

    // Fetch all follow-up questions grouped by category
    const rows = await db.all(
     `
   SELECT DISTINCT c.name as category, f.question
   FROM FollowUpQuestions f
   JOIN Categories c ON f.category_id = c.id
   WHERE f.symptom_id = ?
   ORDER BY c.name
 `,
      [id]
    );

    // Group questions by category and remove duplicates
    const grouped = {};
       rows.forEach((row) => {
         if (!grouped[row.category]) {
           grouped[row.category] = [];
         }
         grouped[row.category].push({
           id: row.id,
           text: row.question_text,
         });
       });

    // Convert sets back to arrays
    const result = {};
    for (const [category, questionsSet] of Object.entries(grouped)) {
      result[category] = Array.from(questionsSet);
    }

    res.json({
      symptom: symptom.name,
      questions: result,
    });
  } catch (error) {
    console.error("Error fetching follow-up questions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
export default router;