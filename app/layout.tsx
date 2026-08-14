import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://windeclare.com'),
  title: "WinDeclare | Premium Sports Turf & Arena Booking",
  description: "Book premium sports turfs, cricket grounds, football boxes, and badminton courts instantly. Transparent pricing, real-time slot availability, and zero hidden fees.",
  icons: {
    icon: '/favicon.png?v=3',
    shortcut: '/favicon.png?v=3',
    apple: '/favicon.png?v=3',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="dark h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-[#0d1117] text-gray-100 selection:bg-gradient-to-r from-[#0EA5E9] to-[#EC4899] selection:text-black">
        {children}
      </body>
    </html>
  );
}
// Build trigger timestamp: 2026-08-14 13:32:00
