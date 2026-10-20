import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Fraunces } from "next/font/google";
import { Header } from "@/components/Header";
import "./globals.css";

const body = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body",
});

const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Sign Language Translator",
  description: "Translate sign language gestures into English text in real time from your webcam.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${body.variable} ${display.variable} font-sans antialiased`}>
        <div className="mx-auto min-h-screen max-w-7xl">
          <Header />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
