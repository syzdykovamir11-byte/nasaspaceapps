import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "~/lib/query-client";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Field Tracker",
  description: "See how your field is doing from satellite data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-ink text-ink`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
