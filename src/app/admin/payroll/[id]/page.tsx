import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "@/lib/jwt";
import { payrollRepository } from "@/repositories/payroll.repository";
import { connectDB } from "@/lib/db";
import { ArrowLeft, FileCheck2, ShieldCheck, Send, Lock } from "lucide-react";
import Link from "next/link";
import { PrintButton } from "@/components/shared/print-button";
import { PayrollActionBar } from "@/components/shared/payroll-action-bar";

export const revalidate = 0;

export default async function AdminPayslipDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get("recruitiq_access")?.value;
    const session = token ? verifyAccessToken(token) : null;

    if (!session || session.role !== "ADMIN") redirect("/login");

    await connectDB();
    const slip = await payrollRepository.findByIdPopulated(id) as any;

    // Admin may view DRAFT/GENERATED/APPROVED/RELEASED for audit purposes.
    if (!slip) redirect("/admin/payroll");

    const isLocked = slip.status === "RELEASED";
    const isDraft = slip.status === "DRAFT";

    // Status banner config — shown on every non-released slip so admin knows
    // what action to take next and can run it inline.
    const banner = (() => {
      if (slip.status === "GENERATED") {
        return {
          tone: "amber" as const,
          icon: FileCheck2,
          title: "Generated — Awaiting Verification",
          body: "Review the computed earnings and deductions below. If everything looks correct, approve to advance the slip for release.",
          actionLabel: "Approve Slip",
          actionIcon: ShieldCheck,
          actionType: "APPROVE" as const,
        };
      }
      if (slip.status === "APPROVED") {
        return {
          tone: "emerald" as const,
          icon: ShieldCheck,
          title: "Approved — Ready for Release",
          body: "This slip has been verified and is ready to be dispatched to the employee. Once released, it becomes immutable.",
          actionLabel: "Release to Employee",
          actionIcon: Send,
          actionType: "RELEASE" as const,
        };
      }
      return null;
    })();

    const emp = slip.employeeId as any;
    const employeeName = emp?.fullName || "—";
    const employeeCode = emp?.employeeId || "—";
    const department = emp?.department || "—";
    const designation = emp?.designation || "—";
    const bankAccount = emp?.bankInfo?.accountNumber
        ? `XXXXXXXX${emp.bankInfo.accountNumber.slice(-4)}`
        : "—";
    const ifscCode = emp?.bankInfo?.ifscCode || "—";
    const panNumber = emp?.panNumber || "—";

    const fmt = (val: number) =>
        new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(val);

    const getMonthName = (m: number) =>
        new Date(2026, m - 1, 1).toLocaleString("en-US", { month: "long" });

    const disbursementDate = new Date(slip.releasedAt || Date.now()).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
    });

    const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    function numToWords(n: number): string {
        if (n === 0) return "Zero";
        if (n < 20) return units[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + units[n % 10] : "");
        if (n < 1000) return units[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + numToWords(n % 100) : "");
        if (n < 100000) return numToWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + numToWords(n % 1000) : "");
        if (n < 10000000) return numToWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + numToWords(n % 100000) : "");
        return numToWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + numToWords(n % 10000000) : "");
    }
    const amountInWords = numToWords(Math.round(slip.netSalary)) + " Rupees Only";

    return (
        <>
            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 0; }
                    body * { visibility: hidden !important; }
                    #payslip-sheet, #payslip-sheet * { visibility: visible !important; }
                    #payslip-sheet {
                        position: fixed !important;
                        inset: 0 !important;
                        width: 210mm !important;
                        min-height: 297mm !important;
                        margin: 0 !important;
                        padding: 18mm 15mm !important;
                        border: none !important;
                        box-shadow: none !important;
                        background: white !important;
                    }
                }
            `}</style>

            <div className="min-h-screen bg-white/[0.04] py-6 sm:py-10 px-3 sm:px-4">
                <div className="w-full max-w-[210mm] mx-auto flex items-center justify-between mb-4 sm:mb-6 print:hidden">
                    <Link
                        href="/admin/payroll"
                        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors font-medium"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Payroll
                    </Link>
                    <div className="flex items-center gap-2">
                        {isLocked && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5">
                                <Lock className="h-3 w-3" /> Locked
                            </span>
                        )}
                        <PrintButton />
                    </div>
                </div>

                {/* ── Verification / Release Action Banner ─────────────────────── */}
                {banner && (
                    <div className={`w-full max-w-[210mm] mx-auto mb-4 sm:mb-6 rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden backdrop-blur-sm ${
                        banner.tone === "amber"
                            ? "bg-amber-500/10 border-amber-500/20"
                            : "bg-emerald-500/10 border-emerald-500/20"
                    }`}>
                        <div className="flex items-start gap-3">
                            <div className={`rounded-xl p-2 ${banner.tone === "amber" ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                                <banner.icon className="h-4 w-4 stroke-[2]" />
                            </div>
                            <div>
                                <p className={`text-sm font-semibold tracking-tight ${banner.tone === "amber" ? "text-amber-900" : "text-emerald-900"}`}>{banner.title}</p>
                                <p className={`text-xs mt-0.5 leading-relaxed ${banner.tone === "amber" ? "text-amber-400/90" : "text-emerald-400/90"}`}>{banner.body}</p>
                            </div>
                        </div>
                        <PayrollActionBar
                            payrollId={slip._id.toString()}
                            action={banner.actionType}
                            label={banner.actionLabel}
                            tone={banner.tone}
                        />
                    </div>
                )}

                {isDraft && (
                    <div className="w-full max-w-[210mm] mx-auto mb-4 sm:mb-6 rounded-2xl border border-white/10 bg-[#12141A] p-4 text-xs text-gray-400 print:hidden">
                        This slip is in draft state — run the payroll engine to compute its values.
                    </div>
                )}

                <div className="overflow-x-auto">
                <div
                    id="payslip-sheet"
                    className="w-[210mm] min-h-[297mm] bg-[#12141A] mx-auto shadow-[0_8px_40px_rgba(0,0,0,0.4)] flex flex-col justify-between"
                    style={{ padding: "18mm 15mm" }}
                >
                    <div>
                        <div className="flex justify-between items-start pb-5 border-b-2 border-dashed border-white/10">
                            <div>
                                <div className="text-2xl font-bold text-white tracking-tight">
                                    <span className="text-[oklch(0.62_0.21_291)]">▲</span> RecruitIQ Enterprise
                                </div>
                                <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mt-1">
                                    Human Resource Management Portal
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold text-white uppercase tracking-wide">Salary Slip</div>
                                <div className="text-xs text-gray-400 mt-1">
                                    Period: <span className="font-semibold text-white">{getMonthName(slip.month)} {slip.year}</span>
                                </div>
                                <div className="text-xs text-gray-400 mt-0.5">
                                    Disbursed: <span className="font-semibold text-white">{disbursementDate}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-y-4 gap-x-4 py-5 border-b border-white/10 text-xs">
                            <div>
                                <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Employee Name</span>
                                <span className="font-semibold text-white">{employeeName}</span>
                            </div>
                            <div>
                                <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Employee ID</span>
                                <span className="font-mono font-bold text-white">{employeeCode}</span>
                            </div>
                            <div>
                                <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Department</span>
                                <span className="font-medium text-gray-200">{department}</span>
                            </div>
                            <div>
                                <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Designation</span>
                                <span className="font-medium text-gray-200">{designation}</span>
                            </div>
                            <div>
                                <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Bank Account No.</span>
                                <span className="font-mono text-gray-200">{bankAccount}</span>
                            </div>
                            <div>
                                <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">IFSC Code</span>
                                <span className="font-mono text-gray-200">{ifscCode}</span>
                            </div>
                            <div>
                                <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">PAN Number</span>
                                <span className="font-mono text-gray-200 uppercase">{panNumber}</span>
                            </div>
                            <div>
                                <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Days Present</span>
                                <span className="font-medium text-white">{slip.attendanceSummary?.presentDays ?? "—"} / {slip.attendanceSummary?.totalWorkingDays ?? "26"}</span>
                            </div>
                            <div>
                                <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Leave Days</span>
                                <span className="font-medium text-white">{slip.attendanceSummary?.leaveDays ?? 0}</span>
                            </div>
                            <div>
                                <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Overtime Hours</span>
                                <span className="font-medium text-white">{slip.attendanceSummary?.overtimeHours ?? 0} hrs</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-10 pt-5">
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-200 pb-1 border-b border-white/10">Earnings</h4>
                                <table className="w-full text-xs text-gray-300">
                                    <tbody>
                                        <tr className="border-b border-white/5">
                                            <td className="py-2">Basic Salary</td>
                                            <td className="py-2 text-right font-medium text-white">₹{fmt(slip.earnings.basicSalary ?? slip.earnings.grossSalary)}</td>
                                        </tr>
                                        {(slip.earnings.hraAmount ?? 0) > 0 && (
                                            <tr className="border-b border-white/5">
                                                <td className="py-2">House Rent Allowance (HRA)</td>
                                                <td className="py-2 text-right font-medium text-white">₹{fmt(slip.earnings.hraAmount)}</td>
                                            </tr>
                                        )}
                                        {(slip.earnings.specialAllowance ?? 0) > 0 && (
                                            <tr className="border-b border-white/5">
                                                <td className="py-2">Special Allowance</td>
                                                <td className="py-2 text-right font-medium text-white">₹{fmt(slip.earnings.specialAllowance)}</td>
                                            </tr>
                                        )}
                                        {(slip.earnings.performancePay ?? 0) > 0 && (
                                            <tr className="border-b border-white/5">
                                                <td className="py-2">Performance Pay</td>
                                                <td className="py-2 text-right font-medium text-white">₹{fmt(slip.earnings.performancePay)}</td>
                                            </tr>
                                        )}
                                        {(slip.earnings.bonus ?? 0) > 0 && (
                                            <tr className="border-b border-white/5">
                                                <td className="py-2">Bonus</td>
                                                <td className="py-2 text-right font-medium text-white">₹{fmt(slip.earnings.bonus)}</td>
                                            </tr>
                                        )}
                                        {(slip.earnings.incentives ?? 0) > 0 && (
                                            <tr className="border-b border-white/5">
                                                <td className="py-2">Incentive</td>
                                                <td className="py-2 text-right font-medium text-white">₹{fmt(slip.earnings.incentives)}</td>
                                            </tr>
                                        )}
                                        {(slip.earnings.otherAllowances ?? 0) > 0 && (
                                            <tr className="border-b border-white/5">
                                                <td className="py-2">Other Allowances</td>
                                                <td className="py-2 text-right font-medium text-white">₹{fmt(slip.earnings.otherAllowances)}</td>
                                            </tr>
                                        )}
                                        {(slip.earnings.overtimePay ?? 0) > 0 && (
                                            <tr className="border-b border-white/5">
                                                <td className="py-2">Overtime Pay</td>
                                                <td className="py-2 text-right font-medium text-white">₹{fmt(slip.earnings.overtimePay)}</td>
                                            </tr>
                                        )}
                                        <tr className="bg-white/[0.03] font-bold text-white">
                                            <td className="p-2">Gross Total</td>
                                            <td className="p-2 text-right">₹{fmt(slip.earnings.total)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-200 pb-1 border-b border-white/10">Deductions</h4>
                                <table className="w-full text-xs text-gray-300">
                                    <tbody>
                                        {(slip.deductions.pf ?? 0) > 0 && (
                                            <tr className="border-b border-white/5">
                                                <td className="py-2">Provident Fund (PF)</td>
                                                <td className="py-2 text-right font-medium text-white">₹{fmt(slip.deductions.pf)}</td>
                                            </tr>
                                        )}
                                        {(slip.deductions.tax ?? 0) > 0 && (
                                            <tr className="border-b border-white/5">
                                                <td className="py-2">Income Tax (TDS)</td>
                                                <td className="py-2 text-right font-medium text-white">₹{fmt(slip.deductions.tax)}</td>
                                            </tr>
                                        )}
                                        {(slip.deductions.professionalTax ?? 0) > 0 && (
                                            <tr className="border-b border-white/5">
                                                <td className="py-2">Professional Tax</td>
                                                <td className="py-2 text-right font-medium text-white">₹{fmt(slip.deductions.professionalTax)}</td>
                                            </tr>
                                        )}
                                        {(slip.deductions.leaveDeduction ?? 0) > 0 && (
                                            <tr className="border-b border-white/5">
                                                <td className="py-2">Leave Deduction</td>
                                                <td className="py-2 text-right font-medium text-white">₹{fmt(slip.deductions.leaveDeduction)}</td>
                                            </tr>
                                        )}
                                        {(slip.deductions.undertimeDeduction ?? 0) > 0 && (
                                            <tr className="border-b border-white/5">
                                                <td className="py-2">Undertime Deduction</td>
                                                <td className="py-2 text-right font-medium text-white">₹{fmt(slip.deductions.undertimeDeduction)}</td>
                                            </tr>
                                        )}
                                        <tr className="bg-white/[0.03] font-bold text-white">
                                            <td className="p-2">Total Deductions</td>
                                            <td className="p-2 text-right">₹{fmt(slip.deductions.total)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="mt-6 border border-white/10 bg-white/[0.03] rounded-xl p-4 flex justify-between items-center">
                            <div>
                                <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Net Pay (Take-Home)</div>
                                <div className="text-[10px] text-gray-500 italic mt-0.5">{amountInWords}</div>
                            </div>
                            <div className="text-2xl font-bold text-white">₹{fmt(slip.netSalary)}</div>
                        </div>
                    </div>

                    <div className="pt-10 space-y-8">
                        <div className="grid grid-cols-2 text-xs">
                            <div className="space-y-10">
                                <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider">Employee Signature</span>
                                <div>
                                    <div className="w-40 border-t border-white/15" />
                                    <div className="text-gray-400 mt-1.5">{employeeName}</div>
                                </div>
                            </div>
                            <div className="space-y-10 text-right flex flex-col items-end">
                                <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider">Authorised Signatory</span>
                                <div>
                                    <div className="font-mono text-[8px] text-gray-500 pb-1 pr-4">[Digitally Authenticated]</div>
                                    <div className="w-40 border-t border-white/15" />
                                    <div className="text-gray-400 mt-1.5">RecruitIQ HR Department</div>
                                </div>
                            </div>
                        </div>
                        <div className="text-center text-[8px] text-gray-500 pt-3 border-t border-white/8">
                            This is a system-generated salary statement and does not require a physical seal. | RecruitIQ Enterprise
                        </div>
                    </div>
                </div>
                </div>
            </div>
        </>
    );
}
