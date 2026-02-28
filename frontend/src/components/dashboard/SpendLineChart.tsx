"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import { formatDate } from "@/lib/format";

interface DataPoint {
  date: string;
  predictedSpend: number;
}

interface SpendLineChartProps {
  data: DataPoint[];
}

export function SpendLineChart({ data }: SpendLineChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    displayDate: formatDate(d.date),
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `$${v}`}
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickLine={false}
            width={40}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), "Predicted"]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.displayDate}
            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
          />
          <Line
            type="monotone"
            dataKey="predictedSpend"
            stroke="#0284c7"
            strokeWidth={2}
            dot={{ fill: "#0284c7", r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
