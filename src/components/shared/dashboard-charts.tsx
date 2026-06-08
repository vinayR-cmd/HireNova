"use client";

import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid
} from "recharts";

interface ChartsProps {
  attendanceData: {
    present: number;
    absent: number;
    leave: number;
  };
  monthlyNetOutlay: number;
}

export function DashboardCharts({ attendanceData, monthlyNetOutlay }: ChartsProps) {
  // 1. Structure data for Today's Attendance Distribution Breakdown (Clean Google Tones)
  const pieData = [
    { name: "Present", value: attendanceData.present, color: "#111111" }, // Deep Matte Black
    { name: "Absent", value: attendanceData.absent, color: "#EA4335" },  // Google Red
    { name: "On Leave", value: attendanceData.leave, color: "#94A3B8" }, // Minimal Gray
  ];

  // 2. Structure chronological fiscal trend tracking data (Simulating trailing 6 months)
  const trendData = [
    { month: "Dec", Outlay: monthlyNetOutlay * 0.92 },
    { month: "Jan", Outlay: monthlyNetOutlay * 0.95 },
    { month: "Feb", Outlay: monthlyNetOutlay * 0.98 },
    { month: "Mar", Outlay: monthlyNetOutlay * 0.97 },
    { month: "Apr", Outlay: monthlyNetOutlay * 1.01 },
    { month: "May", Outlay: monthlyNetOutlay }, // Current Month Reference
  ];

  // Compact Indian Currency Formatter (Handles clean metric display e.g., ₹5L instead of ₹5,00,000)
  const formatIndianCurrency = (value: number) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(1)} Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)} L`;
    }
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="flex flex-col xl:flex-row w-full gap-6 bg-transparent min-w-0">

      {/* ================= CHART 1: ATTENDANCE SHARE DONUT ================= */}
      <div className="w-full xl:w-1/3 min-w-0 rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-white text-base tracking-tight mb-1">Attendance Share</h3>
          <p className="text-xs text-gray-500 font-normal mb-4">Visual ratio breakdown of today's active labor presence.</p>
        </div>

        <div className="w-full flex items-center justify-center relative min-w-0" style={{ height: 224 }}>
          <ResponsiveContainer width="100%" height={224} minWidth={0}>
            <PieChart>
              <Pie
                data={pieData.filter(d => d.value > 0)}
                cx="50%"
                cy="50%"
                innerRadius={68}
                outerRadius={84}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}
                itemStyle={{ color: "#111111", fontSize: "12px", fontWeight: "500" }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Central Summary Tally Counter Layout */}
          <div className="absolute flex flex-col text-center pointer-events-none">
            <span className="text-3xl font-semibold tracking-tight text-white">
              {attendanceData.present + attendanceData.absent + attendanceData.leave}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mt-0.5">Total Logged</span>
          </div>
        </div>

        {/* Dynamic Descriptive Chart Legend Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs mt-4 pt-4 border-t border-white/8">
          {pieData.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-gray-300 font-medium">{item.name} <span className="text-gray-500 font-normal">({item.value})</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* ================= CHART 2: PAYROLL TRAJECTORY BAR ================= */}
      <div className="w-full xl:w-2/3 min-w-0 rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-white text-base tracking-tight mb-1">Payroll Expenditure Trajectory</h3>
          <p className="text-xs text-gray-500 font-normal mb-4">Historical comparison view of net monthly settlement cycles.</p>
        </div>

        <div className="w-full mt-2 min-w-0" style={{ height: 224 }}>
          <ResponsiveContainer width="100%" height={224} minWidth={0}>
            <BarChart data={trendData} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f3f4f6" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "#9CA3AF", fontSize: 12, fontWeight: "500" }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "#9CA3AF", fontSize: 11, fontWeight: "500" }}
                tickFormatter={formatIndianCurrency}
              />
              <Tooltip 
                cursor={{ fill: "#f9fafb" }}
                formatter={(value) => [formatIndianCurrency(Number(value)), "Net Monthly Spend"]}
                contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", fontSize: "12px" }}
                itemStyle={{ fontWeight: "600" }}
              />
              <Bar 
                dataKey="Outlay" 
                fill="#111111" // Sleek Black matching Google reference button core style
                radius={[6, 6, 0, 0]} 
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}