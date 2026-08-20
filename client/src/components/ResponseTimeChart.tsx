import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { HealthCheck } from "../api/monitors";

interface ResponseTimeChartProps {
  history: HealthCheck[];
  interval: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      time: string;
      fullTime: string;
      response_time_ms: number;
      status: string;
      status_code: number | null;
    };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const isHealthy = data.status === "healthy";
  const isUnhealthy = data.status === "unhealthy";

  return (
    <div className="rounded-xl border border-zinc-700/80 bg-zinc-900/95 p-3.5 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-2">
        <span className="text-xs font-medium text-zinc-400">
          {data.fullTime}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
            isHealthy
              ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/60"
              : isUnhealthy
              ? "bg-red-950/80 text-red-400 border border-red-800/60"
              : "bg-amber-950/80 text-amber-400 border border-amber-800/60"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isHealthy
                ? "bg-emerald-400"
                : isUnhealthy
                ? "bg-red-400"
                : "bg-amber-400"
            }`}
          />
          {data.status}
        </span>
      </div>

      <div className="mt-2.5 space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="text-zinc-400">Response Time:</span>
          <span className="font-mono font-semibold text-white">
            {data.response_time_ms} ms
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-zinc-400">HTTP Status:</span>
          <span className="font-mono font-medium text-zinc-300">
            {data.status_code ?? "N/A"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ResponseTimeChart({
  history,
}: ResponseTimeChartProps) {
  const [viewCount, setViewCount] = useState<number>(30);

  // Format and reverse history so it's chronological (left to right)
  const chartData = useMemo(() => {
    const slice = history.slice(0, viewCount);
    return slice
      .map((item) => {
        const date = new Date(item.checked_at);
        return {
          time: date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          fullTime: date.toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          response_time_ms: item.response_time_ms,
          status: item.status,
          status_code: item.status_code,
        };
      })
      .reverse();
  }, [history, viewCount]);

  const stats = useMemo(() => {
    if (!chartData.length) return { avg: 0, min: 0, max: 0 };
    const times = chartData.map((d) => d.response_time_ms);
    const sum = times.reduce((a, b) => a + b, 0);
    return {
      avg: Math.round(sum / times.length),
      min: Math.min(...times),
      max: Math.max(...times),
    };
  }, [chartData]);

  if (!history || history.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-6 text-center">
        <div className="rounded-full bg-zinc-800/80 p-3 text-zinc-400">
          📊
        </div>
        <p className="mt-3 text-sm font-medium text-zinc-300">
          No check data available yet
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Data will appear automatically once checks are recorded.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 backdrop-blur-sm">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h3 className="text-base font-semibold text-white">
            Response Time History
          </h3>
          <p className="mt-0.5 text-xs text-zinc-400">
            Latency metrics across recent health checks
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
          {[
            { label: "Last 10", value: 10 },
            { label: "Last 30", value: 30 },
            { label: "Last 50", value: 50 },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setViewCount(btn.value)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                viewCount === btn.value
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Latency Quick Badges */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-3">
          <span className="text-[11px] font-medium text-zinc-400">
            Average Latency
          </span>
          <p className="mt-0.5 font-mono text-lg font-bold text-emerald-400">
            {stats.avg} <span className="text-xs text-zinc-400">ms</span>
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-3">
          <span className="text-[11px] font-medium text-zinc-400">
            Fastest Check
          </span>
          <p className="mt-0.5 font-mono text-lg font-bold text-cyan-400">
            {stats.min} <span className="text-xs text-zinc-400">ms</span>
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-3">
          <span className="text-[11px] font-medium text-zinc-400">
            Slowest Check
          </span>
          <p className="mt-0.5 font-mono text-lg font-bold text-amber-400">
            {stats.max} <span className="text-xs text-zinc-400">ms</span>
          </p>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="mt-6 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#27272a"
              vertical={false}
            />

            <XAxis
              dataKey="time"
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#27272a" }}
              tickMargin={10}
            />

            <YAxis
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#27272a" }}
              unit="ms"
              tickMargin={10}
            />

            <Tooltip content={<CustomTooltip />} />

            {stats.avg > 0 && (
              <ReferenceLine
                y={stats.avg}
                stroke="#06b6d4"
                strokeDasharray="4 4"
                label={{
                  value: `Avg ${stats.avg}ms`,
                  fill: "#06b6d4",
                  fontSize: 11,
                  position: "insideTopRight",
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="response_time_ms"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#latencyGradient)"
              activeDot={{
                r: 6,
                fill: "#10b981",
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
