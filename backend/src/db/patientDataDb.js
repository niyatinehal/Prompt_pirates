// Patient Data storage using JSON file
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFile = path.resolve(__dirname, "patientData.json");
const datasetPath = path.resolve(__dirname, "Datasetab94d2b.json");
// Load dataset for symptoms and follow-up questions
export function getSymptomDataset() {
  try {
    const raw = fs.readFileSync(datasetPath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load symptom dataset:", err);
    return [];
  }
}

// No DB initialization needed
export function initPatientDataDb() {
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify([]));
  }
}

export function savePatientData({ name, email, symptoms, follow_ups }) {
  initPatientDataDb();
  const patients = JSON.parse(fs.readFileSync(dataFile, "utf-8"));
  const newEntry = {
    id: patients.length + 1,
    name,
    email,
    symptoms,
    follow_ups,
    timestamp: new Date().toISOString(),
  };
  patients.push(newEntry);
  fs.writeFileSync(dataFile, JSON.stringify(patients, null, 2));
}
// Optional: get all patient data
export function getAllPatientData() {
  initPatientDataDb();
  return JSON.parse(fs.readFileSync(dataFile, "utf-8"));
}
