import { useState } from "react";
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

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
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

      onCreated();
    } catch (error) {
      console.error(error);
      setError("Failed to create monitor");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-zinc-800 bg-zinc-900 p-6"
    >
      <h2 className="text-xl font-semibold">
        Add Monitor
      </h2>

      <div className="mt-5 space-y-4">
        <div>
          <label className="mb-2 block text-sm text-zinc-400">
            Name
          </label>

          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="GitHub API"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-400">
            URL
          </label>

          <input
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://api.github.com"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-400">
            Check interval (seconds)
          </label>

          <input
            type="number"
            min="10"
            value={interval}
            onChange={(event) =>
              setInterval(Number(event.target.value))
            }
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-white px-4 py-2 font-medium text-black disabled:opacity-50"
        >
          {submitting ? "Adding..." : "Add Monitor"}
        </button>
      </div>
    </form>
  );
}

export default AddMonitorForm;