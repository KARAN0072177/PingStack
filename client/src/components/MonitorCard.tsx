import type {
  Monitor,
  MonitorCheckResult,
  HealthCheck
} from "../api/monitors";

interface MonitorCardProps {
  monitor: Monitor;
  checkResult?: MonitorCheckResult;
  history: HealthCheck[];
  checking: boolean;
  onCheck: () => void;
}

function MonitorCard({
  monitor,
  checkResult,
  history,
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

      {history.length > 0 && (
  <div className="mt-5">
    <h3 className="text-sm font-medium text-zinc-300">
      Recent Checks
    </h3>

    <div className="mt-3 space-y-2">
      {history.slice(0, 5).map((check, index) => (
        <div
          key={`${check.checked_at}-${index}`}
          className="flex items-center justify-between rounded-lg bg-zinc-950 px-3 py-2 text-sm"
        >
          <span
            className={
              check.status === "healthy"
                ? "text-green-400"
                : check.status === "unhealthy"
                  ? "text-red-400"
                  : "text-yellow-400"
            }
          >
            ● {check.status}
          </span>

          <span className="text-zinc-400">
            {check.response_time_ms} ms
          </span>

          <span className="text-zinc-500">
            {new Date(check.checked_at).toLocaleTimeString()}
          </span>
        </div>
      ))}
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