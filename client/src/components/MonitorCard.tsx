import type { Monitor } from "../api/monitors";

interface MonitorCardProps {
  monitor: Monitor;
}

function MonitorCard({ monitor }: MonitorCardProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {monitor.name}
        </h2>

        <span
          className={`text-sm ${
            monitor.enabled
              ? "text-green-400"
              : "text-zinc-500"
          }`}
        >
          {monitor.enabled ? "Enabled" : "Disabled"}
        </span>
      </div>

      <p className="mt-2 text-sm text-zinc-400 break-all">
        {monitor.url}
      </p>

      <p className="mt-4 text-sm text-zinc-500">
        Check interval: {monitor.interval}s
      </p>
    </div>
  );
}

export default MonitorCard;