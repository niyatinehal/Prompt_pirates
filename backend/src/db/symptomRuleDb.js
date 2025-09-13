import { getDb } from './initDb.js';
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const datasetPath = path.resolve(__dirname, "Datasetab94d2b.json");

async function getFollowUpQuestions(symptom) {
  const db = await getDb();
  const questions = await db.all(
    `SELECT question FROM FollowUpQuestions
     WHERE symptom_id = (SELECT id FROM Symptoms WHERE name = ?)`,
    [symptom]
  );
  return questions.map(q => q.question);
}

async function getAllSymptoms() {
  const db = await getDb();
  const symptoms = await db.all('SELECT name FROM Symptoms');
  return symptoms.map(s => s.name);
}

export { getFollowUpQuestions, getAllSymptoms };
