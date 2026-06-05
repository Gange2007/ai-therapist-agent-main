"use client";

import { useState, useEffect } from "react";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  BarChart3, Brain, Heart, TrendingUp, TrendingDown,
  Minus, Calendar, MessageSquare, BookOpen, Smile, Activity
} from "lucide-react";
import { format, subDays } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MoodEntry {
  score: number;
  emotion: string;
  timestamp: string;
}

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  mood?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getMoodLabel(score: number): string {
  if (score <= 20) return "Very Low";
  if (score <= 40) return "Low";
  if (score <= 60) return "Neutral";
  if (score <= 80) return "Good";
  return "Great";
}

function getMoodEmoji(score: number): string {
  if (score <= 20) return "😔";
  if (score <= 40) return "😕";
  if (score <= 60) return "😊";
  if (score <= 80) return "😃";
  return "🤗";
}

function getMoodColor(score: number): string {
  if (score <= 30) return "text-red-500";
  if (score <= 50) return "text-orange-400";
  if (score <= 70) return "text-yellow-400";
  return "text-green-500";
}

function getBarColor(score: number): string {
  if (score <= 30) return "bg-red-400";
  if (score <= 50) return "bg-orange-400";
  if (score <= 70) return "bg-yellow-400";
  return "bg-green-400";
}

// ─── Simulated recent mood data when no real data exists ─────────────────────
function generatePlaceholderData(): MoodEntry[] {
  const moods = [45, 55, 40, 60, 70, 65, 75];
  return moods.map((score, i) => ({
    score,
    emotion: getMoodLabel(score),
    timestamp: subDays(new Date(), 6 - i).toISOString(),
  }));
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load journal from localStorage
      const rawJournal = localStorage.getItem("aura_journal_entries");
      if (rawJournal) setJournalEntries(JSON.parse(rawJournal));

      // Load mood from backend
      const token = localStorage.getItem("token");
      if (token) {
        const res = await fetch("/api/mood", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setMoodEntries(data);
          } else {
            setMoodEntries(generatePlaceholderData());
          }
        } else {
          setMoodEntries(generatePlaceholderData());
        }
      } else {
        setMoodEntries(generatePlaceholderData());
      }
    } catch {
      setMoodEntries(generatePlaceholderData());
    } finally {
      setIsLoading(false);
    }
  };

  // ── Derived stats ────────────────────────────────────────────────────────
  const last7 = moodEntries.slice(-7);
  const avgScore = last7.length
    ? Math.round(last7.reduce((s, e) => s + e.score, 0) / last7.length)
    : 0;
  const highestMood = last7.reduce((a, b) => (a.score > b.score ? a : b), last7[0] ?? { score: 0, emotion: "-" });
  const lowestMood = last7.reduce((a, b) => (a.score < b.score ? a : b), last7[0] ?? { score: 0, emotion: "-" });

  const trend =
    last7.length >= 2
      ? last7[last7.length - 1].score - last7[0].score
      : 0;

  const TrendIcon = trend > 5 ? TrendingUp : trend < -5 ? TrendingDown : Minus;
  const trendColor = trend > 5 ? "text-green-500" : trend < -5 ? "text-red-500" : "text-yellow-500";
  const trendLabel = trend > 5 ? "Improving" : trend < -5 ? "Declining" : "Stable";

  // Most common emotion
  const emotionCounts: Record<string, number> = {};
  last7.forEach((e) => {
    emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
  });
  const dominantEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  // Journal tag frequency
  const tagCounts: Record<string, number> = {};
  journalEntries.forEach((e) =>
    e.tags.forEach((t) => { tagCounts[t] = (tagCounts[t] || 0) + 1; })
  );
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Insight messages
  const insights: { icon: any; color: string; bg: string; title: string; body: string }[] = [];

  if (avgScore >= 70) {
    insights.push({ icon: Heart, color: "text-green-500", bg: "bg-green-500/10", title: "Strong Week", body: "Your average mood this week is high. Keep up whatever is working for you!" });
  } else if (avgScore <= 40) {
    insights.push({ icon: Brain, color: "text-orange-500", bg: "bg-orange-500/10", title: "Difficult Period", body: "Your mood has been lower this week. Consider speaking to someone you trust, or trying a breathing exercise." });
  }

  if (trend > 10) {
    insights.push({ icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10", title: "Mood Improving", body: "Your mood has been trending upward this week. Something positive is having an effect." });
  } else if (trend < -10) {
    insights.push({ icon: TrendingDown, color: "text-red-500", bg: "bg-red-500/10", title: "Mood Declining", body: "Your mood has dipped over the past week. It may help to talk to someone or revisit the Resources section." });
  }

  if (journalEntries.length >= 3) {
    insights.push({ icon: BookOpen, color: "text-amber-500", bg: "bg-amber-500/10", title: "Consistent Journalling", body: `You have ${journalEntries.length} journal entries. Writing regularly is linked to reduced stress and better self-awareness.` });
  }

  if (insights.length === 0) {
    insights.push({ icon: Activity, color: "text-primary", bg: "bg-primary/10", title: "Keep Tracking", body: "Track your mood daily to unlock personalised insights about your mental wellness patterns." });
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Container className="pt-24 pb-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Reports & Insights</h1>
            <p className="text-sm text-muted-foreground">Your mental wellness overview</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "7-Day Avg Mood",
              value: `${avgScore}/100`,
              sub: getMoodLabel(avgScore),
              icon: Smile,
              color: getMoodColor(avgScore),
              bg: "bg-primary/10",
            },
            {
              label: "Mood Trend",
              value: trendLabel,
              sub: `${trend > 0 ? "+" : ""}${trend} pts`,
              icon: TrendIcon,
              color: trendColor,
              bg: "bg-muted",
            },
            {
              label: "Journal Entries",
              value: journalEntries.length.toString(),
              sub: "Total written",
              icon: BookOpen,
              color: "text-amber-500",
              bg: "bg-amber-500/10",
            },
            {
              label: "Dominant Mood",
              value: getMoodEmoji(avgScore),
              sub: dominantEmotion,
              icon: Heart,
              color: "text-rose-500",
              bg: "bg-rose-500/10",
            },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card>
                <CardContent className="p-4">
                  <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold mt-0.5">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mood Bar Chart */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="w-4 h-4 text-primary" /> 7-Day Mood Overview
                </CardTitle>
                <CardDescription>Your mood score for each tracked entry this week</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Loading...</div>
                ) : last7.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                    No mood data yet. Track your mood daily to see your report.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {last7.map((entry, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-16 shrink-0">
                          {format(new Date(entry.timestamp), "EEE, d MMM")}
                        </span>
                        <div className="flex-1 h-7 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${getBarColor(entry.score)} flex items-center justify-end pr-2`}
                            initial={{ width: 0 }}
                            animate={{ width: `${entry.score}%` }}
                            transition={{ delay: i * 0.08, duration: 0.5 }}
                          >
                            <span className="text-xs font-bold text-white">{entry.score}</span>
                          </motion.div>
                        </div>
                        <span className="text-base w-6">{getMoodEmoji(entry.score)}</span>
                      </div>
                    ))}
                    {/* Scale */}
                    <div className="flex justify-between px-[4.5rem] mt-1">
                      {[0, 25, 50, 75, 100].map((v) => (
                        <span key={v} className="text-[10px] text-muted-foreground">{v}</span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Personalised Insights */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Brain className="w-4 h-4 text-primary" /> Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {insights.map((ins, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-3 rounded-lg ${ins.bg}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <ins.icon className={`w-4 h-4 ${ins.color}`} />
                      <p className="text-sm font-semibold">{ins.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{ins.body}</p>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Top Journal Tags */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="w-4 h-4 text-amber-500" /> Journal Themes
                </CardTitle>
                <CardDescription className="text-xs">Most used tags in your journal</CardDescription>
              </CardHeader>
              <CardContent>
                {topTags.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No journal tags yet. Add tags when writing entries to track themes.</p>
                ) : (
                  <div className="space-y-2">
                    {topTags.map(([tag, count]) => (
                      <div key={tag} className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{tag}</Badge>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: `${(count / (topTags[0][1] || 1)) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{count}×</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="w-4 h-4 text-primary" /> This Week
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: "Mood entries tracked", value: last7.length, icon: Smile, color: "text-primary" },
                  { label: "Journal entries", value: journalEntries.filter(e => new Date(e.createdAt) >= subDays(new Date(), 7)).length, icon: BookOpen, color: "text-amber-500" },
                  { label: "Peak mood", value: highestMood.score ? `${highestMood.score}/100` : "—", icon: TrendingUp, color: "text-green-500" },
                  { label: "Lowest mood", value: lowestMood.score ? `${lowestMood.score}/100` : "—", icon: TrendingDown, color: "text-red-400" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                    </div>
                    <span className="text-xs font-semibold">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}
