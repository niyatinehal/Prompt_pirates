// Telegram Bot Service
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
const doctorChatId = process.env.DOCTOR_TELEGRAM_CHAT_ID || "";

export function notifyDoctor({ name, email, symptoms, follow_ups }) {
  const message = `New Cardiology Consult:\nName: ${name}\nEmail: ${email}\nSymptoms: ${symptoms.join(
    ", "
  )}\nFollow-ups:\n${Object.entries(follow_ups)
    .map(([symptom, answers]) => `${symptom}: ${answers.join("; ")}`)
    .join("\n")}`;
  if (doctorChatId) {
    bot.sendMessage(doctorChatId, message);
  }
}
