import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ask.zafranudin.my";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ask Me Anything | Zafranudin Zafrin",
    template: "%s | Ask Me Anything",
  },
  description:
    "Send an anonymous message or share feedback. Your identity stays private.",
  keywords: [
    "anonymous",
    "ask me anything",
    "ama",
    "feedback",
    "questions",
    "zafranudin",
  ],
  authors: [{ name: "Zafranudin Zafrin", url: "https://zafranudin.my" }],
  creator: "Zafranudin Zafrin",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Ask Me Anything",
    title: "Ask Me Anything | Zafranudin Zafrin",
    description:
      "Send an anonymous message or share feedback. Your identity stays private.",
    images: [
      {
        url: `${siteUrl}/api/og`,
        width: 1200,
        height: 630,
        alt: "Ask Me Anything",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ask Me Anything | Zafranudin Zafrin",
    description:
      "Send an anonymous message or share feedback. Your identity stays private.",
    images: [`${siteUrl}/api/og`],
    creator: "@zafranudin_z",
  },
  robots: {
    index: true,
    follow: true,
  },
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
