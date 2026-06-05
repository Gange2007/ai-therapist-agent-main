"use client";

import { useState } from "react";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  Heart, Brain, Wind, Moon, BookOpen, Phone,
  Search, ExternalLink, Youtube, FileText, Headphones
} from "lucide-react";

const CATEGORIES = ["All", "Anxiety", "Stress", "Sleep", "Depression", "Breathing", "Crisis Support"];

const RESOURCES = [
  // Crisis
  {
    id: 1,
    title: "988 Suicide & Crisis Lifeline",
    description: "Free, confidential support for people in distress. Call or text 988 anytime, 24/7.",
    category: "Crisis Support",
    type: "Hotline",
    icon: Phone,
    color: "text-red-500",
    bg: "bg-red-500/10",
    link: "https://988lifeline.org",
    tags: ["Crisis", "24/7", "Free"],
  },
  {
    id: 2,
    title: "Crisis Text Line",
    description: "Text HOME to 741741 to connect with a trained crisis counselor. Free, 24/7.",
    category: "Crisis Support",
    type: "Hotline",
    icon: Phone,
    color: "text-red-500",
    bg: "bg-red-500/10",
    link: "https://www.crisistextline.org",
    tags: ["Crisis", "Text", "Free"],
  },
  // Anxiety
  {
    id: 3,
    title: "4-7-8 Breathing Technique",
    description: "Inhale for 4 seconds, hold for 7, exhale for 8. Repeat 3–4 times to calm anxiety fast.",
    category: "Breathing",
    type: "Technique",
    icon: Wind,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    link: null,
    tags: ["Breathing", "Anxiety", "Instant Relief"],
    steps: ["Inhale through nose for 4 seconds", "Hold breath for 7 seconds", "Exhale through mouth for 8 seconds", "Repeat 3-4 cycles"],
  },
  {
    id: 4,
    title: "5-4-3-2-1 Grounding Technique",
    description: "Name 5 things you see, 4 you hear, 3 you can touch, 2 you smell, 1 you taste. Grounds you in the present moment.",
    category: "Anxiety",
    type: "Technique",
    icon: Brain,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    link: null,
    tags: ["Grounding", "Anxiety", "Mindfulness"],
    steps: ["5 things you can SEE", "4 things you can HEAR", "3 things you can TOUCH", "2 things you can SMELL", "1 thing you can TASTE"],
  },
  {
    id: 5,
    title: "Anxiety & Worry Workbook (PDF)",
    description: "Free CBT-based workbook with exercises to identify and challenge anxious thoughts.",
    category: "Anxiety",
    type: "Article",
    icon: FileText,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    link: "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Anxiety",
    tags: ["CBT", "Workbook", "Free"],
  },
  // Stress
  {
    id: 6,
    title: "Progressive Muscle Relaxation",
    description: "Tense and release each muscle group from toes to shoulders to release physical tension caused by stress.",
    category: "Stress",
    type: "Technique",
    icon: Heart,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    link: null,
    tags: ["Muscle Relaxation", "Stress", "Body"],
    steps: ["Start with your toes — tense for 5 seconds", "Release and notice the difference for 10 seconds", "Move up: calves, thighs, abdomen, hands, arms, shoulders", "End with your face — scrunch then release"],
  },
  {
    id: 7,
    title: "Headspace — Stress Relief Meditations",
    description: "Guided meditations specifically designed for stress relief and daily calm. Free basic content available.",
    category: "Stress",
    type: "App",
    icon: Headphones,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    link: "https://www.headspace.com",
    tags: ["Meditation", "App", "Guided"],
  },
  // Sleep
  {
    id: 8,
    title: "Sleep Hygiene Checklist",
    description: "Evidence-based tips: consistent bedtime, no screens 30 min before bed, cool dark room, no caffeine after 2pm.",
    category: "Sleep",
    type: "Technique",
    icon: Moon,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    link: null,
    tags: ["Sleep", "Hygiene", "Habits"],
    steps: ["Same bedtime every night", "No screens 30 minutes before bed", "Keep room cool (16–19°C)", "Write a worry list to clear your mind", "Avoid caffeine after 2pm"],
  },
  {
    id: 9,
    title: "Sleep Foundation — Sleep Tips",
    description: "Comprehensive, research-backed sleep improvement guides from sleep health experts.",
    category: "Sleep",
    type: "Article",
    icon: FileText,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    link: "https://www.sleepfoundation.org/sleep-hygiene",
    tags: ["Research", "Sleep", "Free"],
  },
  // Depression
  {
    id: 10,
    title: "Behavioral Activation",
    description: "A core CBT technique for low mood: schedule one small enjoyable activity each day, even when you don't feel like it.",
    category: "Depression",
    type: "Technique",
    icon: Heart,
    color: "text-green-500",
    bg: "bg-green-500/10",
    link: null,
    tags: ["CBT", "Depression", "Activity"],
    steps: ["List 5 activities that usually bring you joy", "Pick the smallest, easiest one", "Schedule it for today or tomorrow", "Do it even if motivation is low", "Notice how you feel after"],
  },
  {
    id: 11,
    title: "MoodGym — Online CBT Program",
    description: "Free interactive online program using cognitive behavioural therapy to prevent and manage depression and anxiety.",
    category: "Depression",
    type: "Article",
    icon: BookOpen,
    color: "text-green-500",
    bg: "bg-green-500/10",
    link: "https://moodgym.com.au",
    tags: ["CBT", "Free", "Interactive"],
  },
  // Videos
  {
    id: 12,
    title: "Yale — The Science of Well-Being",
    description: "Free Coursera course from Yale University on the psychology of happiness and building good mental habits.",
    category: "Stress",
    type: "Video",
    icon: Youtube,
    color: "text-red-400",
    bg: "bg-red-400/10",
    link: "https://www.coursera.org/learn/the-science-of-well-being",
    tags: ["Course", "Free", "University"],
  },
];

const TYPE_COLORS: Record<string, string> = {
  Hotline: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Technique: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Article: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  App: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Video: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

export default function ResourcesPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = RESOURCES.filter((r) => {
    const matchCat = activeCategory === "All" || r.category === activeCategory;
    const matchSearch =
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Container className="pt-24 pb-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-6 h-6 text-rose-500" />
          </div>
          <h1 className="text-3xl font-bold">Mental Health Resources</h1>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
            Curated techniques, tools, and support resources to help you manage your mental well-being.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className="rounded-full"
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Emergency Banner */}
        {(activeCategory === "All" || activeCategory === "Crisis Support") && !search && (
          <Card className="mb-6 border-red-500/30 bg-red-500/5">
            <CardContent className="p-4 flex items-center gap-4">
              <Phone className="w-8 h-8 text-red-500 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-red-500">If you are in crisis right now</p>
                <p className="text-sm text-muted-foreground">Call or text <strong>988</strong> (US Suicide & Crisis Lifeline) — free, confidential, 24/7. You are not alone.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((resource, i) => {
            const Icon = resource.icon;
            const isExpanded = expanded === resource.id;
            return (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="h-full hover:border-primary/30 transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className={`w-9 h-9 rounded-lg ${resource.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${resource.color}`} />
                      </div>
                      <Badge className={`text-xs ${TYPE_COLORS[resource.type] || ""} border-0`}>
                        {resource.type}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm leading-snug mt-2">{resource.title}</CardTitle>
                    <CardDescription className="text-xs leading-relaxed">{resource.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {resource.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Steps (expandable) */}
                    {"steps" in resource && resource.steps && (
                      <div>
                        <button
                          className="text-xs text-primary underline underline-offset-2"
                          onClick={() => setExpanded(isExpanded ? null : resource.id)}
                        >
                          {isExpanded ? "Hide steps" : "Show steps"}
                        </button>
                        {isExpanded && (
                          <motion.ol
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-2 space-y-1"
                          >
                            {resource.steps.map((step, idx) => (
                              <li key={idx} className="text-xs text-muted-foreground flex gap-2">
                                <span className="text-primary font-semibold shrink-0">{idx + 1}.</span>
                                {step}
                              </li>
                            ))}
                          </motion.ol>
                        )}
                      </div>
                    )}

                    {/* Link */}
                    {resource.link && (
                      <a href={resource.link} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                          <ExternalLink className="w-3 h-3" /> Visit Resource
                        </Button>
                      </a>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p>No resources found. Try a different search or category.</p>
          </div>
        )}
      </Container>
    </div>
  );
}
