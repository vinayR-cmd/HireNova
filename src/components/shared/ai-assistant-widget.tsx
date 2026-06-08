"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface ChatResponse {
  mode: "onboarding" | "support" | "admin";
  reply: string;
  suggestedPrompts: string[];
}

const MODE_LABEL: Record<ChatResponse["mode"], string> = {
  onboarding: "Onboarding Assistant",
  support: "HR Support Assistant",
  admin: "HR Assistant",
};

/**
 * Floating chat bubble for the unified Assistant Agent (Onboarding + HR
 * Support). Mounted in both the employee and admin shells — the backend
 * adapts persona and available tools based on who's signed in.
 */
export function AiAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<ChatResponse["mode"]>("support");
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy]);

  async function send(message: string) {
    const trimmed = message.trim();
    if (!trimmed || busy) return;

    const nextTurns: ChatTurn[] = [...turns, { role: "user", content: trimmed }];
    setTurns(nextTurns);
    setInput("");
    setBusy(true);
    setError(null);

    try {
      const res = await apiFetch("/api/agents/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextTurns }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "The assistant couldn't respond. Please try again.");

      const data = json.data as ChatResponse;
      setTurns(prev => [...prev, { role: "assistant", content: data.reply }]);
      setMode(data.mode);
      setSuggestedPrompts(data.suggestedPrompts || []);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setTurns(prev => prev.slice(0, -1));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[oklch(0.62_0.21_291)] text-white shadow-[0_12px_30px_rgba(0,0,0,0.5)] hover:scale-105 transition-transform cursor-pointer"
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[min(380px,calc(100vw-3rem))] h-[min(560px,calc(100vh-10rem))] flex flex-col rounded-2xl border border-white/10 bg-[#12141A] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3.5 bg-[oklch(0.62_0.21_291)]/5">
            <div className="h-9 w-9 rounded-xl bg-[oklch(0.62_0.21_291)]/10 flex items-center justify-center shrink-0">
              <Bot className="h-4.5 w-4.5 text-[oklch(0.62_0.21_291)]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{MODE_LABEL[mode]}</p>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-[oklch(0.62_0.21_291)]">
                <Sparkles className="h-3 w-3" /> AI Agent
              </span>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {turns.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-400 leading-relaxed">
                  Hi! I can help with your leave balance, attendance, payslips, and company policies. Ask me anything.
                </p>
                {suggestedPrompts.length === 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {["How many leave days do I have left?", "How was my attendance this month?", "What are the company holidays?"].map(p => (
                      <button
                        key={p}
                        onClick={() => send(p)}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-gray-200 hover:border-[oklch(0.62_0.21_291)]/30 hover:text-[oklch(0.62_0.21_291)] transition-colors cursor-pointer"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {turns.map((turn, idx) => (
              <div key={idx} className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    turn.role === "user"
                      ? "bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] text-white"
                      : "bg-white/[0.03] border border-white/10 text-gray-100"
                  }`}
                >
                  {turn.content}
                </div>
              </div>
            ))}

            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-sm text-gray-500 inline-flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-400">{error}</div>
            )}

            {!busy && turns.length > 0 && suggestedPrompts.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {suggestedPrompts.slice(0, 3).map(p => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-gray-200 hover:border-[oklch(0.62_0.21_291)]/30 hover:text-[oklch(0.62_0.21_291)] transition-colors cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={e => { e.preventDefault(); send(input); }}
            className="flex items-center gap-2 border-t border-white/8 px-3 py-3"
          >
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about leave, attendance, payroll…"
              disabled={busy}
              className="flex-1 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.21_291)]/20 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[oklch(0.62_0.21_291)] text-white hover:bg-[oklch(0.72_0.18_305)] transition-colors disabled:opacity-40 cursor-pointer"
              aria-label="Send message"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
