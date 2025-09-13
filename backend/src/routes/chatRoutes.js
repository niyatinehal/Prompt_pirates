import { getFollowUpQuestions } from "../db/symptomRuleDb.js";
import { savePatientData } from "../db/patientDataDb.js";
import { notifyDoctor } from "../services/telegramService.js";
import { scheduleConsult } from "../services/calendarService.js";

export function setupChat(io) {
  io.on("connection", (socket) => {
    let patient = { name: "", email: "", symptoms: [], follow_ups: {} };
    let step = 0;
    let currentSymptomIdx = 0;
    let currentFollowUps = [];
    let currentFollowUpIdx = 0;

    // Start consult
    socket.emit("chat", {
      sender: "assistant",
      text: "Welcome! What is your name?",
    });

    socket.on("chat", async (msg) => {
      if (step === 0) {
        patient.name = msg;
        socket.emit("chat", {
          sender: "assistant",
          text: "Please provide your email address.",
        });
        step++;
      } else if (step === 1) {
        patient.email = msg;
        socket.emit("chat", {
          sender: "assistant",
          text: "Describe your symptoms (comma separated).",
        });
        step++;
      } else if (step === 2) {
        patient.symptoms = msg.split(",").map((s) => s.trim());
        currentSymptomIdx = 0;
        step++;
        currentFollowUps = await getFollowUpQuestions(
          patient.symptoms[currentSymptomIdx]
        );
        currentFollowUpIdx = 0;
        socket.emit("chat", {
          sender: "assistant",
          text: currentFollowUps[currentFollowUpIdx],
        });
      } else if (step === 3) {
        // Collect follow-up answers
        const symptom = patient.symptoms[currentSymptomIdx];
        if (!patient.follow_ups[symptom]) patient.follow_ups[symptom] = [];
        patient.follow_ups[symptom].push(msg);
        currentFollowUpIdx++;
        if (currentFollowUpIdx < currentFollowUps.length) {
          socket.emit("chat", {
            sender: "assistant",
            text: currentFollowUps[currentFollowUpIdx],
          });
        } else {
          currentSymptomIdx++;
          if (currentSymptomIdx < patient.symptoms.length) {
            currentFollowUps = await getFollowUpQuestions(
              patient.symptoms[currentSymptomIdx]
            );
            currentFollowUpIdx = 0;
            socket.emit("chat", {
              sender: "assistant",
              text: currentFollowUps[currentFollowUpIdx],
            });
          } else {
            // All done
            await savePatientData(patient);
            notifyDoctor(patient);
            await scheduleConsult(patient);
            socket.emit("chat", {
              sender: "assistant",
              text: "Thank you! Your consult is scheduled. The doctor will contact you soon.",
            });
            step++;
          }
        }
      }
    });
  });
}
