import React, { useEffect, useState } from "react";
import { motion, animate } from "framer-motion";
import { Info } from "lucide-react";
import { DashboardScores } from "../lib/api";

interface ScoreDialProps {
  score: number;
  label: string;
  description: string;
}

const ScoreDial: React.FC<ScoreDialProps> = ({ score, label, description }) => {
  const [displayScore, setDisplayScore] = useState<number>(0);

  useEffect(() => {
    const controls = animate(0, score, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (value) => setDisplayScore(Math.round(value)),
    });
    return () => controls.stop();
  }, [score]);

  const getScoreColor = (val: number): string => {
    if (val >= 80) return "text-teal-400 stroke-teal-400";
    if (val >= 60) return "text-amber-400 stroke-amber-400";
    return "text-rose-500 stroke-rose-500";
  };

  const radius = 38;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative p-5 rounded-2xl glass-panel glass-panel-hover flex flex-col items-center justify-center text-center group">
      {/* Tooltip on Info Hover */}
      <div className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 cursor-pointer pointer-events-auto">
        <Info className="w-4 h-4" />
        <div className="absolute right-0 bottom-full mb-2 w-48 p-2 text-[11px] text-slate-300 bg-slate-950 border border-slate-800 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20 leading-snug">
          {description}
        </div>
      </div>

      <div className="relative w-28 h-28 flex items-center justify-center mt-1">
        <div className="absolute w-22 h-22 rounded-full border border-slate-900/60 bg-slate-950/60" />
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="stroke-slate-900/60 fill-none"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            className={`fill-none ${getScoreColor(score)}`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <span className={`absolute text-2xl font-black ${getScoreColor(score)}`}>
          {displayScore}
        </span>
      </div>

      <span className="text-xs font-bold text-slate-300 mt-3 tracking-wide">{label}</span>
    </div>
  );
};

interface MultiScoreCardProps {
  scores: DashboardScores;
}

export const MultiScoreCard: React.FC<MultiScoreCardProps> = ({ scores }) => {
  const metricDescriptions = {
    overall: "Your aggregated profile score. Blends ATS keyword indexing, visual layout hierarchy, branding cohesion, and target industry search potential.",
    ats: "ATS parsing match. Measures core noun density, bullet point metrics, and clean structure alignment against automated filters.",
    recruiter: "Human appeal score. Evaluates action verb impact, readability, value propositions, and formatting hooks for quick reads.",
    seo: "Search engine discoverability. Focuses on keyword density and presence in primary locations (headline, about, job titles).",
    branding: "Personal brand authenticity. Measures the strength of your headline hook, summary value proposition, and career trajectory clarity.",
    visibility: "Algorithmic discoverability rank. Calculated based on profile completeness indicators, skill count, and keyword richness."
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <ScoreDial 
        score={scores.overall} 
        label="Overall Score" 
        description={metricDescriptions.overall} 
      />
      <ScoreDial 
        score={scores.ats} 
        label="ATS Compatibility" 
        description={metricDescriptions.ats} 
      />
      <ScoreDial 
        score={scores.recruiter} 
        label="Recruiter Appeal" 
        description={metricDescriptions.recruiter} 
      />
      <ScoreDial 
        score={scores.seo} 
        label="SEO Grade" 
        description={metricDescriptions.seo} 
      />
      <ScoreDial 
        score={scores.personalBranding} 
        label="Personal Branding" 
        description={metricDescriptions.branding} 
      />
      <ScoreDial 
        score={scores.visibility} 
        label="Visibility Rank" 
        description={metricDescriptions.visibility} 
      />
    </div>
  );
};
