import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sopro Ducktive",
  description: "A gamified productivity app for households, habits, and real-life quests.",
  applicationName: "Sopro Ducktive",
  appleWebApp: {
    capable: true,
    title: "Ducktive",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#159160"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
