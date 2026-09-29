import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to: string, subject: string, html: string) => {
  const { error } = await resend.emails.send({
    from: "Acme <onboarding@resend.dev>",
    to: [to],
    subject,
    html,
  });

  if (error) {
    return error;
  }

  return null;
};
