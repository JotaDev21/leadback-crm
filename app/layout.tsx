import type { Metadata } from "next";
import "./globals.css";
import { Provider } from "@/components/provider";
export const metadata: Metadata = {
  title: "LeadBack — Oportunidades que voltam",
  description:
    "Recupere as oportunidades esquecidas nas suas conversas de WhatsApp.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
