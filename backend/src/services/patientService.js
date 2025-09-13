import { getDb } from '../db/initDb.js';

export async function savePatient(patient) {
  const db = await getDb();
  try {
    const result = await db.run(
      `INSERT INTO Patients (name, email, symptoms, created_at)
       VALUES (?, ?, ?, datetime('now'))`,
      [patient.name, patient.email, JSON.stringify(patient.symptoms)]
    );
    return result.lastID;
  } catch (error) {
    console.error('Error saving patient:', error);
    throw error;
  }
}
