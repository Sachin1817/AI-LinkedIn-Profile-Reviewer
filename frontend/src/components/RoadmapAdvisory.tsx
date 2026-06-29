import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Code, CheckCircle, BookOpen, GitBranch, Briefcase, ShieldCheck } from "lucide-react";
import { CareerRoadmap, RoadmapSection } from "../lib/api";

interface RoadmapAdvisoryProps {
  roadmap: CareerRoadmap;
}

export const RoadmapAdvisory: React.FC<RoadmapAdvisoryProps> = ({ roadmap }) => {
  const [activeLevel, setActiveLevel] = useState<keyof CareerRoadmap>("beginner");

  const levels: { key: keyof CareerRoadmap; label: string; desc: string }[] = [
    { key: "beginner", label: "Phase 1: Foundation (0-3 Months)", desc: "Essential short-term fixes and foundational skills to align your profile." },
    { key: "intermediate", label: "Phase 2: Growth (3-6 Months)", desc: "Build momentum with advanced tech-stack additions and active certifications." },
    { key: "advanced", label: "Phase 3: Mastery (6+ Months)", desc: "Long-term mastery including publishing tools, system architectures, and thought leadership." }
  ];

  const currentSection: RoadmapSection = roadmap[activeLevel];

  const categories = [
    {
      title: "Core Technologies",
      icon: <Code className="w-4 h-4 text-sky-400" />,
      items: currentSection.technologies,
      emptyText: "No specific technology recommendations for this phase."
    },
    {
      title: "Certifications",
      icon: <Award className="w-4 h-4 text-amber-400" />,
      items: currentSection.certifications,
      emptyText: "No certifications suggested in this phase."
    },
    {
      title: "Suggested Projects",
      icon: <BookOpen className="w-4 h-4 text-purple-400" />,
      items: currentSection.projects,
      emptyText: "No new projects suggested."
    },
    {
      title: "GitHub Enhancements",
      icon: <GitBranch className="w-4 h-4 text-teal-400" />,
      items: currentSection.githubImprovements,
      emptyText: "Profile matches current standard."
    },
    {
      title: "Portfolio Improvements",
      icon: <ShieldCheck className="w-4 h-4 text-rose-400" />,
      items: currentSection.portfolioImprovements,
      emptyText: "No specific website modifications requested."
    },
    {
      title: "LinkedIn Profile Adjustments",
      icon: <Briefcase className="w-4 h-4 text-blue-500" />,
      items: currentSection.linkedinImprovements,
      emptyText: "Profile is in good standing."
    }
  ];

  return (
    <div className="p-6 rounded-2xl glass-panel border border-slate-800/80 flex flex-col h-full">
      <div className="mb-5">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-brand-accentTeal" />
          <span>Interactive Career Growth Roadmap</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">A structured plan designed to close skills gaps and reach peak discoverability.</p>
      </div>

      {/* Level Selection Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {levels.map((lvl) => (
          <button
            key={lvl.key}
            onClick={() => setActiveLevel(lvl.key)}
            className={`flex-1 text-left p-4 rounded-xl border transition-all duration-200 ${
              activeLevel === lvl.key
                ? "bg-brand-blue/10 border-brand-accentBlue/60 text-white shadow-lg shadow-brand-blue/5"
                : "border-slate-800 bg-slate-950/20 hover:bg-slate-900/40 text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="font-bold text-sm tracking-tight">{lvl.label}</div>
            <div className="text-[10px] text-slate-500 leading-snug mt-1">{lvl.desc}</div>
          </button>
        ))}
      </div>

      {/* Accordion/Category Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeLevel}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow"
        >
          {categories.map((cat, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-900 bg-slate-950/30 flex flex-col">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-900">
                {cat.icon}
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{cat.title}</span>
              </div>
              <div className="flex-grow space-y-2">
                {cat.items && cat.items.length > 0 ? (
                  cat.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex gap-2 items-start text-xs text-slate-400">
                      <CheckCircle className="w-4 h-4 text-brand-accentTeal flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{item}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-600 italic">{cat.emptyText}</span>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
