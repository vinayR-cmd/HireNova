"use client";

import { useState, useEffect, useCallback } from "react";
import { Phone, MapPin, ShieldAlert, Landmark, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";

export default function EmployeeProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Profile data states matching secure database schemas
  const [form, setForm] = useState({
    mobile: "",
    address: "",
    emergencyContact: { name: "", phone: "", relation: "" },
    bankInfo: { accountHolderName: "", bankName: "", accountNumber: "", ifscCode: "", branchName: "" },
  });

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/employees/profile");
      if (res.ok) {
        const payload = await res.json();
        if (payload.data) {
          setForm({
            mobile: payload.data.mobile || "",
            address: payload.data.address || "",
            emergencyContact: {
              name: payload.data.emergencyContact?.name || "",
              phone: payload.data.emergencyContact?.phone || "",
              relation: payload.data.emergencyContact?.relation || "",
            },
            bankInfo: {
              accountHolderName: payload.data.bankInfo?.accountHolderName || "",
              bankName: payload.data.bankInfo?.bankName || "",
              accountNumber: payload.data.bankInfo?.accountNumber || "",
              ifscCode: payload.data.bankInfo?.ifscCode || "",
              branchName: payload.data.bankInfo?.branchName || "",
            },
          });
        }
      }
    } catch (err) {
      console.error("Failed loading profile file parameters:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await apiFetch("/api/employees/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed saving profile parameters.");

      setFeedback({ type: "success", text: "Your personal information records have been successfully saved." });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "An error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-24 text-xs font-normal text-gray-500">
        Loading personal registry configuration metrics...
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-4xl mx-auto text-white">
      
      {/* ================= STRUCTURAL MODULE HEADER ================= */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">Personal File Registry</h1>
        <p className="text-xs sm:text-sm text-gray-400 font-normal">Manage your contact points, emergency dependents data, and banking settlement details.</p>
      </div>

      {/* ================= DYNAMIC STATUS FEEDBACK NOTIFICATIONS ================= */}
      {feedback && (
        <div className={`rounded-xl p-4 text-xs font-medium flex items-center gap-2.5 border backdrop-blur-sm animate-in fade-in duration-200 ${
          feedback.type === "success" 
            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" 
            : "bg-red-500/10 text-red-300 border-red-500/20"
        }`}>
          {feedback.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />}
          <span>{feedback.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* ================= PANEL 1: PRIMARY CONTACT PARTICULARS ================= */}
        <div className="rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-5">
          <div className="flex items-center gap-2 font-semibold text-white text-base border-b border-white/8 pb-3">
            <Phone className="h-4 w-4 text-white stroke-[2]" />
            <h3 className="tracking-tight">Contact Particulars</h3>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Mobile Connection Number</label>
              <input
                type="text"
                required
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                placeholder="e.g. +91 98765 43210"
                className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-gray-500" /> Residential Address String
              </label>
              <input
                type="text"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="e.g. Sector 45, Gurugram, Haryana, 122003"
                className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
              />
            </div>
          </div>
        </div>

        {/* ================= PANEL 2: EMERGENCY CONTACT DEPENDENTS ================= */}
        <div className="rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-5">
          <div className="flex items-center gap-2 font-semibold text-white text-base border-b border-white/8 pb-3">
            <ShieldAlert className="h-4 w-4 text-white stroke-[2]" />
            <h3 className="tracking-tight">Emergency Dependent / Next of Kin</h3>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Full Legal Name</label>
              <input
                type="text"
                required
                value={form.emergencyContact.name}
                onChange={(e) => setForm({
                  ...form,
                  emergencyContact: { ...form.emergencyContact, name: e.target.value }
                })}
                placeholder="e.g. Ramesh Sharma"
                className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Telephone Number</label>
              <input
                type="text"
                required
                value={form.emergencyContact.phone}
                onChange={(e) => setForm({
                  ...form,
                  emergencyContact: { ...form.emergencyContact, phone: e.target.value }
                })}
                placeholder="e.g. +91 98111 22233"
                className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Relationship Context</label>
              <input
                type="text"
                required
                value={form.emergencyContact.relation}
                onChange={(e) => setForm({
                  ...form,
                  emergencyContact: { ...form.emergencyContact, relation: e.target.value }
                })}
                placeholder="e.g. Father, Spouse"
                className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
              />
            </div>
          </div>
        </div>

        {/* ================= PANEL 3: SALARY DISBURSAL BANK DETAILS ================= */}
        <div className="rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-5">
          <div className="flex items-center gap-2 font-semibold text-white text-base border-b border-white/8 pb-3">
            <Landmark className="h-4 w-4 text-white stroke-[2]" />
            <h3 className="tracking-tight">Salary Disbursal Bank Account</h3>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Account Holder Designation</label>
              <input
                type="text"
                required
                value={form.bankInfo.accountHolderName}
                onChange={(e) => setForm({
                  ...form,
                  bankInfo: { ...form.bankInfo, accountHolderName: e.target.value }
                })}
                placeholder="Must match official name"
                className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Institution / Bank Name</label>
              <input
                type="text"
                required
                value={form.bankInfo.bankName}
                onChange={(e) => setForm({
                  ...form,
                  bankInfo: { ...form.bankInfo, bankName: e.target.value }
                })}
                placeholder="e.g. HDFC Bank, SBI"
                className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Account Identifier Number</label>
              <input
                type="text"
                required
                value={form.bankInfo.accountNumber}
                onChange={(e) => setForm({
                  ...form,
                  bankInfo: { ...form.bankInfo, accountNumber: e.target.value }
                })}
                placeholder="e.g. 501002345678"
                className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">IFSC Index Code</label>
              <input
                type="text"
                required
                value={form.bankInfo.ifscCode}
                onChange={(e) => setForm({
                  ...form,
                  bankInfo: { ...form.bankInfo, ifscCode: e.target.value }
                })}
                placeholder="e.g. HDFC0000240"
                className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all font-mono uppercase"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Branch Location Name</label>
              <input
                type="text"
                required
                value={form.bankInfo.branchName}
                onChange={(e) => setForm({
                  ...form,
                  bankInfo: { ...form.bankInfo, branchName: e.target.value }
                })}
                placeholder="e.g. DLF CyberHub Branch, Gurugram"
                className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
              />
            </div>
          </div>
        </div>

        {/* ================= SUBMIT MUTATION TRIGGER ACTION ================= */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="
              bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] hover:opacity-90 text-white text-sm font-semibold px-6 py-3 rounded-full 
              shadow-sm transition-all duration-200 ease-out cursor-pointer flex items-center gap-2
              disabled:opacity-40 disabled:pointer-events-none
            "
          >
            <Save className="h-4 w-4 stroke-[2]" /> 
            {isSubmitting ? "Saving Records..." : "Save Profile Details"}
          </button>
        </div>
      </form>
    </div>
  );
}