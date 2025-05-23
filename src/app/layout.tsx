import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/common/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/shared/contexts/AuthContext";
import { MicrosoftAuthProvider } from "@/modules/mailbox/services/MicrosoftAuthContext";
import { UnifiedAuthProvider } from "@/shared/contexts/UnifiedAuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Table - AI-Powered Professional Search",
  description: "Search for LinkedIn profiles and professional content with AI-powered analysis and enhancement",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Analytics />
        <AuthProvider>
          <MicrosoftAuthProvider>
            <UnifiedAuthProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <ToastProvider>
                  {children}
                </ToastProvider>
              </ThemeProvider>
            </UnifiedAuthProvider>
          </MicrosoftAuthProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
