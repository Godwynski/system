'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import type { TrendDataPoint } from '@/lib/actions/analytics';
import { cn } from '@/lib/utils';
import { ArrowUpRight } from 'lucide-react';

interface TrendChartProps {
  data: TrendDataPoint[];
  title: string;
  color?: string;
  href?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number; color?: string }[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border p-3 shadow-md rounded-lg text-left">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 font-mono">
          {label}
        </p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <p className="text-base font-bold text-foreground font-mono">
            {payload[0].value} <span className="text-xs font-normal text-muted-foreground font-sans">transactions</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function TrendChart({ data, title, href }: TrendChartProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const hasData = data && data.length > 0 && data.some(d => d.count > 0);
  const chartData = !hasData ? [
    { label: '', count: 0 }, { label: '', count: 0 }, { label: '', count: 0 },
    { label: '', count: 0 }, { label: '', count: 0 }, { label: '', count: 0 }
  ] : data;

  const content = (
    <div className={cn(
      "w-full h-[320px] sm:h-[360px] flex flex-col border border-border/70 rounded-xl p-5 bg-card relative overflow-hidden transition-all",
      href && "hover:border-foreground/30 group"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-0.5">
          <h3 className="text-sm sm:text-base font-semibold text-foreground">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground">
            Historical transaction volume across selected interval
          </p>
        </div>

        {href && (
          <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1">
            <span>View Ledger</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      
      <div className="flex-1 w-full min-h-0">
        {mounted && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="4 4" 
                vertical={false} 
                horizontal={true}
                stroke="hsl(var(--border) / 0.4)" 
              />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} 
                dy={8}
                interval="preserveStartEnd"
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} 
                domain={[0, 'auto']}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                fill="url(#trendGradient)"
                dot={hasData ? { r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 } : false}
                activeDot={hasData ? { r: 5, fill: 'hsl(var(--primary))', strokeWidth: 0 } : false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block w-full">{content}</Link>;
  }

  return content;
}

interface CategoryPieChartProps {
  data: { name: string; value: number }[];
  title: string;
}

const MONOCHROME_PALETTE = [
  'hsl(var(--primary))',
  'hsl(221 30% 35%)',
  'hsl(215 25% 45%)',
  'hsl(214 20% 60%)',
  'hsl(214 15% 75%)',
  'hsl(214 10% 85%)'
];

export function CategoryPieChart({ data, title }: CategoryPieChartProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const hasData = data && data.length > 0 && data.some(d => d.value > 0);
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="w-full h-full min-h-[320px] sm:min-h-[360px] flex flex-col border border-border/70 rounded-xl p-5 bg-card">
      <div className="space-y-0.5 mb-4">
        <h3 className="text-sm sm:text-base font-semibold text-foreground">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground">
          Classification breakdown across active collection
        </p>
      </div>

      <div className="flex-1 flex flex-col sm:flex-row items-center gap-6 min-h-0">
        <div className="w-full sm:w-1/2 h-[180px] sm:h-full relative flex items-center justify-center">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hasData ? data : [{ name: 'Empty', value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={hasData ? 3 : 0}
                  dataKey="value"
                  stroke="none"
                >
                  {hasData ? data.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={MONOCHROME_PALETTE[index % MONOCHROME_PALETTE.length]} 
                    />
                  )) : (
                    <Cell fill="hsl(var(--muted))" />
                  )}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
              Total
            </span>
            <span className="text-xl font-bold font-mono text-foreground">
              {hasData ? total : '0'}
            </span>
          </div>
        </div>

        {/* Breakdown List */}
        <div className="w-full sm:w-1/2 space-y-2 overflow-y-auto max-h-[160px] sm:max-h-[220px] pr-2 text-xs">
          {hasData ? (
            data.map((entry, index) => {
              const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
              return (
                <div key={entry.name} className="flex items-center justify-between gap-2 border-b border-border/30 pb-1.5">
                  <div className="flex items-center gap-2 truncate">
                    <span 
                      className="w-2 h-2 rounded-full shrink-0" 
                      style={{ backgroundColor: MONOCHROME_PALETTE[index % MONOCHROME_PALETTE.length] }} 
                    />
                    <span className="truncate text-foreground font-medium">{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-muted-foreground shrink-0">
                    <span>{entry.value}</span>
                    <span className="text-muted-foreground/60 w-8 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-xs text-muted-foreground py-4 text-center">
              No category distribution recorded
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PeakHoursBarChartProps {
  data: { hour: string; count: number }[];
  title: string;
}

const CustomBarTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border p-3 shadow-md rounded-lg text-left">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 font-mono">
          {label}
        </p>
        <p className="text-base font-bold text-foreground font-mono">
          {payload[0].value} <span className="text-xs font-normal text-muted-foreground font-sans">patrons recorded</span>
        </p>
      </div>
    );
  }
  return null;
};

export function PeakHoursBarChart({ data, title }: PeakHoursBarChartProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="w-full h-[320px] sm:h-[360px] flex flex-col border border-border/70 rounded-xl p-5 bg-card">
      <div className="space-y-0.5 mb-4 text-left">
        <h3 className="text-sm sm:text-base font-semibold text-foreground">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground">
          Hourly footfall distribution across open library desk hours (8:00 AM – 6:00 PM)
        </p>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        {mounted && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid 
                strokeDasharray="4 4" 
                vertical={false} 
                horizontal={true}
                stroke="hsl(var(--border) / 0.4)" 
              />
              <XAxis 
                dataKey="hour" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} 
                dy={8}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} 
                domain={[0, 'auto']}
                allowDecimals={false}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar 
                dataKey="count" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export function ChartSkeleton({ title: _title }: { title?: string } = {}) {
  return (
    <div className="w-full h-[320px] sm:h-[360px] flex flex-col border border-border/50 rounded-xl p-5 bg-card animate-pulse">
      <div className="space-y-2 mb-6 text-left">
        <div className="h-4 w-40 bg-muted/50 rounded" />
        <div className="h-3 w-64 bg-muted/30 rounded" />
      </div>
      <div className="flex-1 w-full bg-muted/20 rounded-lg" />
    </div>
  );
}
