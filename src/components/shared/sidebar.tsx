"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    CalendarCheck,
    CreditCard,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    CalendarOff,
    Calendar,
    X,
    AlertTriangle,
    Sparkles,
    LineChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";

interface SidebarProps {
    role: "ADMIN" | "EMPLOYEE";
    mobileOpen?: boolean;
    onMobileClose?: () => void;
    onCollapseChange?: (collapsed: boolean) => void;
}

const COLLAPSE_KEY = "recruitiq_sidebar_collapsed";

export function Sidebar({ role, mobileOpen = false, onMobileClose, onCollapseChange }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    // Restore collapse state from localStorage; default false until mounted
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [logoutModal, setLogoutModal] = useState(false);
    const [isTerminating, setIsTerminating] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem(COLLAPSE_KEY);
        const initial = saved === "true";
        setIsCollapsed(initial);
        onCollapseChange?.(initial);
        setMounted(true);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const toggleCollapse = (val: boolean) => {
        setIsCollapsed(val);
        localStorage.setItem(COLLAPSE_KEY, String(val));
        onCollapseChange?.(val);
    };

    // Close mobile drawer on route change
    useEffect(() => {
        onMobileClose?.();
    }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleLogout = async () => {
        setIsTerminating(true);
        try {
            const res = await apiFetch("/api/auth/logout", { method: "POST" });
            if (res.ok) {
                setLogoutModal(false);
                router.push("/login");
                router.refresh();
            }
        } catch {
            // silent
        } finally {
            setIsTerminating(false);
        }
    };

    const adminLinks = [
        { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/hiring", label: "Hiring Agent", icon: Sparkles },
        { href: "/admin/employees", label: "Workforce", icon: Users },
        { href: "/admin/attendance", label: "Attendance", icon: CalendarCheck },
        { href: "/admin/calendar", label: "Working Calendar", icon: Calendar },
        { href: "/admin/leaves", label: "Leave Requests", icon: CalendarOff },
        { href: "/admin/payroll", label: "Payroll Control", icon: CreditCard },
        { href: "/admin/analytics", label: "Workforce Analytics", icon: LineChart },
        { href: "/admin/settings", label: "System Settings", icon: Settings },
    ];

    const employeeLinks = [
        { href: "/employee/dashboard", label: "My Console", icon: LayoutDashboard },
        { href: "/employee/profile", label: "My Profile", icon: Users },
        { href: "/employee/attendance", label: "My Logs", icon: CalendarCheck },
        { href: "/employee/leaves", label: "My Leaves", icon: CalendarOff },
        { href: "/employee/payroll", label: "My Payslips", icon: CreditCard },
    ];

    const links = role === "ADMIN" ? adminLinks : employeeLinks;

    // Prevent layout flash before localStorage is read
    const collapsed = mounted ? isCollapsed : false;

    const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
        <nav className="flex-1 space-y-1.5 px-3 py-6 overflow-y-auto overflow-x-hidden">
            {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "group relative flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                            isActive
                                ? "bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] text-white shadow-md shadow-[oklch(0.62_0.21_291)]/25"
                                : "text-gray-400 hover:bg-white/[0.03] hover:text-white"
                        )}
                    >
                        <Icon className={cn(
                            "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-105",
                            isActive ? "text-white" : "text-gray-500 group-hover:text-gray-300"
                        )} />
                        <span className={cn(
                            "transition-all duration-200 whitespace-nowrap",
                            !mobile && collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
                        )}>
                            {link.label}
                        </span>
                        {isActive && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
                        )}
                    </Link>
                );
            })}
        </nav>
    );

    const SignOutButton = ({ mobile = false }: { mobile?: boolean }) => (
        <button
            onClick={() => setLogoutModal(true)}
            className={cn(
                "flex items-center justify-center gap-2 rounded-full font-semibold text-xs transition-all duration-200 cursor-pointer border",
                "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/15 hover:text-rose-400",
                !mobile && collapsed ? "p-2.5" : "px-4 py-2.5 w-full"
            )}
            title="Sign Out Session"
        >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            <span className={cn(
                "transition-all duration-200 font-medium tracking-wide",
                !mobile && collapsed ? "hidden" : "block"
            )}>
                Sign Out
            </span>
        </button>
    );

    return (
        <>
            {/* ── Desktop: fixed sidebar, always visible ── */}
            <aside className={cn(
                "hidden lg:flex fixed inset-y-0 left-0 z-30 flex-col",
                "transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] peer",
                collapsed ? "w-20" : "w-64"
            )}
                data-collapsed={collapsed}
            >
                <div
                    data-collapsed={collapsed}
                    className={cn(
                        "flex h-full flex-col border-r border-white/15 bg-[#12141A] text-white",
                        "transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]",
                        collapsed ? "w-20" : "w-64"
                    )}
                >
                    {/* Header */}
                    <div className="flex h-16 items-center justify-between px-5 border-b border-white/8 shrink-0">
                        <Link
                            href="/"
                            className={cn(
                                "flex items-center gap-2 font-semibold text-white tracking-tight transition-opacity duration-200",
                                collapsed && "opacity-0 pointer-events-none w-0 overflow-hidden"
                            )}
                        >
                            <Image src="/logo.png" alt="RecruitIQ" width={28} height={28} className="shrink-0" />
                            <span className="text-base font-semibold">RecruitIQ</span>
                            <span className="text-[10px] font-medium text-gray-500 bg-white/[0.03] px-1.5 py-0.5 border border-white/10 rounded-md">v2.4</span>
                        </Link>

                        <button
                            onClick={() => toggleCollapse(!collapsed)}
                            className="flex p-1.5 rounded-full border border-white/10 bg-[#12141A] text-gray-400 hover:text-white hover:bg-white/[0.03] transition-all shadow-xs cursor-pointer shrink-0"
                        >
                            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                        </button>
                    </div>

                    <NavLinks />

                    {/* Footer */}
                    <div className="p-3 border-t border-white/8 bg-white/[0.02] flex flex-col gap-2 shrink-0">
                        <SignOutButton />
                        <div className={cn(
                            "text-center text-[10px] tracking-wider text-gray-500 uppercase font-bold py-1 transition-opacity",
                            collapsed ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
                        )}>
                            Enterprise Node Secure
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── Mobile: slide-over drawer ── */}
            <div
                className={cn(
                    "lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
                    mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={onMobileClose}
            />
            <aside className={cn(
                "lg:hidden fixed inset-y-0 left-0 z-50 flex flex-col w-72",
                "transition-transform duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]",
                mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex h-full flex-col border-r border-white/15 bg-[#12141A] text-white">
                    <div className="flex h-16 items-center justify-between px-5 border-b border-white/8 shrink-0">
                        <Link href="/" className="flex items-center gap-2 font-semibold text-white tracking-tight">
                            <Image src="/logo.png" alt="RecruitIQ" width={28} height={28} className="shrink-0" />
                            <span className="text-base font-semibold">RecruitIQ</span>
                            <span className="text-[10px] font-medium text-gray-500 bg-white/[0.03] px-1.5 py-0.5 border border-white/10 rounded-md">v2.4</span>
                        </Link>
                        <button
                            onClick={onMobileClose}
                            className="p-1.5 rounded-full border border-white/10 bg-[#12141A] text-gray-400 hover:text-white transition-all cursor-pointer"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <NavLinks mobile />
                    <div className="p-3 border-t border-white/8 bg-white/[0.02]">
                        <SignOutButton mobile />
                    </div>
                </div>
            </aside>

            {/* ── Logout Confirmation Modal ── */}
            {logoutModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
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
                                onClick={() => setLogoutModal(false)}
                                className="rounded-full border border-white/10 bg-[#12141A] px-5 py-2 text-xs font-semibold text-gray-300 hover:bg-white/[0.03] transition-all cursor-pointer shadow-xs disabled:opacity-40"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isTerminating}
                                onClick={handleLogout}
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
