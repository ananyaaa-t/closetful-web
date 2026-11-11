import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Geometric display font used for /closet section headings ("Recently
// Added", "All Pieces") — more distinctive than body copy without reading
// as an old-fashioned serif.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Closetful",
  description: "Save anything you want from anywhere, in one place.",
  appleWebApp: {
    // Lets "Add to Home Screen" on iOS Safari launch full-screen like a
    // real app (no browser chrome), matching the Android installed-PWA
    // experience enabled by app/manifest.ts.
    capable: true,
    title: "closetful.",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#38040E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
