import fs from 'fs';
import path from 'path';

const datasetPath = path.join(__dirname, 'Datasetab94d2b.json');
let symptomsData = [];

// Load the dataset synchronously at startup
try {
  const rawData = fs.readFileSync(datasetPath, 'utf-8');
  symptomsData = JSON.parse(rawData);
} catch (err) {
  console.error('Error loading symptoms dataset:', err);
}

// Get all symptoms
export function getAllSymptoms() {
  return symptomsData.map(item => item.symptom);
}

// Get follow-up questions for a given symptom
export function getFollowUpQuestions(symptomName) {
  if (!symptomName) return [];
  const entry = symptomsData.find(item => item.symptom === symptomName);
  return entry ? entry.follow_up_questions : null;
}

  const normalized = symptomName.trim().toLowerCase();
  const entry = symptomsData.find(item => item.symptom.trim().toLowerCase() === normalized);
  if (!entry || !entry.follow_up_questions) return [];
  // Aggregate all questions from all categories into a single array
  const categories = Object.values(entry.follow_up_questions);
  // Flatten the array of arrays
  return categories.flat();
}

// Get full symptom entry
