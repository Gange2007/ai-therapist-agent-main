const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === "undefined") return { "Content-Type": "application/json" };
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface ActivityEntry {
  type: string;
  name: string;
  description?: string;
  duration?: number;
  sessionId?: string;
}

export async function logActivity(data: ActivityEntry): Promise<{ success: boolean; data: any }> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new Error("Not authenticated");

  const res = await fetch("/api/activity", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || json.error || "Failed to log activity");
  return json;
}

export async function getActivities(params?: {
  limit?: number;
  page?: number;
  type?: string;
}): Promise<{ success: boolean; data: any[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.limit) query.append("limit", String(params.limit));
  if (params?.page) query.append("page", String(params.page));
  if (params?.type) query.append("type", params.type);

  const res = await fetch(`/api/activity?${query.toString()}`, { headers: getAuthHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to fetch activities");
  return json;
}

export async function getTodayActivities(): Promise<{ success: boolean; data: any[] }> {
  const res = await fetch("/api/activity/today", { headers: getAuthHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to fetch today's activities");
  return json;
}

export async function getWeekActivities(): Promise<{ success: boolean; data: any[] }> {
  const res = await fetch("/api/activity/week", { headers: getAuthHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to fetch week activities");
  return json;
}

export async function getActivityStats(days = 7): Promise<{ success: boolean; data: any }> {
  const res = await fetch(`/api/activity/stats?days=${days}`, { headers: getAuthHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to fetch activity stats");
  return json;
}

export async function updateActivity(
  id: string,
  data: { completed?: boolean; moodScore?: number; moodNote?: string; duration?: number }
): Promise<{ success: boolean; data: any }> {
  const res = await fetch(`/api/activity/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to update activity");
  return json;
}

export async function deleteActivity(id: string): Promise<void> {
  const res = await fetch(`/api/activity/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.message || "Failed to delete activity");
  }
}
