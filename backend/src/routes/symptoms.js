import express from "express";
import { getDb } from "./initDb.js"; // your SQLite DB setup
import { scheduleConsult } from "../services/calendarService.js"; // your existing service
const router = express.Router();

/**
 * -----------------------------
 * 1. Symptom Rule DB Endpoints
 * -----------------------------
 */

// GET /api/symptoms → list all symptoms
router.get("/symptoms", async (req, res) => {
  try {
    const db = await getDb();
    const symptoms = await db.all(`SELECT id, name FROM Symptoms`);
    res.json(symptoms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/symptoms/:id/questions → all follow-up questions grouped by category
router.get("/symptoms/:id/questions", async (req, res) => {
  try {
    const db = await getDb();
    const symptomId = req.params.id;

    const symptom = await db.get(`SELECT name FROM Symptoms WHERE id = ?`, [symptomId]);
    if (!symptom) return res.status(404).json({ error: "Symptom not found" });

    // Fetch all categories linked to this symptom
    const categories = await db.all(`
      SELECT c.id AS category_id, c.name AS category_name
      FROM Categories c
      JOIN SymptomCategories sc ON sc.category_id = c.id
      WHERE sc.symptom_id = ?
    `, [symptomId]);

    // Fetch all questions for this symptom
    const questions = await db.all(`
      SELECT q.id AS question_id, q.question, q.category_id
      FROM FollowUpQuestions q
      WHERE q.symptom_id = ?
    `, [symptomId]);

    // Group questions by category
    const grouped = {};
    categories.forEach(c => grouped[c.category_name] = []);
    questions.forEach(q => {
      const category = categories.find(c => c.category_id === q.category_id);
      if (category) grouped[category.category_name].push({ id: q.question_id, text: q.question });
    });

    res.json({ symptom: symptom.name, questions: grouped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * -----------------------------
 * 2. Patient Management
 * -----------------------------
 */

// POST /api/patients → create new patient
router.post("/patients", async (req, res) => {
  try {
    const db = await getDb();
    const { name, email, gender } = req.body;
    if (!name || !email) return res.status(400).json({ error: "Name and email required" });

    const result = await db.run(
      `INSERT INTO Patients (name, email) VALUES (?, ?)`,
      [name, email]
    );

    const patient = await db.get(`SELECT * FROM Patients WHERE id = ?`, [result.lastID]);
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/patients/:id → get patient with linked symptoms and responses
router.get("/patients/:id", async (req, res) => {
  try {
    const db = await getDb();
    const patientId = req.params.id;

    const patient = await db.get(`SELECT * FROM Patients WHERE id = ?`, [patientId]);
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    // Fetch linked symptoms
    const symptoms = await db.all(`
      SELECT DISTINCT s.id, s.name
      FROM Symptoms s
      JOIN FollowUpQuestions q ON q.symptom_id = s.id
      JOIN PatientAnswers pa ON pa.question_id = q.id
      WHERE pa.patient_id = ?
    `, [patientId]);

    // Fetch responses
    const responses = await db.all(`
      SELECT pa.question_id, q.question, pa.answer
      FROM PatientAnswers pa
      JOIN FollowUpQuestions q ON pa.question_id = q.id
      WHERE pa.patient_id = ?
    `, [patientId]);

    res.json({ patient, symptoms, responses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * -----------------------------
 * 3. Patient Symptoms & Responses
 * -----------------------------
 */

// POST /api/patients/:id/symptoms → link patient to symptoms
router.post("/patients/:id/symptoms", async (req, res) => {
  try {
    const db = await getDb();
    const patientId = req.params.id;
    const { symptom_ids } = req.body;
    if (!Array.isArray(symptom_ids) || symptom_ids.length === 0)
      return res.status(400).json({ error: "symptom_ids required" });

    for (const symptomId of symptom_ids) {
      await db.run(`
        INSERT OR IGNORE INTO PatientAnswers (patient_id, question_id, answer)
        SELECT ?, q.id, ''
        FROM FollowUpQuestions q
        WHERE q.symptom_id = ?
      `, [patientId, symptomId]);
    }

    res.json({ status: "linked", symptom_ids });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/patients/:id/responses → save patient answers
router.post("/patients/:id/responses", async (req, res) => {
  try {
    const db = await getDb();
    const patientId = req.params.id;
    const { responses } = req.body;
    if (!Array.isArray(responses) || responses.length === 0)
      return res.status(400).json({ error: "responses required" });

    for (const r of responses) {
      await db.run(`
        UPDATE PatientAnswers
        SET answer = ?
        WHERE patient_id = ? AND question_id = ?
      `, [r.response_text, patientId, r.question_id]);
    }

    res.json({ status: "saved", responses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * -----------------------------
 * 4. Appointments & Notifications
 * -----------------------------
 */

router.post("/appointments", async (req, res) => {
  try {
    const { patient_id, doctor_email, scheduled_time } = req.body;
    if (!patient_id || !doctor_email || !scheduled_time)
      return res.status(400).json({ error: "patient_id, doctor_email, scheduled_time required" });

    const appointment = await scheduleConsult({ patient_id, doctor_email, scheduled_time });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/appointments/:id", async (req, res) => {
  try {
    const appointmentId = req.params.id;
    res.json({ id: appointmentId, status: "scheduled" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/appointments/:id/notify", async (req, res) => {
  try {
    const appointmentId = req.params.id;
    res.json({ status: "notification triggered", appointmentId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * -----------------------------
 * 5. Doctor Management (Optional)
 * -----------------------------
 */

router.get("/doctors", async (req, res) => {
  res.json([
    { id: 1, name: "Dr. Smith", email: "smith@hospital.com" },
    { id: 2, name: "Dr. Lee", email: "lee@hospital.com" }
  ]);
});

router.get("/doctors/:id", async (req, res) => {
  const doctorId = parseInt(req.params.id);
  const doctors = [
    { id: 1, name: "Dr. Smith", email: "smith@hospital.com" },
    { id: 2, name: "Dr. Lee", email: "lee@hospital.com" }
  ];
  const doctor = doctors.find(d => d.id === doctorId);
  if (!doctor) return res.status(404).json({ error: "Doctor not found" });
  res.json(doctor);
});

export default router;