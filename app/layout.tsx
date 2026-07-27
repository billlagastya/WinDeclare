import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WinDeclare | Premium Sports Turf & Arena Booking",
  description: "Book premium sports turfs, cricket grounds, football boxes, and badminton courts instantly. Transparent pricing, real-time slot availability, and zero hidden fees.",
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
      <body className="min-h-full flex flex-col bg-[#0d1117] text-gray-100 selection:bg-amber-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
