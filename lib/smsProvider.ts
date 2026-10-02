import twilio from "twilio";
import type { NotificationChannel } from "@/lib/generated/prisma/client";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const smsFrom = process.env.TWILIO_SMS_FROM;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export type SendResult = "SIMULATED" | "SENT" | "FAILED";

/** Sends via Twilio when credentials are configured; otherwise stays simulated with no network call. */
export async function sendRealNotification(
  channel: NotificationChannel,
  toPhone: string,
  message: string,
): Promise<SendResult> {
  if (!client) return "SIMULATED";

  const from = channel === "WHATSAPP" ? whatsappFrom : smsFrom;
  if (!from) return "SIMULATED";

  try {
    await client.messages.create({
      body: message,
      from: channel === "WHATSAPP" ? `whatsapp:${from}` : from,
      to: channel === "WHATSAPP" ? `whatsapp:${toPhone}` : toPhone,
    });
    return "SENT";
  } catch (error) {
    console.error("Twilio send failed:", error);
    return "FAILED";
  }
}
