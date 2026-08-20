import type {
  Monitor,
  MonitorCheckResult,
} from "../api/monitors";

interface MonitorCardProps {
  monitor: Monitor;
  checkResult?: MonitorCheckResult;
  checking: boolean;
  onCheck: () => void;
}

function MonitorCard({
  monitor,
  checkResult,
  checking,
  onCheck,
}: MonitorCardProps) {
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

      <p className="mt-2 break-all text-sm text-zinc-400">
        {monitor.url}
      </p>

      <p className="mt-4 text-sm text-zinc-500">
        Check interval: {monitor.interval}s
      </p>

      {checkResult && (
        <div className="mt-5 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">
              Status
            </span>

            <span
              className={`text-sm font-medium ${
                checkResult.status === "healthy"
                  ? "text-green-400"
                  : checkResult.status === "unhealthy"
                    ? "text-red-400"
                    : "text-yellow-400"
              }`}
            >
              {checkResult.status}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-zinc-400">
              HTTP Status
            </span>

            <span className="text-sm">
              {checkResult.status_code ?? "N/A"}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-zinc-400">
              Response Time
            </span>

            <span className="text-sm">
              {checkResult.response_time_ms} ms
            </span>
          </div>
        </div>
      )}

      <button
        onClick={onCheck}
        disabled={checking}
        className="mt-5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        {checking ? "Checking..." : "Check Now"}
      </button>
    </div>
  );
}

export default MonitorCard;