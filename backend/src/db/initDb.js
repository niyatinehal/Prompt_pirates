import sqlite3 from "sqlite3";
import { open } from "sqlite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;

export async function initDatabase() {
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, "../data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Initialize database connection
    db = await open({
      filename: path.join(dataDir, "symptoms.db"),
      driver: sqlite3.Database,
    });

    // Create tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Symptoms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS Categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS FollowUpQuestions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symptom_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        question TEXT NOT NULL,
        FOREIGN KEY (symptom_id) REFERENCES Symptoms(id),
        FOREIGN KEY (category_id) REFERENCES Categories(id)
      );

      CREATE TABLE IF NOT EXISTS Patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        symptoms TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS RiskFlags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_id INTEGER NOT NULL,
        severity TEXT CHECK(severity IN ('low','moderate','high','critical')),
        FOREIGN KEY (question_id) REFERENCES FollowUpQuestions(id)
      );
    `);

    // Load and seed data
    const datasetPath = path.join(__dirname, "Datasetab94d2b.json");
    const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf-8"));

    for (const entry of dataset) {
      const { symptom, follow_up_questions } = entry;

      // Insert symptom
      const result = await db.run(
        `INSERT OR IGNORE INTO Symptoms (name) VALUES (?)`,
        [symptom]
      );
      const symptomId =
        result.lastID ||
        (await db.get(`SELECT id FROM Symptoms WHERE name = ?`, [symptom])).id;

      // Insert categories + questions
      for (const category in follow_up_questions) {
        // Ensure category exists
        const catResult = await db.run(
          `INSERT OR IGNORE INTO Categories (name) VALUES (?)`,
          [category]
        );
        const categoryId =
          catResult.lastID ||
          (await db.get(`SELECT id FROM Categories WHERE name = ?`, [category])).id;

        // Insert questions
        for (const q of follow_up_questions[category]) {
          const qResult = await db.run(
            `INSERT OR IGNORE INTO FollowUpQuestions (symptom_id, category_id, question) VALUES (?, ?, ?)`,
            [symptomId, categoryId, q]
          );

          // If this is a red_flag category → mark severity as "critical"
          if (category.toLowerCase() === "red_flags") {
            const qId =
              qResult.lastID ||
              (await db.get(
                `SELECT id FROM FollowUpQuestions WHERE question = ? AND symptom_id = ?`,
                [q, symptomId]
              )).id;

            await db.run(
              `INSERT OR IGNORE INTO RiskFlags (question_id, severity) VALUES (?, ?)`,
              [qId, "critical"]
            );
          }
        }
      }
    }

    console.log("Database initialized and seeded successfully 🚀");
    return db;
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

export async function getDb() {
  if (!db) {
    await initDatabase();
  }
  return db;
}

export async function closeDb() {
  if (db) {
    await db.close();
    db = null;
  }
}