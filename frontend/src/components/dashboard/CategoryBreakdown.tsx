"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatCurrency } from "@/lib/format";
import { CATEGORY_COLORS } from "@/lib/constants";

interface CategoryItem {
  name: string;
  value: number;
  key: string;
}

interface CategoryBreakdownProps {
  data: CategoryItem[];
}

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  const colors = data.map((d) => CATEGORY_COLORS[d.key] || CATEGORY_COLORS.other);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={colors[index]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => formatCurrency(value)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
