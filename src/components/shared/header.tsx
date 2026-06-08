"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, Bell, AlertTriangle, Menu, X, CheckCheck, Info, CreditCard, Clock } from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";

interface HeaderProps {
  user: {
    fullName: string;
    email: string;
    role: string;
  };
  onMenuOpen?: () => void;
}

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const typeIcon = (type: string) => {
  if (type === "SALARY_RELEASED") return <CreditCard className="h-3.5 w-3.5 text-emerald-500" />;
  if (type === "LEAVE_APPROVED" || type === "LEAVE_REJECTED") return <Clock className="h-3.5 w-3.5 text-amber-500" />;
  return <Info className="h-3.5 w-3.5 text-[oklch(0.62_0.21_291)]" />;
};

export function Header({ user, onMenuOpen }: HeaderProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);

  // Notifications
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const res = await apiFetch("/api/notifications?limit=15");
      if (res.ok) {
        const payload = await res.json();
        const list: Notification[] = payload.items || [];
        setNotifications(list);
        setUnreadCount(payload.unreadCount ?? list.filter(n => !n.isRead).length);
      }
    } catch {
      // silent
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const openNotifications = () => {
    setNotifOpen(v => !v);
    if (!notifOpen) fetchNotifications();
  };

  const markAllRead = async () => {
    await apiFetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const markOneRead = async (id: string) => {
    await apiFetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    });
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleLogoutExecution = async () => {
    setIsTerminating(true);
    try {
      const response = await apiFetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        setIsModalOpen(false);
        router.push("/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout runtime failure sequence:", error);
    } finally {
      setIsTerminating(false);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/15 bg-[#0D0F15]/90 backdrop-blur-md px-4 sm:px-8 shadow-[0_2px_20px_rgba(0,0,0,0.3)] text-white">
        <div className="flex items-center gap-3">
          {/* Hamburger — mobile only */}
          <button
            onClick={onMenuOpen}
            className="lg:hidden p-2 rounded-xl text-gray-400 hover:bg-white/[0.05] hover:text-white transition-all cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <span className="hidden sm:inline-flex text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-white/[0.03] px-2.5 py-1 border border-white/10 rounded-md">
            {user.role}
          </span>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={openNotifications}
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#0D0F15]/60 border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_2px_8px_rgba(0,0,0,0.4)] backdrop-blur-sm text-gray-400 hover:bg-white/[0.06] hover:border-white/15 hover:text-gray-100 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_2px_8px_rgba(0,0,0,0.4)] transition-all duration-200 cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4 stroke-[1.75]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[oklch(0.62_0.21_291)] text-[9px] font-bold text-white leading-none ring-2 ring-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/10 bg-[#12141A] shadow-2xl z-50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                  <span className="text-xs font-semibold text-white">Notifications</span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[10px] font-medium text-[oklch(0.62_0.21_291)] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCheck className="h-3 w-3" /> Mark all read
                      </button>
                    )}
                    <button onClick={() => setNotifOpen(false)} className="p-1 rounded-lg hover:bg-white/[0.05] text-gray-500 cursor-pointer">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {notifLoading ? (
                    <div className="py-8 text-center text-xs text-gray-500">Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-500">No notifications yet</div>
                  ) : (
                    notifications.map(n => (
                      <button
                        key={n._id}
                        onClick={() => !n.isRead && markOneRead(n._id)}
                        className={`w-full text-left px-4 py-3 hover:bg-white/[0.04] transition-colors flex items-start gap-3 cursor-pointer ${!n.isRead ? "bg-blue-500/10" : ""}`}
                      >
                        <div className="mt-0.5 shrink-0 rounded-full bg-white/[0.05] p-1.5">
                          {typeIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-semibold text-white truncate ${!n.isRead ? "text-white" : "text-gray-300"}`}>
                              {n.title}
                            </span>
                            {!n.isRead && <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.62_0.21_291)] shrink-0" />}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                          <span className="text-[10px] text-gray-600 mt-1 block">{timeAgo(n.createdAt)}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User */}
          <div className="flex items-center gap-3 border-l border-white/8 pl-4 sm:pl-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.62_0.21_291)]/15 to-[oklch(0.68_0.19_330)]/15 border border-[oklch(0.62_0.21_291)]/20 shrink-0">
              <User className="h-4 w-4 text-[oklch(0.62_0.21_291)]" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-white leading-none mb-1">{user.fullName}</p>
              <p className="text-[11px] text-gray-500 max-w-[150px] truncate leading-none font-normal">{user.email}</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              title="Sign Out"
              className="ml-1 sm:ml-2 rounded-xl p-2 text-gray-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4 stroke-[2]" />
            </button>
          </div>
        </div>
      </header>

      {/* Logout confirmation modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="h-5 w-5 stroke-[2]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold tracking-tight text-white">Sign Out of Session?</h3>
                <p className="text-xs text-gray-500 font-normal leading-relaxed">
                  You will need to re-authenticate to access your console again.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/8">
              <button
                type="button"
                disabled={isTerminating}
                onClick={() => setIsModalOpen(false)}
                className="rounded-full border border-white/10 bg-[#12141A] px-5 py-2 text-xs font-semibold text-gray-300 hover:bg-white/[0.03] transition-all cursor-pointer shadow-xs disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isTerminating}
                onClick={handleLogoutExecution}
                className="rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-5 py-2 shadow-sm transition-all cursor-pointer disabled:opacity-40"
              >
                {isTerminating ? "Signing Out..." : "Confirm Sign Out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
