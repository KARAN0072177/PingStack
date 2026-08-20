import { useEffect, useState, useMemo } from "react";
import {
  Activity,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Sparkles,
} from "lucide-react";

import {
  checkMonitor,
  getMonitors,
  getMonitorHistory,
  updateMonitor,
  deleteMonitor,
  type MonitorCheckResult,
  type Monitor,
  type MonitorCreate,
  type HealthCheck,
} from "./api/monitors";

import AddMonitorForm from "./components/AddMonitorForm";
import MonitorCard from "./components/MonitorCard";
import MonitorDetailView from "./components/MonitorDetailView";

function App() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [selectedMonitorId, setSelectedMonitorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "paused" | "issues">("all");
  const [checking, setChecking] = useState<Record<string, boolean>>({});
  const [checkResults, setCheckResults] = useState<Record<string, MonitorCheckResult>>({});
  const [history, setHistory] = useState<Record<string, HealthCheck[]>>({});

  async function loadMonitors(isInitial = false) {
    try {
      if (isInitial) {
        setLoading(true);
      }
      setError("");

      const data = await getMonitors();
      setMonitors(data);

      const historyEntries = await Promise.all(
        data.map(async (monitor) => {
          const monitorHistory = await getMonitorHistory(monitor._id);
          return [monitor._id, monitorHistory] as const;
        })
      );

      setHistory(Object.fromEntries(historyEntries));
    } catch (err) {
      console.error(err);
      if (isInitial) {
        setError("Failed to connect to PingStack backend server");
      }
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    loadMonitors(true);

    const intervalId = setInterval(() => {
      loadMonitors(false);
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  async function handleCheck(monitorId: string) {
    setChecking((current) => ({
      ...current,
      [monitorId]: true,
    }));

    try {
      const result = await checkMonitor(monitorId);

      setCheckResults((current) => ({
        ...current,
        [monitorId]: result,
      }));

      const updatedHistory = await getMonitorHistory(monitorId);
      setHistory((current) => ({
        ...current,
        [monitorId]: updatedHistory,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setChecking((current) => ({
        ...current,
        [monitorId]: false,
      }));
    }
  }

  async function handleUpdate(
    monitorId: string,
    data: Partial<MonitorCreate>
  ) {
    const updated = await updateMonitor(monitorId, data);
    setMonitors((current) =>
      current.map((m) => (m._id === monitorId ? updated : m))
    );
  }

  async function handleDelete(monitorId: string) {
    await deleteMonitor(monitorId);
    if (selectedMonitorId === monitorId) {
      setSelectedMonitorId(null);
    }
    setMonitors((current) => current.filter((m) => m._id !== monitorId));
    setHistory((current) => {
      const copy = { ...current };
      delete copy[monitorId];
      return copy;
    });
    setCheckResults((current) => {
      const copy = { ...current };
      delete copy[monitorId];
      return copy;
    });
  }

  // Global summary statistics
  const globalStats = useMemo(() => {
    const total = monitors.length;
    const active = monitors.filter((m) => m.enabled).length;
    const paused = total - active;

    let totalLatency = 0;
    let latencyCount = 0;
    let issueCount = 0;

    monitors.forEach((m) => {
      const latest =
        checkResults[m._id] ??
        (history[m._id] && history[m._id].length > 0 ? history[m._id][0] : null);

      if (latest) {
        totalLatency += latest.response_time_ms;
        latencyCount += 1;
        if (latest.status !== "healthy") {
          issueCount += 1;
        }
      }
    });

    const avgLatency =
      latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0;

    return { total, active, paused, avgLatency, issueCount };
  }, [monitors, checkResults, history]);

  // Filtered monitors list
  const filteredMonitors = useMemo(() => {
    return monitors.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.url.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      const latest =
        checkResults[m._id] ??
        (history[m._id] && history[m._id].length > 0 ? history[m._id][0] : null);

      if (filterStatus === "active") return m.enabled;
      if (filterStatus === "paused") return !m.enabled;
      if (filterStatus === "issues") return latest && latest.status !== "healthy";

      return true;
    });
  }, [monitors, searchQuery, filterStatus, checkResults, history]);

  const selectedMonitor = useMemo(() => {
    return monitors.find((m) => m._id === selectedMonitorId);
  }, [monitors, selectedMonitorId]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div
            onClick={() => setSelectedMonitorId(null)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-black shadow-lg shadow-emerald-500/20 transition-transform group-hover:scale-105">
              <Activity className="h-5 w-5 stroke-[2.5]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-white">
                  PingStack
                </span>
                <span className="rounded-full border border-emerald-800/60 bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Uptime & Latency Monitoring
              </p>
            </div>
          </div>

          {/* Quick System Health Pill */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3.5 py-1.5 text-xs text-zinc-300">
              <span
                className={`h-2 w-2 rounded-full ${
                  globalStats.issueCount === 0 && globalStats.total > 0
                    ? "bg-emerald-400 animate-pulse"
                    : globalStats.issueCount > 0
                    ? "bg-red-400 animate-ping"
                    : "bg-zinc-500"
                }`}
              />
              <span>
                {globalStats.total === 0
                  ? "No Monitors"
                  : globalStats.issueCount === 0
                  ? "All Systems Operational"
                  : `${globalStats.issueCount} Issue Detected`}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {selectedMonitorId && selectedMonitor ? (
          /* Detailed Graph & Analytics View */
          <MonitorDetailView
            monitor={selectedMonitor}
            checkResult={checkResults[selectedMonitor._id]}
            history={history[selectedMonitor._id] ?? []}
            checking={checking[selectedMonitor._id] ?? false}
            onBack={() => setSelectedMonitorId(null)}
            onCheck={() => handleCheck(selectedMonitor._id)}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ) : (
          /* Main Dashboard & Monitors List */
          <div className="space-y-8 animate-fadeIn">
            {/* Overview Stats Bar */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
                  <Layers className="h-4 w-4 text-emerald-400" />
                  <span>Total Monitors</span>
                </div>
                <p className="mt-2 font-mono text-2xl font-bold text-white">
                  {globalStats.total}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Active Probes</span>
                </div>
                <p className="mt-2 font-mono text-2xl font-bold text-emerald-400">
                  {globalStats.active}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
                  <Clock className="h-4 w-4 text-cyan-400" />
                  <span>Avg Latency</span>
                </div>
                <p className="mt-2 font-mono text-2xl font-bold text-white">
                  {globalStats.avgLatency}{" "}
                  <span className="text-xs font-normal text-zinc-400">ms</span>
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                  <span>Active Incidents</span>
                </div>
                <p
                  className={`mt-2 font-mono text-2xl font-bold ${
                    globalStats.issueCount > 0
                      ? "text-red-400"
                      : "text-zinc-400"
                  }`}
                >
                  {globalStats.issueCount}
                </p>
              </div>
            </div>

            {/* Add Monitor Form Accordion */}
            <AddMonitorForm onCreated={() => loadMonitors(false)} />

            {/* Monitors Section */}
            <section className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Monitored Endpoints
                  </h2>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    Click any monitor card to inspect latency graphs and full check history
                  </p>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Search Box */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search monitors..."
                      className="w-48 rounded-xl border border-zinc-800 bg-zinc-900/90 pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none transition-colors focus:border-zinc-700"
                    />
                  </div>

                  {/* Filter Status Pills */}
                  <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/90 p-1 text-xs">
                    {(
                      [
                        { id: "all", label: "All" },
                        { id: "active", label: "Active" },
                        { id: "paused", label: "Paused" },
                        { id: "issues", label: "Issues" },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setFilterStatus(tab.id)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                          filterStatus === tab.id
                            ? "bg-zinc-800 text-white shadow-sm"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-8 text-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
                  <p className="mt-3 text-sm text-zinc-400">Loading monitors...</p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="rounded-2xl border border-red-800/40 bg-red-950/20 p-5 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && filteredMonitors.length === 0 && (
                <div className="flex h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-8 text-center">
                  <Sparkles className="h-8 w-8 text-zinc-600" />
                  <p className="mt-3 text-sm font-semibold text-zinc-300">
                    {searchQuery
                      ? "No monitors match your search filter"
                      : "No monitors created yet"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {searchQuery
                      ? "Try clearing your search query or status filter."
                      : "Click 'New Monitor' above to add your first API endpoint."}
                  </p>
                </div>
              )}

              {/* Monitors Grid */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredMonitors.map((monitor) => (
                  <MonitorCard
                    key={monitor._id}
                    monitor={monitor}
                    checkResult={checkResults[monitor._id]}
                    checking={checking[monitor._id] ?? false}
                    history={history[monitor._id] ?? []}
                    onSelect={() => setSelectedMonitorId(monitor._id)}
                    onCheck={() => handleCheck(monitor._id)}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;