export interface Monitor {
  _id: string;
  name: string;
  url: string;
  interval: number;
  enabled: boolean;
}

export interface MonitorCreate {
  name: string;
  url: string;
  interval: number;
  enabled: boolean;
}

const API_URL = "http://127.0.0.1:8000";

export async function getMonitors(): Promise<Monitor[]> {
  const response = await fetch(`${API_URL}/api/monitors`);

  if (!response.ok) {
    throw new Error("Failed to fetch monitors");
  }

  return response.json();
}

export async function createMonitor(
  monitor: MonitorCreate
): Promise<Monitor> {
  const response = await fetch(`${API_URL}/api/monitors`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(monitor),
  });

  if (!response.ok) {
    throw new Error("Failed to create monitor");
  }

  const data = await response.json();

  return data.monitor;
}