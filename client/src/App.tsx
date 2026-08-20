import { useEffect, useState } from "react";

import {
  checkMonitor,
  getMonitors,
  getMonitorHistory,
  type MonitorCheckResult,
  type Monitor,
  type HealthCheck,
} from "./api/monitors";

import AddMonitorForm from "./components/AddMonitorForm";
import MonitorCard from "./components/MonitorCard";

function App() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
          const monitorHistory = await getMonitorHistory(
            monitor._id
          );

          return [monitor._id, monitorHistory] as const;
        })
      );

      setHistory(Object.fromEntries(historyEntries));
    } catch (error) {
      console.error(error);
      if (isInitial) {
        setError("Failed to load monitors");
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
    } catch (error) {
      console.error(error);
    } finally {
      setChecking((current) => ({
        ...current,
        [monitorId]: false,
      }));
    }
  }


  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold">
          PingStack
        </h1>

        <p className="mt-2 text-zinc-400">
          API Health & Uptime Monitoring
        </p>

        <div className="mt-10">
          <AddMonitorForm onCreated={loadMonitors} />
        </div>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            Monitors
          </h2>

          {loading && (
            <p className="mt-6 text-zinc-400">
              Loading monitors...
            </p>
          )}

          {error && (
            <p className="mt-6 text-red-400">
              {error}
            </p>
          )}

          {!loading && !error && monitors.length === 0 && (
            <p className="mt-6 text-zinc-400">
              No monitors found.
            </p>
          )}

          <div className="mt-6 grid gap-4">
            {monitors.map((monitor) => (
              <MonitorCard
                key={monitor._id}
                monitor={monitor}
                checkResult={checkResults[monitor._id]}
                checking={checking[monitor._id] ?? false}
                history={history[monitor._id] ?? []}
                onCheck={() => handleCheck(monitor._id)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;