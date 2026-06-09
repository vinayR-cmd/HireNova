import Link from "next/link";
import Image from "next/image";
import { Cpu, ShieldCheck, Users, ArrowRight, Activity, Layers, Landmark, Sparkles, Building2, Terminal } from "lucide-react";

export const metadata = {
  title: "HireNova Enterprise — Autonomous HRMS & Core Payroll Infrastructure",
  description: "Accelerate your corporate operations with an automated HR platform. Specialized in compliant single-page automated Indian payroll cycles, shift logistics tracking, and employee self-service hubs.",
  keywords: ["HRMS India", "Automated Payroll Software", "Compliance Infrastructure", "A4 Payslip Builder", "Employee Attendance Self-Service", "HireNova Engine"],
};

export default function Home() {
  return (
    <div className="min-h-screen bg-[#08090C] text-white font-sans flex flex-col relative overflow-hidden">
      
      {/* ================= BACKGROUND HIGH-AESTHETIC DECORATIVE ELEMENTS ================= */}
      <div className="fixed inset-0 pointer-events-none opacity-20 select-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-[radial-gradient(oklch(0.62_0.21_291)_1.5px,transparent_1.5px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_65%)]" />
      </div>

      {/* ================= PREMIUM FIXED GLASS NAVIGATION DESK ================= */}
      {/* Fixed position with enhanced backdrop blur ensures it stays floating cleanly as you scroll */}
      <div className="w-full flex justify-center fixed top-5 z-50 px-4 pointer-events-none">
        <header className="w-full max-w-5xl rounded-full border border-white/10 bg-[#0D0F15]/70 backdrop-blur-xl px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.35)] pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="relative h-7 w-7 rounded-xl bg-gradient-to-br from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] flex items-center justify-center shadow-xs overflow-hidden">
              <Image
                src="/logo.png"
                alt="HireNova Logo"
                width={20}
                height={20}
                style={{ width: 20, height: "auto" }}
                className="object-contain"
                priority
              />
            </div>
            <span className="text-sm font-bold tracking-tight text-white sm:block hidden">HireNova Enterprise</span>
          </div>

          {/* Core Feature Anchor Links */}
          <nav className="hidden md:flex items-center gap-1 bg-white/[0.05] border border-white/8 p-0.5 rounded-full text-[11px] font-semibold text-gray-400">
            <a href="#payroll" className="px-3 py-1 rounded-full hover:text-white transition-colors">Payroll Matrix</a>
            <a href="#attendance" className="px-3 py-1 rounded-full hover:text-white transition-colors">Shift Logistics</a>
            <a href="#compliance" className="px-3 py-1 rounded-full hover:text-white transition-colors">Governance</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/careers"
              className="text-xs font-semibold text-gray-300 hover:text-white px-3 py-1.5 transition-all"
            >
              Careers
            </Link>
            <Link
              href="/login" 
              className="text-xs font-semibold text-gray-300 hover:text-white px-3 py-1.5 transition-all"
            >
              Portal Access
            </Link>
            <Link 
              href="/admin/payroll" 
              className="bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] hover:opacity-90 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-md shadow-[oklch(0.62_0.21_291)]/25 transition-all tracking-tight"
            >
              Console Core
            </Link>
          </div>
        </header>
      </div>

      {/* ================= HERO ARCHITECTURE VIEWPORT ================= */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 lg:px-16 pt-36 pb-20 max-w-6xl mx-auto w-full space-y-20 relative z-10">
        
        {/* Core Slogan Engine Node */}
        <div className="text-center space-y-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-white/[0.07] border border-white/15 px-3.5 py-1 rounded-full text-[10px] font-bold text-gray-300 uppercase tracking-wider shadow-2xs">
            <Activity className="h-3 w-3 text-[oklch(0.62_0.21_291)]" /> Cloud Infrastructure Layer v2.6.0
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-medium tracking-tight text-white leading-[1.1] max-w-5xl mx-auto">
            Ship workforce operations at <span className="bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] bg-clip-text text-transparent">lightning speed.</span>
          </h1>
          
          <p className="text-sm sm:text-base lg:text-lg text-gray-400 font-normal leading-relaxed max-w-2xl mx-auto">
            Automate distributed resource scheduling, verify deep shift parameters, and run unified Indian compliance-ready payroll streams on a zero-friction operations platform.
          </p>

          {/* Unified Gateway Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6">
            <Link
              href="/admin/payroll"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] hover:opacity-90 text-white text-xs font-semibold px-6 py-3.5 rounded-full shadow-md shadow-[oklch(0.62_0.21_291)]/30 hover:shadow-xl transition-all cursor-pointer group"
            >
              <Cpu className="h-3.5 w-3.5 stroke-[2]" />
              Launch Operations Desk
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
            
            <Link
              href="/employee/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#12141A] hover:bg-white/[0.03] text-gray-200 border border-white/10 text-xs font-semibold px-6 py-3.5 rounded-full shadow-xs transition-all cursor-pointer"
            >
              <Users className="h-3.5 w-3.5 stroke-[2]" />
              Employee Portal Entry
            </Link>
          </div>
        </div>

        {/* ================= HIGH-DETAIL PLATFORM ANCHOR MATRIX ================= */}
        <div className="w-full space-y-12 pt-10">
          <div className="text-center space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">Engineered for Modern Enterprise Scopes</h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto">Eliminate secondary calculation modules with built-in native compliance ledgers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            
            {/* Card Segment 1: Payroll System */}
            <div id="payroll" className="rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-4 flex flex-col justify-between transition-all hover:border-white/15">
              <div className="space-y-4">
                <div className="h-9 w-9 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-white">
                  <Landmark className="h-4.5 w-4.5 stroke-[1.75]" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold text-white tracking-tight flex items-center gap-1.5">
                    Indian Statutory Compliance <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
                  </h3>
                  <p className="text-xs text-gray-500 font-normal leading-relaxed">
                    Automated computational logic processing strict ₹ local currency distribution standards. Fully integrated components mapping standard Provident Fund (PF) allocations, Professional Tax parameters, and recursive TDS withholding deductions.
                  </p>
                </div>
              </div>
              <div className="border-t border-white/8 pt-3 flex items-center gap-1.5 text-[10px] font-mono text-gray-500 uppercase">
                <Terminal className="h-3 w-3" /> Core Calculation Layer
              </div>
            </div>

            {/* Card Segment 2: Attendance Architecture */}
            <div id="attendance" className="rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-4 flex flex-col justify-between transition-all hover:border-white/15">
              <div className="space-y-4">
                <div className="h-9 w-9 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-white">
                  <Layers className="h-4.5 w-4.5 stroke-[1.75]" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold text-white tracking-tight">Biometric Shift Logistics</h3>
                  <p className="text-xs text-gray-500 font-normal leading-relaxed">
                    Interactive structural calendars computing real-time shift obligations. Displays calendar weekend offsets, gazetted holidays, automated undertime delta triggers, and administrative compliance audit trail remarks.
                  </p>
                </div>
              </div>
              <div className="border-t border-white/8 pt-3 flex items-center gap-1.5 text-[10px] font-mono text-gray-500 uppercase">
                <Building2 className="h-3 w-3" /> Time Attendance Matrix
              </div>
            </div>

            {/* Card Segment 3: Printing Frameworks */}
            <div id="compliance" className="rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-4 flex flex-col justify-between transition-all hover:border-white/15">
              <div className="space-y-4">
                <div className="h-9 w-9 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-white">
                  <ShieldCheck className="h-4.5 w-4.5 stroke-[1.75]" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold text-white tracking-tight">Isolated Document Print Pipeline</h3>
                  <p className="text-xs text-gray-500 font-normal leading-relaxed">
                    Hardlocked portrait print media queries forcing absolute, pixel-perfect single-page A4 billing dimensions. Automatically sanitizes and clears browser system margins to yield pristine, corporate-grade digital statements.
                  </p>
                </div>
              </div>
              <div className="border-t border-white/8 pt-3 flex items-center gap-1.5 text-[10px] font-mono text-gray-500 uppercase">
                <ShieldCheck className="h-3 w-3" /> Secure Output Layer
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* ================= PLATFORM CENTRAL CONSOLE FOOTER ================= */}
      <footer className="border-t border-white/10 py-6 text-center text-[11px] text-gray-500 font-normal relative z-10 bg-[#0D0F15]/40 backdrop-blur-xs">
        © 2026 HireNova Systems India Private Limited. Secure Infrastructure Core Node • Cryptographic TLS 1.3 Encryption Rules Enforced.
      </footer>

    </div>
  );
}