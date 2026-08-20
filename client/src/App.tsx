import { useEffect, useState } from "react";

import {
  getMonitors,
  type Monitor,
} from "./api/monitors";

import AddMonitorForm from "./components/AddMonitorForm";
import MonitorCard from "./components/MonitorCard";

function App() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadMonitors() {
    try {
      setLoading(true);
      setError("");

      const data = await getMonitors();

      setMonitors(data);
    } catch (error) {
      console.error(error);
      setError("Failed to load monitors");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMonitors();
  }, []);

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
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;