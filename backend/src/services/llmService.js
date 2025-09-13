import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Rephrase a follow-up question in a friendly, conversational tone.
 */
export async function rephraseQuestion(questionText) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // or gpt-4o if available
      messages: [
        {
          role: "system",
          content:
            "You are a polite medical assistant helping a cardiologist. " +
            "You must ONLY rephrase the provided question. " +
            "Do not add any medical knowledge or create new questions.",
        },
        {
          role: "user",
          content: `Rephrase this question in a friendly way for the patient: "${questionText}"`,
        },
      ],
      max_tokens: 100,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("❌ OpenAI error (rephraseQuestion):", error);
    return questionText; // fallback
  }
}

/**
 * Generate a closing message once consultation is complete.
 */
export async function closingMessage(patient) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a polite medical assistant. " +
            "You must summarize patient details politely and confirm scheduling. " +
            "Do not provide medical advice.",
        },
        {
          role: "user",
          content: `Patient: ${patient.name}, Email: ${
            patient.email
          }, Symptoms: ${patient.symptoms.join(
            ", "
          )}. Generate a polite thank-you + scheduling confirmation message.`,
        },
      ],
      max_tokens: 150,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("❌ OpenAI error (closingMessage):", error);
    return "Thank you! Your consultation has been scheduled. A doctor will contact you soon.";
  }
}
