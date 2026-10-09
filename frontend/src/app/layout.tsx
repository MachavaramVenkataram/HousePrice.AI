import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { AmbientBackground } from "@/components/ui/AmbientBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HOUSEPRICE AI — Machine-Learning Property Price Estimation",
  description:
    "Generate a data-driven property price estimate using historical housing data. Production-grade property price estimation powered by cross-validated ensemble regression, split conformal prediction intervals, and SHAP explainability.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#faf9f6] text-slate-900 relative">
        {/* Multi-Layer Animated Liquid Ambient Background */}
        <AmbientBackground />

        <Providers>
          <CommandPalette />
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
