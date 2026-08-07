/*
========================================================

File:
pages/LandingPage.tsx

Purpose:
Landing page / home page of the Interview Agent application.

Responsibilities:
- Hero section with animated title and tagline
- Feature highlights with icons
- Call-to-action to start an interview
- Showcases the product's value proposition
- Sets the premium visual tone for the entire app

Connected Files:
- src/app/router.tsx (route: /)
- src/components/ui/ (Button, Card)
- src/components/layout/PageTransition.tsx

Depends On:
- react-router (useNavigate)
- motion
- lucide-react

Notes:
This is the first page users see. Make it impressive.

========================================================
*/

import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Brain,
  MessageSquare,
  BarChart3,
  Shield,
  Sparkles,
  ArrowRight,
  Zap,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui";
import { PageTransition } from "@/components/layout/PageTransition";
import { APP_NAME } from "@/constants";

const FEATURES = [
  {
    icon: Brain,
    title: "AI-Powered Assessment",
    description: "Adaptive questions that respond to candidate knowledge and experience level.",
  },
  {
    icon: MessageSquare,
    title: "Natural Conversation",
    description: "Fluid interview flow that feels like talking to an expert human interviewer.",
  },
  {
    icon: BarChart3,
    title: "Deep Analytics",
    description: "Comprehensive feedback with topic-by-topic scoring and actionable recommendations.",
  },
  {
    icon: Shield,
    title: "Curriculum Aligned",
    description: "Questions mapped directly to the Enterprise AI Cohort curriculum modules.",
  },
  {
    icon: Target,
    title: "Adaptive Difficulty",
    description: "Questions dynamically adjust based on candidate responses and performance.",
  },
  {
    icon: Zap,
    title: "Instant Feedback",
    description: "Real-time evaluation with detailed strengths, gaps, and next steps.",
  },
] as const;

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="min-h-[calc(100vh-4rem)] flex flex-col">
        {/* Hero Section */}
        <section className="flex-1 flex flex-col items-center justify-center px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="text-center max-w-3xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-8"
            >
              <Sparkles className="h-3.5 w-3.5" />
              ABTalks Vibe Coding Hackathon
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
            >
              <span className="text-zinc-100">Meet your</span>
              <br />
              <span className="bg-gradient-to-r from-brand-400 via-accent-400 to-brand-300 bg-clip-text text-transparent">
                {APP_NAME}
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              AI-powered technical interviews that adapt to each candidate.
              Comprehensive assessment for the Enterprise AI Cohort with
              real-time feedback and deep analytics.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center"
            >
              <Button
                size="lg"
                onClick={() => navigate("/candidates")}
                icon={<ArrowRight className="h-4 w-4" />}
                className="min-w-[200px]"
              >
                Start Interview
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/about")}
                className="min-w-[200px]"
              >
                Learn More
              </Button>
            </motion.div>
          </motion.div>

          {/* Glow effect behind hero */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-[600px] h-[400px] bg-gradient-to-r from-brand-500/8 via-accent-500/8 to-brand-500/5 rounded-full blur-[120px]" />
          </div>
        </section>

        {/* Features Grid */}
        <section className="px-4 py-20 border-t border-zinc-800/40">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold text-zinc-100 mb-4">
                Built for excellence
              </h2>
              <p className="text-zinc-400 max-w-lg mx-auto">
                Every feature designed to deliver the most comprehensive and fair
                technical assessment experience.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08, duration: 0.4 }}
                    whileHover={{ y: -4 }}
                    className="group p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700/80 transition-all duration-300 cursor-default"
                  >
                    <div className="h-10 w-10 rounded-xl bg-brand-500/10 flex items-center justify-center mb-4 group-hover:bg-brand-500/15 transition-colors">
                      <Icon className="h-5 w-5 text-brand-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-200 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-800/40 py-8 px-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <p className="text-xs text-zinc-600">
              © 2026 {APP_NAME}. ABTalks Vibe Coding Hackathon.
            </p>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-zinc-600">System operational</span>
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
