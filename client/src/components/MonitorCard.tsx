import { useState } from "react";
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
  onCheck: () => void;
  onUpdate: (monitorId: string, data: Partial<MonitorCreate>) => Promise<void>;
  onDelete: (monitorId: string) => Promise<void>;
}

function MonitorCard({
  monitor,
  checkResult,
  history,
  checking,
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

  async function handleToggleEnabled() {
    try {
      await onUpdate(monitor._id, { enabled: !monitor.enabled });
    } catch (err) {
      console.error("Failed to toggle monitor state", err);
    }
  }

  async function handleDeleteClick() {
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
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-all">
      {isEditing ? (
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Edit Monitor</h3>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-sm text-zinc-400 hover:text-white"
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
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
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
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">
                Check Interval (seconds)
              </label>
              <input
                type="number"
                min="5"
                value={editInterval}
                onChange={(e) => setEditInterval(Number(e.target.value))}
                required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">
                Monitoring Status
              </label>
              <label className="flex h-[38px] cursor-pointer items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={editEnabled}
                  onChange={(e) => setEditEnabled(e.target.checked)}
                  className="rounded border-zinc-700"
                />
                <span className="text-xs text-zinc-300">
                  {editEnabled ? "Active" : "Paused"}
                </span>
              </label>
            </div>
          </div>

          {editError && <p className="text-xs text-red-400">{editError}</p>}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-white px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-lg border border-zinc-700 px-4 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-lg font-semibold text-white">
                  {monitor.name}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    monitor.enabled
                      ? "border border-green-800/40 bg-green-950/60 text-green-400"
                      : "border border-zinc-700 bg-zinc-800 text-zinc-400"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      monitor.enabled ? "animate-pulse bg-green-400" : "bg-zinc-500"
                    }`}
                  />
                  {monitor.enabled ? "Active" : "Paused"}
                </span>
              </div>

              <p className="mt-1 break-all text-sm text-zinc-400">
                {monitor.url}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleToggleEnabled}
                title={monitor.enabled ? "Pause auto-monitoring" : "Resume auto-monitoring"}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  monitor.enabled
                    ? "border border-amber-800/60 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40"
                    : "border border-green-800/60 bg-green-950/30 text-green-300 hover:bg-green-900/40"
                }`}
              >
                {monitor.enabled ? "⏸ Pause" : "▶ Resume"}
              </button>

              <button
                onClick={() => {
                  setEditName(monitor.name);
                  setEditUrl(monitor.url);
                  setEditInterval(monitor.interval);
                  setEditEnabled(monitor.enabled);
                  setIsEditing(true);
                }}
                title="Edit monitor"
                className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-2.5 py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
              >
                ✏ Edit
              </button>

              <button
                onClick={handleDeleteClick}
                disabled={deleting}
                title="Delete monitor"
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                  confirmDelete
                    ? "border-red-600 bg-red-600 text-white hover:bg-red-700"
                    : "border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-red-800/60 hover:bg-red-950/40 hover:text-red-300"
                }`}
              >
                {deleting ? "Deleting..." : confirmDelete ? "Confirm Delete?" : "🗑 Delete"}
              </button>
              {confirmDelete && (
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
            <span>Check interval: {monitor.interval}s</span>
            <span>•</span>
            <span>
              Auto-checking:{" "}
              <strong className={monitor.enabled ? "font-normal text-green-400" : "font-normal text-zinc-400"}>
                {monitor.enabled ? `Every ${monitor.interval}s` : "Paused"}
              </strong>
            </span>
          </div>

          {latestCheck && (
            <div className="mt-5 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Status</span>
                <span
                  className={`text-sm font-medium ${
                    latestCheck.status === "healthy"
                      ? "text-green-400"
                      : latestCheck.status === "unhealthy"
                        ? "text-red-400"
                        : "text-yellow-400"
                  }`}
                >
                  {latestCheck.status}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-zinc-400">HTTP Status</span>
                <span className="text-sm">{latestCheck.status_code ?? "N/A"}</span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-zinc-400">Response Time</span>
                <span className="text-sm">{latestCheck.response_time_ms} ms</span>
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-medium text-zinc-300">Recent Checks</h3>

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

                    <span className="text-zinc-400">{check.response_time_ms} ms</span>

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
            className="mt-5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checking ? "Checking..." : "Check Now"}
          </button>
        </>
      )}
    </div>
  );
}

export default MonitorCard;