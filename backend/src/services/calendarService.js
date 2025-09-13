// Google Calendar Service
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

const calendar = google.calendar("v3");
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

export async function scheduleConsult({ name, email, symptoms, follow_ups }) {
  const start = new Date(Date.now() + 60 * 60 * 1000); // 1 hour later
  start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0); // next 15-min slot
  const end = new Date(start.getTime() + 15 * 60 * 1000);

  const description = `Patient: ${name}\nEmail: ${email}\nSymptoms: ${symptoms.join(
    ", "
  )}\nFollow-ups:\n${Object.entries(follow_ups)
    .map(([symptom, answers]) => `${symptom}: ${answers.join("; ")}`)
    .join("\n")}`;

  await calendar.events.insert({
    auth: oauth2Client,
    calendarId: process.env.DOCTOR_EMAIL,
    requestBody: {
      summary: "Cardiology Consult",
      description,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      attendees: [{ email }, { email: process.env.DOCTOR_EMAIL }],
    },
  });
}
