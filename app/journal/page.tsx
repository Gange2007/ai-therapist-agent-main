"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { BookOpen, Plus, Trash2, Save, Calendar, Search, Tag, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  mood?: string;
}

const MOOD_OPTIONS = [
  { emoji: "😔", label: "Very Low" },
  { emoji: "😕", label: "Low" },
  { emoji: "😊", label: "Neutral" },
  { emoji: "😃", label: "Good" },
  { emoji: "🤗", label: "Great" },
];

const STORAGE_KEY = "aura_journal_entries";

function loadEntries(): JournalEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as JournalEntry[];
    return parsed.map((e) => ({ ...e, createdAt: new Date(e.createdAt) }));
  } catch {
    return [];
  }
}

function saveEntries(entries: JournalEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    setEntries(loadEntries());
  }, []);

  const filteredEntries = entries.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.content.toLowerCase().includes(search.toLowerCase()) ||
      e.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const handleNew = () => {
    setSelectedEntry(null);
    setTitle("");
    setContent("");
    setTags([]);
    setTagInput("");
    setSelectedMood("");
    setIsWriting(true);
  };

  const handleEdit = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setTags(entry.tags);
    setSelectedMood(entry.mood || "");
    setIsWriting(true);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags((prev) => [...prev, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSave = async () => {
    if (!content.trim()) {
      toast({ title: "Entry is empty", description: "Write something before saving.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 300));

    const now = new Date();
    if (selectedEntry) {
      const updated = entries.map((e) =>
        e.id === selectedEntry.id
          ? { ...e, title: title || format(now, "MMMM d, yyyy"), content, tags, mood: selectedMood }
          : e
      );
      setEntries(updated);
      saveEntries(updated);
    } else {
      const newEntry: JournalEntry = {
        id: crypto.randomUUID(),
        title: title || format(now, "MMMM d, yyyy"),
        content,
        tags,
        mood: selectedMood,
        createdAt: now,
      };
      const updated = [newEntry, ...entries];
      setEntries(updated);
      saveEntries(updated);
    }

    setIsSaving(false);
    setIsWriting(false);
    toast({ title: selectedEntry ? "Entry updated" : "Entry saved", description: "Your journal entry has been saved." });
  };

  const handleDelete = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    saveEntries(updated);
    if (selectedEntry?.id === id) setIsWriting(false);
    toast({ title: "Entry deleted" });
  };

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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">My Journal</h1>
              <p className="text-sm text-muted-foreground">{entries.length} {entries.length === 1 ? "entry" : "entries"}</p>
            </div>
          </div>
          <Button onClick={handleNew} className="gap-2">
            <Plus className="w-4 h-4" /> New Entry
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Entry List */}
          <div className="lg:col-span-1 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search entries..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Entries */}
            <div className="space-y-3 max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
              {filteredEntries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">{search ? "No entries match your search" : "No journal entries yet.\nClick 'New Entry' to start writing."}</p>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredEntries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Card
                        className={`cursor-pointer transition-all hover:border-primary/40 ${
                          selectedEntry?.id === entry.id && isWriting ? "border-primary" : ""
                        }`}
                        onClick={() => handleEdit(entry)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {entry.mood && <span className="text-base">{entry.mood}</span>}
                                <p className="font-medium text-sm truncate">{entry.title}</p>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">{entry.content}</p>
                              <div className="flex items-center gap-1 mt-2 flex-wrap">
                                {entry.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {format(entry.createdAt, "MMM d")}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:text-destructive"
                                onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Editor */}
          <div className="lg:col-span-2">
            {isWriting ? (
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {selectedEntry ? "Edit Entry" : "New Entry"}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(), "EEEE, MMMM d, yyyy")}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Title */}
                  <Input
                    placeholder="Entry title (optional)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-lg font-medium border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                  />

                  {/* Mood selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Mood:</span>
                    {MOOD_OPTIONS.map((m) => (
                      <button
                        key={m.label}
                        onClick={() => setSelectedMood(selectedMood === m.emoji ? "" : m.emoji)}
                        className={`text-xl transition-all hover:scale-110 ${
                          selectedMood === m.emoji ? "scale-125 ring-2 ring-primary rounded-full" : "opacity-60"
                        }`}
                        title={m.label}
                      >
                        {m.emoji}
                      </button>
                    ))}
                  </div>

                  {/* Content */}
                  <Textarea
                    placeholder="Write your thoughts, feelings, or anything on your mind..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[280px] resize-none border-0 focus-visible:ring-0 text-base leading-relaxed"
                    autoFocus
                  />

                  {/* Tags */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer hover:bg-destructive/20"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                      <Input
                        placeholder="Add tag (press Enter)"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        className="w-36 h-6 text-xs border-0 border-b rounded-none px-1 focus-visible:ring-0"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Entry
                    </Button>
                    <Button variant="outline" onClick={() => setIsWriting(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
                    <BookOpen className="w-8 h-8 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Your Safe Space</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Select an entry to read or edit, or start a new one.
                    </p>
                  </div>
                  <Button onClick={handleNew} className="gap-2">
                    <Plus className="w-4 h-4" /> Start Writing
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
