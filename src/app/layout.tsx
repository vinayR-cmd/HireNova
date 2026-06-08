import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RecruitIQ — Enterprise HRMS & Payroll Portal",
  description: "Next-generation full-stack corporate operations engine.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        className={`
          ${geistSans.variable} 
          ${geistMono.variable} 
          font-sans 
          antialiased 
          text-white 
          bg-[#08090C]
          min-h-screen 
          relative 
          overflow-x-hidden
        `}
      >
        {/* ================= GLOBAL AMBIENT BRAND GLOW BACKGROUND ================= */}
        <div className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0">
          <div className="absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-[oklch(0.62_0.21_291)]/10 blur-[120px]" />
          <div className="absolute top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full bg-[oklch(0.68_0.19_330)]/10 blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(white_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        </div>

        {/* Core application content stream layer */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* TanStack Query, React Context Providers, and UI components hook here */}
          {children}
        </div>
      </body>
    </html>
  );
}