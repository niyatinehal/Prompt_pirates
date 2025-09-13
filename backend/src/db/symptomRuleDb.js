// Symptom Rule DB setup using SQLite
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const datasetPath = path.resolve(__dirname, "Datasetab94d2b.json");
let symptomData = null;

function loadSymptomData() {
  if (!symptomData) {
    try {
      const raw = fs.readFileSync(datasetPath, "utf-8");
      symptomData = JSON.parse(raw);
    } catch (err) {
      console.error("Failed to load symptom dataset:", err);
      symptomData = [];
    }
  }
  return symptomData;
}

// No DB initialization needed
export function getAllSymptoms() {
  return loadSymptomData().map((entry) => entry.symptom);
}

export function getFollowUpQuestions(symptom) {
  const data = loadSymptomData();
  const entry = data.find((e) => e.symptom === symptom);
  return entry ? entry.follow_up_questions : [];
}
