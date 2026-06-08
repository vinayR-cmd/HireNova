"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Users, UserPlus, Check, X, Search, Briefcase, DollarSign,
  Calendar, ChevronDown, MoreHorizontal, CreditCard,
  Building2, Hash, User, Phone,
} from "lucide-react";
import { DEPARTMENTS, DESIGNATIONS, EMPLOYMENT_TYPES } from "@/constants/hr";
import { apiFetch } from "@/lib/api-fetch";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmployeeRecord {
  _id: string;
  fullName: string;
  email: string;
  mobile: string;
  employeeId?: string;
  department?: string;
  designation?: string;
  employmentStatus?: string;
  employmentType?: string;
  grossSalary?: number;
  basicSalary?: number;
  hraEnabled?: boolean;
  hraAmount?: number;
  pfEnabled?: boolean;
  uanNumber?: string;
  panNumber?: string;
  joiningDate?: string;
  specialAllowance?: number;
  performancePay?: number;
  bonus?: number;
  incentive?: number;
  otherAllowances?: number;
  desiredDepartment?: string;
  desiredDesignation?: string;
}

// ─── Shared Dropdown ──────────────────────────────────────────────────────────

function CustomDropdown({
  value, onChange, options, placeholder = "Select",
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly (string | { value: string; label: string })[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const normalised = options.map(o =>
    typeof o === "string" ? { value: o, label: o } : (o as { value: string; label: string })
  );
  const selected = normalised.find(o => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm rounded-xl border border-white/10 bg-white/[0.03] text-gray-200 hover:bg-white/[0.06] focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all cursor-pointer"
      >
        <span className={selected ? "text-white" : "text-gray-500"}>{selected?.label ?? placeholder}</span>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`absolute left-0 right-0 mt-2 z-50 max-h-52 overflow-y-auto rounded-xl border border-white/10 bg-[#0D0F15]/90 backdrop-blur-md shadow-2xl p-1.5 space-y-0.5 transition-all duration-200 origin-top ${open ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}`}>
        {normalised.map(o => (
          <button
            key={o.value}
            type="button"
            onClick={() => { onChange(o.value); setOpen(false); }}
            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all cursor-pointer ${value === o.value ? "bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] text-white font-medium" : "text-gray-300 hover:bg-white/[0.07] hover:text-white"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${enabled ? "bg-emerald-500" : "bg-white/[0.07]"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-[#12141A] shadow transition-transform duration-200 ${enabled ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{children}</label>;
}

function TextInput({ value, onChange, placeholder, type = "text", required }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <input
      type={type}
      required={required}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
    />
  );
}

function NumberInput({ value, onChange, placeholder, min = 0 }: {
  value: number; onChange: (v: number) => void; placeholder?: string; min?: number;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-2.5 text-sm text-gray-500">₹</span>
      <input
        type="number"
        min={min}
        placeholder={placeholder}
        value={value || ""}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="block w-full rounded-xl border border-white/10 bg-white/[0.03] pl-7 pr-4 py-2.5 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
      />
    </div>
  );
}

// ─── Private Edit Drawer ──────────────────────────────────────────────────────

interface PrivateEditState {
  grossSalary: number;
  basicSalary: number;
  hraEnabled: boolean;
  hraAmount: number;
  pfEnabled: boolean;
  specialAllowance: number;
  performancePay: number;
  bonus: number;
  incentive: number;
  otherAllowances: number;
  department: string;
  designation: string;
  employmentType: string;
  employmentStatus: string;
  panNumber: string;
  uanNumber: string;
  joiningDate: string;
}

function PrivateEditPanel({
  emp,
  onClose,
  onSaved,
}: {
  emp: EmployeeRecord;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<PrivateEditState>({
    grossSalary: emp.grossSalary ?? 0,
    basicSalary: emp.basicSalary ?? 0,
    hraEnabled: emp.hraEnabled ?? false,
    hraAmount: emp.hraAmount ?? 0,
    pfEnabled: emp.pfEnabled ?? true,
    specialAllowance: emp.specialAllowance ?? 0,
    performancePay: emp.performancePay ?? 0,
    bonus: emp.bonus ?? 0,
    incentive: emp.incentive ?? 0,
    otherAllowances: emp.otherAllowances ?? 0,
    department: emp.department ?? "",
    designation: emp.designation ?? "",
    employmentType: emp.employmentType ?? "FULL_TIME",
    employmentStatus: emp.employmentStatus ?? "ACTIVE",
    panNumber: emp.panNumber ?? "",
    uanNumber: emp.uanNumber ?? "",
    joiningDate: emp.joiningDate ?? "",  // Already string from API
  });

  const set = <K extends keyof PrivateEditState>(key: K, val: PrivateEditState[K]) =>
    setFields(f => ({ ...f, [key]: val }));

  const availableDesignations = fields.department
    ? (DESIGNATIONS[fields.department] ?? [])
    : [];

  // Gross = sum of Basic + every allowance/component. Always computed, never typed.
  const computedGross =
    fields.basicSalary +
    (fields.hraEnabled ? fields.hraAmount : 0) +
    fields.specialAllowance +
    fields.performancePay +
    fields.bonus +
    fields.incentive +
    fields.otherAllowances;

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch(`/api/employees/${emp._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          grossSalary: computedGross, // always derived, never user-entered
          officialDepartment: fields.department,
          officialDesignation: fields.designation,
        }),
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const fmtINR = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/30 backdrop-blur-xs" onClick={onClose}>
      <div
        className="h-full w-full max-w-lg bg-[#12141A] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">Edit Private Details</h3>
            <p className="text-xs text-gray-500 mt-0.5">{emp.fullName} · {emp.employeeId}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-white/[0.05] transition-all cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Employment */}
          <div className="space-y-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><Briefcase className="h-3 w-3" /> Employment</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Department</FieldLabel>
                <CustomDropdown
                  value={fields.department}
                  onChange={v => { set("department", v); set("designation", ""); }}
                  options={DEPARTMENTS}
                  placeholder="Select dept"
                />
              </div>
              <div>
                <FieldLabel>Designation / Role</FieldLabel>
                <CustomDropdown
                  value={fields.designation}
                  onChange={v => set("designation", v)}
                  options={availableDesignations.length ? availableDesignations : [fields.designation].filter(Boolean)}
                  placeholder="Select role"
                />
              </div>
              <div>
                <FieldLabel>Employment Type</FieldLabel>
                <CustomDropdown
                  value={fields.employmentType}
                  onChange={v => set("employmentType", v)}
                  options={EMPLOYMENT_TYPES}
                />
              </div>
              <div>
                <FieldLabel>Status</FieldLabel>
                <CustomDropdown
                  value={fields.employmentStatus}
                  onChange={v => set("employmentStatus", v)}
                  options={[
                    { value: "ACTIVE", label: "Active" },
                    { value: "ON_LEAVE", label: "On Leave" },
                    { value: "SUSPENDED", label: "Suspended" },
                    { value: "TERMINATED", label: "Terminated" },
                  ]}
                />
              </div>
              <div className="col-span-2">
                <FieldLabel>Joining Date</FieldLabel>
                <TextInput type="date" value={fields.joiningDate} onChange={v => set("joiningDate", v)} />
              </div>
            </div>
          </div>

          {/* Identity */}
          <div className="space-y-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><Hash className="h-3 w-3" /> Identity</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>PAN Number</FieldLabel>
                <TextInput value={fields.panNumber} onChange={v => set("panNumber", v)} placeholder="ABCDE1234F" />
              </div>
              <div>
                <FieldLabel>UAN Number</FieldLabel>
                <TextInput value={fields.uanNumber} onChange={v => set("uanNumber", v)} placeholder="100XXXXXXXXX" />
              </div>
            </div>
          </div>

          {/* Core Salary */}
          <div className="space-y-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><DollarSign className="h-3 w-3" /> Core Salary</p>
            <div>
              <FieldLabel>Basic Salary (₹)</FieldLabel>
              <NumberInput value={fields.basicSalary} onChange={v => set("basicSalary", v)} placeholder="30000" />
              <p className="text-[10px] text-gray-500 mt-1.5">Gross is auto-computed from Basic + all components below.</p>
            </div>
          </div>

          {/* Allowances */}
          <div className="space-y-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><CreditCard className="h-3 w-3" /> Allowances & Variable Pay</p>
            {/* HRA */}
            <div className="rounded-xl border border-white/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-100">House Rent Allowance (HRA)</span>
                <Toggle enabled={fields.hraEnabled} onChange={v => set("hraEnabled", v)} />
              </div>
              {fields.hraEnabled && (
                <div>
                  <FieldLabel>HRA Amount (₹)</FieldLabel>
                  <NumberInput value={fields.hraAmount} onChange={v => set("hraAmount", v)} placeholder="15000" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Special Allowance (₹)</FieldLabel>
                <NumberInput value={fields.specialAllowance} onChange={v => set("specialAllowance", v)} />
              </div>
              <div>
                <FieldLabel>Performance Pay (₹)</FieldLabel>
                <NumberInput value={fields.performancePay} onChange={v => set("performancePay", v)} />
              </div>
              <div>
                <FieldLabel>Bonus (₹)</FieldLabel>
                <NumberInput value={fields.bonus} onChange={v => set("bonus", v)} />
              </div>
              <div>
                <FieldLabel>Incentive (₹)</FieldLabel>
                <NumberInput value={fields.incentive} onChange={v => set("incentive", v)} />
              </div>
              <div className="col-span-2">
                <FieldLabel>Other Allowances (₹)</FieldLabel>
                <NumberInput value={fields.otherAllowances} onChange={v => set("otherAllowances", v)} />
              </div>
            </div>

            {/* Auto-computed Gross display */}
            <div className="rounded-xl bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] text-white p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Monthly Gross (auto)</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Sum of basic + all enabled components</p>
              </div>
              <p className="text-xl font-semibold tracking-tight">{fmtINR(computedGross)}</p>
            </div>
          </div>

          {/* PF */}
          <div className="space-y-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><Building2 className="h-3 w-3" /> Deductions</p>
            <div className="rounded-xl border border-white/10 p-4 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-100">Provident Fund (PF)</span>
                <p className="text-xs text-gray-500 mt-0.5">Override global PF setting for this employee</p>
              </div>
              <Toggle enabled={fields.pfEnabled} onChange={v => set("pfEnabled", v)} />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/8 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose}
            className="rounded-full border border-white/10 bg-[#12141A] px-5 py-2 text-xs font-semibold text-gray-300 hover:bg-white/[0.03] transition-all cursor-pointer shadow-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleSave as unknown as React.MouseEventHandler}
            disabled={saving}
            className="rounded-full bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] hover:opacity-90 text-white px-5 py-2 text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WorkforceManagementPage() {
  const [activeTab, setActiveTab] = useState<"active" | "pending">("active");
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [pendingList, setPendingList] = useState<EmployeeRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Dept filter dropdown
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const deptDropdownRef = useRef<HTMLDivElement>(null);

  // Private edit drawer
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRecord | null>(null);

  // Approval/rejection modal
  const [selectedProfile, setSelectedProfile] = useState<EmployeeRecord | null>(null);
  const [modalAction, setModalAction] = useState<"APPROVE" | "REJECT" | null>(null);
  const [approvalData, setApprovalData] = useState({
    department: "",
    designation: "",
    employmentType: "FULL_TIME",
    grossSalary: "",
    basicSalary: "",
    joiningDate: "",
    panNumber: "",
    uanNumber: "",
  });
  const [rejectionReason, setRejectionReason] = useState("");

  const deptOptions = [
    { value: "", label: "All Departments" },
    ...DEPARTMENTS.map(d => ({ value: d, label: d })),
  ];

  // Close dept dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(e.target as Node))
        setIsDeptOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchActiveWorkforce = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (deptFilter) params.append("department", deptFilter);
      const res = await apiFetch(`/api/employees?${params}`);
      const payload = await res.json();
      if (res.ok) setEmployees(payload.records || []);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, deptFilter]);

  const fetchPendingQueue = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/employees/onboarding");
      const payload = await res.json();
      if (res.ok) setPendingList(payload.data || []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "active") fetchActiveWorkforce();
    else fetchPendingQueue();
  }, [activeTab, fetchActiveWorkforce, fetchPendingQueue]);

  const approvalDesignations = approvalData.department
    ? (DESIGNATIONS[approvalData.department] ?? [])
    : [];

  const handleActionExecution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;
    try {
      const basic = parseFloat(approvalData.basicSalary) || 0;
      const body =
        modalAction === "APPROVE"
          ? {
              action: "APPROVE",
              employeeProfileId: selectedProfile._id,
              department: approvalData.department,
              designation: approvalData.designation,
              employmentType: approvalData.employmentType,
              basicSalary: basic,
              // Gross starts equal to basic at activation. Admin can add HRA/special/etc.
              // later via the ⋯ private edit drawer; gross is auto-recomputed from there.
              grossSalary: basic,
              joiningDate: approvalData.joiningDate,
              panNumber: approvalData.panNumber,
              uanNumber: approvalData.uanNumber,
            }
          : {
              action: "REJECT",
              employeeProfileId: selectedProfile._id,
              reason: rejectionReason,
            };

      const res = await apiFetch("/api/employees/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSelectedProfile(null);
        setModalAction(null);
        setApprovalData({ department: "", designation: "", employmentType: "FULL_TIME", grossSalary: "", basicSalary: "", joiningDate: "", panNumber: "", uanNumber: "" });
        setRejectionReason("");
        fetchPendingQueue();
      } else {
        const err = await res.json();
        alert(err.error || "Action failed.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto text-white">

      {/* HEADER */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">Workforce Hub</h1>
        <p className="text-xs sm:text-sm text-gray-400">Govern corporate rosters, manage structures, and review entry configurations.</p>
      </div>

      {/* TABS */}
      <div className="flex border-b border-white/8 gap-8 text-sm font-medium">
        {([["active", "Active Workforce", Users, employees.length], ["pending", "Onboarding Pipeline", UserPlus, pendingList.length]] as const).map(([tab, label, Icon, count]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${activeTab === tab ? "border-white/25 text-white font-semibold" : "border-transparent text-gray-500 hover:text-white"}`}
          >
            <Icon className="h-4 w-4 stroke-[1.75]" /> {label}
            <span className="text-xs bg-white/[0.05] px-2 py-0.5 rounded-full font-normal text-gray-400 ml-1">{count}</span>
          </button>
        ))}
      </div>

      {/* FILTER BAR */}
      {activeTab === "active" && (
        <div className="flex flex-col gap-4 sm:flex-row relative z-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, ID, or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full text-sm rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder-gray-600 focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
            />
          </div>
          <div className="relative min-w-[220px]" ref={deptDropdownRef}>
            <button
              type="button"
              onClick={() => setIsDeptOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm rounded-xl border border-white/10 bg-white/[0.03] text-gray-200 hover:bg-white/[0.06] focus:border-white/25 focus:outline-none focus:ring-4 focus:ring-white/10 transition-all cursor-pointer"
            >
              <span className="truncate">{deptOptions.find(d => d.value === deptFilter)?.label ?? "All Departments"}</span>
              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-300 ${isDeptOpen ? "rotate-180" : ""}`} />
            </button>
            <div className={`absolute right-0 mt-2 w-full max-h-52 overflow-y-auto rounded-xl border border-white/10 bg-[#0D0F15]/90 backdrop-blur-md shadow-2xl p-1.5 space-y-0.5 transition-all duration-300 origin-top ${isDeptOpen ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}`}>
              {deptOptions.map(d => (
                <button key={d.value} type="button"
                  onClick={() => { setDeptFilter(d.value); setIsDeptOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all cursor-pointer ${deptFilter === d.value ? "bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] text-white font-medium" : "text-gray-300 hover:bg-white/[0.07] hover:text-white"}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="rounded-2xl border border-white/10 bg-[#12141A] overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.35)] relative z-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-white/[0.05] text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-white/10">
              {activeTab === "active" ? (
                <tr>
                  <th className="px-4 sm:px-6 py-4">Employee</th>
                  <th className="px-4 sm:px-6 py-4 hidden md:table-cell">Corporate ID</th>
                  <th className="px-4 sm:px-6 py-4 hidden sm:table-cell">Department</th>
                  <th className="px-4 sm:px-6 py-4 hidden lg:table-cell">Role</th>
                  <th className="px-4 sm:px-6 py-4 text-center hidden sm:table-cell">Status</th>
                  <th className="px-4 sm:px-6 py-4 text-center">HRA</th>
                  <th className="px-4 sm:px-6 py-4 text-center">Edit</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-4 sm:px-6 py-4">Applicant</th>
                  <th className="px-4 sm:px-6 py-4 hidden sm:table-cell">Contact</th>
                  <th className="px-4 sm:px-6 py-4 hidden sm:table-cell">Desired Placement</th>
                  <th className="px-4 sm:px-6 py-4 text-right">Actions</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y border-white/8">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-gray-500">Loading...</td>
                </tr>
              ) : activeTab === "active" ? (
                employees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-xs text-gray-500">No active employees found.</td>
                  </tr>
                ) : (
                  employees.map(emp => (
                    <ActiveRow
                      key={emp._id}
                      emp={emp}
                      onEditPrivate={() => setEditingEmployee(emp)}
                      onHraChange={fetchActiveWorkforce}
                    />
                  ))
                )
              ) : (
                pendingList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-xs text-gray-500">No pending applications.</td>
                  </tr>
                ) : (
                  pendingList.map(app => (
                    <tr key={app._id} className="hover:bg-white/[0.02] transition-colors duration-150">
                      <td className="px-4 sm:px-6 py-4">
                        <span className="font-medium block text-sm text-white">{app.fullName}</span>
                        <span className="text-xs text-gray-500">{app.email}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-xs text-gray-400 hidden sm:table-cell">{app.mobile}</td>
                      <td className="px-4 sm:px-6 py-4 text-xs hidden sm:table-cell">
                        <span className="font-medium text-gray-100">Dept: {app.desiredDepartment}</span>
                        <span className="block text-gray-500 mt-0.5">Role: {app.desiredDesignation}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => { setSelectedProfile(app); setModalAction("APPROVE"); }}
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 px-3 sm:px-4 py-1.5 hover:bg-emerald-500/15 shadow-xs transition-all cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Authorize</span>
                          </button>
                          <button onClick={() => { setSelectedProfile(app); setModalAction("REJECT"); }}
                            className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-400 px-3 sm:px-4 py-1.5 hover:bg-rose-500/15 shadow-xs transition-all cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Decline</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRIVATE EDIT DRAWER */}
      {editingEmployee && (
        <PrivateEditPanel
          emp={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSaved={fetchActiveWorkforce}
        />
      )}

      {/* APPROVAL / REJECTION MODAL */}
      {selectedProfile && modalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-white">
                {modalAction === "APPROVE" ? "Authorize Employee Activation" : "Decline Onboarding Request"}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {selectedProfile.fullName}
                {selectedProfile.desiredDepartment && ` · Desired: ${selectedProfile.desiredDepartment} / ${selectedProfile.desiredDesignation}`}
              </p>
            </div>

            <form onSubmit={handleActionExecution} className="space-y-4">
              {modalAction === "APPROVE" ? (
                <div className="space-y-4">

                  {/* Department + Designation */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel><span className="flex items-center gap-1"><Briefcase className="h-3 w-3 text-gray-500" /> Department</span></FieldLabel>
                      <CustomDropdown
                        value={approvalData.department}
                        onChange={v => setApprovalData(p => ({ ...p, department: v, designation: "" }))}
                        options={DEPARTMENTS}
                        placeholder="Select dept"
                      />
                    </div>
                    <div>
                      <FieldLabel><span className="flex items-center gap-1"><User className="h-3 w-3 text-gray-500" /> Role / Designation</span></FieldLabel>
                      <CustomDropdown
                        value={approvalData.designation}
                        onChange={v => setApprovalData(p => ({ ...p, designation: v }))}
                        options={approvalDesignations.length ? approvalDesignations : []}
                        placeholder={approvalData.department ? "Select role" : "Pick dept first"}
                      />
                    </div>
                  </div>

                  {/* Employment Type + Joining Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Employment Type</FieldLabel>
                      <CustomDropdown
                        value={approvalData.employmentType}
                        onChange={v => setApprovalData(p => ({ ...p, employmentType: v }))}
                        options={EMPLOYMENT_TYPES}
                      />
                    </div>
                    <div>
                      <FieldLabel><span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-gray-500" /> Joining Date</span></FieldLabel>
                      <TextInput type="date" required value={approvalData.joiningDate} onChange={v => setApprovalData(p => ({ ...p, joiningDate: v }))} />
                    </div>
                  </div>

                  {/* Basic Salary (gross is auto-computed once components are added) */}
                  <div>
                    <FieldLabel><span className="flex items-center gap-1"><DollarSign className="h-3 w-3 text-gray-500" /> Basic Salary (₹)</span></FieldLabel>
                    <input
                      type="number" required min="0" placeholder="e.g. 30000"
                      value={approvalData.basicSalary}
                      onChange={e => setApprovalData(p => ({ ...p, basicSalary: e.target.value }))}
                      className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
                    />
                    <p className="text-[10px] text-gray-500 mt-1.5">
                      Add HRA, allowances and other components after activation via the <span className="font-semibold">⋯ Edit</span> button. Gross will be auto-computed.
                    </p>
                  </div>

                  {/* PAN + UAN */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel><span className="flex items-center gap-1"><Hash className="h-3 w-3 text-gray-500" /> PAN Number</span></FieldLabel>
                      <TextInput value={approvalData.panNumber} onChange={v => setApprovalData(p => ({ ...p, panNumber: v }))} placeholder="ABCDE1234F" />
                    </div>
                    <div>
                      <FieldLabel><span className="flex items-center gap-1"><Phone className="h-3 w-3 text-gray-500" /> UAN Number</span></FieldLabel>
                      <TextInput value={approvalData.uanNumber} onChange={v => setApprovalData(p => ({ ...p, uanNumber: v }))} placeholder="100XXXXXXXXX" />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <FieldLabel>Reason for Rejection</FieldLabel>
                  <textarea
                    required rows={3}
                    placeholder="Provide clear administrative rationale to dispatch to applicant..."
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all resize-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/8">
                <button type="button"
                  onClick={() => { setSelectedProfile(null); setModalAction(null); }}
                  className="rounded-full border border-white/10 bg-[#12141A] px-5 py-2 text-xs font-semibold text-gray-300 hover:bg-white/[0.03] transition-all cursor-pointer shadow-xs"
                >
                  Cancel
                </button>
                <button type="submit"
                  className={`rounded-full px-5 py-2 text-xs font-semibold text-white shadow-sm transition-all cursor-pointer ${modalAction === "APPROVE" ? "bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] hover:opacity-90" : "bg-rose-600 hover:bg-rose-700"}`}
                >
                  {modalAction === "APPROVE" ? "Confirm Activation" : "Deny Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Active Row (extracted to keep main component lean) ───────────────────────

function ActiveRow({ emp, onEditPrivate, onHraChange }: {
  emp: EmployeeRecord;
  onEditPrivate: () => void;
  onHraChange: () => void;
}) {
  const [hraEnabled, setHraEnabled] = useState(emp.hraEnabled ?? false);
  const [hraAmount, setHraAmount] = useState(emp.hraAmount ?? 0);
  const [saving, setSaving] = useState(false);

  const saveHra = async (enabled: boolean, amount: number) => {
    setSaving(true);
    try {
      await apiFetch(`/api/employees/${emp._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hraEnabled: enabled, hraAmount: amount }),
      });
      onHraChange();
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="hover:bg-white/[0.02] transition-colors duration-150">
      <td className="px-4 sm:px-6 py-4">
        <div className="flex flex-col">
          <span className="font-medium text-sm text-white">{emp.fullName}</span>
          <span className="text-xs text-gray-500 mt-0.5">{emp.email}</span>
          <span className="text-xs text-gray-400 mt-0.5 sm:hidden">{emp.department || "Unassigned"}</span>
        </div>
      </td>
      <td className="px-4 sm:px-6 py-4 text-xs font-mono font-semibold text-white hidden md:table-cell">{emp.employeeId || "—"}</td>
      <td className="px-4 sm:px-6 py-4 text-xs text-gray-300 font-medium hidden sm:table-cell">{emp.department || "Unassigned"}</td>
      <td className="px-4 sm:px-6 py-4 text-xs text-gray-500 hidden lg:table-cell">{emp.designation || "Unassigned"}</td>
      <td className="px-4 sm:px-6 py-4 text-center hidden sm:table-cell">
        <span className="inline-flex items-center rounded-full bg-white/[0.05] text-gray-100 px-3 py-1 text-xs font-medium border border-white/8">
          {emp.employmentStatus}
        </span>
      </td>

      {/* HRA inline */}
      <td className="px-4 sm:px-6 py-4">
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => {
              const next = !hraEnabled;
              setHraEnabled(next);
              saveHra(next, hraAmount);
            }}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${hraEnabled ? "bg-emerald-500" : "bg-white/[0.07]"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-[#12141A] shadow transition-transform duration-200 ${hraEnabled ? "translate-x-4" : "translate-x-0"}`} />
          </button>
          {hraEnabled && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">₹</span>
              <input
                type="number" min="0"
                value={hraAmount}
                onChange={e => setHraAmount(parseFloat(e.target.value) || 0)}
                onBlur={() => saveHra(hraEnabled, hraAmount)}
                className="w-16 sm:w-20 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-white focus:border-white/25 focus:outline-none focus:ring-2 focus:ring-white/10"
                placeholder="0"
              />
              {saving && <span className="text-[10px] text-gray-500">...</span>}
            </div>
          )}
        </div>
      </td>

      {/* 3-dot edit */}
      <td className="px-4 sm:px-6 py-4 text-center">
        <button
          onClick={onEditPrivate}
          className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-white/10 bg-white/[0.03] text-gray-400 hover:bg-white/[0.05] hover:text-white transition-all cursor-pointer shadow-xs"
          title="Edit private details"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
