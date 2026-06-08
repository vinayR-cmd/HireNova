"use client";

import { useEffect } from "react";

export function AutoPrintTrigger() {
  useEffect(() => {
    // Delay slightly to allow subpixel document tracking frames to lock context
    const timer = setTimeout(() => {
      window.print();
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  return null;
}