export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    technique?: string;
    goal?: string;
    progress?: any;
    analysis?: any;
    currentGoal?: string;
    progressIndicators?: any[];
    emotionalState?: string;
    riskLevel?: number;
    themes?: string[];
    recommendedApproach?: string;
  };
};

// Simple Gemini-only chat: no DB/session storage.
export type ApiResponse = {
  message: string;
  reply: string;
};

export async function sendChatMessage(
  sessionId: string,
  message: string,
  history: { role: "user" | "model"; parts: { text: string }[] }[] = []
) {
  console.log("[sendChatMessage] Sending message:", message.slice(0, 60));

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, history }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const errorMsg = (err as any).error || (err as any).message || "Failed to send message";
    console.error("[sendChatMessage] Error response:", res.status, errorMsg);
    throw new Error(errorMsg);
  }

  const data = await res.json() as { reply: string };
  console.log("[sendChatMessage] Got reply, length:", data.reply?.length);

  return {
    sessionId,
    response: data.reply,
  };
}

// Simple session-based helpers (used by dashboard).
// Minimal implementation: fetches from our demo API.

export type ChatSessionSummary = {
  _id: string;
  title: string;
};

export async function getAllChatSessions(): Promise<ChatSessionSummary[]> {
  try {
    const res = await fetch("/api/chat/sessions", { method: "GET" });
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    // Basic shape validation
    return data
      .filter(
        (s) =>
          s &&
          typeof s === "object" &&
          typeof (s as any)._id === "string" &&
          typeof (s as any).title === "string"
      )
      .map((s) => ({ _id: (s as any)._id, title: (s as any).title }));
  } catch {
    return [];
  }
}

export async function createChatSession(): Promise<{ sessionId: string }> {
  try {
    const res = await fetch("/api/chat/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!res.ok) throw new Error("Failed to create session");
    const data = await res.json();
    return { sessionId: data._id || data.sessionId };
  } catch (error) {
    throw new Error("Failed to create chat session");
  }
}

export async function getChatHistory(sessionId: string): Promise<ChatMessage[]> {
  try {
    const res = await fetch(`/api/chat/sessions/${sessionId}/history`, {
      method: "GET",
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((msg: any) => ({
      role: msg.role || "assistant",
      content: msg.content || "",
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      metadata: msg.metadata,
    }));
  } catch {
    return [];
  }
}

export async function requestEscalation(
  sessionId: string,
  reason: string
): Promise<void> {
  const res = await fetch(`/api/chat/sessions/${sessionId}/escalate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to request escalation");
  }
}

export type SessionAnalyticsData = {
  messageCount: number;
  themes: string[];
  currentSentiment?: {
    sentiment: string;
    score: number;
  };
  currentRiskLevel?: {
    riskLevel: number;
  };
  requiresEscalation: boolean;
  escalationReason?: string;
  sentimentHistory: Array<{
    sentiment: string;
    score: number;
  }>;
};

export async function getSessionAnalytics(
  sessionId: string
): Promise<SessionAnalyticsData> {
  try {
    const res = await fetch(`/api/chat/sessions/${sessionId}/analytics`, {
      method: "GET",
    });

    if (!res.ok) {
      return {
        messageCount: 0,
        themes: [],
        requiresEscalation: false,
        sentimentHistory: [],
      };
    }

    const data = await res.json();
    return {
      messageCount: data.messageCount || 0,
      themes: data.themes || [],
      currentSentiment: data.currentSentiment,
      currentRiskLevel: data.currentRiskLevel,
      requiresEscalation: data.requiresEscalation || false,
      escalationReason: data.escalationReason,
      sentimentHistory: data.sentimentHistory || [],
    };
  } catch {
    return {
      messageCount: 0,
      themes: [],
      requiresEscalation: false,
      sentimentHistory: [],
    };
  }
}

