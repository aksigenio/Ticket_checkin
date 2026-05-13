import nodemailer from "nodemailer";

export function smtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASSWORD?.trim() &&
      process.env.ADMIN_EMAIL?.trim(),
  );
}

/** Поле From: если MAIL_FROM не задано, берется SMTP_USER */
export function getMailFrom(): string {
  const explicit = process.env.MAIL_FROM?.trim();
  if (explicit) return explicit;
  const user = process.env.SMTP_USER?.trim();
  if (!user) throw new Error("SMTP_USER or MAIL_FROM is missing");
  return user;
}

function createTransport() {
  const host = process.env.SMTP_HOST!.trim();
  const user = process.env.SMTP_USER!.trim();
  const pass = process.env.SMTP_PASSWORD!.trim();
  const port = Number(process.env.SMTP_PORT?.trim() || "587");
  const secure =
    process.env.SMTP_SECURE === "true" ||
    process.env.SMTP_SECURE === "1" ||
    port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

export type SmtpAttachment =
  | { filename: string; content: Buffer }
  | { filename: string; content: Buffer; cid: string };

export async function sendSmtpMail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: SmtpAttachment[];
}): Promise<{ error?: string }> {
  try {
    const transporter = createTransport();
    await transporter.sendMail({
      from: getMailFrom(),
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
      attachments: opts.attachments,
    });
    return {};
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: msg };
  }
}
