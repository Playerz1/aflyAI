import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AflyAI — Painel",
  description: "SaaS de gestão com painel administrativo individual.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
