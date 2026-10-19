import { Injectable } from "@nestjs/common";
import { createTransport, type Transporter } from "nodemailer";
import type { AuthMailer } from "./auth.types.js";

@Injectable()
export class SmtpAuthMailer implements AuthMailer {
  private transporter?: Transporter;

  async sendVerification(to: string, name: string, url: string): Promise<void> {
    await this.send({
      to,
      subject: "Verify your TrustExam Pro account",
      text: `Hello ${name},\n\nVerify your email address using this link:\n${url}\n\nIf you did not create this account, you can ignore this email.`,
    });
  }

  async sendPasswordReset(to: string, name: string, url: string): Promise<void> {
    await this.send({
      to,
      subject: "Reset your TrustExam Pro password",
      text: `Hello ${name},\n\nReset your password using this link:\n${url}\n\nIf you did not request this, you can ignore this email.`,
    });
  }

  private async send(message: { to: string; subject: string; text: string }): Promise<void> {
    const transporter = this.transporter ??= createTransport(this.transportOptions());
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? "TrustExam Pro <no-reply@example.invalid>",
      ...message,
    });
  }

  private transportOptions() {
    const port = positiveInteger(process.env.SMTP_PORT, 1025);
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;
    return {
      host: process.env.SMTP_HOST ?? "127.0.0.1",
      port,
      secure: port === 465,
      requireTLS: process.env.NODE_ENV === "production" || Boolean(user && password),
      ...(user && password ? { auth: { user, pass: password } } : {}),
    };
  }
}

function positiveInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}
