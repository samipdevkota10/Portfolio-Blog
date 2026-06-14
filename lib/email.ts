import { Resend } from "resend";

import { featureFlags, requireEnv } from "@/lib/env";
import { siteConfig } from "@/lib/site-config";

export async function sendContactNotification({
  name,
  email,
  subject,
  message,
}: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  if (!featureFlags.email) {
    return { skipped: true };
  }

  const resend = new Resend(requireEnv("RESEND_API_KEY"));

  const result = await resend.emails.send({
    from: `${siteConfig.name} <onboarding@resend.dev>`,
    to: requireEnv("CONTACT_NOTIFICATION_EMAIL"),
    replyTo: email,
    subject: `[Portfolio] ${subject}`,
    text: `From: ${name}\nEmail: ${email}\n\n${message}`,
  });

  return result;
}
