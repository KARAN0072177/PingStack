import { useState } from "react";
import { Plus, Globe, Tag, Clock, ArrowRight } from "lucide-react";
import { createMonitor, type MonitorCreate } from "../api/monitors";

interface AddMonitorFormProps {
  onCreated: () => void;
}

function AddMonitorForm({ onCreated }: AddMonitorFormProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [interval, setInterval] = useState(60);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const presets = [10, 30, 60, 300];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const monitor: MonitorCreate = {
      name,
      url,
      interval,
      enabled: true,
    };

    try {
      await createMonitor(monitor);

      setName("");
      setUrl("");
      setInterval(60);
      setIsExpanded(false);

      onCreated();
    } catch (error) {
      console.error(error);
      setError("Failed to create monitor. Please verify the URL and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 to-zinc-900/50 p-6 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Add New Monitor
          </h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            Set up automatic health probes and latency tracking for your API or website
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-1.5 text-xs font-semibold text-zinc-200 transition-all hover:bg-zinc-700 hover:text-white"
        >
          <Plus className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-45" : ""}`} />
          <span>{isExpanded ? "Close" : "New Monitor"}</span>
        </button>
      </div>

      {isExpanded && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Monitor Name */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                <Tag className="h-3.5 w-3.5 text-emerald-400" />
                <span>Monitor Name</span>
              </label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Production API"
                required
                className="w-full rounded-xl border border-zinc-700/80 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Target URL */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                <Globe className="h-3.5 w-3.5 text-cyan-400" />
                <span>Endpoint URL</span>
              </label>
              <input
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://api.example.com/health"
                required
                className="w-full rounded-xl border border-zinc-700/80 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Check Interval and Presets */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-300">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span>Check Interval (seconds)</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                min="5"
                value={interval}
                onChange={(event) => setInterval(Number(event.target.value))}
                required
                className="w-32 rounded-xl border border-zinc-700/80 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />

              <div className="flex items-center gap-1.5">
                {presets.map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setInterval(sec)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                      interval === sec
                        ? "border border-emerald-700 bg-emerald-950/60 text-emerald-300"
                        : "border border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-red-800/40 bg-red-950/40 p-2.5 text-xs font-medium text-red-400">
              {error}
            </p>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-lg transition-all hover:bg-zinc-200 active:scale-95 disabled:opacity-50"
            >
              <span>{submitting ? "Adding..." : "Create Monitor"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="rounded-xl border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default AddMonitorForm;