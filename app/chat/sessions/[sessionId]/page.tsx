import { redirect } from "next/navigation";

export default function ChatSessionPage({
  params,
}: {
  params: { sessionId: string };
}) {
  // Use your existing working chat UI.
  // Prevents placeholder UI from showing (and avoids prompt/format mismatch).
  redirect(`/therapy/${params.sessionId}`);
}


