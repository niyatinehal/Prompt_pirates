import { scheduleConsult } from "../services/calendarService.js";
import { getFollowUpQuestions } from "../db/symptomRuleDb.js";
import { savePatient } from "../services/patientService.js";
import { notifyDoctor } from "../services/telegramService.js";
import { closingMessage, rephraseQuestion } from "../services/llmService.js";

export function setupChat(io) {
  io.on("connection", (socket) => {
    let patient = { name: "", email: "", symptoms: [], follow_ups: {} };
    let step = 0;
    let followUpQuestions = [];
    let currentQuestionIndex = 0;

    socket.emit("chat", {
      sender: "assistant",
      text: "Welcome! Please enter your name.",
    });

    socket.on("chat", async (msg) => {
      try {
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
          followUpQuestions = await getFollowUpQuestions(patient.symptoms[0]);

          if (followUpQuestions && followUpQuestions.length > 0) {
            currentQuestionIndex = 0;
            socket.emit("chat", {
              sender: "assistant",
              text: followUpQuestions[currentQuestionIndex],
            });
            step++;
          } else {
            await handleConsultation(socket, patient);
            step = -1; // Consultation done
          }
        } else if (step >= 3) {
          const question = followUpQuestions[currentQuestionIndex];

          // Store answer grouped by symptom
          const currentSymptom = patient.symptoms[0];
          if (!patient.follow_ups[currentSymptom]) {
            patient.follow_ups[currentSymptom] = [];
          }
          patient.follow_ups[currentSymptom].push(msg);

          currentQuestionIndex++;

          if (currentQuestionIndex < followUpQuestions.length) {
            // 👇 Rephrase the next question using LLM
            const rawNextQ = followUpQuestions[currentQuestionIndex];
            const friendlyNextQ = await rephraseQuestion(rawNextQ);

            socket.emit("chat", {
              sender: "assistant",
              text: friendlyNextQ,
            });
          } else {
            // Consultation complete
            await handleConsultation(socket, patient);

            // 👇 Use LLM to generate a friendly closing
            const finalMsg = await closingMessage(patient);
            socket.emit("chat", {
              sender: "assistant",
              text: finalMsg,
            });

            step = -1;
          }
        }
      } catch (error) {
        console.error("Chat error:", error);
        socket.emit("chat", {
          sender: "assistant",
          text: "Sorry, there was an error processing your request.",
        });
      }
    });
  });
}

async function handleConsultation(socket, patient) {
  try {
    await savePatient(patient);
    // await scheduleConsult(patient);
    await notifyDoctor(patient);
    socket.emit("chat", {
      sender: "assistant",
      text: "Thank you! Your consultation has been scheduled. A doctor will contact you soon.",
    });
  } catch (error) {
    console.error("Consultation error:", error);
    socket.emit("chat", {
      sender: "assistant",
      text: "Sorry, there was an error scheduling your consultation.",
    });
  }
}
