"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/format";

export interface CategorySlice {
  categoryId: string;
  name: string;
  value: number;
  color: string;
}

export function CategoryDonutChart({
  data,
  onSliceClick,
}: {
  data: CategorySlice[];
  onSliceClick?: (categoryId: string) => void;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-[220px] flex-col items-center justify-center text-center text-sm text-muted">
        <p>No expenses in this period yet.</p>
      </div>
    );
  }

  return (
    <div className="relative h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="95%"
            paddingAngle={2}
            stroke="none"
            onClick={(entry: unknown) => {
              const slice = entry as { categoryId?: string };
              if (slice?.categoryId && onSliceClick) onSliceClick(slice.categoryId);
            }}
          >
            {data.map((slice) => (
              <Cell key={slice.categoryId} fill={slice.color} className="cursor-pointer" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [formatCurrency(value), name]}
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 13,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-muted">Total spent</span>
        <span className="text-lg font-semibold tabular">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
