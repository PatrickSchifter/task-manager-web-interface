import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AppThemeProvider } from "@/src/providers/theme-provider";
import { FeedbackProvider } from "@/src/providers/feedback-provider";
import { AuthStatusProvider } from "@/src/providers/auth-status-provider";
import { getSessionToken } from "@/src/lib/auth/session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Solut Tasks",
  description: "Administre suas tarefas com Inteligencia de Máquina",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isAuthenticated = Boolean(await getSessionToken());

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col"
        suppressHydrationWarning={true}
      >
        <AppThemeProvider>
          <AuthStatusProvider isAuthenticated={isAuthenticated}>
            <FeedbackProvider>{children}</FeedbackProvider>
          </AuthStatusProvider>
        </AppThemeProvider>
      </body>
    </html>
  );
}
