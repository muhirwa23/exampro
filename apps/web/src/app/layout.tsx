import type { Metadata } from "next";
import "./globals.css";
import { t } from "../lib/messages";

export const metadata: Metadata = {
  title: t("title"),
  description: "Trusted hiring and certification assessments.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
