const API_BASE = "http://localhost:8080";

export async function createServer(name: string): Promise<void> {
  const response = await fetch(`${API_BASE}/servers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create server: ${response.statusText}`);
  }
}

export async function deleteServer(serverId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/servers/${serverId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete server: ${response.statusText}`);
  }
}
