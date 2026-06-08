"use client";

import { Download } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] hover:opacity-90 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-sm transition-all cursor-pointer print:hidden"
    >
      <Download className="h-4 w-4" /> Download PDF
    </button>
  );
}