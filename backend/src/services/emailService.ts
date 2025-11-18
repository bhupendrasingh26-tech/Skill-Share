import nodemailer from 'nodemailer';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

let transporter: nodemailer.Transporter | null = null;

const createTransporter = () => {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_PORT ||
    (!process.env.SMTP_USER && !process.env.SMTP_FROM)
  ) {
    console.warn(
      '[email] SMTP settings are incomplete. Emails will be logged instead of sent.'
    );
    return null;
  }

  const port = parseInt(process.env.SMTP_PORT, 10);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number.isNaN(port) ? 587 : port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });
};

export const sendEmail = async ({ to, subject, html, text }: SendEmailOptions) => {
  try {
    if (!transporter) {
      transporter = createTransporter();
    }

    if (!transporter) {
      console.info('[email] Email sending disabled. Showing message instead:');
      console.info('To:', to);
      console.info('Subject:', subject);
      console.info('Text:', text);
      return;
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};

export const sendPasswordResetEmail = async (to: string, resetLink: string) => {
  await sendEmail({
    to,
    subject: 'Reset your SkillShare password',
    text: `We received a request to reset your password. Use the link below within the next hour:\n\n${resetLink}\n\nIf you did not request this, you can ignore this message.`,
    html: `
      <p>We received a request to reset your password.</p>
      <p><a href="${resetLink}" style="color:#4f46e5;">Click here to reset your password</a>. This link will expire in 1 hour.</p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `,
  });
};

