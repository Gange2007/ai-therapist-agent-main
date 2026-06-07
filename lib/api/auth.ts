const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === "undefined") return { "Content-Type": "application/json" };
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export async function registerUser(name: string, email: string, password: string) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Registration failed");
  return data;
}

export async function loginUser(email: string, password: string) {
  console.log("[FRONTEND AUTH] loginUser called with email:", email);
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  console.log("[FRONTEND AUTH] Response status:", res.status);
  let data;
  try {
    data = await res.json();
  } catch (err) {
    const text = await res.text().catch(() => "<unreadable>");
    console.error('[FRONTEND AUTH] Failed to parse JSON from /api/auth/login. status:', res.status, 'text preview:', text.slice(0, 1024));
    throw new Error(`Server returned invalid response (status ${res.status}). Check server logs.`);
  }
  console.log("[FRONTEND AUTH] Response data:", data);
  if (!res.ok) throw new Error(data.message || "Login failed");
  console.log("[FRONTEND AUTH] Login successful, returning data");
  return data;
}

export async function logoutUser() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  await fetch("/api/auth/logout", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).catch(() => {});
  if (typeof window !== "undefined") localStorage.removeItem("token");
}

export async function getMe() {
  const res = await fetch("/api/auth/me", { headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to get user");
  return data;
}

export async function updateProfile(payload: { name?: string; email?: string; preferences?: any }) {
  const res = await fetch("/api/auth/update-profile", {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update profile");
  return data;
}

export async function forgotPassword(email: string) {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to send reset email");
  return data;
}

export async function resetPassword(token: string, password: string) {
  const res = await fetch(`/api/auth/reset-password/${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to reset password");
  return data;
}
