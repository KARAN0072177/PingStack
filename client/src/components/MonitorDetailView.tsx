import { useState, useMemo } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Play,
  Pause,
  RefreshCw,
  Edit3,
  Trash2,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
} from "lucide-react";
import type {
  Monitor,
  MonitorCheckResult,
  HealthCheck,
  MonitorCreate,
} from "../api/monitors";
import ResponseTimeChart from "./ResponseTimeChart";

interface MonitorDetailViewProps {
  monitor: Monitor;
  checkResult?: MonitorCheckResult;
  history: HealthCheck[];
  checking: boolean;
  onBack: () => void;
  onCheck: () => void;
  onUpdate: (monitorId: string, data: Partial<MonitorCreate>) => Promise<void>;
  onDelete: (monitorId: string) => Promise<void>;
}

export default function MonitorDetailView({
  monitor,
  checkResult,
  history,
  checking,
  onBack,
  onCheck,
  onUpdate,
  onDelete,
}: MonitorDetailViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(monitor.name);
  const [editUrl, setEditUrl] = useState(monitor.url);
  const [editInterval, setEditInterval] = useState(monitor.interval);
  const [editEnabled, setEditEnabled] = useState(monitor.enabled);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editError, setEditError] = useState("");

  const latestCheck =
    checkResult ??
    (history.length > 0
      ? {
          monitor: monitor.name,
          status: history[0].status,
          status_code: history[0].status_code,
          response_time_ms: history[0].response_time_ms,
        }
      : undefined);

  // Calculate stats
  const { uptimePercent, avgResponseTime, minResponseTime, maxResponseTime } =
    useMemo(() => {
      if (!history.length) {
        return {
          uptimePercent: 100,
          avgResponseTime: 0,
          minResponseTime: 0,
          maxResponseTime: 0,
        };
      }

      const total = history.length;
      const healthy = history.filter((h) => h.status === "healthy").length;
      const uptime = ((healthy / total) * 100).toFixed(1);

      const times = history.map((h) => h.response_time_ms);
      const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      const min = Math.min(...times);
      const max = Math.max(...times);

      return {
        uptimePercent: Number(uptime),
        avgResponseTime: avg,
        minResponseTime: min,
        maxResponseTime: max,
      };
    }, [history]);

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    setEditError("");
    setSaving(true);
    try {
      await onUpdate(monitor._id, {
        name: editName,
        url: editUrl,
        interval: editInterval,
        enabled: editEnabled,
      });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setEditError("Failed to update monitor");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleEnabled() {
    try {
      await onUpdate(monitor._id, { enabled: !monitor.enabled });
    } catch (err) {
      console.error("Failed to toggle monitor state", err);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await onDelete(monitor._id);
      onBack();
    } catch (err) {
      console.error("Failed to delete monitor", err);
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Bar with Back Button and Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="group inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2 text-sm font-medium text-zinc-300 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to All Monitors</span>
        </button>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onCheck}
            disabled={checking}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black shadow-lg transition-all hover:bg-zinc-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${checking ? "animate-spin" : ""}`}
            />
            <span>{checking ? "Checking..." : "Check Now"}</span>
          </button>

          <button
            onClick={handleToggleEnabled}
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all ${
              monitor.enabled
                ? "border-amber-800/60 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40"
                : "border-emerald-800/60 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40"
            }`}
          >
            {monitor.enabled ? (
              <>
                <Pause className="h-4 w-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Resume</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setEditName(monitor.name);
              setEditUrl(monitor.url);
              setEditInterval(monitor.interval);
              setEditEnabled(monitor.enabled);
              setIsEditing(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
          >
            <Edit3 className="h-4 w-4" />
            <span>Edit</span>
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all ${
              confirmDelete
                ? "border-red-600 bg-red-600 text-white hover:bg-red-700"
                : "border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-red-800/60 hover:bg-red-950/40 hover:text-red-300"
            }`}
          >
            <Trash2 className="h-4 w-4" />
            <span>{deleting ? "Deleting..." : confirmDelete ? "Confirm Delete?" : "Delete"}</span>
          </button>
          {confirmDelete && (
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Monitor Header Info */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 to-zinc-900/40 p-6 backdrop-blur-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {monitor.name}
              </h1>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  monitor.enabled
                    ? "border border-emerald-800/60 bg-emerald-950/60 text-emerald-400"
                    : "border border-zinc-700 bg-zinc-800 text-zinc-400"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    monitor.enabled
                      ? "animate-pulse bg-emerald-400"
                      : "bg-zinc-500"
                  }`}
                />
                {monitor.enabled ? "Auto-Monitoring Active" : "Monitoring Paused"}
              </span>

              {latestCheck && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    latestCheck.status === "healthy"
                      ? "border border-emerald-800/50 bg-emerald-950/40 text-emerald-300"
                      : latestCheck.status === "unhealthy"
                      ? "border border-red-800/50 bg-red-950/40 text-red-300"
                      : "border border-amber-800/50 bg-amber-950/40 text-amber-300"
                  }`}
                >
                  {latestCheck.status === "healthy" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  ) : latestCheck.status === "unhealthy" ? (
                    <XCircle className="h-3.5 w-3.5 text-red-400" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  )}
                  {latestCheck.status.toUpperCase()}
                </span>
              )}
            </div>

            <a
              href={monitor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-emerald-400"
            >
              <span>{monitor.url}</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </a>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-xs text-zinc-400">
            <Clock className="h-4 w-4 text-zinc-500" />
            <span>Interval:</span>
            <span className="font-mono font-semibold text-white">
              {monitor.interval}s
            </span>
          </div>
        </div>
      </div>

      {/* Edit Form Modal/Drawer if editing */}
      {isEditing && (
        <div className="rounded-2xl border border-emerald-800/40 bg-zinc-900 p-6 shadow-2xl">
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-semibold text-white">
                Edit Monitor Settings
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                ✕ Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Monitor Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Target Endpoint URL
                </label>
                <input
                  type="url"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Check Interval (seconds)
                </label>
                <input
                  type="number"
                  min="5"
                  value={editInterval}
                  onChange={(e) => setEditInterval(Number(e.target.value))}
                  required
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Status
                </label>
                <label className="flex h-[42px] cursor-pointer items-center gap-2.5 rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm text-white">
                  <input
                    type="checkbox"
                    checked={editEnabled}
                    onChange={(e) => setEditEnabled(e.target.checked)}
                    className="rounded border-zinc-700 text-emerald-500 focus:ring-0"
                  />
                  <span className="text-xs text-zinc-300">
                    {editEnabled ? "Auto-Monitoring Active" : "Paused"}
                  </span>
                </label>
              </div>
            </div>

            {editError && (
              <p className="text-xs font-medium text-red-400">{editError}</p>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-white px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
              >
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4 Metric Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Status Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">
              Current State
            </span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span
              className={`text-xl font-bold ${
                latestCheck?.status === "healthy"
                  ? "text-emerald-400"
                  : latestCheck?.status === "unhealthy"
                  ? "text-red-400"
                  : latestCheck?.status === "unreachable"
                  ? "text-amber-400"
                  : "text-zinc-400"
              }`}
            >
              {latestCheck ? latestCheck.status.toUpperCase() : "Pending"}
            </span>
            <p className="mt-1 text-xs text-zinc-500">
              HTTP Code:{" "}
              <strong className="font-mono text-zinc-300">
                {latestCheck?.status_code ?? "N/A"}
              </strong>
            </p>
          </div>
        </div>

        {/* Avg Latency */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">
              Avg Response Time
            </span>
            <Clock className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-3">
            <span className="font-mono text-2xl font-bold text-white">
              {avgResponseTime}{" "}
              <span className="text-sm font-normal text-zinc-400">ms</span>
            </span>
            <p className="mt-1 text-xs text-zinc-500">
              Min: <span className="text-zinc-300">{minResponseTime}ms</span> •
              Max: <span className="text-zinc-300">{maxResponseTime}ms</span>
            </p>
          </div>
        </div>

        {/* Uptime % */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">
              Calculated Uptime
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span
              className={`font-mono text-2xl font-bold ${
                uptimePercent >= 99
                  ? "text-emerald-400"
                  : uptimePercent >= 90
                  ? "text-amber-400"
                  : "text-red-400"
              }`}
            >
              {uptimePercent}%
            </span>
            <p className="mt-1 text-xs text-zinc-500">
              Based on recorded checks
            </p>
          </div>
        </div>

        {/* Total Checks */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">
              Total Checks
            </span>
            <RefreshCw className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="mt-3">
            <span className="font-mono text-2xl font-bold text-white">
              {history.length}
            </span>
            <p className="mt-1 text-xs text-zinc-500">
              Auto-checking every {monitor.interval}s
            </p>
          </div>
        </div>
      </div>

      {/* Visual Chart Component */}
      <ResponseTimeChart history={history} interval={monitor.interval} />

      {/* Recent Checks Detailed History Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h3 className="text-base font-semibold text-white">
              Recent Check Logs
            </h3>
            <p className="mt-0.5 text-xs text-zinc-400">
              Chronological log of all recent health probe events
            </p>
          </div>
          <span className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-400">
            {history.length} records
          </span>
        </div>

        {history.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            No check logs recorded yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800/80 text-xs uppercase tracking-wider text-zinc-500">
                  <th className="pb-3 pl-2 font-medium">Status</th>
                  <th className="pb-3 font-medium">HTTP Code</th>
                  <th className="pb-3 font-medium">Response Time</th>
                  <th className="pb-3 font-medium">Latency Bar</th>
                  <th className="pb-3 pr-2 text-right font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 font-mono text-xs">
                {history.slice(0, 20).map((check, index) => {
                  const isHealthy = check.status === "healthy";
                  const isUnhealthy = check.status === "unhealthy";
                  const maxLatency = Math.max(maxResponseTime, 1000);
                  const barWidthPercent = Math.min(
                    Math.round((check.response_time_ms / maxLatency) * 100),
                    100
                  );

                  return (
                    <tr
                      key={`${check.checked_at}-${index}`}
                      className="transition-colors hover:bg-zinc-800/30"
                    >
                      <td className="py-3.5 pl-2 font-sans">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            isHealthy
                              ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                              : isUnhealthy
                              ? "bg-red-950/60 text-red-400 border border-red-800/50"
                              : "bg-amber-950/60 text-amber-400 border border-amber-800/50"
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
                          {check.status}
                        </span>
                      </td>

                      <td className="py-3.5 text-zinc-300">
                        {check.status_code ? (
                          <span className="rounded bg-zinc-950 px-2 py-1 text-zinc-200">
                            {check.status_code}
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>

                      <td className="py-3.5 font-bold text-white">
                        {check.response_time_ms}{" "}
                        <span className="text-[10px] font-normal text-zinc-500">
                          ms
                        </span>
                      </td>

                      <td className="py-3.5 w-40">
                        <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isHealthy
                                ? "bg-emerald-400"
                                : isUnhealthy
                                ? "bg-red-400"
                                : "bg-amber-400"
                            }`}
                            style={{ width: `${Math.max(barWidthPercent, 4)}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 pr-2 text-right text-zinc-400 font-sans">
                        {new Date(check.checked_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
