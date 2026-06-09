/**
 * HireNova seed script — Indian-context test data.
 *
 * Usage:  pnpm seed         (uses MONGODB_URI from .env.local)
 *
 * What it does:
 *  1. Drops Employees, Payrolls, Attendance, LeaveRequests, Notifications, AuditLogs
 *  2. Drops Users EXCEPT those whose email is in ADMIN_EMAILS (preserves admin login)
 *  3. Seeds 15 employees across realistic Indian departments
 *  4. Seeds current-month attendance (mix of PRESENT / ABSENT / LEAVE)
 *  5. Seeds 2 previous months of RELEASED payroll
 *  6. Seeds a few pending leave requests
 *  7. Ensures Company settings exist with sensible defaults
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { addDays, startOfMonth, endOfMonth, getDaysInMonth, subMonths } from "date-fns";

import { User } from "../src/lib/models/User";
import { Employee } from "../src/lib/models/Employee";
import { Attendance } from "../src/lib/models/Attendance";
import { Payroll } from "../src/lib/models/Payroll";
import { LeaveRequest } from "../src/lib/models/LeaveRequest";
import { Notification } from "../src/lib/models/Notification";
import { AuditLog } from "../src/lib/models/AuditLog";
import { Company } from "../src/lib/models/Company";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("✗ MONGODB_URI not set. Add it to .env.local.");
  process.exit(1);
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

// ─── Sample data ────────────────────────────────────────────────────────────

interface SeedEmployee {
  fullName: string;
  email: string;
  mobile: string;
  department: string;
  designation: string;
  basicSalary: number;
  hraAmount: number;
  specialAllowance: number;
  performancePay: number;
  city: string;
  state: string;
  pan: string;
  uan: string;
  bank: string;
  ifsc: string;
}

const EMPLOYEES: SeedEmployee[] = [
  // Engineering (5)
  { fullName: "Arjun Sharma",     email: "arjun.sharma@hirenova.in",    mobile: "9876543210", department: "Engineering",        designation: "Senior Software Engineer", basicSalary: 60000, hraAmount: 24000, specialAllowance: 12000, performancePay: 8000,  city: "Bengaluru",  state: "Karnataka",      pan: "ABCPS1234A", uan: "100123456789", bank: "HDFC Bank",      ifsc: "HDFC0001234" },
  { fullName: "Priya Iyer",       email: "priya.iyer@hirenova.in",      mobile: "9876543211", department: "Engineering",        designation: "Software Engineer",        basicSalary: 45000, hraAmount: 18000, specialAllowance: 9000,  performancePay: 5000,  city: "Chennai",    state: "Tamil Nadu",     pan: "ABCPI1235B", uan: "100123456790", bank: "ICICI Bank",     ifsc: "ICIC0005678" },
  { fullName: "Rohan Mehta",      email: "rohan.mehta@hirenova.in",     mobile: "9876543212", department: "Engineering",        designation: "Lead Engineer",            basicSalary: 80000, hraAmount: 32000, specialAllowance: 16000, performancePay: 12000, city: "Pune",       state: "Maharashtra",    pan: "ABCPM1236C", uan: "100123456791", bank: "Axis Bank",      ifsc: "UTIB0009876" },
  { fullName: "Ananya Reddy",     email: "ananya.reddy@hirenova.in",    mobile: "9876543213", department: "Engineering",        designation: "DevOps Engineer",          basicSalary: 55000, hraAmount: 22000, specialAllowance: 11000, performancePay: 6000,  city: "Hyderabad",  state: "Telangana",      pan: "ABCPR1237D", uan: "100123456792", bank: "SBI",            ifsc: "SBIN0001122" },
  { fullName: "Karthik Nair",     email: "karthik.nair@hirenova.in",    mobile: "9876543214", department: "Engineering",        designation: "QA Engineer",              basicSalary: 40000, hraAmount: 16000, specialAllowance: 8000,  performancePay: 4000,  city: "Kochi",      state: "Kerala",         pan: "ABCPN1238E", uan: "100123456793", bank: "Federal Bank",   ifsc: "FDRL0003344" },

  // Human Resources (2)
  { fullName: "Neha Kapoor",      email: "neha.kapoor@hirenova.in",     mobile: "9876543215", department: "Human Resources",    designation: "HR Manager",               basicSalary: 50000, hraAmount: 20000, specialAllowance: 10000, performancePay: 5000,  city: "New Delhi",  state: "Delhi",          pan: "ABCPK1239F", uan: "100123456794", bank: "HDFC Bank",      ifsc: "HDFC0005566" },
  { fullName: "Vikram Singh",     email: "vikram.singh@hirenova.in",    mobile: "9876543216", department: "Human Resources",    designation: "HR Executive",             basicSalary: 32000, hraAmount: 12800, specialAllowance: 6400,  performancePay: 3000,  city: "Chandigarh", state: "Punjab",         pan: "ABCPS1240G", uan: "100123456795", bank: "PNB",            ifsc: "PUNB0007788" },

  // Finance (2)
  { fullName: "Divya Subramanian", email: "divya.s@hirenova.in",        mobile: "9876543217", department: "Finance",            designation: "Finance Manager",          basicSalary: 65000, hraAmount: 26000, specialAllowance: 13000, performancePay: 7000,  city: "Mumbai",     state: "Maharashtra",    pan: "ABCPS1241H", uan: "100123456796", bank: "ICICI Bank",     ifsc: "ICIC0009900" },
  { fullName: "Aditya Joshi",     email: "aditya.joshi@hirenova.in",    mobile: "9876543218", department: "Finance",            designation: "Accountant",               basicSalary: 35000, hraAmount: 14000, specialAllowance: 7000,  performancePay: 3500,  city: "Pune",       state: "Maharashtra",    pan: "ABCPJ1242I", uan: "100123456797", bank: "Kotak Bank",     ifsc: "KKBK0001122" },

  // Marketing (2)
  { fullName: "Sneha Patel",      email: "sneha.patel@hirenova.in",     mobile: "9876543219", department: "Marketing",          designation: "Marketing Manager",        basicSalary: 55000, hraAmount: 22000, specialAllowance: 11000, performancePay: 6000,  city: "Ahmedabad",  state: "Gujarat",        pan: "ABCPP1243J", uan: "100123456798", bank: "HDFC Bank",      ifsc: "HDFC0003344" },
  { fullName: "Rajesh Verma",     email: "rajesh.verma@hirenova.in",    mobile: "9876543220", department: "Marketing",          designation: "Content Strategist",       basicSalary: 38000, hraAmount: 15200, specialAllowance: 7600,  performancePay: 4000,  city: "Jaipur",     state: "Rajasthan",      pan: "ABCPV1244K", uan: "100123456799", bank: "BOB",            ifsc: "BARB0005566" },

  // Sales (2)
  { fullName: "Kavya Krishnan",   email: "kavya.k@hirenova.in",         mobile: "9876543221", department: "Sales",              designation: "Sales Manager",            basicSalary: 60000, hraAmount: 24000, specialAllowance: 12000, performancePay: 10000, city: "Bengaluru",  state: "Karnataka",      pan: "ABCPK1245L", uan: "100123456800", bank: "ICICI Bank",     ifsc: "ICIC0001122" },
  { fullName: "Sandeep Kumar",    email: "sandeep.kumar@hirenova.in",   mobile: "9876543222", department: "Sales",              designation: "Sales Executive",          basicSalary: 30000, hraAmount: 12000, specialAllowance: 6000,  performancePay: 8000,  city: "Lucknow",    state: "Uttar Pradesh",  pan: "ABCPK1246M", uan: "100123456801", bank: "SBI",            ifsc: "SBIN0007788" },

  // Product / Design (2)
  { fullName: "Meera Pillai",     email: "meera.pillai@hirenova.in",    mobile: "9876543223", department: "Product",            designation: "Product Manager",          basicSalary: 75000, hraAmount: 30000, specialAllowance: 15000, performancePay: 10000, city: "Bengaluru",  state: "Karnataka",      pan: "ABCPP1247N", uan: "100123456802", bank: "Axis Bank",      ifsc: "UTIB0001122" },
  { fullName: "Aniket Desai",     email: "aniket.desai@hirenova.in",    mobile: "9876543224", department: "Design",             designation: "Product Designer",         basicSalary: 50000, hraAmount: 20000, specialAllowance: 10000, performancePay: 5000,  city: "Mumbai",     state: "Maharashtra",    pan: "ABCPD1248O", uan: "100123456803", bank: "HDFC Bank",      ifsc: "HDFC0007788" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const r2 = (n: number) => parseFloat(n.toFixed(2));
const pad3 = (n: number) => String(n).padStart(3, "0");
const cityAddress = (city: string, state: string) => `${city}, ${state}, India`;

function pickAttendanceStatus(dayOfWeek: number): "PRESENT" | "ABSENT" | "LEAVE" | "HALF_DAY" | "HOLIDAY" {
  if (dayOfWeek === 0) return "HOLIDAY";                  // Sunday
  const roll = Math.random();
  if (roll < 0.78) return "PRESENT";
  if (roll < 0.88) return "LEAVE";
  if (roll < 0.95) return "HALF_DAY";
  return "ABSENT";
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("→ Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI!);
  console.log("✓ Connected");

  // 1. Wipe everything except admin users
  console.log("\n→ Wiping existing data (preserving admins listed in ADMIN_EMAILS)...");
  await Promise.all([
    Employee.deleteMany({}),
    Payroll.deleteMany({}),
    Attendance.deleteMany({}),
    LeaveRequest.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);
  // Users — keep only admin emails
  const userKeepFilter = ADMIN_EMAILS.length
    ? { email: { $nin: ADMIN_EMAILS } }
    : {};
  const deletedUsers = await User.deleteMany(userKeepFilter);
  console.log(`  • Cleared employees/payrolls/attendance/leaves/notifications/audit logs`);
  console.log(`  • Removed ${deletedUsers.deletedCount} non-admin user accounts`);
  if (ADMIN_EMAILS.length) console.log(`  • Preserved admins: ${ADMIN_EMAILS.join(", ")}`);

  // 2. Ensure company settings
  console.log("\n→ Ensuring company settings...");
  await Company.findOneAndUpdate(
    {},
    {
      name: "HireNova Technologies Pvt Ltd",
      email: "ops@hirenova.in",
      contactNumber: "+91 80 4567 8900",
      address: "Prestige Tech Park, Outer Ring Rd, Bengaluru, Karnataka 560103",
      gstNumber: "29AABCH1234C1Z5",
      overtimeMultiplier: 1.5,
      pfPercentage: 12,
      taxPercentage: 10,
      maxLeavesPerMonth: 2,
      pfEnabled: true,
      employerPfPercentage: 12,
      professionalTaxEnabled: true,
      professionalTaxAmount: 200,
      overtimeEnabled: true,
      overtimeRateType: "PER_HOUR",
      defaultOvertimeRate: 200,
      defaultWorkingDays: 26,
      basicSalaryPercentage: 40,
      hraEnabled: true,
      hraPercentage: 40,
      autoSalaryCalculation: true,
      workingHoursPolicy: {
        name: "Standard",
        officeStartTime: "09:30",
        officeEndTime: "18:30",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        weeklyOff: ["Sunday"],
        totalDailyHours: 9,
      },
    },
    { upsert: true, returnDocument: "after" }
  );
  console.log("  • Company settings ensured");

  // 3. Seed employees + linked user accounts
  console.log(`\n→ Seeding ${EMPLOYEES.length} employees...`);
  const defaultPasswordHash = await bcrypt.hash("Test@123", 12);
  const joiningDateBase = subMonths(new Date(), 8); // joined ~8 months ago

  const createdEmployees: Array<{ doc: typeof Employee.prototype; seed: SeedEmployee; empId: string }> = [];
  for (let i = 0; i < EMPLOYEES.length; i++) {
    const seed = EMPLOYEES[i];
    const empId = `EMP${pad3(i + 1)}`;
    const user = await User.create({
      email: seed.email.toLowerCase(),
      password: defaultPasswordHash,
      role: "EMPLOYEE",
      status: "ACTIVE",
    });

    const employee = await Employee.create({
      userId: user._id,
      fullName: seed.fullName,
      email: seed.email.toLowerCase(),
      mobile: seed.mobile,
      dateOfBirth: new Date(1990 + (i % 8), i % 12, (i * 3 % 28) + 1),
      gender: i % 2 === 0 ? "MALE" : "FEMALE",
      address: cityAddress(seed.city, seed.state),
      emergencyContact: {
        name: `Contact for ${seed.fullName.split(" ")[0]}`,
        phone: `98765${pad3(43300 + i)}`,
        relation: i % 2 === 0 ? "Spouse" : "Parent",
      },
      employeeId: empId,
      department: seed.department,
      designation: seed.designation,
      officialDepartment: seed.department,
      officialDesignation: seed.designation,
      joiningDate: joiningDateBase,
      employmentStatus: "ACTIVE",
      employmentType: "FULL_TIME",
      basicSalary: seed.basicSalary,
      grossSalary: seed.basicSalary + seed.hraAmount + seed.specialAllowance + seed.performancePay,
      hraEnabled: true,
      hraAmount: seed.hraAmount,
      pfEnabled: true,
      specialAllowance: seed.specialAllowance,
      performancePay: seed.performancePay,
      bonus: 0,
      incentive: 0,
      otherAllowances: 0,
      overtimeMultiplier: 1.5,
      panNumber: seed.pan,
      uanNumber: seed.uan,
      bankInfo: {
        accountHolderName: seed.fullName,
        bankName: seed.bank,
        accountNumber: `${5000_0000_0000 + i}`,
        ifscCode: seed.ifsc,
        branchName: `${seed.city} Main`,
      },
    });
    createdEmployees.push({ doc: employee, seed, empId });
  }
  console.log(`  ✓ ${createdEmployees.length} employees + user accounts created`);
  console.log(`    (default password for all: Test@123)`);

  // 4. Current-month attendance
  console.log("\n→ Seeding current-month attendance...");
  const today = new Date();
  const monthStart = startOfMonth(today);
  const daysSoFar = Math.min(today.getDate(), getDaysInMonth(today));
  let attendanceCount = 0;
  for (const { doc: emp } of createdEmployees) {
    for (let d = 0; d < daysSoFar; d++) {
      const date = addDays(monthStart, d);
      // Skip future dates
      if (date > today) continue;
      const status = pickAttendanceStatus(date.getDay());

      const checkInTime = new Date(date);
      checkInTime.setHours(9, 30 + Math.floor(Math.random() * 30), 0, 0);
      const checkOutTime = new Date(date);
      checkOutTime.setHours(18, 30 + Math.floor(Math.random() * 30), 0, 0);

      const isWorked = status === "PRESENT" || status === "HALF_DAY";
      await Attendance.create({
        employeeId: emp._id,
        date,
        ...(isWorked
          ? {
              checkIn: checkInTime,
              checkOut: checkOutTime,
              workHours: status === "HALF_DAY" ? 4.5 : 9,
              overtimeHours: status === "PRESENT" && Math.random() < 0.15 ? 2 : 0,
              undertimeHours: 0,
            }
          : { workHours: 0, overtimeHours: 0, undertimeHours: 0 }),
        status,
      });
      attendanceCount++;
    }
  }
  console.log(`  ✓ ${attendanceCount} attendance records for ${daysSoFar} day(s) this month`);

  // 5. Previous 2 months of RELEASED payroll
  console.log("\n→ Seeding 2 months of released payroll history...");
  let payrollCount = 0;
  for (let monthsAgo = 2; monthsAgo >= 1; monthsAgo--) {
    const reference = subMonths(today, monthsAgo);
    const month = reference.getMonth() + 1;
    const year = reference.getFullYear();

    for (const { doc: emp, seed } of createdEmployees) {
      const basic = seed.basicSalary;
      const hra = seed.hraAmount;
      const special = seed.specialAllowance;
      const performance = seed.performancePay;
      const otHours = Math.random() < 0.3 ? Math.floor(Math.random() * 8) + 2 : 0;
      const dailyRate = (basic + hra + special) / 26;
      const hourlyRate = dailyRate / 9;
      const overtimePay = r2(otHours * hourlyRate * 1.5);

      const gross = r2(basic + hra + special + performance + overtimePay);
      const pf = r2(basic * 0.12);
      const tax = r2(gross * 0.1);
      const professionalTax = 200;
      const totalDeductions = r2(pf + tax + professionalTax);
      const netSalary = Math.max(0, r2(gross - totalDeductions));

      const releaseDate = endOfMonth(reference);
      releaseDate.setDate(releaseDate.getDate() - 2); // ~28th of month

      await Payroll.create({
        employeeId: emp._id,
        month,
        year,
        status: "RELEASED",
        earnings: {
          basicSalary: basic,
          grossSalary: basic,
          hraAmount: hra,
          specialAllowance: special,
          performancePay: performance,
          bonus: 0,
          incentives: 0,
          otherAllowances: 0,
          overtimePay,
          adjustments: 0,
          total: gross,
        },
        deductions: {
          undertimeDeduction: 0,
          leaveDeduction: 0,
          tax,
          pf,
          professionalTax,
          otherDeductions: 0,
          total: totalDeductions,
        },
        netSalary,
        attendanceSummary: {
          totalWorkingDays: 26,
          presentDays: 22 + Math.floor(Math.random() * 3),
          absentDays: Math.floor(Math.random() * 2),
          leaveDays: Math.floor(Math.random() * 3),
          paidLeaveDays: 2,
          chargeableLeaveDays: 0,
          halfDays: Math.floor(Math.random() * 2),
          overtimeHours: otHours,
          undertimeHours: 0,
        },
        generatedAt: releaseDate,
        approvedAt: releaseDate,
        releasedAt: releaseDate,
      });
      payrollCount++;
    }
  }
  console.log(`  ✓ ${payrollCount} released payroll records (2 months × ${createdEmployees.length} employees)`);

  // 6. Pending leave requests (5 of them)
  console.log("\n→ Seeding pending leave requests...");
  const leaveTypes = ["SICK", "CASUAL", "EARNED", "CASUAL", "SICK"] as const;
  const reasons = [
    "Down with seasonal flu, need rest.",
    "Sister's wedding in hometown.",
    "Annual family vacation to Goa.",
    "Personal errand at the bank.",
    "Medical appointment for routine check-up.",
  ];
  const leaveTargets = createdEmployees.slice(0, 5);
  for (let i = 0; i < leaveTargets.length; i++) {
    const emp = leaveTargets[i].doc;
    const fromDate = addDays(today, 3 + i * 2);
    const days = (i % 3) + 1;
    const toDate = addDays(fromDate, days - 1);
    await LeaveRequest.create({
      employeeId: emp._id,
      leaveType: leaveTypes[i],
      fromDate,
      toDate,
      totalDays: days,
      reason: reasons[i],
      status: "PENDING",
    });
  }
  console.log(`  ✓ ${leaveTargets.length} pending leave requests`);

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✓ Seed complete");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  • Login as admin: any email in ADMIN_EMAILS`);
  console.log(`  • Login as employee: any of these emails with password "Test@123"`);
  EMPLOYEES.slice(0, 3).forEach(e => console.log(`      - ${e.email}`));
  console.log(`      - ...and ${EMPLOYEES.length - 3} more`);
  console.log();

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error("\n✗ Seed failed:", err);
  mongoose.disconnect();
  process.exit(1);
});
