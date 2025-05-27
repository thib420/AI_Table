import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/common/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/shared/contexts/AuthContext";
import { MicrosoftAuthProvider } from "@/modules/mailbox/services/MicrosoftAuthContext";
import { UnifiedAuthProvider } from "@/shared/contexts/UnifiedAuthContext";
import { StructuredData } from "@/components/seo/StructuredData";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Converr - AI-Powered Professional Intelligence Platform",
    template: "%s | Converr"
  },
  description: "Transform your professional network into revenue with AI-powered lead generation. Find, analyze, and connect with the right professionals using intelligent search, instant enrichment, and smart organization tools.",
  keywords: [
    "AI lead generation",
    "professional networking",
    "LinkedIn automation",
    "sales intelligence",
    "prospect research",
    "contact enrichment",
    "B2B sales tools",
    "CRM integration",
    "email campaigns",
    "professional search"
  ],
  authors: [{ name: "Converr Team" }],
  creator: "Converr",
  publisher: "Converr",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://converr.ai",
    siteName: "Converr",
    title: "Converr - AI-Powered Professional Intelligence Platform",
    description: "Transform your professional network into revenue with AI-powered lead generation. Find, analyze, and connect with the right professionals.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Converr - AI-Powered Professional Intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Converr - AI-Powered Professional Intelligence Platform",
    description: "Transform your professional network into revenue with AI-powered lead generation. Find, analyze, and connect with the right professionals.",
    images: ["/og-image.png"],
    creator: "@converr_ai",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  verification: {
    google: "your-google-verification-code",
    // Add other verification codes as needed
  },
  alternates: {
    canonical: "https://converr.ai",
  },
  category: "Technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <StructuredData type="Organization" />
        <StructuredData type="WebSite" />
        <StructuredData type="SoftwareApplication" />
      </head>
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
