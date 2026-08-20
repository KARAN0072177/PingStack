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

export interface MonitorCheckResult {
  monitor: string;
  status: "healthy" | "unhealthy" | "unreachable";
  status_code: number | null;
  response_time_ms: number;
}

export interface HealthCheck {
  status: "healthy" | "unhealthy" | "unreachable";
  status_code: number | null;
  response_time_ms: number;
  checked_at: string;
}

const API_URL = "http://127.0.0.1:8000";

// get all monitors

export async function getMonitors(): Promise<Monitor[]> {
  const response = await fetch(`${API_URL}/api/monitors`);

  if (!response.ok) {
    throw new Error("Failed to fetch monitors");
  }

  return response.json();
}

// create a new monitor

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

// check a specific monitor

export async function checkMonitor(
  monitorId: string
): Promise<MonitorCheckResult> {
  const response = await fetch(
    `${API_URL}/api/monitors/${monitorId}/check`
  );

  if (!response.ok) {
    throw new Error("Failed to check monitor");
  }

  return response.json();
}

// get a specific monitor's history

export async function getMonitorHistory(
  monitorId: string
): Promise<HealthCheck[]> {
  const response = await fetch(
    `${API_URL}/api/monitors/${monitorId}/history`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch monitor history");
  }

  return response.json();
}

// update an existing monitor

export async function updateMonitor(
  monitorId: string,
  data: Partial<MonitorCreate>
): Promise<Monitor> {
  const response = await fetch(`${API_URL}/api/monitors/${monitorId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update monitor");
  }

  const result = await response.json();
  return result.monitor;
}

// delete a monitor

export async function deleteMonitor(monitorId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/monitors/${monitorId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete monitor");
  }
}