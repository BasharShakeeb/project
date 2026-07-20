import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "LifeOS — Your Personal Life Operating System",
  description:
    "An intelligent personal assistant to manage your tasks, calendar, goals, habits, health, finances, notes, and studies — all in one place.",
  keywords: ["life dashboard", "personal assistant", "task management", "habit tracker", "productivity", "LifeOS"],
  authors: [{ name: "LifeOS" }],
  openGraph: {
    title: "LifeOS — Your Personal Life Operating System",
    description: "Manage every aspect of your life in one intelligent dashboard.",
    type: "website",
    siteName: "LifeOS",
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
