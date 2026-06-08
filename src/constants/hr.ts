export const DEPARTMENTS = [
  "Engineering",
  "Human Resources",
  "Finance",
  "Marketing",
  "Sales",
  "Operations",
  "Legal",
  "Product",
  "Design",
  "Customer Support",
  "IT & Infrastructure",
  "Administration",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export const DESIGNATIONS: Record<string, readonly string[]> = {
  Engineering: [
    "Software Engineer",
    "Senior Software Engineer",
    "Lead Engineer",
    "Principal Engineer",
    "Engineering Manager",
    "DevOps Engineer",
    "QA Engineer",
    "Data Engineer",
    "ML Engineer",
  ],
  "Human Resources": [
    "HR Executive",
    "HR Manager",
    "HR Business Partner",
    "Talent Acquisition Specialist",
    "HR Director",
  ],
  Finance: [
    "Accountant",
    "Senior Accountant",
    "Finance Manager",
    "CFO",
    "Financial Analyst",
    "Payroll Specialist",
  ],
  Marketing: [
    "Marketing Executive",
    "Marketing Manager",
    "Content Strategist",
    "SEO Specialist",
    "Growth Manager",
    "CMO",
  ],
  Sales: [
    "Sales Executive",
    "Senior Sales Executive",
    "Sales Manager",
    "Business Development Manager",
    "VP Sales",
  ],
  Operations: [
    "Operations Executive",
    "Operations Manager",
    "Process Analyst",
    "COO",
  ],
  Legal: [
    "Legal Counsel",
    "Senior Legal Counsel",
    "Compliance Officer",
    "General Counsel",
  ],
  Product: [
    "Product Manager",
    "Senior Product Manager",
    "Associate Product Manager",
    "VP Product",
    "Chief Product Officer",
  ],
  Design: [
    "UI Designer",
    "UX Designer",
    "Product Designer",
    "Design Lead",
    "Creative Director",
  ],
  "Customer Support": [
    "Support Executive",
    "Senior Support Executive",
    "Support Lead",
    "Customer Success Manager",
  ],
  "IT & Infrastructure": [
    "IT Executive",
    "IT Manager",
    "System Administrator",
    "Network Engineer",
    "IT Director",
  ],
  Administration: [
    "Admin Executive",
    "Office Manager",
    "Executive Assistant",
    "Receptionist",
  ],
};

export const ALL_DESIGNATIONS = Object.values(DESIGNATIONS).flat();

export const EMPLOYMENT_TYPES = [
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERN", label: "Intern" },
] as const;

export type EmploymentTypeValue = (typeof EMPLOYMENT_TYPES)[number]["value"];
