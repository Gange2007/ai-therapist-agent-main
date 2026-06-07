"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Loader2, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import {
  sendChatMessage,
  ChatMessage,
  getChatHistory,
  createChatSession,
  deleteChatSession,
  clearChatHistory,
} from "@/lib/api/chat";
import { SessionHistory } from "@/components/therapy/session-history";

const SUGGESTED_QUESTIONS = [
  { text: "How can I manage my anxiety better?" },
  { text: "I've been feeling overwhelmed lately" },
  { text: "Can we talk about improving sleep?" },
  { text: "I need help with work-life balance" },
];

const glowAnimation = {
  initial: { opacity: 0.5, scale: 1 },
  animate: {
    opacity: [0.5, 1, 0.5],
    scale: [1, 1.05, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: [0.42, 0, 0.58, 1] as any,
    },
  },
};

export default function TherapyPage() {
  const params = useParams();
  const sessionId = params.sessionId as string | undefined;

  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingSession, setIsDeletingSession] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const loadHistoryOrCreateSession = async () => {
      // If sessionId is "new" or doesn't exist, create a new session immediately
      if (!sessionId || sessionId === "new") {
        try {
          const newSession = await createChatSession();
          setCurrentSessionId(newSession.sessionId);
          setMessages([
            {
              role: "assistant",
              content: "Hello 👋 I'm here for you. How are you feeling today?",
              timestamp: new Date(),
            },
          ]);
        } catch (error) {
          console.error("Failed to create session:", error);
          setMessages([
            {
              role: "assistant",
              content: "Hello 👋 I'm here for you. How are you feeling today?",
              timestamp: new Date(),
            },
          ]);
        }
        return;
      }

      // Try to load history for existing session
      try {
        const history = await getChatHistory(sessionId);
        if (history && history.length > 0) {
          setMessages(history);
          setCurrentSessionId(sessionId);
          return;
        }

        // If no history exists, show welcome message
        setMessages([
          {
            role: "assistant",
            content: "Hello 👋 I'm here for you. How are you feeling today?",
            timestamp: new Date(),
          },
        ]);
        setCurrentSessionId(sessionId);
      } catch (error) {
        console.error("Failed to load chat history:", error);
        // If loading fails, create a new session
        try {
          const newSession = await createChatSession();
          setCurrentSessionId(newSession.sessionId);
          setMessages([
            {
              role: "assistant",
              content: "Hello 👋 I'm here for you. How are you feeling today?",
              timestamp: new Date(),
            },
          ]);
        } catch (createError) {
          console.error("Failed to create session:", createError);
          setMessages([
            {
              role: "assistant",
              content: "Hello 👋 I'm here for you. How are you feeling today?",
              timestamp: new Date(),
            },
          ]);
        }
      }
    };

    loadHistoryOrCreateSession();
  }, [sessionId]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  };

  useEffect(() => {
    if (!isTyping) scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const currentMessage = message.trim();
    if (!currentMessage || isTyping) return;

    setMessage("");
    setIsTyping(true);

    const userMessage: ChatMessage = {
      role: "user",
      content: currentMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const effectiveSessionId = currentSessionId || sessionId || "new";

      console.log("[handleSubmit] Sending message with effectiveSessionId:", effectiveSessionId);
      const response = await sendChatMessage(effectiveSessionId, currentMessage);

      // Update currentSessionId if a new session was created
      if (response.sessionId && response.sessionId !== effectiveSessionId) {
        console.log("[handleSubmit] Updating currentSessionId to:", response.sessionId);
        setCurrentSessionId(response.sessionId);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response?.response || "I'm here for you.",
          timestamp: new Date(),
          metadata: response?.metadata,
        },
      ]);
    } catch (err: any) {
      console.error("[handleSubmit] Error:", err);
      const errMsg = err?.message || "";
      const displayMsg = errMsg.includes("rate limit") || errMsg.includes("quota")
        ? "The AI service is temporarily busy due to high demand. Please wait a moment and try again."
        : errMsg.includes("unavailable")
          ? "The AI service is temporarily unavailable. Please try again in a few seconds."
          : "Sorry — I couldn't generate a response right now. Please try again.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: displayMsg,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestedQuestion = (text: string) => {
    setMessage(text);
  };

  const handleDeleteSession = async () => {
    if (!currentSessionId) return;

    setIsDeletingSession(true);
    try {
      await deleteChatSession(currentSessionId);
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Failed to delete session:", error);
      alert("Failed to delete session. Please try again.");
    } finally {
      setShowDeleteConfirm(false);
      setIsDeletingSession(false);
    }
  };

  const handleClearHistory = async () => {
    if (!currentSessionId) return;

    setIsClearingHistory(true);
    try {
      await clearChatHistory(currentSessionId);
      setMessages([
        {
          role: "assistant",
          content: "Hello 👋 I'm here for you. How are you feeling today?",
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Failed to clear history:", error);
      alert("Failed to clear chat history. Please try again.");
    } finally {
      setShowClearConfirm(false);
      setIsClearingHistory(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const newSession = await createChatSession();
      console.log("[handleNewChat] Created session:", newSession);
      const sessionId = newSession.sessionId || newSession._id;
      window.location.href = `/therapy/${sessionId}`;
    } catch (error) {
      console.error("Failed to create new session:", error);
      alert("Failed to create new session. Please try again.");
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="relative max-w-7xl mx-auto px-4">
      <div className="flex h-[calc(100vh-4rem)] mt-20 gap-4">
        {/* Main chat area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-background rounded-lg border">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold">AI Therapist</h2>
                <p className="text-sm text-muted-foreground">{messages.length} messages</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewChat}
              >
                New Chat
              </Button>
              {currentSessionId && currentSessionId !== "new" && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowClearConfirm(true)}
                    disabled={isClearingHistory}
                  >
                    Clear History
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-destructive hover:text-destructive"
                    disabled={isDeletingSession}
                  >
                    Delete Chat
                  </Button>
                </>
              )}
            </div>
          </div>

          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="max-w-2xl w-full space-y-8">
                <div className="text-center space-y-4">
                  <div className="relative inline-flex flex-col items-center">
                    <motion.div
                      className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"
                      initial="initial"
                      animate="animate"
                      variants={glowAnimation}
                    />
                    <div className="relative flex items-center gap-2 text-2xl font-semibold">
                      <div className="relative">
                        <Sparkles className="w-6 h-6 text-primary" />
                        <motion.div
                          className="absolute inset-0 text-primary"
                          initial="initial"
                          animate="animate"
                          variants={glowAnimation}
                        >
                          <Sparkles className="w-6 h-6" />
                        </motion.div>
                      </div>
                      <span className="bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent">
                        AI Therapist
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-2">How can I assist you today?</p>
                  </div>
                </div>

                <div className="grid gap-3 relative">
                  <motion.div
                    className="absolute -inset-4 bg-gradient-to-b from-primary/5 to-transparent blur-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  />
                  {SUGGESTED_QUESTIONS.map((q, index) => (
                    <motion.div
                      key={q.text}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.5 }}
                    >
                      <Button
                        variant="outline"
                        className="w-full h-auto py-4 px-6 text-left justify-start hover:bg-muted/50 hover:border-primary/50 transition-all duration-300"
                        onClick={() => handleSuggestedQuestion(q.text)}
                      >
                        {q.text}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full p-4">
                <div className="max-w-3xl mx-auto">
                  <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.timestamp.toISOString() + msg.role}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className={cn(
                          "px-2 py-4",
                          msg.role === "assistant" ? "bg-muted/20 rounded-lg" : "bg-background rounded-lg"
                        )}
                      >
                        <div className="flex gap-4">
                          <div className="w-8 h-8 shrink-0 mt-1">
                            {msg.role === "assistant" ? (
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
                                <Bot className="w-5 h-5" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                                <User className="w-5 h-5" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-medium text-sm">{msg.role === "assistant" ? "AI Therapist" : "You"}</p>
                              {msg.metadata?.technique && (
                                <Badge variant="secondary" className="text-xs">
                                  {msg.metadata.technique}
                                </Badge>
                              )}
                            </div>

                            <div className="prose prose-sm dark:prose-invert leading-relaxed">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>

                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="px-2 py-4"
                    >
                      <div className="flex gap-4 bg-muted/20 rounded-lg p-4">
                        <div className="w-8 h-8 shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </div>
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="font-medium text-sm">AI Therapist</p>
                          <p className="text-sm text-muted-foreground">Typing...</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="border-t bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/50 p-4">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-4 items-end relative">
              <div className="flex-1 relative group">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask me anything..."
                  className={cn(
                    "w-full resize-none rounded-2xl border bg-background",
                    "p-3 pr-12 min-h-[48px] max-h-[200px]",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50",
                    "transition-all duration-200",
                    "placeholder:text-muted-foreground/70",
                    (isTyping || !message.trim()) && "opacity-100"
                  )}
                  rows={1}
                  disabled={isTyping}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e as unknown as React.FormEvent);
                    }
                  }}
                />

                <Button
                  type="submit"
                  size="icon"
                  className={cn(
                    "absolute right-1.5 bottom-3.5 h-[36px] w-[36px]",
                    "rounded-xl transition-all duration-200",
                    "bg-primary hover:bg-primary/90",
                    "shadow-sm shadow-primary/20",
                    (isTyping || !message.trim()) && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={isTyping || !message.trim()}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(e as unknown as React.FormEvent);
                  }}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>

            <div className="mt-2 text-xs text-center text-muted-foreground">
              Press <kbd className="px-2 py-0.5 rounded bg-muted">Enter ↵</kbd> to send,
              <kbd className="px-2 py-0.5 rounded bg-muted ml-1">Shift + Enter</kbd> for new line
            </div>
          </div>
        </div>

        {/* Session history on the right (beside chat) */}
        <div className="w-80 hidden lg:block">
          <SessionHistory />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-lg p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-semibold mb-2">Delete Chat Session</h3>
              <p className="text-muted-foreground mb-4">
                Are you sure you want to delete this chat session? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteSession} disabled={isDeletingSession}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear History Confirmation Dialog */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-lg p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-semibold mb-2">Clear Chat History</h3>
              <p className="text-muted-foreground mb-4">
                Are you sure you want to clear all messages from this chat session? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowClearConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleClearHistory} disabled={isClearingHistory}>
                  Clear
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

