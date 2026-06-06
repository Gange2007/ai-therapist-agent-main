"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

/**
 * Chat session UI route.
 *
 * IMPORTANT: UI pages must NOT live under `app/api/**`.
 */
export default function ChatSessionPage() {
  const params = useParams();
  const sessionId = params?.sessionId as string | undefined;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // If you already have a richer UI at `/therapy/[sessionId]`, you can redirect or
  // replace this with that implementation.
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold">Chat session</h1>
      <p className="text-muted-foreground mt-2">
        Session ID: <span className="font-mono">{sessionId ?? "(none)"}</span>
      </p>
      <p className="text-sm text-muted-foreground mt-4">
        UI implementation for chat sessions should live here. Your existing UI is
        currently in <span className="font-mono">/therapy/[sessionId]</span>.
      </p>
    </div>
  );
}

