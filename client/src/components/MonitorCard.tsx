import { useState } from "react";
import {
  ExternalLink,
  Play,
  Pause,
  RefreshCw,
  Edit3,
  Trash2,
  Clock,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

import type {
  Monitor,
  MonitorCheckResult,
  HealthCheck,
  MonitorCreate,
} from "../api/monitors";

interface MonitorCardProps {
  monitor: Monitor;
  checkResult?: MonitorCheckResult;
  history: HealthCheck[];
  checking: boolean;
  onSelect: () => void;
  onCheck: () => void;
  onUpdate: (monitorId: string, data: Partial<MonitorCreate>) => Promise<void>;
  onDelete: (monitorId: string) => Promise<void>;
}

function MonitorCard({
  monitor,
  checkResult,
  history,
  checking,
  onSelect,
  onCheck,
  onUpdate,
  onDelete,
}: MonitorCardProps) {
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

  // Calculate 20 most recent checks for mini visual spark strip
  const recentPills = history.slice(0, 16).reverse();

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

  function handleCancelEdit() {
    setEditName(monitor.name);
    setEditUrl(monitor.url);
    setEditInterval(monitor.interval);
    setEditEnabled(monitor.enabled);
    setEditError("");
    setIsEditing(false);
  }

  async function handleToggleEnabled(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await onUpdate(monitor._id, { enabled: !monitor.enabled });
    } catch (err) {
      console.error("Failed to toggle monitor state", err);
    }
  }

  async function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await onDelete(monitor._id);
    } catch (err) {
      console.error("Failed to delete monitor", err);
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div
      onClick={() => {
        if (!isEditing) onSelect();
      }}
      className="group relative rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/90 hover:shadow-xl hover:shadow-black/40 cursor-pointer"
    >
      {isEditing ? (
        <form
          onSubmit={handleSaveEdit}
          onClick={(e) => e.stopPropagation()}
          className="space-y-4"
        >
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-base font-semibold text-white">
              Edit Monitor
            </h3>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-xs text-zinc-400 hover:text-white"
            >
              ✕ Cancel
            </button>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">
              Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">
              URL
            </label>
            <input
              type="url"
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              required
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">
                Interval (sec)
              </label>
              <input
                type="number"
                min="5"
                value={editInterval}
                onChange={(e) => setEditInterval(Number(e.target.value))}
                required
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">
                Auto-Monitoring
              </label>
              <label className="flex h-[38px] cursor-pointer items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white">
                <input
                  type="checkbox"
                  checked={editEnabled}
                  onChange={(e) => setEditEnabled(e.target.checked)}
                  className="rounded border-zinc-700 text-emerald-500"
                />
                <span className="text-xs text-zinc-300">
                  {editEnabled ? "Active" : "Paused"}
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
              className="rounded-xl bg-white px-4 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-xl border border-zinc-700 px-4 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {/* Card Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-lg font-bold text-white transition-colors group-hover:text-emerald-400">
                  {monitor.name}
                </h3>

                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    monitor.enabled
                      ? "border border-emerald-800/40 bg-emerald-950/60 text-emerald-400"
                      : "border border-zinc-700 bg-zinc-800/80 text-zinc-400"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      monitor.enabled
                        ? "animate-pulse bg-emerald-400"
                        : "bg-zinc-500"
                    }`}
                  />
                  {monitor.enabled ? "Active" : "Paused"}
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs text-zinc-400">
                <span className="truncate">{monitor.url}</span>
                <ExternalLink
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(monitor.url, "_blank");
                  }}
                  className="h-3 w-3 opacity-60 hover:opacity-100 hover:text-emerald-400"
                />
              </div>
            </div>

            {/* Quick Actions Menu */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1"
            >
              <button
                onClick={handleToggleEnabled}
                title={
                  monitor.enabled
                    ? "Pause auto-monitoring"
                    : "Resume auto-monitoring"
                }
                className={`rounded-lg p-1.5 text-xs font-medium transition-all ${
                  monitor.enabled
                    ? "border border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-amber-700/60 hover:bg-amber-950/30 hover:text-amber-300"
                    : "border border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-emerald-700/60 hover:bg-emerald-950/30 hover:text-emerald-300"
                }`}
              >
                {monitor.enabled ? (
                  <Pause className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditName(monitor.name);
                  setEditUrl(monitor.url);
                  setEditInterval(monitor.interval);
                  setEditEnabled(monitor.enabled);
                  setIsEditing(true);
                }}
                title="Edit monitor"
                className="rounded-lg border border-zinc-800 bg-zinc-950 p-1.5 text-zinc-400 transition-all hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={handleDeleteClick}
                disabled={deleting}
                title="Delete monitor"
                className={`rounded-lg border p-1.5 text-xs transition-all ${
                  confirmDelete
                    ? "border-red-600 bg-red-600 text-white"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-red-800/60 hover:bg-red-950/40 hover:text-red-300"
                }`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3">
            {/* Status */}
            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                Status
              </span>
              <div className="mt-0.5 flex items-center gap-1.5">
                {latestCheck?.status === "healthy" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : latestCheck?.status === "unhealthy" ? (
                  <XCircle className="h-3.5 w-3.5 text-red-400" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                )}
                <span
                  className={`text-xs font-semibold ${
                    latestCheck?.status === "healthy"
                      ? "text-emerald-400"
                      : latestCheck?.status === "unhealthy"
                      ? "text-red-400"
                      : "text-amber-400"
                  }`}
                >
                  {latestCheck ? latestCheck.status : "Pending"}
                </span>
              </div>
            </div>

            {/* Response Time */}
            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                Latency
              </span>
              <p className="mt-0.5 font-mono text-xs font-bold text-white">
                {latestCheck ? `${latestCheck.response_time_ms} ms` : "—"}
              </p>
            </div>

            {/* Interval */}
            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                Interval
              </span>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-zinc-300">
                <Clock className="h-3 w-3 text-zinc-500" />
                <span>{monitor.interval}s</span>
              </div>
            </div>
          </div>

          {/* Recent Checks Mini Sparkline Strip */}
          {recentPills.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span>Recent Check History</span>
                <span className="text-zinc-400">{history.length} total checks</span>
              </div>
              <div className="flex h-4 items-center gap-1 rounded-lg bg-zinc-950/80 px-2 py-1">
                {recentPills.map((p, i) => (
                  <div
                    key={`${p.checked_at}-${i}`}
                    title={`${p.status} - ${p.response_time_ms}ms at ${new Date(
                      p.checked_at
                    ).toLocaleTimeString()}`}
                    className={`h-2 flex-1 rounded-sm transition-all hover:scale-125 ${
                      p.status === "healthy"
                        ? "bg-emerald-400"
                        : p.status === "unhealthy"
                        ? "bg-red-400"
                        : "bg-amber-400"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Footer Action Row */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCheck();
              }}
              disabled={checking}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700/80 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-all hover:bg-zinc-700 hover:text-white disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3 w-3 ${checking ? "animate-spin" : ""}`}
              />
              <span>{checking ? "Checking..." : "Check Now"}</span>
            </button>

            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 transition-transform group-hover:translate-x-1">
              <span>View Graph & Analytics</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default MonitorCard;